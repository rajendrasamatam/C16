// src/components/UserProfile.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "@/config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfileData {
  firstName: string;
  lastName: string;
  role: string;
  photoURL: string;
  uid: string; // <-- NEW: Add uid to the interface
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          // --- NEW: Add user.uid to the state ---
          setUserProfile({ uid: user.uid, ...userDoc.data() } as UserProfileData);
        } else {
          console.error("No user profile found in Firestore!");
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => { /* ... no changes ... */ };

  if (loading) { /* ... no changes ... */ }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={userProfile?.photoURL} alt={`${userProfile?.firstName}'s profile photo`} />
          <AvatarFallback>
            {userProfile?.firstName?.charAt(0)}
            {userProfile?.lastName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-lg">{userProfile?.firstName} {userProfile?.lastName}</p>
          {/* --- NEW: Display the User ID --- */}
          <p className="text-xs text-muted-foreground">
            {userProfile?.role.replace("_", " ")} • ID: {userProfile?.uid.slice(0, 10)}...
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
};

export default UserProfile;