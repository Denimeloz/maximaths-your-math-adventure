import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Zap } from 'lucide-react';
import { useAcademicYears, useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface Item {
  id: string; level: Level; chapter: string | null; title: string;
  description: string | null; canva_embed_url: string | null; thumbnail_url: string | null;
  academic_year_id: string | null; display_order: number;
}

export const AutomatismsManager: React.FC = () => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const { classes } = useAcademicYears();
  const [level, setLevel] = useState<Level>('6eme');
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState({ title: '', description: '', chapter: '', canva_embed_url: '', thumbnail_url: '' });

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
    const { error } = await (supabase as any).from('automatisms').insert({
      title: form.title, description: form.description || null, chapter: form.chapter || null,
      canva_embed_url: form.canva_embed_url || null, thumbnail_url: form.thumbnail_url || null,
      level, academic_year_id: academicYearId, display_order: items.length,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ajouté' }); setForm({ title: '', description: '', chapter: '', canva_embed_url: '', thumbnail_url: '' }); fetch(); }
  };

  const remove = async (id: string) => {
    await (supabase as any).from('automatisms').delete().eq('id', id);
    fetch();
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
        <h3 className="font-display">Nouveau support</h3>
        <Input placeholder="Titre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Input placeholder="Chapitre (optionnel)" value={form.chapter} onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))} />
        <Input placeholder="URL d'intégration Canva (embed)" value={form.canva_embed_url} onChange={e => setForm(f => ({ ...f, canva_embed_url: e.target.value }))} />
        <Input placeholder="URL miniature (optionnel)" value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} />
        <Textarea placeholder="Description courte" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map(it => (
          <Card key={it.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-display">{it.title}</h4>
              <Button variant="ghost" size="icon" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
            {it.chapter && <p className="text-xs text-muted-foreground">{it.chapter}</p>}
            {it.description && <p className="text-sm mt-2">{it.description}</p>}
            {it.canva_embed_url && (
              <div className="mt-3 aspect-video">
                <iframe src={it.canva_embed_url} className="w-full h-full rounded-lg border" allow="fullscreen" />
              </div>
            )}
          </Card>
        ))}
        {items.length === 0 && <p className="text-muted-foreground text-sm">Aucun support pour cette classe.</p>}
      </div>
    </div>
  );
};

export default AutomatismsManager;
