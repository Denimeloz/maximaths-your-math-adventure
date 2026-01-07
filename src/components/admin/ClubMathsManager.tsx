import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  GripVertical,
  Upload,
  Loader2,
  X,
  Puzzle,
  BookOpen,
  Lightbulb,
  Trophy,
  FolderOpen,
  ChevronRight
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

interface ClubActivity {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface ClubSubject {
  id: string;
  activity_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  correction_url: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const iconOptions = [
  { value: 'puzzle', label: 'Énigme', icon: Puzzle },
  { value: 'book', label: 'Projet', icon: BookOpen },
  { value: 'lightbulb', label: 'Découverte', icon: Lightbulb },
  { value: 'trophy', label: 'Défi', icon: Trophy },
];

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ElementType> = {
    puzzle: Puzzle,
    book: BookOpen,
    lightbulb: Lightbulb,
    trophy: Trophy,
  };
  return iconMap[iconName] || Puzzle;
};

export function ClubMathsManager() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const correctionInputRef = useRef<HTMLInputElement>(null);
  
  // Activities state
  const [activities, setActivities] = useState<ClubActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ClubActivity | null>(null);
  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    icon: 'puzzle',
    is_published: false,
  });
  
  // Subjects state
  const [selectedActivity, setSelectedActivity] = useState<ClubActivity | null>(null);
  const [subjects, setSubjects] = useState<ClubSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ClubSubject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    title: '',
    description: '',
    file_url: '',
    correction_url: '',
    is_published: false,
  });
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingCorrection, setIsUploadingCorrection] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedActivity) {
      fetchSubjects(selectedActivity.id);
    }
  }, [selectedActivity]);

  const fetchActivities = async () => {
    setLoadingActivities(true);
    const { data, error } = await supabase
      .from('club_activities')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les activités du club',
        variant: 'destructive',
      });
    } else {
      setActivities(data || []);
    }
    setLoadingActivities(false);
  };

  const fetchSubjects = async (activityId: string) => {
    setLoadingSubjects(true);
    const { data, error } = await supabase
      .from('club_subjects')
      .select('*')
      .eq('activity_id', activityId)
      .order('order_index', { ascending: true });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sujets',
        variant: 'destructive',
      });
    } else {
      setSubjects(data || []);
    }
    setLoadingSubjects(false);
  };

  // Activity handlers
  const handleActivityDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activities.findIndex((item) => item.id === active.id);
    const newIndex = activities.findIndex((item) => item.id === over.id);
    const newActivities = arrayMove(activities, oldIndex, newIndex);
    setActivities(newActivities);

    for (let i = 0; i < newActivities.length; i++) {
      await supabase
        .from('club_activities')
        .update({ order_index: i })
        .eq('id', newActivities[i].id);
    }
  };

  const handleSaveActivity = async () => {
    if (!activityForm.title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le titre est requis',
        variant: 'destructive',
      });
      return;
    }

    if (editingActivity) {
      const { error } = await supabase
        .from('club_activities')
        .update({
          title: activityForm.title,
          description: activityForm.description || null,
          icon: activityForm.icon,
          is_published: activityForm.is_published,
        })
        .eq('id', editingActivity.id);

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier l\'activité',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Succès', description: 'Activité modifiée' });
        fetchActivities();
        resetActivityForm();
      }
    } else {
      const { error } = await supabase
        .from('club_activities')
        .insert({
          title: activityForm.title,
          description: activityForm.description || null,
          icon: activityForm.icon,
          is_published: activityForm.is_published,
          order_index: activities.length,
        });

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de créer l\'activité',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Succès', description: 'Activité créée' });
        fetchActivities();
        resetActivityForm();
      }
    }
  };

  const handleEditActivity = (activity: ClubActivity) => {
    setEditingActivity(activity);
    setActivityForm({
      title: activity.title,
      description: activity.description || '',
      icon: activity.icon,
      is_published: activity.is_published,
    });
    setShowActivityForm(true);
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Supprimer cette activité et tous ses sujets ?')) return;

    const { error } = await supabase
      .from('club_activities')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'activité',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Succès', description: 'Activité supprimée' });
      if (selectedActivity?.id === id) {
        setSelectedActivity(null);
        setSubjects([]);
      }
      fetchActivities();
    }
  };

  const resetActivityForm = () => {
    setShowActivityForm(false);
    setEditingActivity(null);
    setActivityForm({
      title: '',
      description: '',
      icon: 'puzzle',
      is_published: false,
    });
  };

  // Subject handlers
  const handleSubjectDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subjects.findIndex((item) => item.id === active.id);
    const newIndex = subjects.findIndex((item) => item.id === over.id);
    const newSubjects = arrayMove(subjects, oldIndex, newIndex);
    setSubjects(newSubjects);

    for (let i = 0; i < newSubjects.length; i++) {
      await supabase
        .from('club_subjects')
        .update({ order_index: i })
        .eq('id', newSubjects[i].id);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'file' | 'correction'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier PDF',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'Le fichier ne doit pas dépasser 20MB',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'file') {
      setIsUploadingFile(true);
    } else {
      setIsUploadingCorrection(true);
    }

    try {
      const fileName = `club-maths/${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(fileName);

      if (type === 'file') {
        setSubjectForm(prev => ({ ...prev, file_url: publicUrl }));
      } else {
        setSubjectForm(prev => ({ ...prev, correction_url: publicUrl }));
      }

      toast({ title: 'Succès', description: 'Fichier téléchargé' });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le fichier',
        variant: 'destructive',
      });
    } finally {
      if (type === 'file') {
        setIsUploadingFile(false);
      } else {
        setIsUploadingCorrection(false);
      }
    }
  };

  const handleSaveSubject = async () => {
    if (!selectedActivity) return;
    if (!subjectForm.title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le titre est requis',
        variant: 'destructive',
      });
      return;
    }

    if (editingSubject) {
      const { error } = await supabase
        .from('club_subjects')
        .update({
          title: subjectForm.title,
          description: subjectForm.description || null,
          file_url: subjectForm.file_url || null,
          correction_url: subjectForm.correction_url || null,
          is_published: subjectForm.is_published,
        })
        .eq('id', editingSubject.id);

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier le sujet',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Succès', description: 'Sujet modifié' });
        fetchSubjects(selectedActivity.id);
        resetSubjectForm();
      }
    } else {
      const { error } = await supabase
        .from('club_subjects')
        .insert({
          activity_id: selectedActivity.id,
          title: subjectForm.title,
          description: subjectForm.description || null,
          file_url: subjectForm.file_url || null,
          correction_url: subjectForm.correction_url || null,
          is_published: subjectForm.is_published,
          order_index: subjects.length,
        });

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de créer le sujet',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Succès', description: 'Sujet créé' });
        fetchSubjects(selectedActivity.id);
        resetSubjectForm();
      }
    }
  };

  const handleEditSubject = (subject: ClubSubject) => {
    setEditingSubject(subject);
    setSubjectForm({
      title: subject.title,
      description: subject.description || '',
      file_url: subject.file_url || '',
      correction_url: subject.correction_url || '',
      is_published: subject.is_published,
    });
    setShowSubjectForm(true);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Supprimer ce sujet ?')) return;

    const { error } = await supabase
      .from('club_subjects')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le sujet',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Succès', description: 'Sujet supprimé' });
      if (selectedActivity) {
        fetchSubjects(selectedActivity.id);
      }
    }
  };

  const resetSubjectForm = () => {
    setShowSubjectForm(false);
    setEditingSubject(null);
    setSubjectForm({
      title: '',
      description: '',
      file_url: '',
      correction_url: '',
      is_published: false,
    });
  };

  if (loadingActivities) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
          <Puzzle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display text-foreground">Club de maths Jules Verne</h2>
          <p className="text-muted-foreground text-sm">Gérez les activités et sujets du club</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activities Panel */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">Activités</CardTitle>
            <Button
              onClick={() => setShowActivityForm(true)}
              size="sm"
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nouvelle activité
            </Button>
          </CardHeader>
          <CardContent>
            {/* Activity Form */}
            {showActivityForm && (
              <div className="mb-4 p-4 rounded-xl bg-muted/50 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">
                    {editingActivity ? 'Modifier l\'activité' : 'Nouvelle activité'}
                  </h4>
                  <Button variant="ghost" size="icon" onClick={resetActivityForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Titre (ex: Énigmes hebdomadaires)"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                  className="rounded-xl"
                />
                <Textarea
                  placeholder="Description"
                  value={activityForm.description}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                  className="rounded-xl"
                  rows={2}
                />
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Icône</Label>
                  <Select
                    value={activityForm.icon}
                    onValueChange={(v) => setActivityForm(prev => ({ ...prev, icon: v }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="activity-published"
                    checked={activityForm.is_published}
                    onCheckedChange={(v) => setActivityForm(prev => ({ ...prev, is_published: v }))}
                  />
                  <Label htmlFor="activity-published">Publier</Label>
                </div>
                <Button onClick={handleSaveActivity} className="w-full rounded-xl">
                  {editingActivity ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            )}

            {/* Activities List */}
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune activité</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleActivityDragEnd}
              >
                <SortableContext
                  items={activities.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {activities.map((activity) => {
                      const IconComponent = getIconComponent(activity.icon);
                      return (
                        <SortableItem key={activity.id} id={activity.id}>
                          <div
                            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                              selectedActivity?.id === activity.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedActivity(activity)}
                          >
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                              <div className="w-8 h-8 rounded-lg bg-rainbow-purple/20 flex items-center justify-center">
                                <IconComponent className="w-4 h-4 text-rainbow-purple" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {activity.is_published ? '✓ Publié' : 'Brouillon'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditActivity(activity);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteActivity(activity.id);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        </SortableItem>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Subjects Panel */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              {selectedActivity ? `Sujets - ${selectedActivity.title}` : 'Sujets'}
            </CardTitle>
            {selectedActivity && (
              <Button
                onClick={() => setShowSubjectForm(true)}
                size="sm"
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nouveau sujet
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedActivity ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sélectionnez une activité</p>
              </div>
            ) : (
              <>
                {/* Subject Form */}
                {showSubjectForm && (
                  <div className="mb-4 p-4 rounded-xl bg-muted/50 border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">
                        {editingSubject ? 'Modifier le sujet' : 'Nouveau sujet'}
                      </h4>
                      <Button variant="ghost" size="icon" onClick={resetSubjectForm}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Titre du sujet"
                      value={subjectForm.title}
                      onChange={(e) => setSubjectForm(prev => ({ ...prev, title: e.target.value }))}
                      className="rounded-xl"
                    />
                    <Textarea
                      placeholder="Description"
                      value={subjectForm.description}
                      onChange={(e) => setSubjectForm(prev => ({ ...prev, description: e.target.value }))}
                      className="rounded-xl"
                      rows={2}
                    />
                    
                    {/* File Upload */}
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Fichier du sujet (PDF)</Label>
                      <div className="flex items-center gap-2">
                        {subjectForm.file_url ? (
                          <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-background border border-border">
                            <FileText className="w-4 h-4 text-rainbow-blue" />
                            <span className="text-sm truncate flex-1">Fichier ajouté</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSubjectForm(prev => ({ ...prev, file_url: '' }))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={(e) => handleFileUpload(e, 'file')}
                              accept=".pdf,application/pdf"
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingFile}
                              className="rounded-xl"
                            >
                              {isUploadingFile ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Télécharger
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Correction Upload */}
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Corrigé (PDF)</Label>
                      <div className="flex items-center gap-2">
                        {subjectForm.correction_url ? (
                          <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-background border border-border">
                            <FileText className="w-4 h-4 text-rainbow-green" />
                            <span className="text-sm truncate flex-1">Corrigé ajouté</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSubjectForm(prev => ({ ...prev, correction_url: '' }))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              ref={correctionInputRef}
                              onChange={(e) => handleFileUpload(e, 'correction')}
                              accept=".pdf,application/pdf"
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              onClick={() => correctionInputRef.current?.click()}
                              disabled={isUploadingCorrection}
                              className="rounded-xl"
                            >
                              {isUploadingCorrection ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Télécharger
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="subject-published"
                        checked={subjectForm.is_published}
                        onCheckedChange={(v) => setSubjectForm(prev => ({ ...prev, is_published: v }))}
                      />
                      <Label htmlFor="subject-published">Publier</Label>
                    </div>
                    <Button onClick={handleSaveSubject} className="w-full rounded-xl">
                      {editingSubject ? 'Enregistrer' : 'Créer'}
                    </Button>
                  </div>
                )}

                {/* Subjects List */}
                {loadingSubjects ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun sujet dans cette activité</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSubjectDragEnd}
                  >
                    <SortableContext
                      items={subjects.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {subjects.map((subject) => (
                          <SortableItem key={subject.id} id={subject.id}>
                            <div className="p-3 rounded-xl border border-border hover:border-primary/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">{subject.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {subject.file_url && (
                                      <a
                                        href={subject.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-rainbow-blue hover:underline"
                                      >
                                        📄 Sujet
                                      </a>
                                    )}
                                    {subject.correction_url && (
                                      <a
                                        href={subject.correction_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-rainbow-green hover:underline"
                                      >
                                        ✅ Corrigé
                                      </a>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {subject.is_published ? '✓ Publié' : 'Brouillon'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditSubject(subject)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSubject(subject.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ClubMathsManager;
