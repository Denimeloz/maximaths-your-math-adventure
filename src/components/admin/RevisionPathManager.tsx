import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Route, Pencil, Save, X, CheckCircle2 } from 'lucide-react';
import { useAcademicYears, useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

export const REVISION_STEPS = [
  { id: 1, label: 'Réactiver les connaissances' },
  { id: 2, label: 'Revoir les notions essentielles' },
  { id: 3, label: "S'entraîner" },
  { id: 4, label: 'Vérifier ses acquis' },
  { id: 5, label: "S'autoévaluer" },
];

const KINDS = ['pdf', 'word', 'powerpoint', 'image', 'video', 'canva', 'podcast', 'link'];
const UPLOAD_KINDS = ['pdf', 'word', 'powerpoint', 'image', 'podcast'];
const ACCEPTS: Record<string, string> = {
  pdf: '.pdf',
  word: '.doc,.docx',
  powerpoint: '.ppt,.pptx',
  image: 'image/*',
  podcast: 'audio/*',
};

interface Resource {
  id: string; level: Level; academic_year_id: string | null; step: number;
  kind: string; title: string; description: string | null; url: string | null;
  correction_url: string | null; display_order: number;
}

export const RevisionPathManager: React.FC = () => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const { classes } = useAcademicYears();
  const [level, setLevel] = useState<Level>('6eme');
  const [items, setItems] = useState<Resource[]>([]);
  const [form, setForm] = useState({ step: 1, kind: 'pdf', title: '', description: '', url: '', correction_url: '' });
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ kind: 'pdf', title: '', description: '', url: '', correction_url: '' });

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
      correction_url: form.correction_url || null,
      display_order: stepCount,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ajouté' }); setForm({ step: form.step, kind: 'pdf', title: '', description: '', url: '', correction_url: '' }); fetch(); }
  };

  const uploadTo = async (file: File): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `parcours-revision/${level}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('course-files').upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      toast({ title: 'Erreur de téléversement', description: error.message, variant: 'destructive' });
      return null;
    }
    toast({ title: 'Fichier téléversé' });
    return supabase.storage.from('course-files').getPublicUrl(path).data.publicUrl;
  };

  const uploadFile = async (file: File) => {
    const url = await uploadTo(file);
    if (url) setForm(f => ({ ...f, url, title: f.title || file.name.replace(/\.[^.]+$/, '') }));
  };

  const startEdit = (r: Resource) => {
    setEditingId(r.id);
    setEditForm({ kind: r.kind, title: r.title, description: r.description || '', url: r.url || '', correction_url: r.correction_url || '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await (supabase as any).from('revision_path_resources').update({
      kind: editForm.kind, title: editForm.title, description: editForm.description || null,
      url: editForm.url || null, correction_url: editForm.correction_url || null,
    }).eq('id', editingId);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Modifié' }); setEditingId(null); fetch(); }
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
        {UPLOAD_KINDS.includes(form.kind) ? (
          <div className="space-y-2">
            <label className="text-sm font-body text-muted-foreground">Téléverser le fichier</label>
            <Input type="file" accept={ACCEPTS[form.kind]} disabled={uploading}
              onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
            {uploading && <p className="text-xs text-muted-foreground">Téléversement en cours…</p>}
            {form.url && !uploading && (
              <p className="text-xs text-rainbow-green truncate">Fichier prêt : <a href={form.url} target="_blank" rel="noreferrer" className="underline">voir</a></p>
            )}
          </div>
        ) : (
          <Input placeholder="URL / lien" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
        )}
        <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <div className="space-y-2 p-3 rounded-lg border border-dashed border-rainbow-green/50">
          <p className="text-xs font-semibold text-rainbow-green flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Corrigé (optionnel)</p>
          <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*,audio/*" disabled={uploading}
            onChange={async e => {
              const f = e.target.files?.[0];
              if (!f) return;
              const u = await uploadTo(f);
              if (u) setForm(fr => ({ ...fr, correction_url: u }));
            }} />
          <Input placeholder="ou URL du corrigé" value={form.correction_url} onChange={e => setForm(f => ({ ...f, correction_url: e.target.value }))} />
        </div>
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
      </Card>

      {REVISION_STEPS.map(step => {
        const stepItems = items.filter(i => i.step === step.id);
        return (
          <Card key={step.id} className="p-4">
            <h3 className="font-display mb-3">{step.id}. {step.label}</h3>
            <div className="space-y-2">
              {stepItems.map(r => (
                editingId === r.id ? (
                  <div key={r.id} className="space-y-2 p-3 rounded border border-rainbow-blue/50">
                    <Select value={editForm.kind} onValueChange={v => setEditForm(f => ({ ...f, kind: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{KINDS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Titre" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                    <Input placeholder="URL du fichier / lien" value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} />
                    <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*,audio/*" disabled={uploading}
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const u = await uploadTo(f);
                        if (u) setEditForm(fr => ({ ...fr, url: u }));
                      }} />
                    <Textarea placeholder="Description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    <div className="space-y-2 p-3 rounded-lg border border-dashed border-rainbow-green/50">
                      <p className="text-xs font-semibold text-rainbow-green flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Corrigé (optionnel)</p>
                      <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*,audio/*" disabled={uploading}
                        onChange={async e => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const u = await uploadTo(f);
                          if (u) setEditForm(fr => ({ ...fr, correction_url: u }));
                        }} />
                      <Input placeholder="ou URL du corrigé" value={editForm.correction_url} onChange={e => setEditForm(f => ({ ...f, correction_url: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} disabled={uploading}><Save className="w-4 h-4 mr-1" />Enregistrer</Button>
                      <Button variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4 mr-1" />Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <div key={r.id} className="flex items-start justify-between gap-3 p-2 rounded bg-muted/40">
                    <div className="min-w-0">
                      <p className="font-semibold">{r.title} <span className="text-xs text-muted-foreground">({r.kind})</span></p>
                      {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                      <div className="flex flex-wrap gap-3">
                        {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-rainbow-blue underline">Voir</a>}
                        {r.correction_url && <a href={r.correction_url} target="_blank" rel="noreferrer" className="text-xs text-rainbow-green underline">Voir le corrigé</a>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(r)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                )
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
