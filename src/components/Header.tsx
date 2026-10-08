import { Menu, X, Home, Info, ChevronDown, GraduationCap, UsersRound, Zap, Route, Spline, Puzzle, Search, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import newLogo from "@/assets/new-logo.png";
import { useAcademicYears } from '@/contexts/AcademicYearContext';
import { fetchSiteLabels } from '@/lib/siteLabels';
import { LEVEL_GROUPS, LEVEL_LABELS, LEVEL_STYLES, type LevelId } from '@/lib/levels';
import { getLevelMenu, levelMenuPath, usesNewArchitecture } from '@/lib/levelMenus';
import SiteSearch from '@/components/SiteSearch';

interface ResourceEntry {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Rubriques qui n'existent que pour les années 2026-2027 et suivantes */
  newArchitectureOnly?: boolean;
}

const RESOURCE_ENTRIES: ResourceEntry[] = [
  { to: '/automatismes', label: 'Automatismes', description: 'Entraînement régulier', icon: Zap, newArchitectureOnly: true },
  { to: '/parcours-revision', label: 'Parcours de révision', description: '5 étapes pour réviser', icon: Route, newArchitectureOnly: true },
  { to: '/progression-spiralee', label: 'Progression spiralée', description: "Fiches et exercices pour toute l'année", icon: Spline },
  { to: '/ressources-dnb', label: 'Ressources DNB', description: 'Fiches et annales du brevet', icon: GraduationCap },
  { to: '/club-maths', label: 'Club Jules Verne', description: 'Énigmes, défis et projets', icon: Puzzle },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [searchOpen, setSearchOpen] = useState(false);
  const { years, classes, selectedYearId, setSelectedYearId } = useAcademicYears();
  const selectedYear = years.find(y => y.id === selectedYearId);

  // Années qui ont des classes ouvertes : année en cours d'abord, puis de la plus récente à la plus ancienne
  const browsableYears = years
    .filter(y => classes.some(c => c.academic_year_id === y.id))
    .sort((a, b) => (a.is_active !== b.is_active ? (a.is_active ? -1 : 1) : b.start_year - a.start_year));

  // Le menu ne propose que les classes ouvertes pour l'année choisie (toutes si la liste n'est pas encore chargée)
  const openLevels = new Set(classes.filter(c => c.academic_year_id === selectedYearId).map(c => c.class_level));
  const levelGroups = LEVEL_GROUPS
    .map(group => ({ ...group, levelIds: openLevels.size ? group.levelIds.filter((id: LevelId) => openLevels.has(id)) : group.levelIds }))
    .filter(group => group.levelIds.length > 0);

  const chooseYear = (yearId: string) => {
    setSelectedYearId(yearId);
    setExpandedLevel(null);
  };

  // Choix de l'année, affiché en haut des menus Collège / Lycée quand plusieurs années existent
  const yearSwitch = browsableYears.length > 1 && (
    <div className="px-2 pt-1 pb-2 mb-1 border-b border-border" role="group" aria-label="Année scolaire">
      <p className="text-xs font-body text-muted-foreground mb-1.5">Année scolaire</p>
      <div className="flex flex-wrap gap-1.5">
        {browsableYears.map(year => (
          <button
            key={year.id}
            type="button"
            onClick={() => chooseYear(year.id)}
            aria-pressed={selectedYearId === year.id}
            className={`px-2.5 py-1 rounded-full text-xs font-body font-semibold border transition-colors ${
              selectedYearId === year.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:border-primary'
            }`}
          >
            {year.label}
          </button>
        ))}
      </div>
    </div>
  );
  const isNewArchitecture = usesNewArchitecture(selectedYear?.start_year);
  const hasNewArchitectureYear = years.some(y => usesNewArchitecture(y.start_year));
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});

  const resourceEntries = RESOURCE_ENTRIES.filter(e => !e.newArchitectureOnly || hasNewArchitectureYear);

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

  const closeAll = () => {
    setMobileMenuOpen(false);
    setExpandedLevel(null);
    setOpenGroup(null);
  };

  // Fermer les menus : clic à l'extérieur, touche Échap, changement de page
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setExpandedLevel(null);
        setOpenGroup(null);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAll();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(() => {
    closeAll();
  }, [location.pathname, location.search]);

  const toggleGroup = (id: string) => {
    setOpenGroup(openGroup === id ? null : id);
    setExpandedLevel(null);
  };

  const handleSubMenuClick = (levelId: string, subMenuId: string) => {
    navigate(levelMenuPath(levelId, subMenuId, selectedYearId));
    closeAll();
  };

  const topButton = (active: boolean) =>
    `flex items-center gap-1 px-4 py-2 rounded-full font-body font-semibold transition-colors hover:bg-rainbow-blue/20 ${active ? 'bg-rainbow-blue/20' : ''}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-sky-cloud/95 backdrop-blur-md border-b-4 border-rainbow-blue/30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 rounded-xl" aria-label="MAXIMATHS — retour à l'accueil">
          <img src={newLogo} alt="" className="w-14 h-14 object-contain" />
          <span className="text-2xl md:text-3xl font-display font-semibold tracking-tight hidden sm:block">
            <span className="text-primary">MAXI</span>
            <span className="text-secondary">MATHS</span>
          </span>
        </Link>

        {/* Navigation ordinateur */}
        <nav ref={menuRef} className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
          {!isHomePage && (
            <Button asChild variant="nav" size="sm" className="gap-2 rounded-full hover:bg-rainbow-green/20">
              <Link to="/">
                <Home className="w-4 h-4 text-rainbow-green" />
                Accueil
              </Link>
            </Button>
          )}

          {levelGroups.map((group) => (
            <div key={group.id} className="relative">
              <button
                onClick={() => toggleGroup(group.id)}
                aria-expanded={openGroup === group.id}
                className={topButton(openGroup === group.id)}
              >
                {group.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${openGroup === group.id ? 'rotate-180' : ''}`} />
              </button>

              {openGroup === group.id && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-card rounded-xl shadow-xl border border-border p-2 z-50">
                  {yearSwitch}
                  {group.levelIds.map(levelId => {
                    const style = LEVEL_STYLES[levelId];
                    const isOpen = expandedLevel === levelId;
                    return (
                      <div key={levelId} className="relative">
                        <button
                          onClick={() => setExpandedLevel(isOpen ? null : levelId)}
                          aria-expanded={isOpen}
                          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 font-body font-semibold text-sm transition-colors ${style.hoverBg} ${isOpen ? 'bg-muted' : ''}`}
                        >
                          <span className={style.text}>{LEVEL_LABELS[levelId]}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '-rotate-90' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="absolute left-full top-0 ml-2 w-60 max-h-[75vh] overflow-y-auto bg-card rounded-xl shadow-xl border border-border p-2 z-50">
                            {getLevelMenu(levelId, isNewArchitecture).map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleSubMenuClick(levelId, item.id)}
                                className="block w-full text-left select-none rounded-lg p-2.5 leading-none transition-colors hover:bg-muted focus-visible:bg-muted outline-none"
                              >
                                <div className="text-sm font-semibold font-body">{labelMap[item.id] || item.label}</div>
                                <p className="text-xs text-muted-foreground font-body mt-1">{item.description}</p>
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

          <div className="relative">
            <button
              onClick={() => toggleGroup('ressources')}
              aria-expanded={openGroup === 'ressources'}
              className={topButton(openGroup === 'ressources')}
            >
              Ressources
              <ChevronDown className={`w-4 h-4 transition-transform ${openGroup === 'ressources' ? 'rotate-180' : ''}`} />
            </button>

            {openGroup === 'ressources' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-card rounded-xl shadow-xl border border-border p-2 z-50">
                {resourceEntries.map(entry => (
                  <Link
                    key={entry.to}
                    to={entry.to}
                    onClick={closeAll}
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted focus-visible:bg-muted outline-none"
                  >
                    <entry.icon className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                    <span>
                      <span className="block text-sm font-semibold font-body">{entry.label}</span>
                      <span className="block text-xs text-muted-foreground font-body mt-0.5">{entry.description}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => { closeAll(); setSearchOpen(true); }}
            aria-label="Rechercher sur le site"
            className="flex items-center justify-center h-10 w-10 rounded-full transition-colors hover:bg-rainbow-blue/20"
          >
            <Search className="w-5 h-5" />
          </button>

          <Button asChild size="sm" className="gap-2 rounded-full ml-1">
            <Link to="/ressources-parents">
              <UsersRound className="w-4 h-4" />
              Espace parents
            </Link>
          </Button>

          <Button asChild variant="nav" size="sm" className="gap-2 rounded-full hover:bg-rainbow-pink/20">
            <Link to="/about">
              <Info className="w-4 h-4 text-rainbow-pink" />
              À propos
            </Link>
          </Button>
        </nav>

        {/* Recherche et menu sur téléphone */}
        <div className="lg:hidden flex items-center gap-2">
        <button
          type="button"
          onClick={() => { closeAll(); setSearchOpen(true); }}
          aria-label="Rechercher sur le site"
          className="p-2 rounded-xl bg-muted hover:bg-rainbow-blue/20 transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>
        <button
          className="p-2 rounded-xl bg-muted hover:bg-rainbow-blue/20 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        </div>
      </div>

      <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-sky-cloud border-t-2 border-border max-h-[80vh] overflow-y-auto">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1" aria-label="Navigation principale">
            {!isHomePage && (
              <Link to="/" onClick={closeAll} className="flex items-center gap-3 h-12 px-3 rounded-xl font-body font-bold hover:bg-muted">
                <Home className="w-5 h-5 text-primary" />
                Accueil
              </Link>
            )}

            {yearSwitch}

            {levelGroups.map((group) => (
              <div key={group.id} className="border-b border-border/50">
                <button
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={openGroup === group.id}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <span className="font-body font-bold text-foreground">{group.label}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openGroup === group.id ? 'rotate-180' : ''}`} />
                </button>

                {openGroup === group.id && (
                  <div className="pl-3 pb-2 space-y-1">
                    {group.levelIds.map(levelId => {
                      const style = LEVEL_STYLES[levelId];
                      const isOpen = expandedLevel === levelId;
                      return (
                        <div key={levelId}>
                          <button
                            onClick={() => setExpandedLevel(isOpen ? null : levelId)}
                            aria-expanded={isOpen}
                            className={`w-full flex items-center justify-between p-3 rounded-xl ${style.hoverBg} transition-colors`}
                          >
                            <span className={`font-body font-semibold ${style.text}`}>{LEVEL_LABELS[levelId]}</span>
                            <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isOpen && (
                            <div className="pl-4 pb-2 space-y-1">
                              {getLevelMenu(levelId, isNewArchitecture).map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => handleSubMenuClick(levelId, item.id)}
                                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                                >
                                  <div className="font-body font-medium text-foreground">{labelMap[item.id] || item.label}</div>
                                  <p className="text-xs text-muted-foreground font-body">{item.description}</p>
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

            <div className="border-b border-border/50">
              <button
                onClick={() => toggleGroup('ressources')}
                aria-expanded={openGroup === 'ressources'}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors"
              >
                <span className="font-body font-bold text-foreground">Ressources</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openGroup === 'ressources' ? 'rotate-180' : ''}`} />
              </button>
              {openGroup === 'ressources' && (
                <div className="pl-3 pb-2 space-y-1">
                  {resourceEntries.map(entry => (
                    <Link
                      key={entry.to}
                      to={entry.to}
                      onClick={closeAll}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <entry.icon className="w-5 h-5 shrink-0 text-primary" />
                      <span className="font-body font-medium text-foreground">{entry.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/ressources-parents" onClick={closeAll} className="flex items-center gap-3 h-12 px-3 rounded-xl font-body font-bold hover:bg-muted">
              <UsersRound className="w-5 h-5 text-primary" />
              Espace parents
            </Link>

            <Link to="/about" onClick={closeAll} className="flex items-center gap-3 h-12 px-3 rounded-xl font-body font-bold hover:bg-muted">
              <Info className="w-5 h-5 text-primary" />
              À propos
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
