import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  User,
  LogOut,
  Shield,
  ClipboardList,
  FileCheck,
  Home,
  Star,
  ChevronDown,
  Lightbulb,
  Dumbbell,
  Target,
  Puzzle,
  Megaphone,
  Camera,
  Gamepad2,
  GraduationCap,
  Spline,
  CalendarRange,
  CalendarPlus,
  Zap,
  Route,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useEffect } from 'react';
import { useAcademicYears } from '@/contexts/AcademicYearContext';

export type AdminCourseLevel =
  | '6eme' | '5eme' | '4eme' | '3eme'
  | 'seconde' | 'premiere' | 'terminale'
  | 'club-maths'
  | 'spiral-progression'
  | 'automatismes'
  | 'parcours-revision';


const LEVEL_LABELS: Record<string, string> = {
  '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
  'seconde': 'Seconde', 'premiere': 'Première', 'terminale': 'Terminale',
};

const SPIRAL_SUBSECTIONS = [
  { id: '6eme', label: '6ème', icon: BookOpen },
  { id: '5eme', label: '5ème', icon: BookOpen },
  { id: '4eme', label: '4ème', icon: BookOpen },
  { id: '3eme', label: '3ème', icon: BookOpen },
  { id: 'seconde', label: 'Seconde', icon: BookOpen },
  { id: 'premiere', label: 'Première', icon: BookOpen },
  { id: 'terminale', label: 'Terminale', icon: BookOpen },
];

const getSubSections = (level: AdminCourseLevel, isNewArchitecture: boolean = false) => {
  if (level === 'club-maths') {
    return [
      { id: 'enigmes', label: 'Énigmes hebdomadaires', icon: Puzzle },
      { id: 'projets', label: 'Projets pédagogiques', icon: BookOpen },
    ];
  }
  if (level === 'spiral-progression') return SPIRAL_SUBSECTIONS;
  if (level === 'automatismes') return [{ id: 'automatismes', label: 'Gérer les supports', icon: Zap }];
  if (level === 'parcours-revision') return [{ id: 'parcours-revision', label: 'Gérer les parcours', icon: Route }];

  const base = [
    { id: 'infos', label: 'Informations pour la classe', icon: Megaphone },
  ];
  base.push({
    id: 'activites',
    label: isNewArchitecture ? "Espace d'approfondissement" : 'Activité de découverte',
    icon: Lightbulb,
  });
  base.push({ id: 'cours', label: 'Cours', icon: BookOpen });
  base.push({
    id: 'exercices-entrainement',
    label: isNewArchitecture ? 'Devoirs de maison' : "Exercices d'entraînement",
    icon: Dumbbell,
  });
  base.push(
    { id: 'tests-entrainement', label: level === '3eme' ? 'Tests ou Mini DNB' : 'Tests (Évaluations formatives)', icon: Target },
    { id: 'devoirs', label: 'Devoirs de niveaux', icon: ClipboardList },
    { id: 'evaluations', label: 'Évaluations', icon: FileCheck },
    { id: 'jeux-genially', label: 'Jeux et Genially', icon: Gamepad2 },
  );
  if (level === '3eme') {
    base.push({ id: 'prepa-dnb', label: 'Prépa DNB', icon: Star });
    base.push({ id: 'ressources-dnb', label: 'Ressources révision DNB', icon: GraduationCap });
    base.push({ id: 'classe-activite', label: 'Classe en activité', icon: Camera });
  }
  if (level === 'seconde') {
    base.push({ id: 'classe-activite', label: 'Classe en activité', icon: Camera });
  }
  return base;
};


const accountItems = [
  { title: 'Accueil', url: '/', icon: Home },
  { title: 'Mon profil', url: '/profile', icon: User },
];

interface AdminSidebarProps {
  activeTab?: string;
  activeLevel?: AdminCourseLevel | null;
  onTabChange?: (tab: string, level?: AdminCourseLevel | null, academicYearId?: string | null) => void;
}

export function AdminSidebar({ activeTab, activeLevel, onTabChange }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { years, classes, selectedYearId } = useAcademicYears();

  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});
  const [openLevels, setOpenLevels] = useState<Record<string, boolean>>({});

  // Auto-open the currently-selected year
  useEffect(() => {
    if (selectedYearId) setOpenYears(prev => ({ ...prev, [selectedYearId]: true }));
  }, [selectedYearId]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleYear = (id: string) => setOpenYears(p => ({ ...p, [id]: !p[id] }));
  const toggleLevel = (id: string) => setOpenLevels(p => ({ ...p, [id]: !p[id] }));

  const isActiveSection = (yearId: string | null, level: AdminCourseLevel, sectionId: string) =>
    activeLevel === level && activeTab === sectionId && (yearId === null || selectedYearId === yearId);

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
            <Shield className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-foreground truncate">{profile?.first_name || 'Admin'}</p>
            <p className="text-xs text-rainbow-purple font-body font-semibold">Administrateur</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onTabChange?.('dashboard', null, null)}
                  className={`cursor-pointer transition-colors ${activeTab === 'dashboard' && !activeLevel ? 'bg-rainbow-purple/10 text-rainbow-purple font-medium' : 'hover:bg-muted/50'}`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onTabChange?.('academic-years', null, null)}
                  className={`cursor-pointer transition-colors ${activeTab === 'academic-years' ? 'bg-rainbow-purple/10 text-rainbow-purple font-medium' : 'hover:bg-muted/50'}`}
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  <span>Nouvelle année</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Années scolaires */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-muted-foreground">Années scolaires</SidebarGroupLabel>
          <SidebarGroupContent>
            {years.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground italic">
                Aucune année. Créez-en une via « Nouvelle année ».
              </p>
            )}
            {years.map(year => {
              const yClasses = classes.filter(c => c.academic_year_id === year.id);
              return (
                <Collapsible key={year.id} open={!!openYears[year.id]} onOpenChange={() => toggleYear(year.id)}>
                  <CollapsibleTrigger className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50 ${selectedYearId === year.id ? 'text-rainbow-purple' : 'text-foreground'}`}>
                    <span className="flex items-center gap-2">
                      <CalendarRange className="w-4 h-4" />
                      {year.label}
                      {year.is_active && <Star className="w-3 h-3 fill-rainbow-purple text-rainbow-purple" />}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openYears[year.id] ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-3 border-l-2 border-muted pl-2">
                      {yClasses.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic px-3 py-2">Aucune classe ouverte.</p>
                      ) : yClasses.map(c => {
                        const lvl = c.class_level as AdminCourseLevel;
                        const key = `${year.id}:${c.id}`;
                        return (
                          <Collapsible key={c.id} open={!!openLevels[key]} onOpenChange={() => toggleLevel(key)}>
                            <CollapsibleTrigger className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-muted/50 ${selectedYearId === year.id && activeLevel === lvl ? 'text-rainbow-purple font-medium' : 'text-foreground'}`}>
                              <span className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rainbow-purple/60" />
                                {LEVEL_LABELS[c.class_level] || c.class_level}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openLevels[key] ? 'rotate-180' : ''}`} />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenu className="ml-3 mt-1 border-l border-muted/60 pl-2">
                                {getSubSections(lvl, year.start_year >= 2026).map(section => (
                                  <SidebarMenuItem key={section.id}>
                                    <SidebarMenuButton
                                      onClick={() => onTabChange?.(section.id, lvl, year.id)}
                                      className={`cursor-pointer transition-colors text-sm ${isActiveSection(year.id, lvl, section.id) ? 'bg-rainbow-purple/10 text-rainbow-purple font-medium' : 'hover:bg-muted/50'}`}
                                    >
                                      <section.icon className="w-4 h-4 mr-2" />
                                      <span className="truncate">{section.label}</span>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                ))}
                              </SidebarMenu>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Espaces transverses */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-muted-foreground">Espaces transverses</SidebarGroupLabel>
          <SidebarGroupContent>
            {[
              { id: 'club-maths' as AdminCourseLevel, label: 'Club Jules Verne', icon: Puzzle },
              { id: 'spiral-progression' as AdminCourseLevel, label: 'Progression Spiralée', icon: Spline },
              { id: 'automatismes' as AdminCourseLevel, label: 'Automatismes', icon: Zap },
              { id: 'parcours-revision' as AdminCourseLevel, label: 'Parcours de révision', icon: Route },
            ].map(item => (

              <Collapsible key={item.id} open={!!openLevels[item.id]} onOpenChange={() => toggleLevel(item.id)}>
                <CollapsibleTrigger className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50 ${activeLevel === item.id ? 'text-rainbow-purple' : 'text-foreground'}`}>
                  <span className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openLevels[item.id] ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu className="ml-4 mt-1 border-l-2 border-muted pl-2">
                    {getSubSections(item.id).map(section => (
                      <SidebarMenuItem key={section.id}>
                        <SidebarMenuButton
                          onClick={() => onTabChange?.(section.id, item.id, (item.id === 'automatismes' || item.id === 'parcours-revision') ? (selectedYearId || undefined) : null)}
                          className={`cursor-pointer transition-colors text-sm ${activeLevel === item.id && activeTab === section.id ? 'bg-rainbow-purple/10 text-rainbow-purple font-medium' : 'hover:bg-muted/50'}`}
                        >
                          <section.icon className="w-4 h-4 mr-2" />
                          <span className="truncate">{section.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestion */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-muted-foreground">Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onTabChange?.('users', null, null)}
                  className={`cursor-pointer transition-colors ${activeTab === 'users' && !activeLevel ? 'bg-rainbow-purple/10 text-rainbow-purple font-medium' : 'hover:bg-muted/50'}`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span>Utilisateurs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-muted-foreground">Compte</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={() => navigate(item.url)} className="cursor-pointer transition-colors hover:bg-muted/50">
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
