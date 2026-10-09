import React, { useEffect, useState } from 'react';
import { move, MoveButtons, PublishToggle, saveOrder } from './MoveButtons';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Zap, Upload, FileText, Pencil, X, Save, GripVertical } from 'lucide-react';
import { useAcademicYears, useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface Item {
  id: string; level: Level; chapter: string | null; title: string;
  description: string | null; canva_embed_url: string | null; thumbnail_url: string | null;
  academic_year_id: string | null; display_order: number;
  file_url: string | null; file_name: string | null;
}

/** Carte déplaçable : on l'attrape par la poignée (souris, doigt ou clavier). */
const SortableCard: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`p-4 flex gap-2 ${isDragging ? 'relative z-10 shadow-xl ring-2 ring-primary/40' : ''}`}
    >
      <button
        type="button"
        className="shrink-0 self-start -ml-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        aria-label={`Déplacer « ${title} »`}
        title="Glisser pour déplacer"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </Card>
  );
};

export const AutomatismsManager: React.FC = () => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const { classes } = useAcademicYears();
  const [level, setLevel] = useState<Level>('6eme');
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState({ title: '', description: '', chapter: '', canva_embed_url: '', thumbnail_url: '' });
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm = { title: '', description: '', chapter: '', canva_embed_url: '', thumbnail_url: '' };
  const startEdit = (it: Item) => {
    setEditingId(it.id);
    setForm({ title: it.title, description: it.description || '', chapter: it.chapter || '', canva_embed_url: it.canva_embed_url || '', thumbnail_url: it.thumbnail_url || '' });
    setFile(it.file_url ? { url: it.file_url, name: it.file_name || 'Fichier' } : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); setFile(null); };

  const upload = async (f: File) => {
    setUploading(true);
    const ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `automatismes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('course-files').upload(path, f, { upsert: false });
    setUploading(false);
    if (error) { toast({ title: 'Upload échoué', description: error.message, variant: 'destructive' }); return; }
    const { data } = supabase.storage.from('course-files').getPublicUrl(path);
    setFile({ url: data.publicUrl, name: f.name });
    setForm(x => ({ ...x, title: x.title || f.name.replace(/\.[^.]+$/, '') }));
  };

  const availableLevels = classes
    .filter(c => c.academic_year_id === academicYearId)
    .map(c => c.class_level as Level);

  useEffect(() => {
    if (availableLevels.length && !availableLevels.includes(level)) setLevel(availableLevels[0]);
  }, [academicYearId, availableLevels.join(',')]);

  useEffect(() => { fetch(); }, [level, academicYearId]);

  const fetch = async () => {
    if (!academicYearId) { setItems([]); return; }
    const { data } = await (supabase as any).from('automatisms')
      .select('*').eq('level', level).eq('academic_year_id', academicYearId)
      .order('display_order');
    setItems(data || []);
  };

  const add = async () => {
    if (!form.title.trim() || !academicYearId) return;
    const payload = {
      title: form.title, description: form.description || null, chapter: form.chapter || null,
      canva_embed_url: form.canva_embed_url || null, file_url: file?.url || null, file_name: file?.name || null, thumbnail_url: form.thumbnail_url || null,
    };
    const { error } = editingId
      ? await (supabase as any).from('automatisms').update(payload).eq('id', editingId)
      : await (supabase as any).from('automatisms').insert({ ...payload, level, academic_year_id: academicYearId, display_order: items.length });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: editingId ? 'Modifié' : 'Ajouté' }); cancelEdit(); fetch(); }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce support ?')) return;
    await (supabase as any).from('automatisms').delete().eq('id', id);
    fetch();
  };

  // Un petit déplacement de la souris est exigé avant de « prendre » la carte, pour ne pas gêner les clics
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex(i => i.id === active.id);
    const to = items.findIndex(i => i.id === over.id);
    if (from < 0 || to < 0) return;
    const reordered = arrayMove(items, from, to);
    // Affichage immédiat du nouvel ordre, puis enregistrement des seules positions modifiées
    setItems(reordered.map((item, position) => ({ ...item, display_order: position })));
    const error = await saveOrder('automatisms', reordered);
    if (error) {
      toast({ title: "L'ordre n'a pas pu être enregistré", description: error.message, variant: 'destructive' });
      fetch();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-rainbow-yellow" />
          <h2 className="font-display text-xl">Automatismes</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Disponible pour l'année scolaire sélectionnée.</p>
        <div className="mt-3">
          <Select value={level} onValueChange={v => setLevel(v as Level)}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableLevels.length === 0 && <SelectItem value="6eme">Aucune classe — ouvrez-en une</SelectItem>}
              {availableLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-4 space-y-2 bg-muted/30">
        <h3 className="font-display">{editingId ? 'Modifier le support' : 'Nouveau support'}</h3>
        <Input placeholder="Titre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Input placeholder="Chapitre (optionnel)" value={form.chapter} onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))} />
        <Input placeholder="URL d'intégration Canva (embed)" value={form.canva_embed_url} onChange={e => setForm(f => ({ ...f, canva_embed_url: e.target.value }))} />
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm border rounded-md px-3 py-2 bg-background">
            <Upload className="w-4 h-4" />{uploading ? 'Envoi...' : 'Téléverser un fichier (PDF, Word, PowerPoint, image...)'}
            <input type="file" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
          </label>
          {file && <span className="text-xs text-muted-foreground">{file.name}</span>}
          {file && <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}>Retirer le fichier</Button>}
        </div>
        <Input placeholder="URL miniature (optionnel)" value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} />
        <Textarea placeholder="Description courte" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <div className="flex gap-2">
          <Button onClick={add}>{editingId ? <Save className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}{editingId ? 'Enregistrer' : 'Ajouter'}</Button>
          {editingId && <Button variant="outline" onClick={cancelEdit}><X className="w-4 h-4 mr-1" />Annuler</Button>}
        </div>
      </Card>

      {items.length > 1 && (
        <p className="text-sm text-muted-foreground">
          Pour changer l'ordre, fais glisser une carte par sa poignée <GripVertical className="inline w-4 h-4 align-text-bottom" aria-hidden="true" /> et dépose-la où tu veux.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((it, i) => (
          <SortableCard key={it.id} id={it.id} title={it.title}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-display">{it.title}</h4>
              <div className="flex shrink-0">
              <Button variant="ghost" size="icon" onClick={() => startEdit(it)}><Pencil className="w-4 h-4" /></Button>
              <PublishToggle table="automatisms" id={it.id} published={(it as any).is_published} onDone={fetch} /><MoveButtons index={i} total={items.length} onMove={d => move('automatisms', items, i, d, fetch)} />
              <Button variant="ghost" size="icon" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
            {it.chapter && <p className="text-xs text-muted-foreground">{it.chapter}</p>}
            {it.description && <p className="text-sm mt-2">{it.description}</p>}
            {it.file_url && (
              <a href={it.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-rainbow-purple hover:underline">
                <FileText className="w-4 h-4" />{it.file_name || 'Ouvrir le fichier'}
              </a>
            )}
            {it.canva_embed_url && (
              <div className="mt-3 aspect-video">
                <iframe src={it.canva_embed_url} title={it.title} className="w-full h-full rounded-lg border" allow="fullscreen" />
              </div>
            )}
          </SortableCard>
        ))}
        {items.length === 0 && <p className="text-muted-foreground text-sm">Aucun support pour cette classe.</p>}
      </div>
      </SortableContext>
      </DndContext>
    </div>
  );
};

export default AutomatismsManager;
