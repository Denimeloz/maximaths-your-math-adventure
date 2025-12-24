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
  PenTool,
  HelpCircle,
  ClipboardList,
  FileCheck,
  CheckSquare,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, tab: 'dashboard' },
  { title: 'Cours', url: '/admin/courses', icon: BookOpen, tab: 'courses' },
  { title: 'Exercices', url: '/admin', icon: PenTool, tab: 'exercises' },
  { title: 'Quiz', url: '/admin', icon: HelpCircle, tab: 'quizzes' },
  { title: 'Devoirs', url: '/admin', icon: ClipboardList, tab: 'assignments' },
  { title: 'Évaluations', url: '/admin', icon: FileCheck, tab: 'evaluations' },
  { title: 'Correction', url: '/admin', icon: CheckSquare, tab: 'grading' },
  { title: 'Utilisateurs', url: '/admin/users', icon: Users, tab: 'users' },
];

const accountItems = [
  { title: 'Accueil', url: '/', icon: Home },
  { title: 'Mon profil', url: '/profile', icon: User },
];

interface AdminSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (onTabChange && item.tab) {
      onTabChange(item.tab);
    } else {
      navigate(item.url);
    }
  };

  const isActive = (tab: string) => activeTab === tab;

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
          <SidebarGroupLabel className="font-display text-muted-foreground">Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleMenuClick(item)}
                    className={`cursor-pointer transition-colors ${
                      isActive(item.tab) 
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