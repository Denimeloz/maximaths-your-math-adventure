import { Menu, X, Home, Info, ChevronDown, ChevronUp, GraduationCap, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import newLogo from "@/assets/new-logo.png";
import { useAcademicYears } from '@/contexts/AcademicYearContext';
import { fetchSiteLabels } from '@/lib/siteLabels';

const levels = [
  { 
    id: '6eme', 
    label: '6ème', 
    color: 'bg-rainbow-blue',
    hoverColor: 'hover:bg-rainbow-blue/20',
    textColor: 'text-rainbow-blue',
    borderColor: 'border-rainbow-blue'
  },
  { 
    id: '5eme', 
    label: '5ème', 
    color: 'bg-rainbow-green',
    hoverColor: 'hover:bg-rainbow-green/20',
    textColor: 'text-rainbow-green',
    borderColor: 'border-rainbow-green'
  },
  { 
    id: '4eme', 
    label: '4ème', 
    color: 'bg-rainbow-orange',
    hoverColor: 'hover:bg-rainbow-orange/20',
    textColor: 'text-rainbow-orange',
    borderColor: 'border-rainbow-orange'
  },
  { 
    id: '3eme', 
    label: '3ème', 
    color: 'bg-rainbow-coral',
    hoverColor: 'hover:bg-rainbow-coral/20',
    textColor: 'text-rainbow-coral',
    borderColor: 'border-rainbow-coral'
  },
  { 
    id: 'seconde', 
    label: 'Seconde', 
    color: 'bg-rainbow-pink',
    hoverColor: 'hover:bg-rainbow-pink/20',
    textColor: 'text-rainbow-pink',
    borderColor: 'border-rainbow-pink'
  },
  { 
    id: 'premiere', 
    label: 'Première', 
    color: 'bg-rainbow-purple',
    hoverColor: 'hover:bg-rainbow-purple/20',
    textColor: 'text-rainbow-purple',
    borderColor: 'border-rainbow-purple'
  },
  { 
    id: 'terminale', 
    label: 'Terminale', 
    color: 'bg-rainbow-yellow',
    hoverColor: 'hover:bg-rainbow-yellow/20',
    textColor: 'text-rainbow-yellow',
    borderColor: 'border-rainbow-yellow'
  },
];

// Ancienne architecture (≤ 2025-2026) — INCHANGÉE
const subMenuItems = [
  { id: 'infos', label: 'Infos pour la classe', description: 'Informations importantes' },
  { id: 'activites', label: 'Activités', description: 'Découverte et exploration' },
  { id: 'cours', label: 'Cours', description: 'Leçons et chapitres' },
  { id: 'exercices-entrainement', label: "Exercices d'entraînement", description: 'Exercices à pratiquer' },
  { id: 'tests-entrainement', label: 'Tests (Évaluations formatives)', description: 'Tests' },
  { id: 'devoirs', label: 'Devoirs de niveaux', description: 'Devoirs de niveaux' },
  { id: 'evaluations', label: 'Évaluations', description: 'Tests et examens' },
  { id: 'jeux-genially', label: 'Jeux et Genially', description: 'Jeux éducatifs et présentations' },
];

const subMenuItems3emeSeconde = [
  ...subMenuItems,
  { id: 'classe-activite', label: 'Classe en activité', description: 'Photos et moments de classe' },
];

const subMenuItems3eme = [
  ...subMenuItems.map(item => item.id === 'tests-entrainement' ? { ...item, label: 'Tests ou Mini DNB' } : item),
  { id: 'prepa-dnb', label: 'Prépa DNB', description: 'Préparation au brevet' },
  { id: 'ressources-dnb', label: 'Ressources révision DNB', description: 'Fiches et supports à télécharger' },
  { id: 'classe-activite', label: 'Classe en activité', description: 'Photos et moments de classe' },
];

// Ordre 2026-2027+ (nouvelle architecture)
const getNewArchitectureSubMenu = (levelId: string) => {
  const is3eme = levelId === '3eme';
  const items: { id: string; label: string; description: string }[] = [
    { id: 'infos', label: 'Infos pour la classe', description: 'Informations importantes' },
    { id: 'cours', label: "Parcours d'apprentissage", description: 'Leçons et chapitres' },
    { id: 'jeux-genially', label: 'Jeux et Genially', description: 'Jeux éducatifs et présentations' },
    { id: 'classe-activite', label: 'Classe en activité', description: 'Photos et moments de classe' },
    { id: 'exercices-entrainement', label: 'Devoirs de maison', description: 'À réaliser à la maison' },
    { id: 'activites', label: "Espace d'approfondissement", description: 'Pour aller plus loin' },
    { id: 'tests-entrainement', label: is3eme ? 'Tests ou Mini DNB' : 'Test', description: 'Tests' },
    { id: 'evaluations', label: 'Évaluations', description: 'Tests et examens' },
  ];
  if (is3eme) items.push({ id: 'prepa-dnb', label: 'Prépa DNB', description: 'Préparation au brevet' });
  items.push({ id: 'devoirs', label: 'Devoirs de niveaux', description: 'Devoirs de niveaux' });
  if (is3eme) items.push({ id: 'ressources-dnb', label: 'Ressources révision DNB', description: 'Fiches et supports à télécharger' });
  return items;
};

const getSubMenuForLevel = (levelId: string, isNewArchitecture: boolean) => {
  if (isNewArchitecture) return getNewArchitectureSubMenu(levelId);
  if (levelId === '3eme') return subMenuItems3eme;
  if (levelId === 'seconde') return subMenuItems3emeSeconde;
  return subMenuItems;
};

const groups = [
  { id: 'college', label: 'Collège', levelIds: ['6eme', '5eme', '4eme', '3eme'] },
  { id: 'lycee', label: 'Lycée', levelIds: ['seconde', 'premiere', 'terminale'] },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { years, selectedYearId } = useAcademicYears();
  const selectedYear = years.find(y => y.id === selectedYearId);
  const isNewArchitecture = !!selectedYear && selectedYear.start_year >= 2026;
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (isNewArchitecture) {
        const labels = await fetchSiteLabels(selectedYearId);
        if (mounted) setLabelMap(labels || {});
      } else {
        setLabelMap({});
      }
    }
    load();
    return () => { mounted = false; };
  }, [isNewArchitecture, selectedYearId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setExpandedLevel(null);
        setOpenGroup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLevelClick = (levelId: string) => {
    setExpandedLevel(expandedLevel === levelId ? null : levelId);
  };

  const handleSubMenuClick = (levelId: string, subMenuId: string) => {
    navigate(`/niveau/${levelId}/${subMenuId}`);
    setMobileMenuOpen(false);
    setExpandedLevel(null);
    setOpenGroup(null);
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

        {/* Navigation Desktop - Niveaux avec menus cliquables */}
        <nav ref={menuRef} className="hidden lg:flex items-center gap-1">
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
          
          {groups.map((group) => (
            <div key={group.id} className="relative">
              <button
                onClick={() => { setOpenGroup(openGroup === group.id ? null : group.id); setExpandedLevel(null); }}
                className={`flex items-center gap-1 px-4 py-2 rounded-full font-body font-semibold transition-all hover:bg-rainbow-blue/20 ${
                  openGroup === group.id ? 'bg-rainbow-blue/20' : ''
                }`}
              >
                {group.label}
                {openGroup === group.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {openGroup === group.id && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-card rounded-xl shadow-xl border border-border p-2 z-50 animate-slide-up">
                  {group.levelIds.map(levelId => {
                    const level = levels.find(l => l.id === levelId)!;
                    const isOpen = expandedLevel === level.id;
                    return (
                      <div key={level.id} className="relative">
                        <button
                          onClick={() => handleLevelClick(level.id)}
                          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 font-body font-semibold text-sm transition-colors ${level.hoverColor} ${isOpen ? 'bg-muted' : ''}`}
                        >
                          <span className={level.textColor}>{level.label}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 lg:-rotate-90' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="lg:absolute lg:left-full lg:top-0 lg:ml-2 w-full lg:w-60 bg-card rounded-xl lg:shadow-xl lg:border lg:border-border p-1 lg:p-2 z-50">
                            {getSubMenuForLevel(level.id, isNewArchitecture).map((item) => {
                              const displayLabel = labelMap[item.id] || item.label;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleSubMenuClick(level.id, item.id)}
                                  className="block w-full text-left select-none rounded-lg p-2.5 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                  <div className="text-sm font-semibold font-body">{displayLabel}</div>
                                  <p className="text-xs text-muted-foreground font-body mt-1">
                                    {item.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          
          <Button 
            variant="nav" 
            size="sm" 
            className="gap-2 rounded-full hover:bg-rainbow-coral/20 hover:scale-105 transition-all"
            onClick={() => navigate('/ressources-dnb')}
          >
            <GraduationCap className="w-4 h-4 text-rainbow-coral" />
            Ressources DNB
          </Button>

          <Button 
            size="sm" 
            className="gap-2 rounded-full bg-rainbow-blue text-white font-semibold shadow-btn hover:shadow-btn-hover hover:opacity-90 hover:scale-105 transition-all"
            onClick={() => navigate('/ressources-parents')}
          >
            <UsersRound className="w-4 h-4" />
            Espace parents
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
            
            {/* Collège / Lycée avec accordéons imbriqués */}
            {groups.map((group) => (
              <div key={group.id} className="border-b border-border/50 last:border-b-0">
                <button
                  onClick={() => { setOpenGroup(openGroup === group.id ? null : group.id); setExpandedLevel(null); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-rainbow-blue/20 transition-colors"
                >
                  <span className="font-body font-bold text-foreground">{group.label}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openGroup === group.id ? 'rotate-180' : ''}`} />
                </button>

                {openGroup === group.id && (
                  <div className="pl-3 pb-2 space-y-1">
                    {group.levelIds.map(levelId => {
                      const level = levels.find(l => l.id === levelId)!;
                      const isOpen = expandedLevel === level.id;
                      return (
                        <div key={level.id}>
                          <button
                            onClick={() => setExpandedLevel(isOpen ? null : level.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl ${level.hoverColor} transition-colors`}
                          >
                            <span className={`font-body font-semibold ${level.textColor}`}>{level.label}</span>
                            <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isOpen && (
                            <div className="pl-4 pb-2 space-y-1">
                              {getSubMenuForLevel(level.id, isNewArchitecture).map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => handleSubMenuClick(level.id, item.id)}
                                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                                >
                                  <div className="font-body font-medium text-foreground">{labelMap[item.id] || item.label}</div>
                                  <p className="text-xs text-muted-foreground font-body">
                                    {item.description}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            
            <Button 
              variant="ghost" 
              className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-coral/20 mt-2"
              onClick={() => { navigate('/ressources-dnb'); setMobileMenuOpen(false); }}
            >
              <GraduationCap className="w-5 h-5 text-rainbow-coral" />
              Ressources DNB
            </Button>

            <Button 
              variant="ghost" 
              className="justify-start gap-3 h-12 rounded-xl hover:bg-rainbow-blue/20 mt-2"
              onClick={() => { navigate('/ressources-parents'); setMobileMenuOpen(false); }}
            >
              <UsersRound className="w-5 h-5 text-rainbow-blue" />
              Ressources parents
            </Button>

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