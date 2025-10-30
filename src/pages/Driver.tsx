import { useState, useEffect } from "react";
// Note: The imports below are standard for a React project.
// They will resolve correctly in your local development environment.
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// PREVIEW ERROR NOTE: The preview environment cannot find "@/components/SEO" because it doesn't
// understand your project's specific path alias setup. This will work correctly in your local project.
import SEO from "@/components/SEO";
// PREVIEW ERROR NOTE: The preview environment cannot find "@/config/firebase" because it doesn't
// understand your project's specific path alias setup. This will work correctly in your local project.
import { firestore } from "@/config/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

// Define the structure of an Alert object for TypeScript
interface Alert {
  id: string;
  type: 'ambulance' | 'fire';
  location: {
    lat: number;
    lng: number;
  };
  notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'picked';
  createdAt: any; // Firestore Timestamp
}

const Driver = () => {
  const [role, setRole] = useState<'ambulance' | 'fire'>("ambulance");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [acceptedAlert, setAcceptedAlert] = useState<Alert | null>(null);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Effect to get the driver's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setDriverCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  // --- Fetch alerts from Firestore in real-time ---
  useEffect(() => {
    // Reference to the 'alerts' collection
    const alertsCollectionRef = collection(firestore, "alerts");

    // Create a query to get pending alerts matching the driver's role
    const q = query(
      alertsCollectionRef,
      where("type", "==", role),
      where("status", "==", "pending")
    );

    // Set up a real-time listener with onSnapshot
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedAlerts: Alert[] = [];
      querySnapshot.forEach((doc) => {
        // Push each alert with its document ID to the array
        fetchedAlerts.push({ id: doc.id, ...doc.data() } as Alert);
      });
      setAlerts(fetchedAlerts);
    });

    // Cleanup: Unsubscribe from the listener when the component unmounts or the role changes
    return () => unsubscribe();
  }, [role]); // Rerun this effect whenever the 'role' changes

  // --- Accept an alert and update its status in Firestore ---
  const accept = async (alert: Alert) => {
    setAcceptedAlert(alert);
    const alertDocRef = doc(firestore, "alerts", alert.id);
    await updateDoc(alertDocRef, { status: "accepted" });
  };

  // --- Reject an alert and update its status in Firestore ---
  const reject = async (id: string) => {
    const alertDocRef = doc(firestore, "alerts", id);
    await updateDoc(alertDocRef, { status: "rejected" });
  };

  // --- Mark pickup as complete and update status in Firestore ---
  const completePickup = async () => {
    if (!acceptedAlert) return;
    const alertDocRef = doc(firestore, "alerts", acceptedAlert.id);
    await updateDoc(alertDocRef, { status: "picked" });
    setAcceptedAlert(null); // Clear the mission
  };

  // --- Open Google Maps with the correct location field ---
  const openGoogleMaps = () => {
    if (acceptedAlert?.location) {
      const { lat, lng } = acceptedAlert.location;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    }
  };

  return (
    <main className="container mx-auto px-6 py-10">
      <SEO title="Driver Portal – VitalRoute" description="Accept missions, navigate, and trigger signal priority." />
      <div className="grid md:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Driver Console</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Selector */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue={role} onValueChange={(value: 'ambulance' | 'fire') => setRole(value)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulance">Ambulance</SelectItem>
                  <SelectItem value="fire">Fire Engine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
              <Label>Assigned Alerts</Label>
              {alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">No pending alerts for this role yet.</p>
              )}
              {alerts.map((a) => (
                <div key={a.id} className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">{a.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)} • {a.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!acceptedAlert && <Button size="sm" onClick={() => accept(a)}>Accept</Button>}
                    {!acceptedAlert && <Button size="sm" variant="outline" onClick={() => reject(a.id)}>Reject</Button>}
                  </div>
                </div>
              ))}
            </div>

            {/* On Mission Actions */}
            {acceptedAlert && (
              <div className="space-y-3 pt-4 border-t">
                <Label>On Mission</Label>
                <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="font-bold">Navigating to: {acceptedAlert.type} Alert</p>
                    <p className="text-sm text-muted-foreground">{acceptedAlert.location.lat.toFixed(5)}, {acceptedAlert.location.lng.toFixed(5)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={completePickup}>Mark Pickup Complete</Button>
                  <Button variant="hero" onClick={openGoogleMaps}>Navigate</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Traffic signals will auto-switch within 500m on the route (demo placeholder).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Driver;
