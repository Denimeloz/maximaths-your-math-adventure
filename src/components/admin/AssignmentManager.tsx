import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, ClipboardList, Calendar } from 'lucide-react';

interface Assignment {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  max_points: number;
  due_date: string | null;
  allow_late_submission: boolean;
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

interface AssignmentManagerProps {
  courses: Course[];
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({ courses }) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [form, setForm] = useState({
    chapter_id: '',
    title: '',
    description: '',
    instructions: '',
    max_points: 100,
    due_date: '',
    allow_late_submission: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [chaptersRes, assignmentsRes] = await Promise.all([
      supabase.from('chapters').select('id, title, course_id').order('order_index'),
      supabase.from('assignments').select('*').order('order_index'),
    ]);
    if (chaptersRes.data) setChapters(chaptersRes.data);
    if (assignmentsRes.data) setAssignments(assignmentsRes.data);
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
      due_date: form.due_date || null,
      allow_late_submission: form.allow_late_submission,
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
      const assignmentsForChapter = assignments.filter(a => a.chapter_id === form.chapter_id);
      const { error } = await supabase
        .from('assignments')
        .insert({
          ...data,
          chapter_id: form.chapter_id,
          order_index: assignmentsForChapter.length,
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
      chapter_id: assignment.chapter_id,
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      max_points: assignment.max_points,
      due_date: assignment.due_date ? assignment.due_date.split('T')[0] : '',
      allow_late_submission: assignment.allow_late_submission,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAssignment(null);
    setForm({
      chapter_id: '',
      title: '',
      description: '',
      instructions: '',
      max_points: 100,
      due_date: '',
      allow_late_submission: false,
    });
  };

  const filteredChapters = selectedCourse
    ? chapters.filter(c => c.course_id === selectedCourse)
    : chapters;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Gestion des Devoirs</h2>
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
              <label className="text-sm font-body text-muted-foreground mb-1 block">Chapitre *</label>
              <select
                value={form.chapter_id}
                onChange={(e) => setForm(prev => ({ ...prev, chapter_id: e.target.value }))}
                className="w-full p-2 rounded-xl border border-input bg-background"
                disabled={!!editingAssignment}
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
        {assignments.map(assignment => {
          const chapter = chapters.find(c => c.id === assignment.chapter_id);
          if (selectedCourse && chapter?.course_id !== selectedCourse) return null;

          return (
            <div key={assignment.id} className="card-cartoon bg-card border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rainbow-pink/20 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-rainbow-pink" />
                  </div>
                  <div>
                    <p className="font-display text-foreground">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{chapter?.title}</p>
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
          );
        })}
      </div>
    </div>
  );
};
