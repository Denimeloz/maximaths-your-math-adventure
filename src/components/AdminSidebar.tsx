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
  Settings, 
  LogOut,
  Shield,
  FileText,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Cours', url: '/admin/courses', icon: BookOpen },
  { title: 'Chapitres', url: '/admin/chapters', icon: FileText },
  { title: 'Utilisateurs', url: '/admin/users', icon: Users },
  { title: 'Statistiques', url: '/admin/stats', icon: BarChart3 },
];

const accountItems = [
  { title: 'Mon profil', url: '/profile', icon: User },
  { title: 'Paramètres', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-muted-foreground">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    className={`cursor-pointer transition-colors ${
                      isActive(item.url) 
                        ? 'bg-rainbow-purple/10 text-rainbow-purple font-medium' 
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
          <SidebarGroupLabel className="font-display text-muted-foreground">Compte</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
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
