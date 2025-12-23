import { Book, GraduationCap, Info, Menu, X, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import newLogo from "@/assets/new-logo.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-sky-cloud/95 backdrop-blur-md border-b-4 border-rainbow-blue/30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img 
            src={newLogo} 
            alt="MAXIMATHS Logo" 
            className="w-14 h-14 object-contain"
          />
          <span className="text-2xl md:text-3xl font-display tracking-tight">
            <span className="text-rainbow-coral">M</span>
            <span className="text-rainbow-yellow">A</span>
            <span className="text-rainbow-orange">X</span>
            <span className="text-rainbow-pink">I</span>
            <span className="text-rainbow-purple">M</span>
            <span className="text-rainbow-blue">A</span>
            <span className="text-rainbow-green">T</span>
            <span className="text-rainbow-coral">H</span>
            <span className="text-rainbow-yellow">S</span>
          </span>
        </div>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-2">
          {!isHomePage && (
            <Button 
              variant="nav" 
              size="sm" 
              className="gap-2 rounded-full hover:bg-rainbow-green/20 hover:scale-105 transition-all"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 text-rainbow-green" />
              Accueil
            </Button>
          )}
          <Button 
            variant="nav" 
            size="sm" 
            className="gap-2 rounded-full hover:bg-rainbow-blue/20 hover:scale-105 transition-all"
            onClick={() => navigate('/college')}
          >
            <Book className="w-4 h-4 text-rainbow-blue" />
            Collège
          </Button>
          <Button 
            variant="nav" 
            size="sm" 
            className="gap-2 rounded-full hover:bg-rainbow-purple/20 hover:scale-105 transition-all"
            onClick={() => navigate('/lycee')}
          >
            <GraduationCap className="w-4 h-4 text-rainbow-purple" />
            Lycée
          </Button>
          <Button 
            variant="nav" 
            size="sm" 
            className="gap-2 rounded-full hover:bg-rainbow-pink/20 hover:scale-105 transition-all"
            onClick={() => navigate('/about')}
          >
            <Info className="w-4 h-4 text-rainbow-pink" />
            À propos
          </Button>
        </nav>

        {/* CTA Button & Mobile Menu */}
        <div className="flex items-center gap-3">
          <Button 
            variant="orange" 
            size="sm" 
            className="hidden sm:flex shadow-[0_5px_0_hsl(25_100%_35%)] text-sm font-bold gap-2"
            onClick={() => navigate('/auth')}
          >
            <LogIn className="w-4 h-4" />
            Connexion
          </Button>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-xl bg-muted hover:bg-rainbow-blue/20 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sky-cloud/98 border-t-2 border-border animate-slide-up">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {!isHomePage && (
              <Button 
                variant="ghost" 
                className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-green/20"
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
              >
                <Home className="w-5 h-5 text-rainbow-green" />
                Accueil
              </Button>
            )}
            <Button 
              variant="ghost" 
              className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-blue/20"
              onClick={() => { navigate('/college'); setMobileMenuOpen(false); }}
            >
              <Book className="w-5 h-5 text-rainbow-blue" />
              Collège
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-purple/20"
              onClick={() => { navigate('/lycee'); setMobileMenuOpen(false); }}
            >
              <GraduationCap className="w-5 h-5 text-rainbow-purple" />
              Lycée
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-pink/20"
              onClick={() => { navigate('/about'); setMobileMenuOpen(false); }}
            >
              <Info className="w-5 h-5 text-rainbow-pink" />
              À propos
            </Button>
            <Button 
              variant="orange" 
              className="mt-2 h-12 shadow-[0_5px_0_hsl(25_100%_35%)] gap-2"
              onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
            >
              <LogIn className="w-5 h-5" />
              Connexion
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;