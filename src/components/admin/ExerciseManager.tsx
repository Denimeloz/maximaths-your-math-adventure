import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, ChevronDown, ChevronRight } from 'lucide-react';

interface Exercise {
  id: string;
  chapter_id: string;
  title: string;
  question: string;
  answer: string;
  explanation: string | null;
  difficulty: number;
  points: number;
  is_published: boolean;
  order_index: number;
}

interface Chapter {
  id: string;
  title: string;
  course_id: string;
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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState({
    chapter_id: '',
    title: '',
    question: '',
    answer: '',
    explanation: '',
    difficulty: 1,
    points: 10,
  });

  useEffect(() => {
    fetchChapters();
    fetchExercises();
  }, []);

  const fetchChapters = async () => {
    const { data } = await supabase.from('chapters').select('id, title, course_id').order('order_index');
    if (data) setChapters(data);
  };

  const fetchExercises = async () => {
    const { data } = await supabase.from('exercises').select('*').order('order_index');
    if (data) setExercises(data);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.chapter_id || !form.question || !form.answer) {
      toast({ title: "Erreur", description: "Champs requis manquants", variant: "destructive" });
      return;
    }

    if (editingExercise) {
      const { error } = await supabase
        .from('exercises')
        .update({
          title: form.title,
          question: form.question,
          answer: form.answer,
          explanation: form.explanation || null,
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
      const exercisesForChapter = exercises.filter(e => e.chapter_id === form.chapter_id);
      const { error } = await supabase
        .from('exercises')
        .insert({
          chapter_id: form.chapter_id,
          title: form.title,
          question: form.question,
          answer: form.answer,
          explanation: form.explanation || null,
          difficulty: form.difficulty,
          points: form.points,
          order_index: exercisesForChapter.length,
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
      chapter_id: exercise.chapter_id,
      title: exercise.title,
      question: exercise.question,
      answer: exercise.answer,
      explanation: exercise.explanation || '',
      difficulty: exercise.difficulty,
      points: exercise.points,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingExercise(null);
    setForm({ chapter_id: '', title: '', question: '', answer: '', explanation: '', difficulty: 1, points: 10 });
  };

  const filteredChapters = selectedCourse
    ? chapters.filter(c => c.course_id === selectedCourse)
    : chapters;

  const getExercisesForChapter = (chapterId: string) => exercises.filter(e => e.chapter_id === chapterId);

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
              <label className="text-sm font-body text-muted-foreground mb-1 block">Chapitre *</label>
              <select
                value={form.chapter_id}
                onChange={(e) => setForm(prev => ({ ...prev, chapter_id: e.target.value }))}
                className="w-full p-2 rounded-xl border border-input bg-background"
                disabled={!!editingExercise}
              >
                <option value="">Sélectionner un chapitre</option>
                {filteredChapters.map(chapter => (
                  <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
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
              <label className="text-sm font-body text-muted-foreground mb-1 block">Question *</label>
              <Textarea
                value={form.question}
                onChange={(e) => setForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Énoncé de l'exercice"
                className="rounded-xl"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Réponse (Corrigé) *</label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Réponse / Solution"
                className="rounded-xl"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Explication</label>
              <Textarea
                value={form.explanation}
                onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explication détaillée"
                className="rounded-xl"
                rows={3}
              />
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

      <div className="space-y-4">
        {filteredChapters.map(chapter => (
          <div key={chapter.id} className="card-cartoon bg-card border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-display text-foreground">{chapter.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-rainbow-orange/20 text-rainbow-orange text-xs">
                {getExercisesForChapter(chapter.id).length} exercices
              </span>
            </div>

            <div className="space-y-2">
              {getExercisesForChapter(chapter.id).map(exercise => (
                <div key={exercise.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <div className="flex-1">
                    <p className="font-body text-foreground font-medium">{exercise.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Difficulté: {exercise.difficulty}/5</span>
                      <span>•</span>
                      <span>{exercise.points} pts</span>
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
              ))}
              {getExercisesForChapter(chapter.id).length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-2">Aucun exercice</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
