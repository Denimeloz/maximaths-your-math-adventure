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
  Trophy, 
  User, 
  Settings, 
  LogOut,
  GraduationCap,
  Sparkles,
  Home,
  Target,
  FileText,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const menuItems = [
  { title: 'Tableau de bord', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Mon profil', url: '/profile', icon: User },
  { title: 'Mes badges', url: '/dashboard/badges', icon: Trophy },
  { title: 'Mes devoirs', url: '/dashboard/assignments', icon: FileText },
];

const courseItems = [
  { title: 'Cours Collège', url: '/college', icon: GraduationCap, color: 'text-rainbow-blue' },
  { title: 'Cours Lycée', url: '/lycee', icon: Sparkles, color: 'text-rainbow-purple' },
];

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  const getLevelLabel = () => {
    if (profile?.level === 'college') return 'Collège';
    if (profile?.level === 'lycee') return 'Lycée';
    return 'Tous niveaux';
  };

  return (
    <Sidebar className="border-r border-border bg-card/95 backdrop-blur-sm">
      <SidebarHeader className="p-4 border-b border-border">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer mb-4" 
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-rainbow-purple flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg text-rainbow">MAXIMATHS</span>
        </div>

        {/* User profile card */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-rainbow-purple/5 border border-border/50">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} alt="Avatar" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-rainbow-purple text-white font-display">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-display text-foreground truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground font-body">
                {getLevelLabel()}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progression</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-1.5" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-xs text-muted-foreground uppercase tracking-wider px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/')}
                  className="cursor-pointer transition-all duration-200 rounded-xl hover:bg-muted/50"
                >
                  <Home className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-body">Accueil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    className={`cursor-pointer transition-all duration-200 rounded-xl ${
                      isActive(item.url) 
                        ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 mr-3 ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-body">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-xs text-muted-foreground uppercase tracking-wider px-3">
            Cours
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {courseItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    className={`cursor-pointer transition-all duration-200 rounded-xl ${
                      isActive(item.url) 
                        ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 mr-3 ${isActive(item.url) ? 'text-primary' : item.color}`} />
                    <span className="font-body">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-xs text-muted-foreground uppercase tracking-wider px-3">
            Raccourcis
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/dashboard/calendar')}
                  className="cursor-pointer transition-all duration-200 rounded-xl hover:bg-muted/50"
                >
                  <Calendar className="w-4 h-4 mr-3 text-rainbow-orange" />
                  <span className="font-body">Calendrier</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/dashboard/settings')}
                  className="cursor-pointer transition-all duration-200 rounded-xl hover:bg-muted/50"
                >
                  <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-body">Paramètres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-body">Déconnexion</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
