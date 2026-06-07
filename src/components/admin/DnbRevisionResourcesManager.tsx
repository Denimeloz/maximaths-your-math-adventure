import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import { Plus, Trash2, Edit, X, Upload, Loader2, FileText, Eye, EyeOff, GraduationCap, GripVertical, Link as LinkIcon } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

interface ResourceLink { title: string; url: string }

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  is_published: boolean;
  order_index: number;
  resource_links: ResourceLink[] | null;
}

export const DnbRevisionResourcesManager: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Resource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    file_url: '',
    file_name: '',
    is_published: false,
    resource_links: [] as ResourceLink[],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await (supabase as any)
      .from('dnb_revision_resources')
      .select('*')
      .order('order_index', { ascending: true });
    if (data) setItems(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Le fichier ne doit pas dépasser 20MB", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `dnb-revision/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('course-files').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, file_url: publicUrl, file_name: file.name }));
      toast({ title: "Succès ✨", description: "Fichier téléchargé" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de télécharger le fichier", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', description: '', file_url: '', file_name: '', is_published: false, resource_links: [] });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Erreur", description: "Le titre est requis", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      file_url: form.file_url || null,
      file_name: form.file_name || null,
      is_published: form.is_published,
      resource_links: form.resource_links.filter(l => l.url.trim()),
    };
    if (editing) {
      const { error } = await (supabase as any)
        .from('dnb_revision_resources').update(payload).eq('id', editing.id);
      if (error) return toast({ title: "Erreur", description: "Échec de la mise à jour", variant: "destructive" });
      toast({ title: "Succès", description: "Ressource mise à jour" });
    } else {
      const { error } = await (supabase as any)
        .from('dnb_revision_resources').insert({ ...payload, order_index: items.length });
      if (error) return toast({ title: "Erreur", description: "Échec de la création", variant: "destructive" });
      toast({ title: "Succès", description: "Ressource créée" });
    }
    resetForm();
    fetchData();
  };

  const handleEdit = (item: Resource) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      file_url: item.file_url || '',
      file_name: item.file_name || '',
      is_published: item.is_published,
      resource_links: Array.isArray(item.resource_links) ? item.resource_links : [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette ressource ?")) return;
    await (supabase as any).from('dnb_revision_resources').delete().eq('id', id);
    toast({ title: "Supprimé" });
    fetchData();
  };

  const togglePublish = async (item: Resource) => {
    await (supabase as any).from('dnb_revision_resources')
      .update({ is_published: !item.is_published }).eq('id', item.id);
    fetchData();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    for (let i = 0; i < newItems.length; i++) {
      await (supabase as any).from('dnb_revision_resources')
        .update({ order_index: i }).eq('id', newItems[i].id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-rainbow-coral" />
          Ressources pour la révision au DNB
        </h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle ressource
        </Button>
      </div>

      {showForm && (
        <Card className="border-rainbow-coral/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              {editing ? 'Modifier la ressource' : 'Nouvelle ressource'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-5 h-5" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Fiche de révision - Théorème de Pythagore" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brève description de la ressource..." className="rounded-xl mt-1" rows={3} />
            </div>
            <div>
              <Label>Fichier téléchargeable</Label>
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
                    <p className="text-xs text-muted-foreground mt-1">Max 20MB</p>
                  </>
                )}
              </div>
            </div>

            {/* External Links */}
            <div>
              <Label className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Liens externes (Padlet, sites...)</Label>
              <div className="mt-2 space-y-2">
                {form.resource_links.map((link, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={link.title}
                      onChange={(e) => {
                        const updated = [...form.resource_links];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setForm(p => ({ ...p, resource_links: updated }));
                      }}
                      placeholder="Titre (ex: Padlet de révision)"
                      className="rounded-xl flex-1"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...form.resource_links];
                        updated[idx] = { ...updated[idx], url: e.target.value };
                        setForm(p => ({ ...p, resource_links: updated }));
                      }}
                      placeholder="https://..."
                      className="rounded-xl flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => {
                      setForm(p => ({ ...p, resource_links: p.resource_links.filter((_, i) => i !== idx) }));
                    }}>
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => {
                  setForm(p => ({ ...p, resource_links: [...p.resource_links, { title: '', url: '' }] }));
                }}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter un lien
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch id="pub" checked={form.is_published}
                onCheckedChange={(c) => setForm(p => ({ ...p, is_published: c }))} />
              <Label htmlFor="pub">Publier</Label>
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
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
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
                          <GraduationCap className="w-4 h-4 text-rainbow-coral" />
                          <h3 className="font-display text-foreground">{item.title}</h3>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        )}
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

export default DnbRevisionResourcesManager;
