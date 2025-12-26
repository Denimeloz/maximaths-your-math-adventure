import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import PDFViewer from '@/components/PDFViewer';
import { SortableItem } from './SortableItem';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, Upload, FileText, Loader2 } from 'lucide-react';

interface Exercise {
  id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  file_url: string | null;
  difficulty: number;
  points: number;
  is_published: boolean;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
}

interface ExerciseManagerProps {
  courses: Course[];
}

export const ExerciseManager: React.FC<ExerciseManagerProps> = ({ courses }) => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    difficulty: 1,
    points: 10,
    file_url: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('id, course_id, title, explanation, file_url, difficulty, points, is_published, order_index')
      .order('order_index');
    if (data) {
      // Map explanation to description for display
      const mapped = data.map(e => ({
        ...e,
        description: e.explanation,
      }));
      setExercises(mapped as Exercise[]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Le fichier ne doit pas dépasser 20MB", variant: "destructive" });
      return;
    }

    setIsUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `exercises/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('course-files').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, file_url: publicUrl }));
      toast({ title: "Succès", description: "Fichier téléchargé" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de télécharger le fichier", variant: "destructive" });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.course_id) {
      toast({ title: "Erreur", description: "Le cours et le titre sont requis", variant: "destructive" });
      return;
    }

    if (editingExercise) {
      const { error } = await supabase
        .from('exercises')
        .update({
          title: form.title,
          explanation: form.description || null,
          file_url: form.file_url || null,
          difficulty: form.difficulty,
          points: form.points,
        })
        .eq('id', editingExercise.id);

      if (!error) {
        toast({ title: "Succès", description: "Exercice modifié" });
        fetchExercises();
        resetForm();
      }
    } else {
      const exercisesForCourse = exercises.filter(e => e.course_id === form.course_id);
      const { error } = await supabase
        .from('exercises')
        .insert({
          course_id: form.course_id,
          title: form.title,
          question: '',
          answer: '',
          explanation: form.description || null,
          file_url: form.file_url || null,
          difficulty: form.difficulty,
          points: form.points,
          order_index: exercisesForCourse.length,
        });

      if (!error) {
        toast({ title: "Succès", description: "Exercice créé" });
        fetchExercises();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet exercice ?")) return;
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (!error) {
      toast({ title: "Supprimé" });
      fetchExercises();
    }
  };

  const handleTogglePublish = async (exercise: Exercise) => {
    await supabase.from('exercises').update({ is_published: !exercise.is_published }).eq('id', exercise.id);
    fetchExercises();
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setForm({
      course_id: exercise.course_id || '',
      title: exercise.title,
      description: exercise.description || '',
      difficulty: exercise.difficulty,
      points: exercise.points,
      file_url: exercise.file_url || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingExercise(null);
    setForm({ course_id: '', title: '', description: '', difficulty: 1, points: 10, file_url: '' });
  };

  const filteredExercises = selectedCourse
    ? exercises.filter(e => e.course_id === selectedCourse).sort((a, b) => a.order_index - b.order_index)
    : exercises.sort((a, b) => a.order_index - b.order_index);

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return 'Non assigné';
    return courses.find(c => c.id === courseId)?.title || 'Inconnu';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = filteredExercises.findIndex(e => e.id === active.id);
    const newIndex = filteredExercises.findIndex(e => e.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newOrder = arrayMove(filteredExercises, oldIndex, newIndex);
    
    // Optimistic update
    setExercises(prev => {
      const otherExercises = prev.filter(e => !filteredExercises.find(f => f.id === e.id));
      return [...otherExercises, ...newOrder.map((e, i) => ({ ...e, order_index: i }))];
    });
    
    // Update in database
    try {
      await Promise.all(
        newOrder.map((exercise, index) =>
          supabase.from('exercises').update({ order_index: index }).eq('id', exercise.id)
        )
      );
      toast({ title: "Ordre mis à jour" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour l'ordre", variant: "destructive" });
      fetchExercises();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Gestion des Exercices</h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel exercice
        </Button>
      </div>

      <div>
        <label className="text-sm font-body text-muted-foreground mb-1 block">Filtrer par cours</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="p-2 rounded-xl border border-input bg-background"
        >
          <option value="">Tous les cours</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="card-sticker bg-card border-rainbow-orange/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display text-foreground">
              {editingExercise ? 'Modifier l\'exercice' : 'Nouvel exercice'}
            </h3>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Cours *</label>
              <select
                value={form.course_id}
                onChange={(e) => setForm(prev => ({ ...prev, course_id: e.target.value }))}
                className="w-full p-2 rounded-xl border border-input bg-background"
                disabled={!!editingExercise}
              >
                <option value="">Sélectionner un cours</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Titre *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de l'exercice"
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de l'exercice"
                className="rounded-xl"
                rows={4}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Fichier joint (PDF, Word, etc.)</label>
              <div className="flex items-center gap-4">
                {form.file_url ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl flex-1">
                    <FileText className="w-6 h-6 text-rainbow-blue" />
                    <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-rainbow-blue hover:underline truncate">
                      Voir le fichier
                    </a>
                    <button onClick={() => setForm(prev => ({ ...prev, file_url: '' }))} className="ml-auto">
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile} className="rounded-xl">
                      {isUploadingFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      {isUploadingFile ? 'Upload...' : 'Ajouter un fichier'}
                    </Button>
                  </>
                )}
              </div>
              {/* PDF Preview */}
              {form.file_url && form.file_url.toLowerCase().includes('pdf') && (
                <div className="mt-3">
                  <PDFViewer url={form.file_url} title="Aperçu du fichier" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body text-muted-foreground mb-1 block">Difficulté (1-5)</label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.difficulty}
                  onChange={(e) => setForm(prev => ({ ...prev, difficulty: parseInt(e.target.value) || 1 }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-body text-muted-foreground mb-1 block">Points</label>
                <Input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) => setForm(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="btn-3d bg-primary rounded-xl">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button onClick={resetForm} variant="outline" className="rounded-xl">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredExercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {filteredExercises.map(exercise => (
              <SortableItem key={exercise.id} id={exercise.id}>
                <div className="card-cartoon bg-card border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-display text-foreground">{exercise.title}</p>
                      <p className="text-sm text-muted-foreground">{getCourseName(exercise.course_id)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>Difficulté: {exercise.difficulty}/5</span>
                        <span>•</span>
                        <span>{exercise.points} pts</span>
                        {exercise.file_url && (
                          <>
                            <span>•</span>
                            <a href={exercise.file_url} target="_blank" rel="noopener noreferrer" className="text-rainbow-blue hover:underline flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Fichier
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(exercise)} className="rounded-xl">
                        {exercise.is_published ? <Eye className="w-4 h-4 text-rainbow-green" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(exercise)} className="rounded-xl">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(exercise.id)} className="rounded-xl text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </SortableItem>
            ))}
            {filteredExercises.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Aucun exercice</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
