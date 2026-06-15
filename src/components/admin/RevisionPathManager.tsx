import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, X, Route } from 'lucide-react';
import { useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

export const STEPS = [
  { n: 1, label: 'Réactiver les connaissances' },
  { n: 2, label: 'Revoir les notions essentielles' },
  { n: 3, label: "S'entraîner" },
  { n: 4, label: 'Vérifier ses acquis' },
  { n: 5, label: "S'autoévaluer" },
];

export const KINDS = [
  { id: 'canva', label: 'Canva' },
  { id: 'pdf', label: 'PDF' },
  { id: 'video', label: 'Vidéo' },
  { id: 'podcast', label: 'Podcast (audio)' },
  { id: 'link', label: 'Lien externe' },
];

interface Item {
  id: string; level: Level; step: number; kind: string;
  title: string; description: string | null; url: string; display_order: number;
}

interface Props { selectedLevel: Level }

export const RevisionPathManager: React.FC<Props> = ({ selectedLevel }) => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const [items, setItems] = useState<Item[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ step: 1, kind: 'pdf', title: '', description: '', url: '' });

  useEffect(() => { fetchData(); }, [selectedLevel, academicYearId]);

  const fetchData = async () => {
    let q = (supabase as any).from('revision_path_resources').select('*').eq('level', selectedLevel).order('step').order('display_order');
    if (academicYearId) q = q.eq('academic_year_id', academicYearId);
    const { data } = await q;
    setItems(data || []);
  };

  const reset = () => { setShowForm(false); setEditing(null); setForm({ step: 1, kind: 'pdf', title: '', description: '', url: '' }); };

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) return toast({ title: 'Erreur', description: 'Titre et URL requis', variant: 'destructive' });
    const payload: any = {
      level: selectedLevel, academic_year_id: academicYearId,
      step: form.step, kind: form.kind, title: form.title,
      description: form.description || null, url: form.url,
    };
    if (editing) {
      await (supabase as any).from('revision_path_resources').update(payload).eq('id', editing.id);
    } else {
      await (supabase as any).from('revision_path_resources').insert({ ...payload, display_order: items.filter(i => i.step === form.step).length });
    }
    toast({ title: 'Succès' }); reset(); fetchData();
  };

  const edit = (i: Item) => {
    setEditing(i);
    setForm({ step: i.step, kind: i.kind, title: i.title, description: i.description || '', url: i.url });
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ?')) return;
    await (supabase as any).from('revision_path_resources').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display flex items-center gap-2">
          <Route className="w-6 h-6 text-rainbow-blue" /> Parcours de révision
        </h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle ressource
        </Button>
      </div>

      {showForm && (
        <Card className="border-rainbow-blue/30">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-lg font-display">{editing ? 'Modifier' : 'Nouvelle ressource'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={reset}><X className="w-5 h-5" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Étape</Label>
                <Select value={String(form.step)} onValueChange={v => setForm(p => ({ ...p, step: Number(v) }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STEPS.map(s => <SelectItem key={s.n} value={String(s.n)}>{s.n}. {s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.kind} onValueChange={v => setForm(p => ({ ...p, kind: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{KINDS.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Titre *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>URL *</Label><Input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." className="rounded-xl mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="rounded-xl mt-1" /></div>
            <div className="flex gap-3 pt-2">
              <Button onClick={save} className="btn-3d bg-primary rounded-xl">{editing ? 'Enregistrer' : 'Créer'}</Button>
              <Button variant="outline" onClick={reset} className="rounded-xl">Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {STEPS.map(s => {
        const stepItems = items.filter(i => i.step === s.n);
        return (
          <Card key={s.n}>
            <CardHeader><CardTitle className="text-base font-display">Étape {s.n} — {s.label} <span className="text-xs text-muted-foreground font-body">({stepItems.length})</span></CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {stepItems.length === 0 ? <p className="text-sm text-muted-foreground italic">Aucune ressource</p> : stepItems.map(i => (
                <div key={i.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <span className="text-xs px-2 py-0.5 rounded bg-rainbow-blue/20 text-rainbow-blue font-semibold">{KINDS.find(k => k.id === i.kind)?.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{i.title}</p>
                    {i.description && <p className="text-xs text-muted-foreground truncate">{i.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => edit(i)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(i.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RevisionPathManager;
