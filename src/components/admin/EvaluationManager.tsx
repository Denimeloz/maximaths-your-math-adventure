import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, FileCheck, Clock, Upload, FileText, Loader2 } from 'lucide-react';

interface Evaluation {
  id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  max_points: number;
  duration_minutes: number | null;
  is_published: boolean;
  order_index: number;
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
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    instructions: '',
    max_points: 100,
    duration_minutes: 60,
    file_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('evaluations').select('*').order('order_index');
    if (data) setEvaluations(data);
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
      const fileName = `evaluations/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
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
      toast({ title: "Erreur", description: "Titre et cours requis", variant: "destructive" });
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
      const evaluationsForCourse = evaluations.filter(e => e.course_id === form.course_id);
      const { error } = await supabase
        .from('evaluations')
        .insert({
          ...data,
          course_id: form.course_id,
          order_index: evaluationsForCourse.length,
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
      course_id: evaluation.course_id || '',
      title: evaluation.title,
      description: evaluation.description || '',
      instructions: evaluation.instructions || '',
      max_points: evaluation.max_points,
      duration_minutes: evaluation.duration_minutes || 60,
      file_url: '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEvaluation(null);
    setForm({
      course_id: '',
      title: '',
      description: '',
      instructions: '',
      max_points: 100,
      duration_minutes: 60,
      file_url: '',
    });
  };

  const filteredEvaluations = selectedCourse
    ? evaluations.filter(e => e.course_id === selectedCourse)
    : evaluations;

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return 'Non assigné';
    return courses.find(c => c.id === courseId)?.title || 'Inconnu';
  };

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
              <label className="text-sm font-body text-muted-foreground mb-1 block">Cours *</label>
              <select
                value={form.course_id}
                onChange={(e) => setForm(prev => ({ ...prev, course_id: e.target.value }))}
                className="w-full p-2 rounded-xl border border-input bg-background"
                disabled={!!editingEvaluation}
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
        {filteredEvaluations.map(evaluation => (
          <div key={evaluation.id} className="card-cartoon bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rainbow-coral/20 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-rainbow-coral" />
                </div>
                <div>
                  <p className="font-display text-foreground">{evaluation.title}</p>
                  <p className="text-sm text-muted-foreground">{getCourseName(evaluation.course_id)}</p>
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
        ))}
        {filteredEvaluations.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Aucune évaluation créée</p>
        )}
      </div>
    </div>
  );
};