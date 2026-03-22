import React, { useState, useEffect, useRef } from 'react';
import { notifyNewAssignment, notifyContentUpdate } from '@/hooks/useNotifyUsers';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, ClipboardList, Upload, FileText, Loader2, BookCheck } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  order_index: number;
  file_url: string | null;
  correction_url: string | null;
  level: string | null;
}

type CourseLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface AssignmentManagerProps {
  filterLevel: CourseLevel;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({ filterLevel }) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingCorrection, setIsUploadingCorrection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const correctionInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    file_url: '',
    correction_url: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, [filterLevel]);

  const fetchData = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('level', filterLevel)
      .order('order_index');
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
    if (!form.title.trim()) {
      toast({ title: "Erreur", description: "Le titre est requis", variant: "destructive" });
      return;
    }

    const data = {
      title: form.title,
      description: form.description || null,
      file_url: form.file_url || null,
      correction_url: form.correction_url || null,
    };

    if (editingAssignment) {
      const { error } = await supabase
        .from('assignments')
        .update(data)
        .eq('id', editingAssignment.id);

      if (!error) {
        toast({ title: "Succès", description: "Devoir modifié" });
        if (editingAssignment.is_published) {
          notifyContentUpdate(filterLevel, 'Devoir', form.title);
        }
        fetchData();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('assignments')
        .insert({
          ...data,
          level: filterLevel,
          order_index: assignments.length,
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
      title: assignment.title,
      description: assignment.description || '',
      file_url: assignment.file_url || '',
      correction_url: assignment.correction_url || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAssignment(null);
    setForm({
      title: '',
      description: '',
      file_url: '',
      correction_url: '',
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = assignments.findIndex((i) => i.id === active.id);
    const newIndex = assignments.findIndex((i) => i.id === over.id);
    const newItems = arrayMove(assignments, oldIndex, newIndex);
    setAssignments(newItems);

    const updates = newItems.map((item, index) => ({
      id: item.id,
      order_index: index,
    }));

    for (const update of updates) {
      await supabase.from('assignments').update({ order_index: update.order_index }).eq('id', update.id);
    }
    toast({ title: "Ordre mis à jour" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Devoirs de niveaux</h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau devoir
        </Button>
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

            {/* File Upload */}
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Fichier (sujet)</label>
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
              <label className="text-sm font-body text-muted-foreground mb-1 block">Corrigé</label>
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
        <SortableContext items={assignments.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {assignments.map(assignment => (
              <SortableItem key={assignment.id} id={assignment.id}>
                <div className="card-cartoon bg-card border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rainbow-pink/20 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-rainbow-pink" />
                      </div>
                      <div>
                        <p className="font-display text-foreground">{assignment.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {assignment.file_url && (
                            <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-rainbow-blue hover:underline">
                              <FileText className="w-3 h-3" />
                              Fichier
                            </a>
                          )}
                          {assignment.correction_url && (
                            <a href={assignment.correction_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-rainbow-green hover:underline">
                              <BookCheck className="w-3 h-3" />
                              Corrigé
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
              </SortableItem>
            ))}
            {assignments.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Aucun devoir</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};