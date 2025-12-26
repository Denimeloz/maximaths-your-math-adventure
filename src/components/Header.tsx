import { Menu, X, Home, Info, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import newLogo from "@/assets/new-logo.png";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const levels = [
  { 
    id: '6eme', 
    label: '6ème', 
    color: 'bg-rainbow-blue',
    hoverColor: 'hover:bg-rainbow-blue/20',
    textColor: 'text-rainbow-blue'
  },
  { 
    id: '5eme', 
    label: '5ème', 
    color: 'bg-rainbow-green',
    hoverColor: 'hover:bg-rainbow-green/20',
    textColor: 'text-rainbow-green'
  },
  { 
    id: '4eme', 
    label: '4ème', 
    color: 'bg-rainbow-orange',
    hoverColor: 'hover:bg-rainbow-orange/20',
    textColor: 'text-rainbow-orange'
  },
  { 
    id: '3eme', 
    label: '3ème', 
    color: 'bg-rainbow-coral',
    hoverColor: 'hover:bg-rainbow-coral/20',
    textColor: 'text-rainbow-coral'
  },
  { 
    id: 'seconde', 
    label: 'Seconde', 
    color: 'bg-rainbow-pink',
    hoverColor: 'hover:bg-rainbow-pink/20',
    textColor: 'text-rainbow-pink'
  },
  { 
    id: 'premiere', 
    label: 'Première', 
    color: 'bg-rainbow-purple',
    hoverColor: 'hover:bg-rainbow-purple/20',
    textColor: 'text-rainbow-purple'
  },
  { 
    id: 'terminale', 
    label: 'Terminale', 
    color: 'bg-rainbow-yellow',
    hoverColor: 'hover:bg-rainbow-yellow/20',
    textColor: 'text-rainbow-yellow'
  },
];

const subMenuItems = [
  { id: 'cours', label: 'Cours', description: 'Leçons et chapitres' },
  { id: 'devoirs', label: 'Devoirs', description: 'Exercices à rendre' },
  { id: 'evaluations', label: 'Évaluations', description: 'Tests et examens' },
];

const subMenuItems3eme = [
  { id: 'cours', label: 'Cours', description: 'Leçons et chapitres' },
  { id: 'devoirs', label: 'Devoirs de niveau', description: 'Exercices à rendre' },
  { id: 'evaluations', label: 'Évaluation', description: 'Tests et examens' },
  { id: 'prepa-dnb', label: 'Prepa DNB', description: 'Préparation au brevet' },
];

const getSubMenuForLevel = (levelId: string) => {
  return levelId === '3eme' ? subMenuItems3eme : subMenuItems;
};

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const handleSubMenuClick = (levelId: string, subMenuId: string) => {
    navigate(`/niveau/${levelId}/${subMenuId}`);
    setMobileMenuOpen(false);
    setExpandedLevel(null);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-sky-cloud/95 backdrop-blur-md border-b-4 border-rainbow-blue/30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigate('/')}>
          <img 
            src={newLogo} 
            alt="MAXIMATHS Logo" 
            className="w-14 h-14 object-contain"
          />
          <span className="text-2xl md:text-3xl font-display tracking-tight hidden sm:block">
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

        {/* Navigation Desktop - Niveaux avec sous-menus */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="gap-1">
            {!isHomePage && (
              <NavigationMenuItem>
                <Button 
                  variant="nav" 
                  size="sm" 
                  className="gap-2 rounded-full hover:bg-rainbow-green/20 hover:scale-105 transition-all"
                  onClick={() => navigate('/')}
                >
                  <Home className="w-4 h-4 text-rainbow-green" />
                  Accueil
                </Button>
              </NavigationMenuItem>
            )}
            
            {levels.map((level) => (
              <NavigationMenuItem key={level.id}>
                <NavigationMenuTrigger 
                  className={`rounded-full px-4 py-2 font-body font-semibold ${level.hoverColor} transition-all data-[state=open]:${level.color}/20`}
                >
                  {level.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-52 gap-1 p-2">
                    {getSubMenuForLevel(level.id).map((item) => (
                      <li key={item.id}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => handleSubMenuClick(level.id, item.id)}
                            className={`block w-full text-left select-none rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground`}
                          >
                            <div className="text-sm font-semibold font-body">{item.label}</div>
                            <p className="text-xs text-muted-foreground font-body mt-1">
                              {item.description}
                            </p>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
            
            <NavigationMenuItem>
              <Button 
                variant="nav" 
                size="sm" 
                className="gap-2 rounded-full hover:bg-rainbow-pink/20 hover:scale-105 transition-all"
                onClick={() => navigate('/about')}
              >
                <Info className="w-4 h-4 text-rainbow-pink" />
                À propos
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile menu button */}
        <button 
          className="lg:hidden p-2 rounded-xl bg-muted hover:bg-rainbow-blue/20 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-sky-cloud/98 border-t-2 border-border animate-slide-up max-h-[80vh] overflow-y-auto">
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
            
            {/* Niveaux avec accordéon */}
            {levels.map((level) => (
              <div key={level.id} className="border-b border-border/50 last:border-b-0">
                <button
                  onClick={() => setExpandedLevel(expandedLevel === level.id ? null : level.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl ${level.hoverColor} transition-colors`}
                >
                  <span className={`font-body font-semibold ${level.textColor}`}>
                    {level.label}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${expandedLevel === level.id ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {expandedLevel === level.id && (
                  <div className="pl-4 pb-2 space-y-1">
                    {getSubMenuForLevel(level.id).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSubMenuClick(level.id, item.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="font-body font-medium text-foreground">{item.label}</div>
                        <p className="text-xs text-muted-foreground font-body">
                          {item.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <Button 
              variant="ghost" 
              className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-pink/20 mt-2"
              onClick={() => { navigate('/about'); setMobileMenuOpen(false); }}
            >
              <Info className="w-5 h-5 text-rainbow-pink" />
              À propos
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;