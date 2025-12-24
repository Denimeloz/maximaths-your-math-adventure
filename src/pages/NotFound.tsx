import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-gradient relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-16 bg-sky-cloud rounded-full opacity-70 animate-float" />
      <div className="absolute top-40 right-20 w-40 h-20 bg-sky-cloud rounded-full opacity-60 animate-float-delayed" />
      <div className="absolute bottom-32 left-1/4 w-24 h-12 bg-sky-cloud rounded-full opacity-50 animate-float" />
      
      <div className="text-center px-4 relative z-10">
        {/* 404 Number */}
        <div className="text-8xl md:text-9xl font-display mb-6 animate-bounce-in">
          <span className="text-rainbow-yellow">4</span>
          <span className="text-rainbow-pink">0</span>
          <span className="text-rainbow-purple">4</span>
        </div>
        
        {/* Search icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-feature-purple border-4 border-rainbow-purple flex items-center justify-center animate-wiggle">
          <Search className="w-10 h-10 text-rainbow-purple" />
        </div>

        {/* Message */}
        <h1 className="text-2xl md:text-3xl font-display text-foreground mb-4">
          Oups ! Cette page s'est perdue...
        </h1>
        <p className="text-lg text-muted-foreground font-body mb-8 max-w-md mx-auto">
          La page que tu cherches n'existe pas encore ou a été déplacée. 
          Retourne à l'accueil pour continuer ton aventure mathématique !
        </p>
        
        {/* CTA Button */}
        <Button variant="hero" size="lg" asChild>
          <a href="/" className="gap-2">
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
