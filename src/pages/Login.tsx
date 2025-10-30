// src/pages/Login.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { auth, firestore } from "@/config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(firestore, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        // Redirect based on role
        switch (role) {
          case "admin":
            navigate("/admin");
            break;
          case "ambulance_driver":
            navigate("/ambulance");
            break;
          case "fire_driver":
            navigate("/fire");
            break;
          default:
            setError("Unknown role. Please contact support.");
        }
      } else {
        setError("User profile not found. Please contact support.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to log in. Please check your credentials.");
    }
  };

  return (
    <main className="container min-h-screen flex items-center justify-center py-10">
      <SEO title="Login – VitalRoute" description="Log in to your account" />
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@vitalroute.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">
              Log In
            </Button>
            <div className="text-center text-sm mt-2">
              Don't have an account?{" "}
              <Link to="/signup" className="underline text-primary">
                Sign Up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;
