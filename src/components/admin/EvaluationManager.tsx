import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LinksEditor, ResourceLink } from './LinksEditor';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, FileCheck, Upload, FileText, Loader2, BookCheck } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

interface Evaluation {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  order_index: number;
  file_url: string | null;
  correction_url: string | null;
  resource_links?: any;
  level: string | null;
}

type CourseLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface EvaluationManagerProps {
  filterLevel: CourseLevel;
}

export const EvaluationManager: React.FC<EvaluationManagerProps> = ({ filterLevel }) => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingCorrection, setIsUploadingCorrection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const correctionInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    file_url: '',
    correction_url: '',
    resource_links: [] as ResourceLink[],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, [filterLevel, academicYearId]);

  const fetchData = async () => {
    const { data } = await supabase
      .from('evaluations')
      .select('*')
      .eq('level', filterLevel)
      .eq('academic_year_id', academicYearId as any)
      .order('order_index');
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
      resource_links: form.resource_links.filter(l => l.url.trim()) as any,
    };

    if (editingEvaluation) {
      const { error } = await supabase
        .from('evaluations')
        .update(data)
        .eq('id', editingEvaluation.id);

      if (!error) {
        toast({ title: "Succès", description: "Évaluation modifiée" });
        if (editingEvaluation.is_published) {
        }
        fetchData();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('evaluations')
        .insert({
          ...data,
          level: filterLevel,
          order_index: evaluations.length,
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
    const newPublished = !evaluation.is_published;
    await supabase.from('evaluations').update({ is_published: newPublished }).eq('id', evaluation.id);
    if (newPublished) {
    }
    fetchData();
  };

  const handleEdit = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation);
    setForm({
      title: evaluation.title,
      description: evaluation.description || '',
      file_url: evaluation.file_url || '',
      correction_url: evaluation.correction_url || '',
      resource_links: Array.isArray(evaluation.resource_links) ? evaluation.resource_links : [],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEvaluation(null);
    setForm({
      title: '',
      description: '',
      file_url: '',
      correction_url: '',
      resource_links: [] as ResourceLink[],
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = evaluations.findIndex((i) => i.id === active.id);
    const newIndex = evaluations.findIndex((i) => i.id === over.id);
    const newItems = arrayMove(evaluations, oldIndex, newIndex);
    setEvaluations(newItems);

    const updates = newItems.map((item, index) => ({
      id: item.id,
      order_index: index,
    }));

    for (const update of updates) {
      await supabase.from('evaluations').update({ order_index: update.order_index }).eq('id', update.id);
    }
    toast({ title: "Ordre mis à jour" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Évaluations</h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle évaluation
        </Button>
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

            <LinksEditor value={form.resource_links} onChange={links => setForm(prev => ({ ...prev, resource_links: links }))} />

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
        <SortableContext items={evaluations.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {evaluations.map(evaluation => (
              <SortableItem key={evaluation.id} id={evaluation.id}>
                <div className="card-cartoon bg-card border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rainbow-coral/20 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-rainbow-coral" />
                      </div>
                      <div>
                        <p className="font-display text-foreground">{evaluation.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {evaluation.file_url && (
                            <a href={evaluation.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-rainbow-blue hover:underline">
                              <FileText className="w-3 h-3" />
                              Fichier
                            </a>
                          )}
                          {evaluation.correction_url && (
                            <a href={evaluation.correction_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-rainbow-green hover:underline">
                              <BookCheck className="w-3 h-3" />
                              Corrigé
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
              </SortableItem>
            ))}
            {evaluations.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Aucune évaluation créée</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};