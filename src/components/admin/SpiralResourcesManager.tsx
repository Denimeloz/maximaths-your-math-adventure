import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LinksEditor, ResourceLink } from './LinksEditor';
import { Plus, Trash2, Edit, X, Upload, Loader2, FileText, Eye, EyeOff, GripVertical, Spline, Link as LinkIcon, Video, Dumbbell, Download } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type SpiralLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

export const SPIRAL_LEVELS: { id: SpiralLevel; label: string }[] = [
  { id: '6eme', label: '6ème' },
  { id: '5eme', label: '5ème' },
  { id: '4eme', label: '4ème' },
  { id: '3eme', label: '3ème' },
  { id: 'seconde', label: 'Seconde' },
  { id: 'premiere', label: 'Première' },
  { id: 'terminale', label: 'Terminale' },
];

export const RESOURCE_TYPES = [
  { id: 'fiche', label: 'Fiche PDF', icon: FileText },
  { id: 'lien', label: 'Lien externe', icon: LinkIcon },
  { id: 'exercice', label: 'Exercice', icon: Dumbbell },
  { id: 'video', label: 'Vidéo', icon: Video },
  { id: 'ressource', label: 'Ressource', icon: Download },
] as const;

interface SpiralResource {
  id: string;
  level: SpiralLevel;
  resource_type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  external_url: string | null;
  resource_links?: any;
  is_published: boolean;
  order_index: number;
}

interface Props { selectedLevel: SpiralLevel }

export const SpiralResourcesManager: React.FC<Props> = ({ selectedLevel }) => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const [items, setItems] = useState<SpiralResource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SpiralResource | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    resource_type: 'fiche',
    file_url: '',
    file_name: '',
    external_url: '',
    resource_links: [] as ResourceLink[],
    is_published: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchData(); }, [selectedLevel, academicYearId]);

  const fetchData = async () => {
    const { data } = await (supabase as any)
      .from('spiral_resources')
      .select('*')
      .eq('level', selectedLevel)
      .eq('academic_year_id', academicYearId as any)
      .order('order_index', { ascending: true });
    if (data) setItems(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Max 20MB", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `spiral/${selectedLevel}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('course-files').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(fileName);
      setForm(p => ({ ...p, file_url: publicUrl, file_name: file.name }));
      toast({ title: "Succès ✨", description: "Fichier téléchargé" });
    } catch {
      toast({ title: "Erreur", description: "Upload impossible", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', description: '', resource_type: 'fiche', file_url: '', file_name: '', external_url: '', resource_links: [] as ResourceLink[], is_published: false });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Erreur", description: "Titre requis", variant: "destructive" });
      return;
    }
    const payload = {
      level: selectedLevel,
      resource_type: form.resource_type,
      title: form.title,
      description: form.description || null,
      file_url: form.file_url || null,
      file_name: form.file_name || null,
      external_url: form.external_url || null,
      resource_links: form.resource_links.filter(l => l.url.trim()) as any,
      is_published: form.is_published,
      academic_year_id: academicYearId,
    };
    if (editing) {
      const { error } = await (supabase as any).from('spiral_resources').update(payload).eq('id', editing.id);
      if (error) return toast({ title: "Erreur", description: "Échec", variant: "destructive" });
      toast({ title: "Mis à jour" });
    } else {
      const { error } = await (supabase as any).from('spiral_resources').insert({ ...payload, order_index: items.length });
      if (error) return toast({ title: "Erreur", description: "Échec", variant: "destructive" });
      toast({ title: "Créé" });
    }
    resetForm();
    fetchData();
  };

  const handleEdit = (item: SpiralResource) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      resource_type: item.resource_type,
      file_url: item.file_url || '',
      file_name: item.file_name || '',
      external_url: item.external_url || '',
      resource_links: Array.isArray(item.resource_links) ? item.resource_links : [],
      is_published: item.is_published,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette ressource ?")) return;
    await (supabase as any).from('spiral_resources').delete().eq('id', id);
    fetchData();
  };

  const togglePublish = async (item: SpiralResource) => {
    await (supabase as any).from('spiral_resources')
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
      await (supabase as any).from('spiral_resources')
        .update({ order_index: i }).eq('id', newItems[i].id);
    }
  };

  const levelLabel = SPIRAL_LEVELS.find(l => l.id === selectedLevel)?.label || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
          <Spline className="w-6 h-6 text-rainbow-purple" />
          Progression Spiralée — {levelLabel}
        </h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle ressource
        </Button>
      </div>

      {showForm && (
        <Card className="border-rainbow-purple/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              {editing ? 'Modifier' : 'Nouvelle ressource'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-5 h-5" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={form.resource_type} onValueChange={(v) => setForm(p => ({ ...p, resource_type: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titre *</Label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Fiche - Théorème de Thalès" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brève description..." className="rounded-xl mt-1" rows={3} />
            </div>
            <div>
              <Label>Lien externe (URL)</Label>
              <Input value={form.external_url} onChange={(e) => setForm(p => ({ ...p, external_url: e.target.value }))}
                placeholder="https://..." className="rounded-xl mt-1" />
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
            <LinksEditor value={form.resource_links} onChange={links => setForm(p => ({ ...p, resource_links: links }))} />
            <div className="flex items-center gap-3 pt-2">
              <Switch checked={form.is_published}
                onCheckedChange={(c) => setForm(p => ({ ...p, is_published: c }))} />
              <Label>Publier</Label>
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
            <Spline className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground font-body">Aucune ressource pour {levelLabel}</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map(item => {
                const type = RESOURCE_TYPES.find(t => t.id === item.resource_type);
                const TypeIcon = type?.icon || FileText;
                return (
                  <SortableItem key={item.id} id={item.id}>
                    <Card className={`border-l-4 ${item.is_published ? 'border-l-rainbow-green' : 'border-l-muted'}`}>
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <TypeIcon className="w-4 h-4 text-rainbow-purple" />
                            <h3 className="font-display text-foreground">{item.title}</h3>
                            <span className="text-xs text-muted-foreground">• {type?.label}</span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex gap-3 mt-1 flex-wrap">
                            {item.file_url && (
                              <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-rainbow-blue hover:underline inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" /> {item.file_name || 'Fichier'}
                              </a>
                            )}
                            {item.external_url && (
                              <a href={item.external_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-rainbow-purple hover:underline inline-flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" /> Lien
                              </a>
                            )}
                          </div>
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
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default SpiralResourcesManager;
