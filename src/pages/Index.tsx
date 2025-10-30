import { Button } from "@/components/ui/button";
import { ArrowRight, Siren, Ambulance, Shield } from "lucide-react";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <SEO title="VitalRoute – Smart Emergency Response" description="Role-based dashboards for public alerts, drivers, and admin oversight with real-time routing." />
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-muted-foreground mb-6">Real-time emergency routing</div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-primary bg-clip-text text-transparent">VitalRoute</h1>
          <p className="mt-4 text-lg text-muted-foreground">Send alerts, route the nearest vehicle, and keep intersections clear with automated signal control.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/public"><Button variant="hero" className="pulse-glow"><Siren /> Public Alert</Button></a>
            <a href="/driver"><Button variant="secondary"><Ambulance /> Driver Portal</Button></a>
            <a href="/admin"><Button variant="outline"><Shield /> Admin Dashboard</Button></a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
