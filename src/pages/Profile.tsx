import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  Save, 
  Camera,
  Loader2,
  ArrowLeft
} from 'lucide-react';

const Profile = () => {
  const { user, profile, isAdmin, isLoading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    profession: '',
    level: '',
    bio: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        profession: profile.profession || '',
        level: profile.level || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        profession: formData.profession,
        level: formData.level,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès ✨",
        description: "Profil mis à jour avec succès",
      });
      await refreshProfile();
      setIsEditing(false);
    }
    
    setIsSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground font-body">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const SidebarComponent = isAdmin ? AdminSidebar : DashboardSidebar;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-hero-gradient">
        <SidebarComponent />
        
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-display text-foreground">Mon Profil</h1>
                <p className="text-muted-foreground font-body">
                  Gérez vos informations personnelles
                </p>
              </div>
            </div>

            {/* Profile Card */}
            <div className="card-sticker bg-card border-rainbow-purple/30 p-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <User className="w-12 h-12 text-secondary-foreground" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
                <h2 className="mt-4 text-xl font-display text-foreground">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <p className="text-muted-foreground font-body">{profile?.email}</p>
                {isAdmin && (
                  <span className="mt-2 px-3 py-1 bg-rainbow-purple/20 text-rainbow-purple rounded-full text-sm font-body font-semibold">
                    Administrateur
                  </span>
                )}
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="font-body font-semibold flex items-center gap-2">
                      <User className="w-4 h-4 text-rainbow-purple" />
                      Prénom
                    </Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="rounded-xl border-2 focus:border-rainbow-purple h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="font-body font-semibold">
                      Nom
                    </Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="rounded-xl border-2 focus:border-rainbow-purple h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-body font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rainbow-pink" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="rounded-xl border-2 h-12 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession" className="font-body font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-rainbow-orange" />
                    Profession
                  </Label>
                  <Input
                    id="profession"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Élève, Enseignant, Parent..."
                    className="rounded-xl border-2 focus:border-rainbow-orange h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="font-body font-semibold flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-rainbow-blue" />
                    Niveau d'intérêt
                  </Label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full h-12 px-4 rounded-xl border-2 border-input bg-background focus:border-rainbow-blue focus:outline-none focus:ring-2 focus:ring-rainbow-blue/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionnez un niveau</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                    <option value="both">Les deux</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-body font-semibold">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Parlez-nous de vous..."
                    className="rounded-xl border-2 focus:border-rainbow-green min-h-[100px]"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          if (profile) {
                            setFormData({
                              first_name: profile.first_name || '',
                              last_name: profile.last_name || '',
                              profession: profile.profession || '',
                              level: profile.level || '',
                              bio: profile.bio || '',
                            });
                          }
                        }}
                        className="flex-1 h-12 rounded-xl"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 h-12 rounded-xl btn-3d bg-primary"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Enregistrer
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="w-full h-12 rounded-xl btn-3d bg-primary"
                    >
                      Modifier le profil
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="mt-6 card-cartoon bg-card border-border p-6">
              <h3 className="font-display text-lg text-foreground mb-4">Informations du compte</h3>
              <div className="space-y-3 text-sm font-body">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membre depuis</span>
                  <span className="text-foreground">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernière mise à jour</span>
                  <span className="text-foreground">
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rôle</span>
                  <span className={`font-semibold ${isAdmin ? 'text-rainbow-purple' : 'text-rainbow-blue'}`}>
                    {isAdmin ? 'Administrateur' : 'Utilisateur'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Profile;
