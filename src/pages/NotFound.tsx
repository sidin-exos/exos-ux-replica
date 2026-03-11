import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, BarChart3, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Gradient glow background */}
        <div className="absolute inset-0 bg-[var(--gradient-glow)] pointer-events-none" />

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <p className="text-8xl md:text-9xl font-bold text-primary/20 tracking-tighter leading-none select-none">
            404
          </p>
          <h1 className="text-3xl font-semibold text-foreground mt-4">
            Page not found
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-md mx-auto">
            The page you're looking for may have been moved, deleted, or never existed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button asChild>
              <Link to="/">
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                <BarChart3 className="w-4 h-4" />
                Explore Scenarios
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/market-intelligence">
                <TrendingUp className="w-4 h-4" />
                Market Intelligence
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
