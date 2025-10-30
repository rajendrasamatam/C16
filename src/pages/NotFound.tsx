import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-2 text-primary">404</h1>
        <p className="text-lg text-muted-foreground mb-6">Oops! Page not found</p>
        <a href="/" className="inline-block">
          <span className="sr-only">Return to Home</span>
          <button className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
            Return to Home
          </button>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
