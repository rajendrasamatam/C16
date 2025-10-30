// src/pages/Public.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // MODIFIED: Added CardDescription
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // ADDED: Using Textarea for better multiline notes
import { toast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { firestore } from "@/config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // MODIFIED: Using serverTimestamp for reliability
import { Loader2, User, Phone, LocateFixed } from "lucide-react"; // ADDED: Icons for better UI

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem", // Kept your original style
};

const defaultCenter = {
  lat: 17.3850,
  lng: 78.4867,
};

const Public = () => {
  // --- Your original state is preserved ---
  const [type, setType] = useState<string>("ambulance");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState("");
  
  // --- ADDED: State for new essential fields ---
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // ADDED: State to handle submission UI

  // --- Your original map loading logic is preserved ---
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  // --- Your original useEffect for location is preserved ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast({ title: "Location Detected", description: "Your current location has been successfully fetched." });
      });
    }
  }, []);

  // --- Your original requestLocation function is preserved and slightly enhanced ---
  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation Error", description: "Geolocation is not supported by your browser.", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast({ title: "Location Updated", description: "Your location has been refreshed." });
      },
      () => toast({ title: "Location Error", description: "Could not fetch your location. Please check browser permissions.", variant: "destructive" })
    );
  };

  // --- Your original submitAlert function is MODIFIED to include new data and validation ---
  const submitAlert = async () => {
    if (!coords) {
      toast({ title: "Missing Location", description: "Your location has not been detected. Please enable location services.", variant: "destructive" });
      return;
    }
    // ADDED: Validation for new fields
    if (!callerName || !callerPhone) {
        toast({ title: "Missing Information", description: "Please enter your name and phone number.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true); // Set loading state

    const alertData = {
      type,
      location: {
        lat: coords.lat,
        lng: coords.lng,
      },
      notes,
      // ADDED: New, critical data fields
      callerName: callerName,
      callerPhone: callerPhone,
      status: "pending",
      createdAt: serverTimestamp(), // MODIFIED: Using server-side timestamp is more reliable
      driverId: null,
    };

    try {
      const alertsCollectionRef = collection(firestore, 'alerts');
      await addDoc(alertsCollectionRef, alertData);
      toast({ title: "Alert Sent!", description: "Help is on the way. The nearest unit has been dispatched." });
      // Reset form fields after successful submission
      setNotes("");
      setCallerName("");
      setCallerPhone("");
    } catch (error) {
      console.error("Firestore submission error:", error);
      toast({ title: "Submission Error", description: "Could not send the alert. Please try again.", variant: "destructive" });
    } finally {
        setIsSubmitting(false); // Reset loading state
    }
  };

  // --- Your original renderMap function is preserved ---
  const renderMap = () => {
    if (loadError) return <p className="text-destructive">Error loading map</p>;
    if (!isLoaded) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    
    return (
      <GoogleMap mapContainerStyle={mapContainerStyle} zoom={coords ? 15 : 12} center={coords || defaultCenter}>
        {coords && <Marker position={coords} />}
      </GoogleMap>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SEO title="Public Alert – VitalRoute" description="Raise ambulance or fire emergencies with your live location." />
      {/* MODIFIED: The overall layout is now centered and cleaner for a better single-focus experience */}
      <div className="container grid lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Report an Emergency</CardTitle>
            <CardDescription>Your location is detected automatically. Please provide your details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* MODIFIED: Replaced manual Lat/Lng with a clear status display */}
            <div>
              <Label>Your Location</Label>
              <div className="flex items-center gap-2 mt-1 p-2 border rounded-md bg-gray-50">
                <LocateFixed className="h-5 w-5 text-primary" />
                {coords ? (
                    <span className="text-sm font-mono text-muted-foreground">{`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}</span>
                ) : (
                    <span className="text-sm text-muted-foreground">Detecting...</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-type">Emergency Type</Label>
              <Select defaultValue={type} onValueChange={setType}>
                <SelectTrigger id="emergency-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulance">Ambulance</SelectItem>
                  <SelectItem value="fire_engine">Fire Engine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ADDED: New required input fields */}
            <div className="space-y-2">
              <Label htmlFor="callerName">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input id="callerName" value={callerName} onChange={(e) => setCallerName(e.target.value)} placeholder="e.g., Jane Doe" className="pl-9" required/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callerPhone">Phone Number</Label>
               <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input id="callerPhone" type="tel" value={callerPhone} onChange={(e) => setCallerPhone(e.target.value)} placeholder="Dispatcher will call this number" className="pl-9" required/>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (e.g., floor, landmark)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Provide any helpful details..." />
            </div>

            {/* MODIFIED: Buttons are now more descriptive and have better spacing */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" onClick={requestLocation} className="w-full">
                Refresh Location
              </Button>
              <Button onClick={submitAlert} disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Submitting..." : "Submit Emergency Alert"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-3 h-96 lg:h-full min-h-[400px] rounded-lg overflow-hidden shadow-lg">
          {renderMap()}
        </div>
      </div>
    </main>
  );
};

export default Public;