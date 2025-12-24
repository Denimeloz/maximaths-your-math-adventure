import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Menu, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Lock,
  Save,
  Loader2
} from 'lucide-react';

const DashboardSettings = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification settings (local state - could be persisted to DB)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [quizResults, setQuizResults] = useState(true);

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: "Votre mot de passe a été mis à jour",
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setIsUpdating(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-hero-gradient">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-4 py-3">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div>
                <h1 className="text-lg font-display text-foreground flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  Paramètres
                </h1>
                <p className="text-xs text-muted-foreground font-body">
                  Gérez vos préférences et votre compte
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Profile section */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profil
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Prénom</Label>
                      <p className="text-foreground font-medium">{profile?.first_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Nom</Label>
                      <p className="text-foreground font-medium">{profile?.last_name || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="text-foreground font-medium">{profile?.email || user.email}</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    Modifier le profil
                  </Button>
                </div>
              </div>

              {/* Notifications section */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-rainbow-yellow" />
                  Notifications
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">Notifications par email</p>
                      <p className="text-sm text-muted-foreground">Recevoir des emails pour les mises à jour importantes</p>
                    </div>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">Rappels de devoirs</p>
                      <p className="text-sm text-muted-foreground">Recevoir un rappel avant la date limite</p>
                    </div>
                    <Switch 
                      checked={assignmentReminders} 
                      onCheckedChange={setAssignmentReminders} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">Résultats de quiz</p>
                      <p className="text-sm text-muted-foreground">Être notifié quand un quiz est noté</p>
                    </div>
                    <Switch 
                      checked={quizResults} 
                      onCheckedChange={setQuizResults} 
                    />
                  </div>
                </div>
              </div>

              {/* Security section */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rainbow-green" />
                  Sécurité
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={isUpdating || !newPassword || !confirmPassword}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Changer le mot de passe
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Theme section */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-rainbow-purple" />
                  Apparence
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Le thème s'adapte automatiquement aux préférences de votre système.
                </p>
                <div className="flex gap-3">
                  <div className="flex-1 p-4 rounded-xl border border-border bg-background text-center">
                    <div className="w-8 h-8 rounded-full bg-card border border-border mx-auto mb-2" />
                    <p className="text-sm text-foreground">Clair</p>
                  </div>
                  <div className="flex-1 p-4 rounded-xl border border-border bg-zinc-900 text-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 mx-auto mb-2" />
                    <p className="text-sm text-zinc-100">Sombre</p>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardSettings;
