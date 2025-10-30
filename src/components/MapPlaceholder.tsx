import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const MapPlaceholder = ({ label = "Map" }: { label?: string }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-72 w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
          <div className="text-center max-w-md">
            <AlertTriangle className="mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">
              Interactive maps and live routing go here. To enable Google Maps or Mapbox, we recommend connecting Supabase for secure key management. You can also temporarily input keys in the UI and store them in localStorage.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPlaceholder;
