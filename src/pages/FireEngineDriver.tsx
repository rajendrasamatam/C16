// src/pages/FireEngineDriver.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Phone,
  AlertTriangle,
  LogOut,
  MapPin,
  Clock,
  User,
  List,
  CheckCircle,
} from "lucide-react";
import SEO from "@/components/SEO";
import { firestore, auth } from "@/config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { signOut, onAuthStateChanged } from "firebase/auth";

// --- Enhanced Alert Interface ---
interface Alert {
  id: string;
  type: "ambulance" | "fire_engine" | "fire";
  location: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  notes: string;
  callerName: string;
  callerPhone: string;
  status:
    | "pending"
    | "accepted"
    | "on_scene"
    | "enroute_to_hospital"
    | "completed"
    | "rejected";
  createdAt: any;
  distance?: string;
  eta?: string;
}

// --- Google Map Component ---
const EmbeddedMap = ({
  location,
  destination,
}: {
  location: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (isLoaded && destination) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: location,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            setDirections(result);
          }
        }
      );
    }
  }, [isLoaded, location, destination]);

  if (!isLoaded) {
    return (
      <div className="h-48 w-full bg-gray-200 flex items-center justify-center rounded-md">
        <p className="text-gray-500">Loading Map...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      center={location}
      zoom={14}
      mapContainerStyle={{
        width: "100%",
        height: "200px",
        borderRadius: "8px",
      }}
    >
      {!destination && <Marker position={location} />}
      {destination && directions && (
        <DirectionsRenderer directions={directions} />
      )}
    </GoogleMap>
  );
};

// --- Main Driver Component ---
const FireEngineDriver = () => {
  const DRIVER_ID_FALLBACK = "driver_fire_engine_01";

  const [isOnline, setIsOnline] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentMission, setCurrentMission] = useState<Alert | null>(null);
  const [tripHistory, setTripHistory] = useState<Alert[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<Alert | null>(
    null
  );

  const [userName, setUserName] = useState<string>("Fire Driver 01");
  const [userPhoto, setUserPhoto] = useState<string>(
    "https://ui-avatars.com/api/?name=Fire+Driver+01&background=random"
  );
  const [driverId, setDriverId] = useState<string>(DRIVER_ID_FALLBACK);

  useEffect(() => {
    const avatarFor = (name: string) =>
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "Driver"
      )}&background=random`;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUserName("Driver");
        setUserPhoto(avatarFor("Driver"));
        setDriverId(DRIVER_ID_FALLBACK);
        return;
      }

      const baseName =
        u.displayName || (u.email ? u.email.split("@")[0] : "Driver");
      setUserName(baseName);
      setUserPhoto(u.photoURL || avatarFor(baseName));
      setDriverId(DRIVER_ID_FALLBACK);

      try {
        const userDocRef = doc(firestore, "users", u.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data?.name) setUserName(data.name);
          if (data?.photoURL) setUserPhoto(data.photoURL);
          if (data?.driverId) setDriverId(data.driverId);
        }
      } catch (e) {
        console.error("Failed to load user profile:", e);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setAlerts([]);
      return;
    }

    const alertsRef = collection(firestore, "alerts");
    const q = query(
      alertsRef,
      where("type", "==", "fire"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts: Alert[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Alert;
        data.distance = `${(Math.random() * 10).toFixed(1)} km`;
        data.eta = `${Math.floor(Math.random() * 20 + 5)} min`;
        fetchedAlerts.push({ id: docSnap.id, ...data });
      });
      setAlerts(fetchedAlerts);
    });

    return () => unsubscribe();
  }, [isOnline]);

  useEffect(() => {
    let watchId: number | null = null;
    if (currentMission) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Live Location: ${latitude}, ${longitude}`);
        },
        () => alert("GPS Error. Please enable location services."),
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentMission]);

  const fetchHistory = async () => {
    const alertsRef = collection(firestore, "alerts");
    const q = query(
      alertsRef,
      where("driverId", "==", driverId),
      where("type", "==", "fire"),
      where("status", "==", "completed")
    );
    const snapshot = await getDocs(q);
    const history: Alert[] = [];
    snapshot.forEach((docSnap) =>
      history.push({ id: docSnap.id, ...docSnap.data() } as Alert)
    );
    setTripHistory(history);
    setShowHistory(true);
  };

  const handleAccept = async (alert: Alert) => {
    setCurrentMission(alert);
    const alertRef = doc(firestore, "alerts", alert.id);
    await updateDoc(alertRef, { status: "accepted", driverId });
  };

  const handleArrivedAtScene = async () => {
    if (!currentMission) return;
    const alertRef = doc(firestore, "alerts", currentMission.id);
    await updateDoc(alertRef, { status: "on_scene" });
    setCurrentMission({ ...currentMission, status: "on_scene" });
  };

  const handleMissionComplete = async () => {
    if (!currentMission) return;
    const alertRef = doc(firestore, "alerts", currentMission.id);
    await updateDoc(alertRef, { status: "completed" });
    setCurrentMission(null);
  };

  const handlePanic = () => {
    alert("🚨 PANIC ALERT SENT TO ADMIN! Stay safe.");
  };

  const openGoogleMaps = (location: { lat: number; lng: number }) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
      "_blank"
    );
  };

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  const handleToggleHistory = () => {
    if (showHistory) {
      setSelectedHistoryItem(null);
    } else {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  return (
    <>
      <SEO
        title="Fire Engine Driver – VitalRoute"
        description="Fire Engine missions"
      />
      <main className="min-h-screen bg-gray-50">
        {/* --- Top Bar --- */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <img
                  src={userPhoto}
                  alt={userName}
                  className="w-10 h-10 rounded-full border"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">
                    {userName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="online-switch" className="text-sm">
                    Go {isOnline ? "Offline" : "Online"}
                  </Label>
                  <Switch
                    id="online-switch"
                    checked={isOnline}
                    onCheckedChange={setIsOnline}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* --- Main Content --- */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Current Mission or History */}
            <div className="lg:col-span-2 space-y-8">
              {currentMission ? (
                <Card className="shadow-lg border-2 border-red-500">
                  <CardHeader>
                    <CardTitle className="text-red-600">
                      Active Mission
                    </CardTitle>
                    <CardDescription>
                      Proceed to the location safely and swiftly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-md bg-red-50 border border-red-200 space-y-3">
                      <div>
                        <p className="font-bold text-base">
                          Caller: {currentMission.callerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentMission.notes}
                        </p>
                      </div>

                      <EmbeddedMap location={currentMission.location} />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="w-full"
                      onClick={() => openGoogleMaps(currentMission.location)}
                    >
                      Open Navigation
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        (window.location.href = `tel:${currentMission.callerPhone}`)
                      }
                    >
                      <Phone className="h-4 w-4 mr-2" /> Call
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handlePanic}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" /> Panic
                    </Button>
                  </CardFooter>
                  <CardFooter>
                    {currentMission.status === "accepted" && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleArrivedAtScene}
                      >
                        Mark Arrived at Scene
                      </Button>
                    )}
                    {currentMission.status === "on_scene" && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleMissionComplete}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Mission Complete
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Trip History</CardTitle>
                    <CardDescription>
                      Review your completed missions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tripHistory.length > 0 ? (
                      <ul className="space-y-3">
                        {tripHistory.map((trip) => (
                          <li
                            key={trip.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
                          >
                            <div>
                              <p className="font-semibold text-sm">
                                {trip.notes || "No details"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Completed on:{" "}
                                {trip.createdAt.toDate().toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedHistoryItem(trip)}
                            >
                              View Details
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-center text-muted-foreground py-4">
                        No completed trips found.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Pending Alerts */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Alerts</CardTitle>
                  <CardDescription>
                    {isOnline
                      ? "Awaiting new missions."
                      : "You are offline."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!isOnline && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      Go online to see new alerts.
                    </div>
                  )}
                  {isOnline && alerts.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      No pending alerts.
                    </div>
                  )}
                  {isOnline &&
                    alerts.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-md border p-4 space-y-3"
                      >
                        <div className="font-medium capitalize">
                          {a.notes || a.type}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> {a.distance} away
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> ETA: {a.eta}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleAccept(a)}
                        >
                          Accept Mission
                        </Button>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* --- Dialog for Trip Details --- */}
        <Dialog
          open={!!selectedHistoryItem}
          onOpenChange={(isOpen) => !isOpen && setSelectedHistoryItem(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Completed Trip Details</DialogTitle>
              <DialogDescription>
                Details for trip completed on{" "}
                {selectedHistoryItem?.createdAt.toDate().toLocaleString()}.
              </DialogDescription>
            </DialogHeader>
            {selectedHistoryItem && (
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 mt-1 text-gray-600" />
                  <div>
                    <Label className="font-bold">Caller</Label>
                    <p>{selectedHistoryItem.callerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <List className="w-5 h-5 mt-1 text-gray-600" />
                  <div>
                    <Label className="font-bold">Notes</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedHistoryItem.notes}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="font-bold block mb-2">Location</Label>
                  <EmbeddedMap location={selectedHistoryItem.location} />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
};

export default FireEngineDriver;