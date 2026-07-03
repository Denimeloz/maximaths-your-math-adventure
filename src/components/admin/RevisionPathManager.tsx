import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Route, Upload, Trash2, FileText, Save } from 'lucide-react';
import { useAcademicYears, useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface RevisionFile {
  id: string;
  academic_year_id: string;
  level: Level;
  title: string | null;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
}

export const RevisionPathManager: React.FC = () => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const { classes } = useAcademicYears();
  const [level, setLevel] = useState<Level>('6eme');
  const [current, setCurrent] = useState<RevisionFile | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableLevels = classes.filter(c => c.academic_year_id === academicYearId).map(c => c.class_level as Level);

  useEffect(() => {
    if (availableLevels.length && !availableLevels.includes(level)) setLevel(availableLevels[0]);
  }, [academicYearId, availableLevels.join(',')]);

  useEffect(() => { load(); }, [level, academicYearId]);

  const load = async () => {
    if (!academicYearId) { setCurrent(null); return; }
    const { data } = await (supabase as any).from('revision_path_files')
      .select('*').eq('level', level).eq('academic_year_id', academicYearId).maybeSingle();
    setCurrent(data || null);
    setTitle(data?.title || '');
    setDescription(data?.description || '');
  };

  const upsert = async (patch: Partial<RevisionFile>) => {
    if (!academicYearId) return null;
    const payload = { academic_year_id: academicYearId, level, ...patch };
    const { data, error } = await (supabase as any).from('revision_path_files')
      .upsert(payload, { onConflict: 'academic_year_id,level' }).select().single();
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return null; }
    setCurrent(data);
    return data;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !academicYearId) return;
    setUploading(true);
    try {
      const path = `revision-path/${academicYearId}/${level}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('course-files').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(path);
      await upsert({ file_url: publicUrl, file_name: file.name });
      toast({ title: 'Fichier téléversé' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = async () => {
    if (!current) return;
    await upsert({ file_url: null, file_name: null });
    toast({ title: 'Fichier retiré' });
  };

  const saveMeta = async () => {
    setSaving(true);
    await upsert({ title: title || null, description: description || null });
    setSaving(false);
    toast({ title: 'Enregistré' });
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

      <Card className="p-4 space-y-3">
        <h3 className="font-display">Fichier du parcours</h3>
        <Input placeholder="Titre (optionnel)" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea placeholder="Description (optionnel)" value={description} onChange={e => setDescription(e.target.value)} />
        <Button onClick={saveMeta} disabled={saving} variant="outline">
          <Save className="w-4 h-4 mr-2" />Enregistrer titre / description
        </Button>

        <div className="pt-3 border-t">
          {current?.file_url ? (
            <div className="flex items-center justify-between p-3 rounded bg-muted/40">
              <a href={current.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium hover:underline">
                <FileText className="w-4 h-4" />{current.file_name || 'Fichier'}
              </a>
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Aucun fichier téléversé.</p>
          )}
          <label className="mt-3 inline-flex items-center gap-2 cursor-pointer">
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">
              <Upload className="w-4 h-4" />{uploading ? 'Téléversement…' : (current?.file_url ? 'Remplacer le fichier' : 'Téléverser un fichier')}
            </span>
          </label>
        </div>
      </Card>
    </div>
  );
};

export default RevisionPathManager;
