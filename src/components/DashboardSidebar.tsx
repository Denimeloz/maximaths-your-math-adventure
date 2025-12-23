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
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Tableau de bord', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Mon profil', url: '/dashboard/profile', icon: User },
  { title: 'Mes badges', url: '/dashboard/badges', icon: Trophy },
  { title: 'Paramètres', url: '/dashboard/settings', icon: Settings },
];

const courseItems = [
  { title: 'Cours Collège', url: '/college', icon: GraduationCap },
  { title: 'Cours Lycée', url: '/lycee', icon: Sparkles },
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

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-secondary-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-foreground truncate">
              {profile?.first_name || 'Utilisateur'}
            </p>
            <p className="text-xs text-muted-foreground font-body truncate">
              {profile?.email}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-muted-foreground">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    className={`cursor-pointer transition-colors ${
                      isActive(item.url) 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-muted-foreground">Cours</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {courseItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    className={`cursor-pointer transition-colors ${
                      isActive(item.url) 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-muted/50'
                    }`}
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
          className="w-full justify-start gap-2 rounded-xl"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
