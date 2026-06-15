import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, X, Zap } from 'lucide-react';
import { useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface Automatism {
  id: string;
  title: string;
  chapter: string | null;
  level: Level;
  canva_embed_url: string;
  thumbnail_url: string | null;
  description: string | null;
  display_order: number;
  created_at: string;
}

interface Props { selectedLevel: Level }

export const AutomatismsManager: React.FC<Props> = ({ selectedLevel }) => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const [items, setItems] = useState<Automatism[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Automatism | null>(null);
  const [form, setForm] = useState({
    title: '', chapter: '', canva_embed_url: '', thumbnail_url: '', description: '',
  });

  useEffect(() => { fetchData(); }, [selectedLevel, academicYearId]);

  const fetchData = async () => {
    let q = (supabase as any).from('automatisms').select('*').eq('level', selectedLevel).order('display_order');
    if (academicYearId) q = q.eq('academic_year_id', academicYearId);
    const { data } = await q;
    setItems(data || []);
  };

  const reset = () => {
    setShowForm(false); setEditing(null);
    setForm({ title: '', chapter: '', canva_embed_url: '', thumbnail_url: '', description: '' });
  };

  const save = async () => {
    if (!form.title.trim() || !form.canva_embed_url.trim()) {
      return toast({ title: 'Erreur', description: 'Titre et URL Canva requis', variant: 'destructive' });
    }
    const payload: any = {
      title: form.title, chapter: form.chapter || null,
      level: selectedLevel, academic_year_id: academicYearId,
      canva_embed_url: form.canva_embed_url, thumbnail_url: form.thumbnail_url || null,
      description: form.description || null,
    };
    if (editing) {
      const { error } = await (supabase as any).from('automatisms').update(payload).eq('id', editing.id);
      if (error) return toast({ title: 'Erreur', variant: 'destructive' });
    } else {
      const { error } = await (supabase as any).from('automatisms').insert({ ...payload, display_order: items.length });
      if (error) return toast({ title: 'Erreur', variant: 'destructive' });
    }
    toast({ title: 'Succès' });
    reset(); fetchData();
  };

  const edit = (a: Automatism) => {
    setEditing(a);
    setForm({
      title: a.title, chapter: a.chapter || '', canva_embed_url: a.canva_embed_url,
      thumbnail_url: a.thumbnail_url || '', description: a.description || '',
    });
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette fiche d\'automatismes ?')) return;
    await (supabase as any).from('automatisms').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display flex items-center gap-2">
          <Zap className="w-6 h-6 text-rainbow-yellow" /> Automatismes
        </h2>
        <Button onClick={() => setShowForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle fiche
        </Button>
      </div>

      {showForm && (
        <Card className="border-rainbow-yellow/30">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-lg font-display">{editing ? 'Modifier' : 'Nouvelle fiche Canva'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={reset}><X className="w-5 h-5" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Titre *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>Chapitre</Label><Input value={form.chapter} onChange={e => setForm(p => ({ ...p, chapter: e.target.value }))} placeholder="Ex: Fractions" className="rounded-xl mt-1" /></div>
            <div>
              <Label>URL d'intégration Canva *</Label>
              <Input value={form.canva_embed_url} onChange={e => setForm(p => ({ ...p, canva_embed_url: e.target.value }))}
                placeholder="https://www.canva.com/design/.../view?embed" className="rounded-xl mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Dans Canva : Partager → Plus → Intégrer → Lien intelligent (ajoutez ?embed)</p>
            </div>
            <div><Label>URL miniature (optionnel)</Label><Input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://..." className="rounded-xl mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="rounded-xl mt-1" /></div>
            <div className="flex gap-3 pt-2">
              <Button onClick={save} className="btn-3d bg-primary rounded-xl">{editing ? 'Enregistrer' : 'Créer'}</Button>
              <Button variant="outline" onClick={reset} className="rounded-xl">Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Aucune fiche pour ce niveau.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-start gap-4">
                {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="w-20 h-20 object-cover rounded-lg" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display">{item.title}</h3>
                  {item.chapter && <p className="text-xs text-rainbow-yellow font-semibold">{item.chapter}</p>}
                  {item.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => edit(item)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutomatismsManager;
