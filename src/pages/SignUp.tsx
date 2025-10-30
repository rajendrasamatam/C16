import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { auth, firestore } from "@/config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [area, setArea] = useState("");
  const [role, setRole] = useState<"admin" | "ambulance_driver" | "fire_driver">("admin");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (data.success) return data.data.url;
    throw new Error("Image upload failed");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let photoURL = "";
      if (photoFile) {
        photoURL = await handleUploadImage(photoFile);
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(firestore, "users", user.uid), {
        name,
        email,
        mobile,
        numberPlate,
        area,
        role,
        photoURL,
        createdAt: new Date(),
      });

      if (role === "admin") navigate("/admin");
      if (role === "ambulance_driver") navigate("/ambulance");
      if (role === "fire_driver") navigate("/fire");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      <SEO title="Sign Up – VitalRoute" description="Create a new account" />

      {/* Left side: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white shadow-lg">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">Create an Account</h2>
          <p className="mb-6 text-gray-500">Enter your details to get started.</p>

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Profile Photo Upload (moved to top) */}
            <div className="flex flex-col items-center space-y-2">
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full object-cover border"
                />
              )}
              <Label
                htmlFor="photo"
                className="cursor-pointer bg-gray-100 px-4 py-2 rounded-md border"
              >
                {photoPreview ? "Change Photo" : "Upload Profile Photo"}
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPhotoFile(file);
                  if (file) setPhotoPreview(URL.createObjectURL(file));
                }}
                required
              />
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {/* Mobile Number */}
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            </div>

            {/* Number Plate */}
            {role !== "admin" && (
              <div>
                <Label htmlFor="numberPlate">Vehicle Number Plate</Label>
                <Input id="numberPlate" value={numberPlate} onChange={(e) => setNumberPlate(e.target.value)} required />
              </div>
            )}

            {/* Area */}
            <div>
              <Label htmlFor="area">Area</Label>
              <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} required />
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="w-full border rounded p-2"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="admin">Admin</option>
                <option value="ambulance_driver">Ambulance Driver</option>
                <option value="fire_driver">Fire Engine Driver</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>

            <p className="text-sm text-center">
              Already have an account?{" "}
              <Link to="/login" className="underline">Log In</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right side: Background Image */}
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/signup-bg.jpg')" }}
      ></div>
    </main>
  );
};

export default SignUp;
