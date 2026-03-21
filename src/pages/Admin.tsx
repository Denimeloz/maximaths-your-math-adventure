import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ExerciseManager } from '@/components/admin/ExerciseManager';
import { AssignmentManager } from '@/components/admin/AssignmentManager';
import { EvaluationManager } from '@/components/admin/EvaluationManager';
import { FileVideoManager } from '@/components/admin/FileVideoManager';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { DnbManager } from '@/components/admin/DnbManager';
import ActivityManager from '@/components/admin/ActivityManager';
import { TrainingExerciseManager } from '@/components/admin/TrainingExerciseManager';
import { TrainingTestManager } from '@/components/admin/TrainingTestManager';
import { ClubMathsManager } from '@/components/admin/ClubMathsManager';
import { ClassInfoManager } from '@/components/admin/ClassInfoManager';
import { ClassPhotosManager } from '@/components/admin/ClassPhotosManager';
import PDFViewer from '@/components/PDFViewer';
import { 
  Users, 
  BookOpen, 
  GraduationCap,
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
  TrendingUp,
  Award,
  Upload,
  Image,
  Loader2,
  Layers,
  PenTool,
  ClipboardList,
  FileCheck,
  CheckSquare
} from 'lucide-react';

import { AdminCourseLevel } from '@/components/AdminSidebar';

type CourseLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  category: string;
  is_published: boolean;
  order_index: number;
  image_url: string | null;
  pdf_url: string | null;
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
  const location = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // Determine active tab from URL
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === '/admin/courses') return 'courses';
    if (path === '/admin/users') return 'users';
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState<string>(getActiveTabFromPath);
  const [activeLevel, setActiveLevel] = useState<AdminCourseLevel | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<(Profile & { role?: string })[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  
  // Course form state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    level: '6eme' as CourseLevel,
    category: 'algebre',
    image_url: '',
    pdf_url: '',
    video_links: [] as { title: string; url: string }[],
    game_links: [] as { title: string; url: string }[],
  });

  // Sync activeTab with URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `courses/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(fileName);

      setCourseForm(prev => ({ ...prev, image_url: publicUrl }));

      toast({
        title: "Succès ✨",
        description: "Image téléchargée avec succès",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier PDF",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier PDF ne doit pas dépasser 20MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPdf(true);

    try {
      // Generate unique filename
      const fileName = `pdfs/${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(fileName);

      setCourseForm(prev => ({ ...prev, pdf_url: publicUrl }));

      toast({
        title: "Succès ✨",
        description: "Fichier PDF téléchargé avec succès",
      });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier PDF",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPdf(false);
    }
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
          image_url: courseForm.image_url || null,
          pdf_url: courseForm.pdf_url || null,
          video_url: courseForm.video_url || null,
          game_url: courseForm.game_url || null,
        } as any)
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
          image_url: courseForm.image_url || null,
          pdf_url: courseForm.pdf_url || null,
          video_url: courseForm.video_url || null,
          game_url: courseForm.game_url || null,
          order_index: courses.length,
        } as any);

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
      image_url: course.image_url || '',
      pdf_url: course.pdf_url || '',
      video_url: (course as any).video_url || '',
      game_url: (course as any).game_url || '',
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
      image_url: '',
      pdf_url: '',
      video_url: '',
      game_url: '',
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
    { icon: Users, label: 'Utilisateurs', value: users.length, color: 'text-rainbow-blue', bg: 'bg-rainbow-blue/10' },
    { icon: BookOpen, label: 'Cours', value: courses.length, color: 'text-rainbow-green', bg: 'bg-rainbow-green/10' },
    { icon: GraduationCap, label: 'Publiés', value: courses.filter(c => c.is_published).length, color: 'text-rainbow-purple', bg: 'bg-rainbow-purple/10' },
    { icon: Award, label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-rainbow-orange', bg: 'bg-rainbow-orange/10' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-hero-gradient">
        <AdminSidebar 
          activeTab={activeTab} 
          activeLevel={activeLevel}
          onTabChange={(tab, level) => {
            setActiveTab(tab);
            setActiveLevel(level || null);
          }} 
        />
        
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-rainbow-purple" />
              Panel Administrateur
            </h1>
            <p className="text-muted-foreground font-body mt-1">
              Gérez votre plateforme MAXIMATHS
            </p>
          </div>

          {/* Level-specific header */}
          {activeLevel && (
            <div className="mb-6 p-4 rounded-xl bg-card border border-border">
            <h2 className="text-xl font-display text-foreground flex items-center gap-2">
                {activeLevel === 'club-maths' ? 'Club Jules Verne' : getLevelLabel(activeLevel as CourseLevel)} - {
                  activeTab === 'infos' ? 'Informations pour la classe' :
                  activeTab === 'cours' ? 'Cours' :
                  activeTab === 'activites' ? 'Activité de découverte' :
                  activeTab === 'exercices-entrainement' ? "Exercices d'entraînement" :
                  activeTab === 'tests-entrainement' ? "Tests (Évaluations formatives)" :
                  activeTab === 'devoirs' ? 'Devoirs de niveaux' :
                  activeTab === 'evaluations' ? 'Évaluations' :
                  activeTab === 'prepa-dnb' ? 'Prépa DNB' :
                  activeTab === 'classe-activite' ? 'Classe en activité' :
                  activeTab === 'enigmes' ? 'Énigmes hebdomadaires' :
                  activeTab === 'projets' ? 'Projets pédagogiques' : ''
                }
              </h2>
            </div>
          )}

          {/* Tabs - Only show when no level selected */}
          {!activeLevel && (
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'users', label: 'Utilisateurs', icon: Users },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className="rounded-xl flex items-center gap-2 whitespace-nowrap"
                  size="sm"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              ))}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && !activeLevel && <AdminDashboard />}

          {/* Class Info Section */}
          {activeTab === 'infos' && activeLevel && activeLevel !== 'club-maths' && (
            <ClassInfoManager selectedLevel={activeLevel as CourseLevel} />
          )}

          {/* Club de maths Sections */}
          {activeLevel === 'club-maths' && (activeTab === 'enigmes' || activeTab === 'projets') && (
            <ClubMathsManager selectedActivityType={activeTab} />
          )}

          {/* Courses Tab - filtered by level */}
          {activeTab === 'cours' && activeLevel && activeLevel !== 'club-maths' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display text-foreground">Cours - {getLevelLabel(activeLevel as CourseLevel)}</h2>
                <Button 
                  onClick={() => {
                    setCourseForm(prev => ({ ...prev, level: activeLevel as CourseLevel }));
                    setShowCourseForm(true);
                  }} 
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

                    {/* Image Upload */}
                    <div>
                      <label className="text-sm font-body text-muted-foreground mb-1 block">Image du cours</label>
                      <div className="flex items-center gap-4">
                        {courseForm.image_url ? (
                          <div className="relative">
                            <img 
                              src={courseForm.image_url} 
                              alt="Preview" 
                              className="w-24 h-24 rounded-xl object-cover"
                            />
                            <button
                              onClick={() => setCourseForm(prev => ({ ...prev, image_url: '' }))}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3 text-destructive-foreground" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                            <Image className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="rounded-xl"
                          >
                            {isUploadingImage ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Upload...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                {courseForm.image_url ? 'Changer' : 'Télécharger'}
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">Max 5MB, JPG/PNG</p>
                        </div>
                      </div>
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
                          <SelectItem value="automatismes">Automatismes</SelectItem>
                          <SelectItem value="activite">Activité de découverte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* PDF Upload */}
                    <div>
                      <label className="text-sm font-body text-muted-foreground mb-1 block">Fichier PDF du cours</label>
                      <div className="flex items-center gap-4">
                        {courseForm.pdf_url ? (
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                            <FileText className="w-8 h-8 text-rainbow-blue" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-body text-foreground truncate">Fichier PDF ajouté</p>
                              <a 
                                href={courseForm.pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-rainbow-blue hover:underline"
                              >
                                Voir le fichier
                              </a>
                            </div>
                            <button
                              onClick={() => setCourseForm(prev => ({ ...prev, pdf_url: '' }))}
                              className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3 text-destructive-foreground" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-3">
                            <FileText className="w-8 h-8 text-muted-foreground/50" />
                            <span className="text-sm text-muted-foreground">Aucun fichier PDF</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <input
                          type="file"
                          ref={pdfInputRef}
                          onChange={handlePdfUpload}
                          accept=".pdf,application/pdf"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => pdfInputRef.current?.click()}
                          disabled={isUploadingPdf}
                          className="rounded-xl"
                        >
                          {isUploadingPdf ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Upload...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              {courseForm.pdf_url ? 'Changer le PDF' : 'Télécharger un PDF'}
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">Max 20MB, PDF uniquement</p>
                      </div>
                      {/* PDF Preview */}
                      {courseForm.pdf_url && (
                        <div className="mt-4">
                          <PDFViewer url={courseForm.pdf_url} title="Aperçu du PDF du cours" />
                        </div>
                      )}
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="text-sm font-body text-muted-foreground mb-1 block">Lien vidéo (YouTube, etc.)</label>
                      <Input
                        value={courseForm.video_url}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, video_url: e.target.value }))}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Collez un lien YouTube ou autre plateforme vidéo</p>
                    </div>

                    {/* Game URL */}
                    <div>
                      <label className="text-sm font-body text-muted-foreground mb-1 block">Lien de jeu éducatif</label>
                      <Input
                        value={courseForm.game_url}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, game_url: e.target.value }))}
                        placeholder="https://www.geogebra.org/..."
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Collez un lien vers un jeu interactif (GeoGebra, Scratch, etc.)</p>
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

              {/* Courses List filtered by level */}
              <div className="space-y-4">
                {courses.filter(c => c.level === activeLevel).length === 0 ? (
                  <div className="card-cartoon bg-card border-border p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground font-body">Aucun cours pour ce niveau</p>
                  </div>
                ) : (
                  courses.filter(c => c.level === activeLevel).map((course) => (
                    <div 
                      key={course.id}
                      className="card-cartoon bg-card border-border p-6 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        {course.image_url ? (
                          <img src={course.image_url} alt={course.title} className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-rainbow-purple/20 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-rainbow-purple" />
                          </div>
                        )}
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
                            {course.category}
                          </p>
                        </div>
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

          {/* Activites Tab - filtered by level */}
          {activeTab === 'activites' && activeLevel && activeLevel !== 'club-maths' && (
            <ActivityManager selectedLevel={activeLevel as CourseLevel} />
          )}

          {/* Training Exercises Tab - filtered by level */}
          {activeTab === 'exercices-entrainement' && activeLevel && activeLevel !== 'club-maths' && (
            <TrainingExerciseManager filterLevel={activeLevel as CourseLevel} />
          )}

          {/* Training Tests Tab - filtered by level */}
          {activeTab === 'tests-entrainement' && activeLevel && activeLevel !== 'club-maths' && (
            <TrainingTestManager filterLevel={activeLevel as CourseLevel} />
          )}

          {/* Assignments Tab - filtered by level */}
          {activeTab === 'devoirs' && activeLevel && activeLevel !== 'club-maths' && (
            <AssignmentManager filterLevel={activeLevel as CourseLevel} />
          )}

          {/* Evaluations Tab - filtered by level */}
          {activeTab === 'evaluations' && activeLevel && activeLevel !== 'club-maths' && (
            <EvaluationManager filterLevel={activeLevel as CourseLevel} />
          )}

          {/* DNB Tab - only for 3eme */}
          {activeTab === 'prepa-dnb' && activeLevel === '3eme' && (
            <DnbManager />
          )}

          {/* Class Photos Tab - only for 3eme and seconde */}
          {activeTab === 'classe-activite' && activeLevel && (activeLevel === '3eme' || activeLevel === 'seconde') && (
            <ClassPhotosManager selectedLevel={activeLevel as CourseLevel} />
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <FileVideoManager courses={courses.map(c => ({ id: c.id, title: c.title }))} />
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
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;