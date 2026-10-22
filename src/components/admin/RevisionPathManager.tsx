import React, { useEffect, useState } from 'react';
import { move, MoveButtons, PublishToggle, saveOrder } from './MoveButtons';
import { SortableList } from './SortableList';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Route, Pencil, Save, X, CheckCircle2, FileText, Link as LinkIcon } from 'lucide-react';
import { useAcademicYears, useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';
import { levelLabel } from '@/lib/levels';
import { RevisionFile, RevisionResource, resourceKind } from '@/lib/parcoursRevision';

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,image/*,audio/*';

interface FormState { title: string; description: string; files: RevisionFile[]; url: string; correction_url: string; }
const EMPTY: FormState = { title: '', description: '', files: [], url: '', correction_url: '' };

/** Champs d'une ressource, communs à l'ajout et à la modification */
const ResourceFields: React.FC<{
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  uploading: boolean;
  upload: (file: File) => Promise<string | null>;
}> = ({ form, setForm, uploading, upload }) => {
  const addFiles = async (list: FileList) => {
    for (const file of Array.from(list)) {
      const url = await upload(file);
      if (!url) continue;
      const name = file.name.replace(/\.[^.]+$/, '');
      setForm(f => ({ ...f, files: [...f.files, { name, url }], title: f.title || name }));
    }
  };

  return (
    <div className="space-y-2">
      <Input placeholder="Titre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

      <div className="space-y-2 p-3 rounded-lg border border-dashed">
        <p className="text-xs font-semibold flex items-center gap-1"><FileText className="w-3 h-3" /> Fichier(s)</p>
        <Input type="file" multiple accept={ACCEPT} disabled={uploading}
          onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }} />
        {form.files.map((file, i) => (
          <div key={file.url} className="flex items-center gap-2">
            <Input value={file.name} aria-label="Nom affiché du fichier"
              onChange={e => setForm(f => ({ ...f, files: f.files.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} />
            <a href={file.url} target="_blank" rel="noreferrer" className="text-xs underline shrink-0">voir</a>
            <Button variant="ghost" size="icon" title="Retirer ce fichier"
              onClick={() => setForm(f => ({ ...f, files: f.files.filter((_, j) => j !== i) }))}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input placeholder="Lien (vidéo, Canva...), facultatif" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
      </div>

      <div className="space-y-2 p-3 rounded-lg border border-dashed border-rainbow-green/50">
        <p className="text-xs font-semibold text-rainbow-green flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Corrigé (facultatif)</p>
        <Input type="file" accept={ACCEPT} disabled={uploading}
          onChange={async e => {
            const f = e.target.files?.[0];
            if (!f) return;
            const u = await upload(f);
            if (u) setForm(fr => ({ ...fr, correction_url: u }));
          }} />
        <Input placeholder="ou URL du corrigé" value={form.correction_url} onChange={e => setForm(f => ({ ...f, correction_url: e.target.value }))} />
      </div>
      {uploading && <p className="text-xs text-muted-foreground">Téléversement en cours…</p>}
    </div>
  );
};

const toRow = (form: FormState) => ({
  title: form.title.trim(),
  description: form.description || null,
  files: form.files,
  url: form.url || null,
  correction_url: form.correction_url || null,
  kind: resourceKind(form.files, form.url),
});

export const RevisionPathManager: React.FC = () => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const { classes } = useAcademicYears();
  const [level, setLevel] = useState('6eme');
  const [items, setItems] = useState<RevisionResource[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY);

  const availableLevels = classes.filter(c => c.academic_year_id === academicYearId).map(c => c.class_level);

  useEffect(() => {
    if (availableLevels.length && !availableLevels.includes(level)) setLevel(availableLevels[0]);
  }, [academicYearId, availableLevels.join(',')]);

  useEffect(() => { fetch(); }, [level, academicYearId]);

  const fetch = async () => {
    if (!academicYearId) { setItems([]); return; }
    const { data } = await (supabase as any).from('revision_path_resources')
      .select('*').eq('level', level).eq('academic_year_id', academicYearId)
      .order('display_order').order('created_at');
    setItems(data || []);
  };

  const add = async () => {
    if (!form.title.trim() || !academicYearId) {
      toast({ title: 'Il manque le titre', variant: 'destructive' });
      return;
    }
    const { error } = await (supabase as any).from('revision_path_resources').insert({
      ...toRow(form), level, academic_year_id: academicYearId, step: 1, display_order: items.length,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ajouté' }); setForm(EMPTY); fetch(); }
  };

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `parcours-revision/${level}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('course-files').upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      toast({ title: 'Erreur de téléversement', description: error.message, variant: 'destructive' });
      return null;
    }
    return supabase.storage.from('course-files').getPublicUrl(path).data.publicUrl;
  };

  const startEdit = (r: RevisionResource) => {
    setEditingId(r.id);
    setEditForm({ title: r.title, description: r.description || '', files: r.files || [], url: r.url || '', correction_url: r.correction_url || '' });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.title.trim()) return;
    const { error } = await (supabase as any).from('revision_path_resources').update(toRow(editForm)).eq('id', editingId);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Modifié' }); setEditingId(null); fetch(); }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette ressource ?')) return;
    await (supabase as any).from('revision_path_resources').delete().eq('id', id);
    fetch();
  };

  // Glisser-déposer : affichage immédiat, puis enregistrement des positions modifiées
  const reorder = async (ordered: RevisionResource[]) => {
    setItems(ordered.map((r, position) => ({ ...r, display_order: position })));
    const error = await saveOrder('revision_path_resources', ordered);
    if (error) {
      toast({ title: "L'ordre n'a pas pu être enregistré", description: error.message, variant: 'destructive' });
      fetch();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Route className="w-5 h-5 text-rainbow-purple" />
          <h2 className="font-display text-xl">Parcours de révision</h2>
        </div>
        <div className="mt-3">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableLevels.length === 0 && <SelectItem value="6eme">Aucune classe</SelectItem>}
              {availableLevels.map(l => <SelectItem key={l} value={l}>{levelLabel(l)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-4 space-y-2 bg-muted/30">
        <h3 className="font-display">Ajouter une ressource</h3>
        <ResourceFields form={form} setForm={setForm} uploading={uploading} upload={upload} />
        <Button onClick={add} disabled={uploading}><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
      </Card>

      <Card className="p-4">
        <h3 className="font-display mb-3">Ressources de la classe</h3>
        <SortableList items={items} getLabel={r => r.title} onReorder={reorder} className="space-y-2">
          {(r, handle, i) => (
            editingId === r.id ? (
              <div className="space-y-2 p-3 rounded border border-rainbow-blue/50">
                <ResourceFields form={editForm} setForm={setEditForm} uploading={uploading} upload={upload} />
                <div className="flex gap-2">
                  <Button onClick={saveEdit} disabled={uploading}><Save className="w-4 h-4 mr-1" />Enregistrer</Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4 mr-1" />Annuler</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start gap-2 p-2 rounded bg-muted/40">
                {handle}
                <div className="min-w-0 flex-[1_1_12rem]">
                  <p className="font-semibold">{r.title}</p>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  <div className="flex flex-wrap gap-3">
                    {(r.files || []).map(f => (
                      <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="text-xs text-rainbow-blue underline">{f.name}</a>
                    ))}
                    {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-rainbow-blue underline">Lien</a>}
                    {r.correction_url && <a href={r.correction_url} target="_blank" rel="noreferrer" className="text-xs text-rainbow-green underline">Corrigé</a>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(r)}><Pencil className="w-4 h-4" /></Button>
                  <PublishToggle table="revision_path_resources" id={r.id} published={r.is_published} onDone={fetch} />
                  <MoveButtons index={i} total={items.length} onMove={d => move('revision_path_resources', items, i, d, fetch)} />
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            )
          )}
        </SortableList>
        {items.length === 0 && <p className="text-xs text-muted-foreground italic">Aucune ressource.</p>}
      </Card>
    </div>
  );
};

export default RevisionPathManager;
