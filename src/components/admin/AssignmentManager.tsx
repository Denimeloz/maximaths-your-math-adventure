import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, ClipboardList, Calendar, Upload, FileText, Loader2, BookCheck } from 'lucide-react';

interface Assignment {
  id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  max_points: number;
  due_date: string | null;
  allow_late_submission: boolean;
  is_published: boolean;
  order_index: number;
  correction_url: string | null;
}

interface Course {
  id: string;
  title: string;
}

interface AssignmentManagerProps {
  courses: Course[];
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({ courses }) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingCorrection, setIsUploadingCorrection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const correctionInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    instructions: '',
    max_points: 100,
    due_date: '',
    allow_late_submission: false,
    file_url: '',
    correction_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('assignments').select('*').order('order_index');
    if (data) setAssignments(data);
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
      const fileName = `assignments/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
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

  const handleCorrectionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Le fichier ne doit pas dépasser 20MB", variant: "destructive" });
      return;
    }

    setIsUploadingCorrection(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `corrections/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('course-files').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, correction_url: publicUrl }));
      toast({ title: "Succès", description: "Corrigé téléchargé" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de télécharger le corrigé", variant: "destructive" });
    } finally {
      setIsUploadingCorrection(false);
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
      due_date: form.due_date || null,
      allow_late_submission: form.allow_late_submission,
      correction_url: form.correction_url || null,
    };

    if (editingAssignment) {
      const { error } = await supabase
        .from('assignments')
        .update(data)
        .eq('id', editingAssignment.id);

      if (!error) {
        toast({ title: "Succès", description: "Devoir modifié" });
        fetchData();
        resetForm();
      }
    } else {
      const assignmentsForCourse = assignments.filter(a => a.course_id === form.course_id);
      const { error } = await supabase
        .from('assignments')
        .insert({
          ...data,
          course_id: form.course_id,
          order_index: assignmentsForCourse.length,
        });

      if (!error) {
        toast({ title: "Succès", description: "Devoir créé" });
        fetchData();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce devoir ?")) return;
    await supabase.from('assignments').delete().eq('id', id);
    toast({ title: "Supprimé" });
    fetchData();
  };

  const handleTogglePublish = async (assignment: Assignment) => {
    await supabase.from('assignments').update({ is_published: !assignment.is_published }).eq('id', assignment.id);
    fetchData();
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setForm({
      course_id: assignment.course_id || '',
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      max_points: assignment.max_points,
      due_date: assignment.due_date ? assignment.due_date.split('T')[0] : '',
      allow_late_submission: assignment.allow_late_submission,
      file_url: '',
      correction_url: assignment.correction_url || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAssignment(null);
    setForm({
      course_id: '',
      title: '',
      description: '',
      instructions: '',
      max_points: 100,
      due_date: '',
      allow_late_submission: false,
      file_url: '',
      correction_url: '',
    });
  };

  const filteredAssignments = selectedCourse
    ? assignments.filter(a => a.course_id === selectedCourse)
    : assignments;

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return 'Non assigné';
    return courses.find(c => c.id === courseId)?.title || 'Inconnu';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Gestion des Devoirs de niveaux</h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau devoir
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
        <div className="card-sticker bg-card border-rainbow-pink/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display text-foreground">
              {editingAssignment ? 'Modifier le devoir' : 'Nouveau devoir'}
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
                disabled={!!editingAssignment}
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
                placeholder="Titre du devoir"
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
                placeholder="Instructions détaillées"
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

            {/* Correction Upload */}
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Corrigé (PDF, Word, etc.)</label>
              <div className="flex items-center gap-4">
                {form.correction_url ? (
                  <div className="flex items-center gap-3 p-3 bg-rainbow-green/10 rounded-xl flex-1">
                    <BookCheck className="w-6 h-6 text-rainbow-green" />
                    <a href={form.correction_url} target="_blank" rel="noopener noreferrer" className="text-sm text-rainbow-green hover:underline truncate">
                      Voir le corrigé
                    </a>
                    <button onClick={() => setForm(prev => ({ ...prev, correction_url: '' }))} className="ml-auto">
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input type="file" ref={correctionInputRef} onChange={handleCorrectionUpload} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" />
                    <Button type="button" variant="outline" onClick={() => correctionInputRef.current?.click()} disabled={isUploadingCorrection} className="rounded-xl border-rainbow-green/50 text-rainbow-green hover:bg-rainbow-green/10">
                      {isUploadingCorrection ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookCheck className="w-4 h-4 mr-2" />}
                      {isUploadingCorrection ? 'Upload...' : 'Ajouter le corrigé'}
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
                <label className="text-sm font-body text-muted-foreground mb-1 block">Date limite</label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.allow_late_submission}
                onChange={(e) => setForm(prev => ({ ...prev, allow_late_submission: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <label className="text-sm font-body text-foreground">Autoriser les soumissions tardives</label>
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
        {filteredAssignments.map(assignment => (
          <div key={assignment.id} className="card-cartoon bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rainbow-pink/20 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-rainbow-pink" />
                </div>
                <div>
                  <p className="font-display text-foreground">{assignment.title}</p>
                  <p className="text-sm text-muted-foreground">{getCourseName(assignment.course_id)}</p>
                  {assignment.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-rainbow-purple/20 text-rainbow-purple text-xs">
                  {assignment.max_points} pts
                </span>
                <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(assignment)} className="rounded-xl">
                  {assignment.is_published ? <Eye className="w-4 h-4 text-rainbow-green" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(assignment)} className="rounded-xl">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)} className="rounded-xl text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filteredAssignments.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Aucun devoir</p>
        )}
      </div>
    </div>
  );
};