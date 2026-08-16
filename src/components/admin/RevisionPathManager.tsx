import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Route } from 'lucide-react';
import { useAcademicYears, useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

export const REVISION_STEPS = [
  { id: 1, label: 'Réactiver les connaissances' },
  { id: 2, label: 'Revoir les notions essentielles' },
  { id: 3, label: "S'entraîner" },
  { id: 4, label: 'Vérifier ses acquis' },
  { id: 5, label: "S'autoévaluer" },
];

const KINDS = ['pdf', 'video', 'canva', 'podcast', 'link'];

interface Resource {
  id: string; level: Level; academic_year_id: string | null; step: number;
  kind: string; title: string; description: string | null; url: string | null; display_order: number;
}

export const RevisionPathManager: React.FC = () => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const { classes } = useAcademicYears();
  const [level, setLevel] = useState<Level>('6eme');
  const [items, setItems] = useState<Resource[]>([]);
  const [form, setForm] = useState({ step: 1, kind: 'pdf', title: '', description: '', url: '' });

  const availableLevels = classes.filter(c => c.academic_year_id === academicYearId).map(c => c.class_level as Level);

  useEffect(() => {
    if (availableLevels.length && !availableLevels.includes(level)) setLevel(availableLevels[0]);
  }, [academicYearId, availableLevels.join(',')]);

  useEffect(() => { fetch(); }, [level, academicYearId]);

  const fetch = async () => {
    if (!academicYearId) { setItems([]); return; }
    const { data } = await (supabase as any).from('revision_path_resources')
      .select('*').eq('level', level).eq('academic_year_id', academicYearId)
      .order('step').order('display_order');
    setItems(data || []);
  };

  const add = async () => {
    if (!form.title.trim() || !academicYearId) return;
    const stepCount = items.filter(i => i.step === form.step).length;
    const { error } = await (supabase as any).from('revision_path_resources').insert({
      level, academic_year_id: academicYearId, step: form.step, kind: form.kind,
      title: form.title, description: form.description || null, url: form.url || null,
      display_order: stepCount,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ajouté' }); setForm({ step: form.step, kind: 'pdf', title: '', description: '', url: '' }); fetch(); }
  };

  const remove = async (id: string) => {
    await (supabase as any).from('revision_path_resources').delete().eq('id', id);
    fetch();
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Route className="w-5 h-5 text-rainbow-purple" />
          <h2 className="font-display text-xl">Parcours de révision</h2>
        </div>
        <div className="mt-3">
          <Select value={level} onValueChange={v => setLevel(v as Level)}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableLevels.length === 0 && <SelectItem value="6eme">Aucune classe</SelectItem>}
              {availableLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-4 space-y-2 bg-muted/30">
        <h3 className="font-display">Ajouter une ressource</h3>
        <div className="grid md:grid-cols-2 gap-2">
          <Select value={String(form.step)} onValueChange={v => setForm(f => ({ ...f, step: parseInt(v) }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{REVISION_STEPS.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.id}. {s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.kind} onValueChange={v => setForm(f => ({ ...f, kind: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{KINDS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Input placeholder="Titre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Input placeholder="URL" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
        <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
      </Card>

      {REVISION_STEPS.map(step => {
        const stepItems = items.filter(i => i.step === step.id);
        return (
          <Card key={step.id} className="p-4">
            <h3 className="font-display mb-3">{step.id}. {step.label}</h3>
            <div className="space-y-2">
              {stepItems.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded bg-muted/40">
                  <div>
                    <p className="font-semibold">{r.title} <span className="text-xs text-muted-foreground">({r.kind})</span></p>
                    {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                    {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-rainbow-blue underline">Voir</a>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              {stepItems.length === 0 && <p className="text-xs text-muted-foreground italic">Aucune ressource.</p>}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default RevisionPathManager;
