import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, X, Upload, Loader2, FileText, Eye, EyeOff, Users, GripVertical, Link as LinkIcon } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { LinksEditor, ResourceLink } from './LinksEditor';
import { useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

interface ParentResource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  file_name: string | null;
  resource_links: ResourceLink[] | null;
  is_published: boolean;
  order_index: number;
}

export const ParentResourcesManager: React.FC = () => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const [items, setItems] = useState<ParentResource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ParentResource | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emptyForm = {
    title: '', description: '', category: 'general',
    file_url: '', file_name: '', is_published: true,
    resource_links: [] as ResourceLink[],
  };
  const [form, setForm] = useState(emptyForm);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchData(); }, [academicYearId]);

  const fetchData = async () => {
    let query = (supabase as any).from('parent_resources').select('*').order('order_index', { ascending: true });
    if (academicYearId) query = query.or(`academic_year_id.eq.${academicYearId},academic_year_id.is.null`);
    const { data } = await query;
    setItems(data || []);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'Erreur', description: 'Le fichier ne doit pas dépasser 20MB', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `parents/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('course-files').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(path);
      setForm(prev => ({ ...prev, file_url: publicUrl, file_name: file.name }));
      toast({ title: 'Succès ✨', description: 'Fichier téléchargé' });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de télécharger le fichier', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Erreur', description: 'Le titre est requis', variant: 'destructive' });
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category || 'general',
      file_url: form.file_url || null,
      file_name: form.file_name || null,
      resource_links: form.resource_links.filter(l => l.url.trim()),
      is_published: form.is_published,
      academic_year_id: academicYearId,
    };
    if (editing) {
      const { error } = await (supabase as any).from('parent_resources').update(payload).eq('id', editing.id);
      if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      toast({ title: 'Ressource mise à jour' });
    } else {
      const { error } = await (supabase as any).from('parent_resources').insert({ ...payload, order_index: items.length });
      if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      toast({ title: 'Ressource créée' });
    }
    resetForm();
    fetchData();
  };

  const handleEdit = (item: ParentResource) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category || 'general',
      file_url: item.file_url || '',
      file_name: item.file_name || '',
      is_published: item.is_published,
      resource_links: Array.isArray(item.resource_links) ? item.resource_links : [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette ressource ?')) return;
    await (supabase as any).from('parent_resources').delete().eq('id', id);
    toast({ title: 'Supprimé' });
    fetchData();
  };

  const togglePublish = async (item: ParentResource) => {
    await (supabase as any).from('parent_resources').update({ is_published: !item.is_published }).eq('id', item.id);
    fetchData();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    for (let i = 0; i < next.length; i++) {
      await (supabase as any).from('parent_resources').update({ order_index: i }).eq('id', next[i].id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-rainbow-blue" />
          Ressources pour les parents
        </h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle ressource
        </Button>
      </div>

      {showForm && (
        <Card className="border-rainbow-blue/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              {editing ? 'Modifier la ressource' : 'Nouvelle ressource'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-5 h-5" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Comment accompagner mon enfant en maths" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Informations utiles pour les parents..." className="rounded-xl mt-1" rows={3} />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                placeholder="Ex: Général, Organisation, Suivi..." className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Document (PDF, Word, PowerPoint)</Label>
              <div className="mt-2">
                {form.file_url ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <FileText className="w-6 h-6 text-rainbow-blue shrink-0" />
                    <a href={form.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-sm text-rainbow-blue hover:underline truncate">
                      {form.file_name || 'Fichier'}
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => setForm(p => ({ ...p, file_url: '', file_name: '' }))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <Button type="button" variant="outline" className="rounded-xl"
                      onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      {isUploading ? 'Upload...' : 'Téléverser un fichier'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Max 20MB — optionnel si vous ajoutez des liens</p>
                  </>
                )}
              </div>
            </div>

            <LinksEditor value={form.resource_links} onChange={links => setForm(p => ({ ...p, resource_links: links }))} />

            <div className="flex items-center gap-3 pt-2">
              <Switch id="pub-parents" checked={form.is_published}
                onCheckedChange={c => setForm(p => ({ ...p, is_published: c }))} />
              <Label htmlFor="pub-parents">Publier</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} className="btn-3d bg-primary rounded-xl">
                {editing ? 'Enregistrer' : 'Créer'}
              </Button>
              <Button variant="outline" onClick={resetForm} className="rounded-xl">Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground font-body">Aucune ressource pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map(item => (
                <SortableItem key={item.id} id={item.id}>
                  <Card className={`border-l-4 ${item.is_published ? 'border-l-rainbow-green' : 'border-l-muted'}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-rainbow-blue" />
                          <h3 className="font-display text-foreground">{item.title}</h3>
                        </div>
                        {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                        {item.file_url && (
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-rainbow-blue hover:underline inline-flex items-center gap-1 mt-1 mr-3">
                            <FileText className="w-3 h-3" /> {item.file_name || 'Voir le fichier'}
                          </a>
                        )}
                        {Array.isArray(item.resource_links) && item.resource_links.length > 0 && (
                          <span className="text-xs text-rainbow-purple inline-flex items-center gap-1 mt-1">
                            <LinkIcon className="w-3 h-3" /> {item.resource_links.length} lien(s)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => togglePublish(item)} className="rounded-xl">
                          {item.is_published ? <Eye className="w-4 h-4 text-rainbow-green" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="rounded-xl">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="rounded-xl text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default ParentResourcesManager;
