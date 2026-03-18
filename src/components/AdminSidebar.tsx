import { useNavigate, useLocation } from 'react-router-dom';
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
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

export type AdminCourseLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale' | 'club-maths';

interface LevelConfig {
  id: AdminCourseLevel;
  label: string;
  color: string;
  isClub?: boolean;
}

const levels: LevelConfig[] = [
  { id: '6eme', label: '6ème', color: 'rainbow-blue' },
  { id: '5eme', label: '5ème', color: 'rainbow-green' },
  { id: '4eme', label: '4ème', color: 'rainbow-orange' },
  { id: '3eme', label: '3ème', color: 'rainbow-coral' },
  { id: 'seconde', label: 'Seconde', color: 'rainbow-purple' },
  { id: 'premiere', label: 'Première', color: 'rainbow-pink' },
  { id: 'terminale', label: 'Terminale', color: 'rainbow-blue' },
  { id: 'club-maths', label: 'Club Jules Verne', color: 'rainbow-pink', isClub: true },
];

const getSubSections = (level: AdminCourseLevel) => {
  // Club de maths a ses propres sous-sections
  if (level === 'club-maths') {
    return [
      { id: 'enigmes', label: 'Énigmes hebdomadaires', icon: Puzzle },
      { id: 'projets', label: 'Projets pédagogiques', icon: BookOpen },
    ];
  }
  
  const baseSections = [
    { id: 'infos', label: 'Informations pour la classe', icon: Megaphone },
    { id: 'activites', label: 'Activité de découverte', icon: Lightbulb },
    { id: 'cours', label: 'Cours', icon: BookOpen },
    { id: 'exercices-entrainement', label: "Exercices d'entraînement", icon: Dumbbell },
    { id: 'tests-entrainement', label: "Tests (Évaluations formatives)", icon: Target },
    { id: 'devoirs', label: 'Devoirs de niveaux', icon: ClipboardList },
    { id: 'evaluations', label: 'Évaluations', icon: FileCheck },
  ];
  
  if (level === '3eme') {
    baseSections.push({ id: 'prepa-dnb', label: 'Prépa DNB', icon: Star });
  }
  
  return baseSections;
};

const accountItems = [
  { title: 'Accueil', url: '/', icon: Home },
  { title: 'Mon profil', url: '/profile', icon: User },
];

interface AdminSidebarProps {
  activeTab?: string;
  activeLevel?: AdminCourseLevel | null;
  onTabChange?: (tab: string, level?: AdminCourseLevel) => void;
}

export function AdminSidebar({ activeTab, activeLevel, onTabChange }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [openLevels, setOpenLevels] = useState<Record<string, boolean>>({ 
    [activeLevel || '']: true 
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSubSectionClick = (level: AdminCourseLevel, sectionId: string) => {
    if (onTabChange) {
      onTabChange(sectionId, level);
    }
  };

  const toggleLevel = (levelId: string) => {
    setOpenLevels(prev => ({ ...prev, [levelId]: !prev[levelId] }));
  };

  const isActiveSection = (level: AdminCourseLevel, sectionId: string) => {
    return activeLevel === level && activeTab === sectionId;
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
            <Shield className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-foreground truncate">
              {profile?.first_name || 'Admin'}
            </p>
            <p className="text-xs text-rainbow-purple font-body font-semibold">
              Administrateur
            </p>
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
                  onClick={() => onTabChange?.('dashboard')}
                  className={`cursor-pointer transition-colors ${
                    activeTab === 'dashboard' && !activeLevel
                      ? 'bg-rainbow-purple/10 text-rainbow-purple font-medium' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Niveaux et Club */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-muted-foreground">Niveaux & Club</SidebarGroupLabel>
          <SidebarGroupContent>
            {levels.map((level) => (
              <Collapsible 
                key={level.id} 
                open={openLevels[level.id]} 
                onOpenChange={() => toggleLevel(level.id)}
              >
                <CollapsibleTrigger className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50 ${
                  activeLevel === level.id ? `text-${level.color}` : 'text-foreground'
                }`}>
                  <span className="flex items-center gap-2">
                    {level.isClub ? (
                      <Puzzle className={`w-4 h-4 text-${level.color}`} />
                    ) : (
                      <div className={`w-2 h-2 rounded-full bg-${level.color}`} />
                    )}
                    {level.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openLevels[level.id] ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu className="ml-4 mt-1 border-l-2 border-muted pl-2">
                    {getSubSections(level.id).map((section) => (
                      <SidebarMenuItem key={section.id}>
                        <SidebarMenuButton 
                          onClick={() => handleSubSectionClick(level.id, section.id)}
                          className={`cursor-pointer transition-colors text-sm ${
                            isActiveSection(level.id, section.id)
                              ? `bg-${level.color}/10 text-${level.color} font-medium` 
                              : 'hover:bg-muted/50'
                          }`}
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
                  onClick={() => onTabChange?.('users')}
                  className={`cursor-pointer transition-colors ${
                    activeTab === 'users' && !activeLevel
                      ? 'bg-rainbow-purple/10 text-rainbow-purple font-medium' 
                      : 'hover:bg-muted/50'
                  }`}
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
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
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
