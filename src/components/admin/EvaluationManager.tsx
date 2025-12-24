import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, FileCheck, Clock } from 'lucide-react';

interface Evaluation {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  max_points: number;
  duration_minutes: number | null;
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

interface EvaluationManagerProps {
  courses: Course[];
}

export const EvaluationManager: React.FC<EvaluationManagerProps> = ({ courses }) => {
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [form, setForm] = useState({
    chapter_id: '',
    title: '',
    description: '',
    instructions: '',
    max_points: 100,
    duration_minutes: 60,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [chaptersRes, evaluationsRes] = await Promise.all([
      supabase.from('chapters').select('id, title, course_id').order('order_index'),
      supabase.from('evaluations').select('*').order('order_index'),
    ]);
    if (chaptersRes.data) setChapters(chaptersRes.data);
    if (evaluationsRes.data) setEvaluations(evaluationsRes.data);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.chapter_id) {
      toast({ title: "Erreur", description: "Titre et chapitre requis", variant: "destructive" });
      return;
    }

    const data = {
      title: form.title,
      description: form.description || null,
      instructions: form.instructions || null,
      max_points: form.max_points,
      duration_minutes: form.duration_minutes || null,
    };

    if (editingEvaluation) {
      const { error } = await supabase
        .from('evaluations')
        .update(data)
        .eq('id', editingEvaluation.id);

      if (!error) {
        toast({ title: "Succès", description: "Évaluation modifiée" });
        fetchData();
        resetForm();
      }
    } else {
      const evaluationsForChapter = evaluations.filter(e => e.chapter_id === form.chapter_id);
      const { error } = await supabase
        .from('evaluations')
        .insert({
          ...data,
          chapter_id: form.chapter_id,
          order_index: evaluationsForChapter.length,
        });

      if (!error) {
        toast({ title: "Succès", description: "Évaluation créée" });
        fetchData();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette évaluation ?")) return;
    await supabase.from('evaluations').delete().eq('id', id);
    toast({ title: "Supprimée" });
    fetchData();
  };

  const handleTogglePublish = async (evaluation: Evaluation) => {
    await supabase.from('evaluations').update({ is_published: !evaluation.is_published }).eq('id', evaluation.id);
    fetchData();
  };

  const handleEdit = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation);
    setForm({
      chapter_id: evaluation.chapter_id,
      title: evaluation.title,
      description: evaluation.description || '',
      instructions: evaluation.instructions || '',
      max_points: evaluation.max_points,
      duration_minutes: evaluation.duration_minutes || 60,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEvaluation(null);
    setForm({
      chapter_id: '',
      title: '',
      description: '',
      instructions: '',
      max_points: 100,
      duration_minutes: 60,
    });
  };

  const filteredChapters = selectedCourse
    ? chapters.filter(c => c.course_id === selectedCourse)
    : chapters;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Gestion des Évaluations</h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle évaluation
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
        <div className="card-sticker bg-card border-rainbow-coral/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display text-foreground">
              {editingEvaluation ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
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
                disabled={!!editingEvaluation}
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
                placeholder="Titre de l'évaluation"
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="rounded-xl"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Instructions</label>
              <Textarea
                value={form.instructions}
                onChange={(e) => setForm(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Instructions détaillées pour l'évaluation"
                className="rounded-xl"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body text-muted-foreground mb-1 block">Points max</label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_points}
                  onChange={(e) => setForm(prev => ({ ...prev, max_points: parseInt(e.target.value) || 100 }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-body text-muted-foreground mb-1 block">Durée (minutes)</label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
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
        {evaluations.map(evaluation => {
          const chapter = chapters.find(c => c.id === evaluation.chapter_id);
          if (selectedCourse && chapter?.course_id !== selectedCourse) return null;

          return (
            <div key={evaluation.id} className="card-cartoon bg-card border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rainbow-coral/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-rainbow-coral" />
                  </div>
                  <div>
                    <p className="font-display text-foreground">{evaluation.title}</p>
                    <p className="text-sm text-muted-foreground">{chapter?.title}</p>
                    {evaluation.duration_minutes && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {evaluation.duration_minutes} min
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-rainbow-purple/20 text-rainbow-purple text-xs">
                    {evaluation.max_points} pts
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(evaluation)} className="rounded-xl">
                    {evaluation.is_published ? <Eye className="w-4 h-4 text-rainbow-green" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(evaluation)} className="rounded-xl">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(evaluation.id)} className="rounded-xl text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {evaluations.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Aucune évaluation créée</p>
        )}
      </div>
    </div>
  );
};
