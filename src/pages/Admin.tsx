import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  BookOpen, 
  GraduationCap,
  LogOut,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Edit,
  Save,
  X,
  Shield,
  LayoutDashboard,
  FileText,
  Settings
} from 'lucide-react';

type CourseLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  category: string;
  is_published: boolean;
  order_index: number;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profession: string | null;
  level: string | null;
  user_id: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
}

const Admin = () => {
  const { user, isAdmin, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'users'>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<(Profile & { role?: string })[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Course form state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    level: '6eme' as CourseLevel,
    category: 'algebre',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && user && !isAdmin) {
      navigate('/dashboard');
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits d'administrateur",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchCourses(), fetchUsers()]);
    setIsLoading(false);
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('level', { ascending: true })
      .order('order_index', { ascending: true });
    
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les cours",
        variant: "destructive",
      });
    } else {
      setCourses(data || []);
    }
  };

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (profilesError || rolesError) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } else {
      setUserRoles(roles || []);
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.user_id)?.role || 'user'
      }));
      setUsers(usersWithRoles);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est requis",
        variant: "destructive",
      });
      return;
    }

    if (editingCourse) {
      const { error } = await supabase
        .from('courses')
        .update({
          title: courseForm.title,
          description: courseForm.description || null,
          level: courseForm.level,
          category: courseForm.category,
        })
        .eq('id', editingCourse.id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le cours",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Cours modifié avec succès",
        });
        fetchCourses();
        resetCourseForm();
      }
    } else {
      const { error } = await supabase
        .from('courses')
        .insert({
          title: courseForm.title,
          description: courseForm.description || null,
          level: courseForm.level,
          category: courseForm.category,
          order_index: courses.length,
        });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le cours",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Cours créé avec succès",
        });
        fetchCourses();
        resetCourseForm();
      }
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      level: course.level,
      category: course.category,
    });
    setShowCourseForm(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) return;
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le cours",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: "Cours supprimé",
      });
      fetchCourses();
    }
  };

  const handleTogglePublish = async (course: Course) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_published: !course.is_published })
      .eq('id', course.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la publication",
        variant: "destructive",
      });
    } else {
      fetchCourses();
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: `Rôle modifié en ${newRole}`,
      });
      fetchUsers();
    }
  };

  const resetCourseForm = () => {
    setShowCourseForm(false);
    setEditingCourse(null);
    setCourseForm({
      title: '',
      description: '',
      level: '6eme',
      category: 'algebre',
    });
  };

  const getLevelLabel = (level: CourseLevel) => {
    const labels: Record<CourseLevel, string> = {
      '6eme': '6ème',
      '5eme': '5ème',
      '4eme': '4ème',
      '3eme': '3ème',
      'seconde': 'Seconde',
      'premiere': 'Première',
      'terminale': 'Terminale',
    };
    return labels[level];
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground font-body">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const stats = [
    { icon: Users, label: 'Utilisateurs', value: users.length, color: 'text-rainbow-blue' },
    { icon: BookOpen, label: 'Cours', value: courses.length, color: 'text-rainbow-green' },
    { icon: GraduationCap, label: 'Publiés', value: courses.filter(c => c.is_published).length, color: 'text-rainbow-purple' },
  ];

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="text-2xl font-display text-rainbow"
          >
            MAXIMATHS
          </button>
          
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-rainbow-purple/20 text-rainbow-purple rounded-full text-sm font-body font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'courses', label: 'Cours', icon: BookOpen },
            { id: 'users', label: 'Utilisateurs', icon: Users },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="rounded-xl flex items-center gap-2"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="card-cartoon bg-card border-border p-6 text-center"
                >
                  <stat.icon className={`w-12 h-12 mx-auto mb-3 ${stat.color}`} />
                  <p className="text-4xl font-display text-foreground mb-1">{stat.value}</p>
                  <p className="text-muted-foreground font-body">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="card-sticker bg-card border-rainbow-blue/30 p-8">
              <h2 className="text-2xl font-display text-foreground mb-4">Bienvenue dans l'espace Admin</h2>
              <p className="text-muted-foreground font-body mb-6">
                Gérez les cours, les chapitres et les utilisateurs depuis cette interface.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => setActiveTab('courses')} className="btn-3d bg-primary rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un cours
                </Button>
                <Button onClick={() => setActiveTab('users')} variant="outline" className="rounded-xl">
                  <Users className="w-4 h-4 mr-2" />
                  Gérer les utilisateurs
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display text-foreground">Gestion des Cours</h2>
              <Button 
                onClick={() => setShowCourseForm(true)} 
                className="btn-3d bg-primary rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau cours
              </Button>
            </div>

            {/* Course Form Modal */}
            {showCourseForm && (
              <div className="card-sticker bg-card border-rainbow-purple/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display text-foreground">
                    {editingCourse ? 'Modifier le cours' : 'Nouveau cours'}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={resetCourseForm}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-body text-muted-foreground mb-1 block">Titre *</label>
                    <Input
                      value={courseForm.title}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Titre du cours"
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-body text-muted-foreground mb-1 block">Description</label>
                    <Textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description du cours"
                      className="rounded-xl"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-body text-muted-foreground mb-1 block">Niveau</label>
                      <Select 
                        value={courseForm.level} 
                        onValueChange={(v) => setCourseForm(prev => ({ ...prev, level: v as CourseLevel }))}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6eme">6ème</SelectItem>
                          <SelectItem value="5eme">5ème</SelectItem>
                          <SelectItem value="4eme">4ème</SelectItem>
                          <SelectItem value="3eme">3ème</SelectItem>
                          <SelectItem value="seconde">Seconde</SelectItem>
                          <SelectItem value="premiere">Première</SelectItem>
                          <SelectItem value="terminale">Terminale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-body text-muted-foreground mb-1 block">Catégorie</label>
                      <Select 
                        value={courseForm.category} 
                        onValueChange={(v) => setCourseForm(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="algebre">Algèbre</SelectItem>
                          <SelectItem value="geometrie">Géométrie</SelectItem>
                          <SelectItem value="analyse">Analyse</SelectItem>
                          <SelectItem value="probabilites">Probabilités</SelectItem>
                          <SelectItem value="statistiques">Statistiques</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveCourse} className="btn-3d bg-primary rounded-xl">
                      <Save className="w-4 h-4 mr-2" />
                      {editingCourse ? 'Enregistrer' : 'Créer'}
                    </Button>
                    <Button variant="outline" onClick={resetCourseForm} className="rounded-xl">
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Courses List */}
            <div className="space-y-4">
              {courses.length === 0 ? (
                <div className="card-cartoon bg-card border-border p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground font-body">Aucun cours créé</p>
                </div>
              ) : (
                courses.map((course) => (
                  <div 
                    key={course.id}
                    className="card-cartoon bg-card border-border p-6 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-display text-foreground">{course.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-body ${
                          course.is_published 
                            ? 'bg-rainbow-green/20 text-rainbow-green' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {course.is_published ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-body">
                        {getLevelLabel(course.level)} • {course.category}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePublish(course)}
                        className="rounded-full"
                      >
                        {course.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCourse(course)}
                        className="rounded-full"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCourse(course.id)}
                        className="rounded-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display text-foreground">Gestion des Utilisateurs</h2>
            
            <div className="space-y-4">
              {users.map((userItem) => (
                <div 
                  key={userItem.id}
                  className="card-cartoon bg-card border-border p-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
                      <span className="text-lg font-display text-secondary-foreground">
                        {userItem.first_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-foreground">
                          {userItem.first_name} {userItem.last_name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-body ${
                          userItem.role === 'admin'
                            ? 'bg-rainbow-purple/20 text-rainbow-purple'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {userItem.role === 'admin' ? 'Admin' : 'Utilisateur'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-body">{userItem.email}</p>
                      {userItem.level && (
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          {userItem.profession} • {userItem.level}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant={userItem.role === 'admin' ? 'outline' : 'default'}
                    onClick={() => handleToggleUserRole(userItem.user_id, userItem.role || 'user')}
                    className="rounded-xl"
                    disabled={userItem.user_id === user?.id}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {userItem.role === 'admin' ? 'Retirer Admin' : 'Promouvoir Admin'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;