// src/pages/AmbulanceDriver.tsx

import { useState, useEffect, useCallback } from "react"; // ADDED: useCallback
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Hospital,
  Loader2, // ADDED: Loader icon
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

// --- Enhanced Alert Interface (no changes needed) ---
interface Alert {
  id: string;
  type: "ambulance" | "fire_engine";
  location: { lat: number; lng: number };
  destination?: { lat: number; lng: number; name?: string }; // MODIFIED: Added optional name for hospital
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

// --- Google Map Component (MODIFIED to accept onLoad) ---
const EmbeddedMap = ({
  location,
  destination,
  onLoad,
}: {
  location: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  onLoad?: (map: google.maps.Map) => void; // ADDED: onLoad callback prop
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"], // Places library is essential for this feature
  });

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (isLoaded && location && destination) {
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
    } else {
      setDirections(null);
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
      center={destination || location}
      zoom={14}
      mapContainerStyle={{ width: "100%", height: "200px", borderRadius: "8px" }}
      onLoad={onLoad} // ATTACHED: Pass the map instance up
    >
      {!destination && <Marker position={location} />}
      {destination && directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
};

// --- Main Driver Component ---
const AmbulanceDriver = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentMission, setCurrentMission] = useState<Alert | null>(null);
  const [tripHistory, setTripHistory] = useState<Alert[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<Alert | null>(
    null
  );

  const [userName, setUserName] = useState<string>("Ambulance Driver");
  const [userPhoto, setUserPhoto] = useState<string>(
    "https://ui-avatars.com/api/?name=Ambulance+Driver&background=random"
  );
  const [driverId, setDriverId] = useState<string | null>(null);

  // --- ADDED: State for nearby hospitals and map instance ---
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<google.maps.places.PlaceResult[]>([]);
  const [isFetchingHospitals, setIsFetchingHospitals] = useState(false);

  // --- Auth & User Profile (no changes) ---
  useEffect(() => {
    const avatarFor = (name: string) =>
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "Driver"
      )}&background=random`;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUserName("Driver");
        setUserPhoto(avatarFor("Driver"));
        setDriverId(null);
        return;
      }
      setDriverId(u.uid);
      const baseName =
        u.displayName || (u.email ? u.email.split("@")[0] : "Driver");
      setUserName(baseName);
      setUserPhoto(u.photoURL || avatarFor(baseName));

      try {
        const userDocRef = doc(firestore, "users", u.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.name) setUserName(data.name);
          if (data?.photoURL) setUserPhoto(data.photoURL);
        }
      } catch (e) {
        console.error("Failed to load user profile from Firestore:", e);
      }
    });
    return () => unsub();
  }, []);

  // --- Fetch Pending Alerts (no changes) ---
  useEffect(() => {
    if (!isOnline || !driverId) {
      setAlerts([]);
      return;
    }
    const alertsRef = collection(firestore, "alerts");
    const q = query(
      alertsRef,
      where("type", "==", "ambulance"),
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
  }, [isOnline, driverId]);

  // --- Live Location Tracking (no changes) ---
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

  // --- Fetch Trip History (no changes) ---
  const fetchHistory = async () => {
    if (!driverId) return;
    const alertsRef = collection(firestore, "alerts");
    const q = query(
      alertsRef,
      where("driverId", "==", driverId),
      where("status", "==", "completed")
    );
    const snapshot = await getDocs(q);
    const history: Alert[] = [];
    snapshot.forEach((docSnap) =>
      history.push({ id: docSnap.id, ...docSnap.data() } as Alert)
    );
    setTripHistory(history);
  };

  useEffect(() => {
    fetchHistory();
  }, [driverId]);

  // --- NEW: Function to find nearby hospitals ---
  const findNearbyHospitals = (location: { lat: number; lng: number }) => {
    if (!mapInstance) {
      alert("Map is not loaded yet. Cannot search for hospitals.");
      return;
    }
    setIsFetchingHospitals(true);
    setNearbyHospitals([]);

    const placesService = new google.maps.places.PlacesService(mapInstance);
    const request: google.maps.places.PlaceSearchRequest = {
      location: location,
      radius: 15000, // 15km radius
      type: "hospital",
      keyword: "multi speciality hospital emergency", // Keywords to find relevant hospitals
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setNearbyHospitals(results);
      } else {
        alert("Could not find any nearby hospitals. Please proceed manually.");
      }
      setIsFetchingHospitals(false);
    });
  };

  // --- Mission Control Handlers ---
  const handleAccept = async (alert: Alert) => {
    if (!driverId) return;
    setCurrentMission(alert);
    setNearbyHospitals([]); // Clear hospitals from previous missions
    const alertRef = doc(firestore, "alerts", alert.id);
    await updateDoc(alertRef, { status: "accepted", driverId: driverId });
  };

  // MODIFIED: handleArrivedAtScene now triggers hospital search
  const handleArrivedAtScene = async () => {
    if (!currentMission) return;
    const alertRef = doc(firestore, "alerts", currentMission.id);
    await updateDoc(alertRef, { status: "on_scene" });
    setCurrentMission({ ...currentMission, status: "on_scene" });
    findNearbyHospitals(currentMission.location); // Find hospitals upon arrival
  };

  // MODIFIED: handleEnrouteToHospital now takes a destination
  const handleEnrouteToHospital = async (hospital: google.maps.places.PlaceResult) => {
    if (!currentMission || !hospital.geometry?.location) return;

    const destination = {
        lat: hospital.geometry.location.lat(),
        lng: hospital.geometry.location.lng(),
        name: hospital.name,
    };

    const alertRef = doc(firestore, "alerts", currentMission.id);
    await updateDoc(alertRef, { 
        status: "enroute_to_hospital",
        destination: destination, // Save the selected hospital as the destination
    });
    setCurrentMission({ ...currentMission, status: "enroute_to_hospital", destination });
  };

  const handleMissionComplete = async () => {
    if (!currentMission) return;
    const alertRef = doc(firestore, "alerts", currentMission.id);
    await updateDoc(alertRef, { status: "completed" });
    setCurrentMission(null);
    fetchHistory();
  };

  const handlePanic = () => alert("🚨 PANIC ALERT SENT TO ADMIN! Stay safe.");

  const openGoogleMaps = (location: { lat: number; lng: number }, destination?: { lat: number; lng: number }) => {
    const dest = destination || location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, "_blank");
  };

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };
  
  // ADDED: useCallback to memoize the map load function
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  return (
    <>
      <SEO title="Ambulance Driver – VitalRoute" description="Ambulance missions" />
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
           {/* Header JSX remains the same */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-16"><div className="flex items-center space-x-3"><img src={userPhoto} alt={userName} className="w-10 h-10 rounded-full border" referrerPolicy="no-referrer"/><div><span className="text-sm font-medium text-gray-800">{userName}</span><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`}></div><span className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</span></div></div></div><div className="flex items-center gap-4"><div className="flex items-center space-x-2"><Label htmlFor="online-switch" className="text-sm">Go {isOnline ? "Offline" : "Online"}</Label><Switch id="online-switch" checked={isOnline} onCheckedChange={setIsOnline}/></div><Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-600 hover:text-red-600"><LogOut className="w-4 h-4 mr-2"/>Sign Out</Button></div></div></div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              {currentMission ? (
                <Card className="shadow-lg border-2 border-blue-500">
                  <CardHeader>
                    <CardTitle className="text-blue-600">Active Mission</CardTitle>
                    <CardDescription>
                      {currentMission.status === "enroute_to_hospital"
                        ? `Transporting patient to: ${currentMission.destination?.name || 'Hospital'}`
                        : "Proceed to the patient's location safely."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-md bg-blue-50 border border-blue-200 space-y-3">
                      <div>
                        <p className="font-bold text-base">Patient: {currentMission.callerName}</p>
                        <p className="text-sm text-muted-foreground">{currentMission.notes}</p>
                      </div>
                      <EmbeddedMap
                        location={currentMission.location}
                        destination={currentMission.destination}
                        onLoad={onMapLoad} // Pass the onLoad handler to the map
                      />
                    </div>
                    
                    {/* --- NEW: Hospital List Display --- */}
                    {currentMission.status === 'on_scene' && (
                        <div>
                            <Label className="font-semibold text-lg">Nearby Hospitals</Label>
                            {isFetchingHospitals && <div className="flex items-center gap-2 text-muted-foreground mt-2"><Loader2 className="h-5 w-5 animate-spin"/><span>Searching...</span></div>}
                            <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                                {nearbyHospitals.map(hospital => (
                                    <div key={hospital.place_id} className="p-3 border rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{hospital.name}</p>
                                            <p className="text-xs text-muted-foreground">{hospital.vicinity}</p>
                                        </div>
                                        <Button size="sm" onClick={() => handleEnrouteToHospital(hospital)}>
                                            Select & Proceed
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button className="w-full" onClick={() => openGoogleMaps(currentMission.location, currentMission.destination)}>
                      Open Navigation
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => (window.location.href = `tel:${currentMission.callerPhone}`)}>
                      <Phone className="h-4 w-4 mr-2"/> Call Patient
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={handlePanic}>
                      <AlertTriangle className="h-4 w-4 mr-2"/> Panic
                    </Button>
                  </CardFooter>
                  <CardFooter>
                    {currentMission.status === "accepted" && (
                      <Button className="w-full" onClick={handleArrivedAtScene}>
                        Mark Arrived at Scene
                      </Button>
                    )}
                    {/* The button for on_scene is now rendered inside the hospital list items */}
                    {currentMission.status === "enroute_to_hospital" && (
                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleMissionComplete}>
                        <CheckCircle className="h-4 w-4 mr-2"/> Mark Arrived at Hospital
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ) : (
                <Card>{/* Trip History JSX remains the same */}<CardHeader><CardTitle>Trip History</CardTitle><CardDescription>Review your completed ambulance runs.</CardDescription></CardHeader><CardContent>{tripHistory.length>0?<ul className="space-y-3">{tripHistory.map((trip)=>(<li key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"><div><p className="font-semibold text-sm">{trip.notes||"No details"}</p><p className="text-xs text-muted-foreground">Completed on:{" "}{trip.createdAt.toDate().toLocaleDateString()}</p></div><Button variant="outline" size="sm" onClick={()=>setSelectedHistoryItem(trip)}>View Details</Button></li>))}</ul>:<p className="text-sm text-center text-muted-foreground py-4">You have no completed trips.</p>}</CardContent></Card>
              )}
            </div>

            {/* Right Column: Pending Alerts (remains the same) */}
            <div className="lg:col-span-1 space-y-6">
              <Card><CardHeader><CardTitle>Pending Alerts</CardTitle><CardDescription>{isOnline?"Awaiting new missions.":"You are offline."}</CardDescription></CardHeader><CardContent className="space-y-3">{!isOnline&&<div className="text-center text-sm text-muted-foreground py-4">Go online to see new alerts.</div>}{isOnline&&alerts.length===0&&<div className="text-center text-sm text-muted-foreground py-4">No pending alerts.</div>}{isOnline&&alerts.map((a)=>(<div key={a.id} className="rounded-md border p-4 space-y-3"><div className="font-medium capitalize">{a.notes||a.type}</div><div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin className="w-3 h-3"/> {a.distance} away</span><span className="flex items-center gap-1.5"><Clock className="w-3 h-3"/> ETA: {a.eta}</span></div><Button size="sm" className="w-full" onClick={()=>handleAccept(a)}>Accept Mission</Button></div>))}</CardContent></Card>
            </div>
          </div>
        </div>

        {/* --- Dialog for Trip Details (remains the same) --- */}
        <Dialog open={!!selectedHistoryItem} onOpenChange={(isOpen)=>!isOpen&&setSelectedHistoryItem(null)}><DialogContent><DialogHeader><DialogTitle>Completed Trip Details</DialogTitle><DialogDescription>Details for trip completed on{" "}{selectedHistoryItem?.createdAt.toDate().toLocaleString()}.</DialogDescription></DialogHeader>{selectedHistoryItem&&<div className="space-y-4 pt-4"><div className="flex items-start gap-3"><User className="w-5 h-5 mt-1 text-gray-600"/><div><Label className="font-bold">Caller</Label><p>{selectedHistoryItem.callerName}</p></div></div><div className="flex items-start gap-3"><List className="w-5 h-5 mt-1 text-gray-600"/><div><Label className="font-bold">Notes</Label><p className="text-sm text-muted-foreground">{selectedHistoryItem.notes}</p></div></div><div><Label className="font-bold block mb-2">Patient Location</Label><EmbeddedMap location={selectedHistoryItem.location}/></div>{selectedHistoryItem.destination&&<div><Label className="font-bold block mb-2">Hospital Destination</Label><EmbeddedMap location={selectedHistoryItem.destination}/></div>}</div>}</DialogContent></Dialog>
      </main>
    </>
  );
};

export default AmbulanceDriver;