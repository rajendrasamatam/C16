// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

// --- Import all your pages ---
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Public from "./pages/Public";
import Admin from "./pages/Admin";
import LandingPage from "./pages/LandingPage";
import AmbulanceDriver from "./pages/AmbulanceDriver";
import FireEngineDriver from "./pages/FireEngineDriver";
// --- NEW: Import Login and SignUp pages ---
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

const queryClient = new QueryClient();

// --- Update the wrapper to navigate to the login page ---
const LandingPageWrapper = () => {
  const navigate = useNavigate();
  return <LandingPage onNavigateToLogin={() => navigate("/login")} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPageWrapper />} />

          {/* --- NEW: Auth routes --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Existing pages */}
          <Route path="/index" element={<Index />} />
          <Route path="/public" element={<Public />} />
          <Route path="/admin" element={<Admin />} />

          {/* Separate Driver pages */}
          <Route path="/ambulance" element={<AmbulanceDriver />} />
          <Route path="/fire" element={<FireEngineDriver />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;