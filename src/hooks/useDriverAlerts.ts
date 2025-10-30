import { useEffect, useState } from "react";
import { firestore } from "@/config/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export type RoleType = 'ambulance' | 'fire';

export interface Alert {
  id: string;
  type: RoleType;
  location: { lat: number; lng: number };
  notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'picked';
  createdAt: any; // Firestore Timestamp
}

export const useDriverAlerts = (role: RoleType) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [acceptedAlert, setAcceptedAlert] = useState<Alert | null>(null);

  // Fetch alerts in real-time
  useEffect(() => {
    const alertsCollectionRef = collection(firestore, "alerts");
    const q = query(
      alertsCollectionRef,
      where("type", "==", role),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedAlerts: Alert[] = [];
      querySnapshot.forEach((doc) => {
        fetchedAlerts.push({ id: doc.id, ...doc.data() } as Alert);
      });
      setAlerts(fetchedAlerts);
    });

    return () => unsubscribe();
  }, [role]);

  const accept = async (alert: Alert) => {
    setAcceptedAlert(alert);
    const alertDocRef = doc(firestore, "alerts", alert.id);
    await updateDoc(alertDocRef, { status: "accepted" });
  };

  const reject = async (id: string) => {
    const alertDocRef = doc(firestore, "alerts", id);
    await updateDoc(alertDocRef, { status: "rejected" });
  };

  const completePickup = async () => {
    if (!acceptedAlert) return;
    const alertDocRef = doc(firestore, "alerts", acceptedAlert.id);
    await updateDoc(alertDocRef, { status: "picked" });
    setAcceptedAlert(null);
  };

  return { alerts, acceptedAlert, accept, reject, completePickup };
};
