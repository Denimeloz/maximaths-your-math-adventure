import { Book, GraduationCap, Info, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import maximathsLogo from "@/assets/maximaths-logo.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-sky-cloud/95 backdrop-blur-md border-b-4 border-rainbow-blue/30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={maximathsLogo} 
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
          <Button variant="nav" size="sm" className="gap-2 rounded-full hover:bg-rainbow-blue/20 hover:scale-105 transition-all">
            <Book className="w-4 h-4 text-rainbow-blue" />
            Collège
          </Button>
          <Button variant="nav" size="sm" className="gap-2 rounded-full hover:bg-rainbow-purple/20 hover:scale-105 transition-all">
            <GraduationCap className="w-4 h-4 text-rainbow-purple" />
            Lycée
          </Button>
          <Button variant="nav" size="sm" className="gap-2 rounded-full hover:bg-rainbow-pink/20 hover:scale-105 transition-all">
            <Info className="w-4 h-4 text-rainbow-pink" />
            À propos
          </Button>
        </nav>

        {/* CTA Button & Mobile Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Button 
                variant="orange" 
                size="sm" 
                className="shadow-[0_5px_0_hsl(25_100%_35%)] text-sm font-bold"
                onClick={() => navigate('/dashboard')}
              >
                <User className="w-4 h-4 mr-1" />
                {profile?.first_name || 'Mon espace'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-full hover:bg-destructive/20"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="orange" 
              size="sm" 
              className="hidden sm:flex shadow-[0_5px_0_hsl(25_100%_35%)] text-sm font-bold"
              onClick={() => navigate('/auth')}
            >
              🎓 Espace Élève
            </Button>
          )}
          
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
            <Button variant="ghost" className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-blue/20">
              <Book className="w-5 h-5 text-rainbow-blue" />
              Collège
            </Button>
            <Button variant="ghost" className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-purple/20">
              <GraduationCap className="w-5 h-5 text-rainbow-purple" />
              Lycée
            </Button>
            <Button variant="ghost" className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-pink/20">
              <Info className="w-5 h-5 text-rainbow-pink" />
              À propos
            </Button>
            {user ? (
              <>
                <Button 
                  variant="orange" 
                  className="mt-2 h-12 shadow-[0_5px_0_hsl(25_100%_35%)]"
                  onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
                >
                  <User className="w-5 h-5 mr-2" />
                  Mon espace
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-12 rounded-xl hover:bg-destructive/20 text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button 
                variant="orange" 
                className="mt-2 h-12 shadow-[0_5px_0_hsl(25_100%_35%)]"
                onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
              >
                🎓 Espace Élève
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;