// src/pages/Admin.tsx

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { firestore, auth } from "@/config/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { Trash2, PlusCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";

interface Alert {
  id: string;
  type?: "ambulance" | "fire" | "police"; // made optional to avoid crashes
  location?: { lat: number; lng: number };
  priority?: "red" | "yellow" | "green";
  status?:
    | "pending"
    | "accepted"
    | "on_scene"
    | "enroute_to_hospital"
    | "completed"
    | "rejected";
  createdAt: any;
  userId?: string;
  userName?: string;
  assignedVehicle?: string;
}

interface Vehicle {
  id: string;
  type: "ambulance" | "fire" | "police";
  status: "available" | "enroute" | "on_scene" | "unavailable";
  location?: { lat: number; lng: number };
}

const defaultCenter = { lat: 17.406, lng: 78.477 }; // Hyderabad default

const Admin = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [adminProfile, setAdminProfile] = useState<{
    name: string;
    photoURL?: string;
    email: string;
    role: string;
  } | null>(null);

  const [showNewAlertDialog, setShowNewAlertDialog] = useState(false);
  const [newAlertType, setNewAlertType] = useState<"ambulance" | "fire" | "police">("ambulance");
  const [newAlertPriority, setNewAlertPriority] = useState<"red" | "yellow" | "green">("red");
  const [newAlertLocation, setNewAlertLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [assigningAlert, setAssigningAlert] = useState<Alert | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const userId = auth.currentUser?.uid || "";

  // ✅ Fetch admin profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const userRef = doc(firestore, "users", userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setAdminProfile(snap.data() as any);
        }
      } catch (err) {
        console.error("Error fetching admin profile:", err);
      }
    };
    fetchProfile();
  }, [userId]);

  // ✅ Listen for alerts
  useEffect(() => {
    const alertsRef = collection(firestore, "alerts");
    const q = query(alertsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedAlerts: Alert[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Alert & { userId?: string };
        let userName = "Unknown User";
        if (data.userId) {
          try {
            const userDoc = await getDoc(doc(firestore, "users", data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.name || userData.email || "Unnamed User";
            }
          } catch (err) {
            console.error("Error fetching user:", err);
          }
        }
        fetchedAlerts.push({
          id: docSnap.id,
          ...data,
          userName,
        });
      }
      setAlerts(fetchedAlerts);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Listen for vehicles
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "vehicles"), (snapshot) => {
      const fetched: Vehicle[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Vehicle),
      }));
      setVehicles(fetched);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Assign vehicle to alert
  const handleAssignVehicle = async () => {
    if (!assigningAlert || !selectedVehicleId) return;
    try {
      await updateDoc(doc(firestore, "alerts", assigningAlert.id), {
        assignedVehicle: selectedVehicleId,
        status: "accepted",
      });
      await updateDoc(doc(firestore, "vehicles", selectedVehicleId), {
        status: "enroute",
      });
      setAssigningAlert(null);
      setSelectedVehicleId("");
    } catch (err) {
      console.error("Error assigning vehicle:", err);
    }
  };

  // ✅ Create new alert manually
  const handleCreateAlert = async () => {
    if (!newAlertLocation) return alert("Please select a location on map.");
    try {
      await addDoc(collection(firestore, "alerts"), {
        type: newAlertType,
        priority: newAlertPriority,
        location: newAlertLocation,
        status: "pending",
        createdAt: new Date(),
        userId,
      });
      setShowNewAlertDialog(false);
    } catch (err) {
      console.error("Error creating alert:", err);
    }
  };

  // ✅ Delete alert
  const handleDeleteAlert = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) return;
    try {
      await deleteDoc(doc(firestore, "alerts", id));
    } catch (err) {
      console.error("Error deleting alert:", err);
    }
  };

  // Stats
  const active = alerts.filter((a) =>
    ["pending", "accepted", "on_scene", "enroute_to_hospital"].includes(a.status || "")
  ).length;
  const resolved = alerts.filter((a) =>
    ["completed", "rejected"].includes(a.status || "")
  ).length;

  // Icons by type
  const getIcon = (type?: string, priority?: string) => {
    if (type === "ambulance") return { url: "🚑" };
    if (type === "fire") return { url: "🚒" };
    if (type === "police") return { url: "🚓" };
    return { url: "📍" };
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <main className="container mx-auto px-6 py-10 space-y-6">
      <SEO title="Admin Dashboard – VitalRoute" description="Monitor vehicles, requests, and signals in real-time." />

      {/* Profile Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {adminProfile?.photoURL ? (
            <img src={adminProfile.photoURL} alt={adminProfile.name} className="h-10 w-10 rounded-full border" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center text-white">
              {adminProfile?.name?.charAt(0) || "A"}
            </div>
          )}
          <div>
            <p className="font-semibold">{adminProfile?.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground">{adminProfile?.role || "system_admin"}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Active Vehicles</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{vehicles.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Requests</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{alerts.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Resolved vs Ongoing</CardTitle></CardHeader>
          <CardContent className="text-lg">
            <Badge variant="secondary">Resolved {resolved}</Badge>{" "}
            <Badge>Ongoing {active}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Fleet & Alerts Overview</CardTitle>
          <Button onClick={() => setShowNewAlertDialog(true)} size="sm">
            <PlusCircle className="mr-1 h-4 w-4" /> New Alert
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoaded ? (
            <div style={{ width: "100%", height: "400px" }}>
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={alerts[0]?.location || defaultCenter}
                zoom={12}
                onClick={(e) =>
                  setNewAlertLocation({ lat: e.latLng!.lat(), lng: e.latLng!.lng() })
                }
              >
                {/* Vehicles */}
                {vehicles.map(
                  (v) =>
                    v.location && (
                      <Marker key={v.id} position={v.location} icon={getIcon(v.type)} title={`${v.type} - ${v.status}`} />
                    )
                )}
                {/* Alerts */}
                {alerts.map(
                  (a) =>
                    a.location && (
                      <Marker
                        key={a.id}
                        position={a.location}
                        icon={getIcon(a.type, a.priority)}
                        title={`${(a.type || "unknown").toUpperCase()} - ${(a.priority || "normal").toUpperCase()}`}
                      />
                    )
                )}
              </GoogleMap>
            </div>
          ) : (
            <div className="w-full h-[400px] flex items-center justify-center">
              <p>Loading map...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts + Dispatch Panel */}
      <Card>
        <CardHeader><CardTitle>Recent Alerts</CardTitle></CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr,2fr,1fr,1fr,1fr,auto] gap-2 text-sm font-semibold text-muted-foreground border-b pb-2">
                <div>Type</div>
                <div>Location</div>
                <div>Priority</div>
                <div>Raised By</div>
                <div className="text-right">Status</div>
                <div className="text-right">Actions</div>
              </div>

              {alerts.map((a) => (
                <div key={a.id} className="grid grid-cols-[1fr,2fr,1fr,1fr,1fr,auto] gap-2 text-sm items-center border-b pb-2">
                  <div className="font-medium capitalize">{a.type || "unknown"}</div>
                  <div className="col-span-1 text-muted-foreground">
                    {a.location?.lat?.toFixed(5)},{a.location?.lng?.toFixed(5)}
                  </div>
                  <div>
                    <Badge
                      variant={
                        a.priority === "red"
                          ? "destructive"
                          : a.priority === "yellow"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {(a.priority || "normal").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">{a.userName}</div>
                  <div className="text-right">
                    <Badge>{a.status || "unknown"}</Badge>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAssigningAlert(a)}>
                      Assign
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Vehicle Dialog */}
      <Dialog open={!!assigningAlert} onOpenChange={() => setAssigningAlert(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Vehicle</DialogTitle></DialogHeader>
          <Select onValueChange={setSelectedVehicleId}>
            <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
            <SelectContent>
              {vehicles
                .filter((v) => v.type === assigningAlert?.type && v.status === "available")
                .map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.type.toUpperCase()} - {v.id}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button className="mt-3 w-full" onClick={handleAssignVehicle}>
            <Send className="mr-2 h-4 w-4" /> Assign
          </Button>
        </DialogContent>
      </Dialog>

      {/* Manual New Alert Dialog */}
      <Dialog open={showNewAlertDialog} onOpenChange={setShowNewAlertDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Alert</DialogTitle></DialogHeader>
          <Select value={newAlertType} onValueChange={(val: any) => setNewAlertType(val)}>
            <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ambulance">Ambulance</SelectItem>
              <SelectItem value="fire">Fire</SelectItem>
              <SelectItem value="police">Police</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newAlertPriority} onValueChange={(val: any) => setNewAlertPriority(val)}>
            <SelectTrigger><SelectValue placeholder="Select Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="red">Red (Critical)</SelectItem>
              <SelectItem value="yellow">Yellow (Urgent)</SelectItem>
              <SelectItem value="green">Green (Normal)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Click on the map to set location</p>
          <Button className="mt-3 w-full" onClick={handleCreateAlert}>Create Alert</Button>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Admin;
