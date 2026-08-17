import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
}

interface ClubMathsManagerProps {
  selectedActivityType: 'enigmes' | 'projets';
}

const activityTypeConfig = {
  enigmes: {
    title: 'Énigmes hebdomadaires',
    icon: 'puzzle',
    description: 'Énigmes et défis mathématiques hebdomadaires',
    Icon: Puzzle,
  },
  projets: {
    title: 'Projets pédagogiques',
    icon: 'book',
    description: 'Projets pédagogiques et activités de groupe',
    Icon: BookOpen,
  }
};

export function ClubMathsManager({ selectedActivityType }: ClubMathsManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const correctionInputRef = useRef<HTMLInputElement>(null);
  
  const config = activityTypeConfig[selectedActivityType];
  
  const [activity, setActivity] = useState<ClubActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<ClubSubject[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ClubSubject | null>(null);
  const [form, setForm] = useState({
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
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchOrCreateActivity();
  }, [selectedActivityType]);

  useEffect(() => {
    if (activity) fetchSubjects(activity.id);
  }, [activity]);

  const fetchOrCreateActivity = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('club_activities')
      .select('*')
      .eq('title', config.title)
      .maybeSingle();

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (data) {
      setActivity(data);
    } else {
      const { data: newData, error: createError } = await supabase
        .from('club_activities')
        .insert({
          title: config.title,
          description: config.description,
          icon: config.icon,
          is_published: true,
          order_index: selectedActivityType === 'enigmes' ? 0 : 1,
        })
        .select()
        .single();

      if (!createError && newData) setActivity(newData);
    }
    setLoading(false);
  };

  const fetchSubjects = async (activityId: string) => {
    const { data } = await supabase
      .from('club_subjects')
      .select('*')
      .eq('activity_id', activityId)
      .order('order_index', { ascending: true });
    if (data) setSubjects(data);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subjects.findIndex((item) => item.id === active.id);
    const newIndex = subjects.findIndex((item) => item.id === over.id);
    const newSubjects = arrayMove(subjects, oldIndex, newIndex);
    setSubjects(newSubjects);

    for (let i = 0; i < newSubjects.length; i++) {
      await supabase.from('club_subjects').update({ order_index: i }).eq('id', newSubjects[i].id);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'correction') => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    type === 'file' ? setIsUploadingFile(true) : setIsUploadingCorrection(true);

    try {
      const fileName = `club-maths/${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
      await supabase.storage.from('course-files').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, [type === 'file' ? 'file_url' : 'correction_url']: publicUrl }));
    } catch {
      toast({ title: 'Erreur', description: 'Échec upload', variant: 'destructive' });
    } finally {
      type === 'file' ? setIsUploadingFile(false) : setIsUploadingCorrection(false);
    }
  };

  const handleSave = async () => {
    if (!activity || !form.title.trim()) return;

    if (editingSubject) {
      await supabase.from('club_subjects').update({
        title: form.title,
        description: form.description || null,
        file_url: form.file_url || null,
        correction_url: form.correction_url || null,
        is_published: form.is_published,
      }).eq('id', editingSubject.id);
    } else {
      await supabase.from('club_subjects').insert({
        activity_id: activity.id,
        title: form.title,
        description: form.description || null,
        file_url: form.file_url || null,
        correction_url: form.correction_url || null,
        is_published: form.is_published,
        order_index: subjects.length,
      });
    }
    
    toast({ title: 'Succès', description: editingSubject ? 'Sujet modifié' : 'Sujet créé' });
    fetchSubjects(activity.id);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce sujet ?')) return;
    await supabase.from('club_subjects').delete().eq('id', id);
    if (activity) fetchSubjects(activity.id);
  };

  const handleEdit = (subject: ClubSubject) => {
    setEditingSubject(subject);
    setForm({
      title: subject.title,
      description: subject.description || '',
      file_url: subject.file_url || '',
      correction_url: subject.correction_url || '',
      is_published: subject.is_published,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSubject(null);
    setForm({ title: '', description: '', file_url: '', correction_url: '', is_published: false });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const Icon = config.Icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display text-foreground">{config.title}</h2>
            <p className="text-sm text-muted-foreground">{subjects.length} sujet(s)</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau sujet
        </Button>
      </div>

      {showForm && (
        <Card className="border-rainbow-pink/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-lg">{editingSubject ? 'Modifier' : 'Nouveau sujet'}</h3>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-5 h-5" /></Button>
            </div>
            <Input placeholder="Titre" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sujet (PDF)</Label>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                <Button variant="outline" className="w-full mt-1" onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile}>
                  {isUploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {form.file_url ? 'Changer' : 'Télécharger'}
                </Button>
              </div>
              <div>
                <Label>Corrigé (PDF)</Label>
                <input ref={correctionInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'correction')} />
                <Button variant="outline" className="w-full mt-1" onClick={() => correctionInputRef.current?.click()} disabled={isUploadingCorrection}>
                  {isUploadingCorrection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {form.correction_url ? 'Changer' : 'Télécharger'}
                </Button>
              </div>
            </div>

            <LinksEditor value={form.resource_links} onChange={links => setForm(prev => ({ ...prev, resource_links: links }))} />

            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_published: checked }))} />
              <Label>Publié</Label>
            </div>
            <Button onClick={handleSave} className="w-full">{editingSubject ? 'Modifier' : 'Créer'}</Button>
          </CardContent>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={subjects.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {subjects.map((subject) => (
              <SortableItem key={subject.id} id={subject.id}>
                <Card className={`border ${subject.is_published ? 'border-rainbow-green/30' : 'border-muted'}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <h4 className="font-medium">{subject.title}</h4>
                      {subject.description && <p className="text-sm text-muted-foreground line-clamp-1">{subject.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      {subject.file_url && <a href={subject.file_url} target="_blank" rel="noopener noreferrer"><FileText className="w-4 h-4 text-rainbow-blue" /></a>}
                      {subject.correction_url && <a href={subject.correction_url} target="_blank" rel="noopener noreferrer"><BookOpen className="w-4 h-4 text-rainbow-green" /></a>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(subject)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {subjects.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun sujet pour le moment</p>
        </div>
      )}
    </div>
  );
}
