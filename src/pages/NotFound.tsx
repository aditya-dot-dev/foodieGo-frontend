import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Gradient Header */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        {/* 404 Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-[120px] md:text-[180px] font-black text-white/20 select-none">
            404
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 -mt-20">
        <div className="bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
          <div className="p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-6">
              <MapPin className="h-10 w-10 text-orange-500" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Page Not Found
            </h2>
            
            {/* Message */}
            <p className="text-muted-foreground mb-2">
              Oops! Looks like you've wandered off the menu.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                asChild
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="flex-1 hover:border-orange-500/50 hover:bg-orange-500/5"
              >
                <Link to="/search">
                  <Search className="h-4 w-4 mr-2" />
                  Search Food
                </Link>
              </Button>
            </div>

            {/* Back link */}
            <button 
              onClick={() => window.history.back()}
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back to previous page
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© 2026 FoodieGo. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default NotFound;
