import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Siren, Ambulance, Shield } from "lucide-react";

const Navbar = () => {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary" : "hover:bg-muted/50";

  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-6 h-14 flex items-center justify-between">
        <NavLink to="/" className="font-bold text-lg tracking-tight">
          VitalRoute
        </NavLink>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <NavLink to="/public" className={linkCls}><Siren className="mr-2" />Public</NavLink>
          </Button>
          <Button asChild variant="ghost">
            <NavLink to="/driver" className={linkCls}><Ambulance className="mr-2" />Driver</NavLink>
          </Button>
          <Button asChild variant="ghost">
            <NavLink to="/admin" className={linkCls}><Shield className="mr-2" />Admin</NavLink>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
