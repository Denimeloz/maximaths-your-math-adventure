import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, ChevronDown, ChevronRight, BookOpen, FileText, HelpCircle, ClipboardList, Video } from 'lucide-react';

interface Chapter {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content: string | null;
  order_index: number;
  is_published: boolean;
}

interface Course {
  id: string;
  title: string;
  level: string;
}

interface ChapterManagerProps {
  courses: Course[];
  onRefresh: () => void;
}

export const ChapterManager: React.FC<ChapterManagerProps> = ({ courses, onRefresh }) => {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    content: '',
  });

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (!error) setChapters(data || []);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.course_id) {
      toast({ title: "Erreur", description: "Titre et cours requis", variant: "destructive" });
      return;
    }

    if (editingChapter) {
      const { error } = await supabase
        .from('chapters')
        .update({
          title: form.title,
          description: form.description || null,
          content: form.content || null,
        })
        .eq('id', editingChapter.id);

      if (error) {
        toast({ title: "Erreur", description: "Impossible de modifier", variant: "destructive" });
      } else {
        toast({ title: "Succès", description: "Chapitre modifié" });
        fetchChapters();
        resetForm();
      }
    } else {
      const chaptersForCourse = chapters.filter(c => c.course_id === form.course_id);
      const { error } = await supabase
        .from('chapters')
        .insert({
          course_id: form.course_id,
          title: form.title,
          description: form.description || null,
          content: form.content || null,
          order_index: chaptersForCourse.length,
        });

      if (error) {
        toast({ title: "Erreur", description: "Impossible de créer", variant: "destructive" });
      } else {
        toast({ title: "Succès", description: "Chapitre créé" });
        fetchChapters();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce chapitre ?")) return;
    const { error } = await supabase.from('chapters').delete().eq('id', id);
    if (!error) {
      toast({ title: "Supprimé" });
      fetchChapters();
    }
  };

  const handleTogglePublish = async (chapter: Chapter) => {
    const { error } = await supabase
      .from('chapters')
      .update({ is_published: !chapter.is_published })
      .eq('id', chapter.id);
    if (!error) fetchChapters();
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setForm({
      course_id: chapter.course_id,
      title: chapter.title,
      description: chapter.description || '',
      content: chapter.content || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingChapter(null);
    setForm({ course_id: '', title: '', description: '', content: '' });
  };

  const getChaptersForCourse = (courseId: string) => chapters.filter(c => c.course_id === courseId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Gestion des Chapitres</h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau chapitre
        </Button>
      </div>

      {showForm && (
        <div className="card-sticker bg-card border-rainbow-purple/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display text-foreground">
              {editingChapter ? 'Modifier le chapitre' : 'Nouveau chapitre'}
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
                disabled={!!editingChapter}
              >
                <option value="">Sélectionner un cours</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title} ({course.level})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Titre *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du chapitre"
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
              <label className="text-sm font-body text-muted-foreground mb-1 block">Contenu</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Contenu du chapitre"
                className="rounded-xl"
                rows={4}
              />
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
        {courses.map(course => (
          <div key={course.id} className="card-cartoon bg-card border-border overflow-hidden">
            <button
              onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-rainbow-purple" />
                <span className="font-display text-foreground">{course.title}</span>
                <span className="text-sm text-muted-foreground">({course.level})</span>
                <span className="px-2 py-0.5 rounded-full bg-rainbow-blue/20 text-rainbow-blue text-xs">
                  {getChaptersForCourse(course.id).length} chapitres
                </span>
              </div>
              {expandedCourse === course.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>

            {expandedCourse === course.id && (
              <div className="border-t border-border p-4 space-y-3">
                {getChaptersForCourse(course.id).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucun chapitre</p>
                ) : (
                  getChaptersForCourse(course.id).map(chapter => (
                    <div key={chapter.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div>
                        <p className="font-body text-foreground font-medium">{chapter.title}</p>
                        {chapter.description && (
                          <p className="text-sm text-muted-foreground">{chapter.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePublish(chapter)}
                          className="rounded-xl"
                        >
                          {chapter.is_published ? (
                            <Eye className="w-4 h-4 text-rainbow-green" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(chapter)} className="rounded-xl">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(chapter.id)} className="rounded-xl text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
