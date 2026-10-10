import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, Loader2, BookOpen, Lightbulb, Dumbbell, HeartHandshake, Clapperboard, Pencil, Save, X, CheckCircle2 } from 'lucide-react';
import { move, MoveButtons, PublishToggle, saveOrder } from './MoveButtons';
import { SortableList } from './SortableList';
import { useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface Chapter { id: string; title: string; description: string | null; display_order: number; is_published?: boolean | null; }
interface Resource { id: string; chapter_id: string; section: string; kind: string; title: string; url: string | null; correction_url: string | null; description: string | null; display_order: number; }
interface Podcast { id: string; chapter_id: string; title: string; description: string | null; audio_url: string; duration_seconds: number | null; display_order: number; }

const SUBSECTIONS = [
  { id: 'activite_decouverte', label: 'Activité de découverte', icon: Lightbulb },
    { id: 'cours', label: 'Cours', icon: BookOpen },
  { id: 'exercices_entrainement', label: "Exercices d'entraînement", icon: Dumbbell },
  { id: 'accompagnement_personnalise', label: 'Accompagnement personnalisé', icon: HeartHandshake },
] as const;

const KINDS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'word', label: 'Word' },
  { id: 'powerpoint', label: 'PowerPoint' },
  { id: 'image', label: 'Image' },
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Vidéo' },
  { id: 'canva', label: 'Canva' },
  { id: 'link', label: 'Lien externe' },
  { id: 'lesson', label: 'Leçon' },
];

const FILE_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,image/*,audio/*,video/*';

interface Props { selectedLevel: Level }

export const CoursChapterManager: React.FC<Props> = ({ selectedLevel }) => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [chapterForm, setChapterForm] = useState({ title: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Chapitre en cours de renommage
  const [editingChapter, setEditingChapter] = useState<{ id: string; title: string; description: string } | null>(null);

  // En changeant de classe ou d'année, on repart du premier chapitre de la nouvelle liste :
  // sinon les ressources affichées (et celles qu'on ajoute) restaient celles de la classe précédente.
  useEffect(() => {
    setSelectedChapter(null);
    setResources([]);
    setPodcasts([]);
    setEditingId(null);
    setEditingChapter(null);
    fetchChapters(true);
  }, [selectedLevel, academicYearId]);
  useEffect(() => { if (selectedChapter) fetchResources(); }, [selectedChapter]);

  const fetchChapters = async (selectFirst = false) => {
    if (!academicYearId) { setChapters([]); return; }
    const { data } = await (supabase as any).from('tab_chapters').select('*')
      .eq('level', selectedLevel).eq('academic_year_id', academicYearId)
      .order('display_order');
    const list: Chapter[] = data || [];
    setChapters(list);
    setSelectedChapter(current => {
      if (!selectFirst && current && list.some(c => c.id === current)) return current;
      return list[0]?.id ?? null;
    });
  };

  const fetchResources = async () => {
    if (!selectedChapter) return;
    const [{ data: r }, { data: p }] = await Promise.all([
      (supabase as any).from('chapter_resources').select('*').eq('chapter_id', selectedChapter).order('display_order'),
      (supabase as any).from('chapter_podcasts').select('*').eq('chapter_id', selectedChapter).order('display_order'),
    ]);
    setResources(r || []);
    setPodcasts(p || []);
  };

  const createChapter = async () => {
    if (!chapterForm.title.trim() || !academicYearId) return;
    const { error } = await (supabase as any).from('tab_chapters').insert({
      title: chapterForm.title, description: chapterForm.description || null,
      level: selectedLevel, academic_year_id: academicYearId, display_order: chapters.length, is_published: true,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Chapitre créé' }); setChapterForm({ title: '', description: '' }); setShowNewChapter(false); fetchChapters(); }
  };

  const saveChapter = async () => {
    if (!editingChapter || !editingChapter.title.trim()) return;
    const { error } = await (supabase as any).from('tab_chapters').update({
      title: editingChapter.title.trim(), description: editingChapter.description.trim() || null,
    }).eq('id', editingChapter.id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Chapitre modifié' }); setEditingChapter(null); fetchChapters(); }
  };

  const deleteChapter = async (id: string) => {
    if (!confirm('Supprimer ce chapitre et toutes ses ressources ?')) return;
    await (supabase as any).from('tab_chapters').delete().eq('id', id);
    setSelectedChapter(null);
    fetchChapters(true);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const extension = file.name.includes('.') ? file.name.split('.').pop() : null;
      const ext = extension?.toLowerCase() || 'bin';
      const base = file.name
        .replace(/\.[^.]+$/, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'fichier';
      const path = `chapters/${Date.now()}-${base}.${ext}`;
      const { error } = await supabase.storage.from('course-files').upload(path, file);
      if (error) throw error;
      return supabase.storage.from('course-files').getPublicUrl(path).data.publicUrl;
    } catch (e: any) {
      toast({ title: 'Upload échoué', description: e.message, variant: 'destructive' });
      return null;
    } finally { setUploading(false); }
  };

  const addResource = async (section: string, kind: string, title: string, url: string, description: string, correctionUrl: string) => {
    if (!selectedChapter || !title.trim()) return;
    const { error } = await (supabase as any).from('chapter_resources').insert({
      chapter_id: selectedChapter, section, kind, title, url: url || null,
      correction_url: correctionUrl || null,
      description: description || null,
      display_order: resources.filter(r => r.section === section).length,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ajouté' }); fetchResources(); }
  };

  const updateResource = async (id: string, values: Partial<Resource>) => {
    const { error } = await (supabase as any).from('chapter_resources').update({
      title: values.title, kind: values.kind, url: values.url || null,
      correction_url: values.correction_url || null, description: values.description || null,
    }).eq('id', id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Modifié' }); setEditingId(null); fetchResources(); }
  };

  const deleteResource = async (id: string) => {
    if (!confirm('Supprimer cette ressource ?')) return;
    await (supabase as any).from('chapter_resources').delete().eq('id', id);
    fetchResources();
  };

  const deletePodcast = async (id: string) => {
    if (!confirm('Supprimer ce podcast ?')) return;
    await (supabase as any).from('chapter_podcasts').delete().eq('id', id);
    fetchResources();
  };

  // --- Glisser-déposer : affichage immédiat, puis enregistrement des seules positions modifiées
  const reportOrderError = (error: { message: string } | null, refresh: () => void) => {
    if (!error) return;
    toast({ title: "L'ordre n'a pas pu être enregistré", description: error.message, variant: 'destructive' });
    refresh();
  };

  const reorderChapters = async (ordered: Chapter[]) => {
    setChapters(ordered.map((c, position) => ({ ...c, display_order: position })));
    reportOrderError(await saveOrder('tab_chapters', ordered), () => fetchChapters());
  };

  const reorderResources = async (section: string, ordered: Resource[]) => {
    setResources(prev => [
      ...prev.filter(r => r.section !== section),
      ...ordered.map((r, position) => ({ ...r, display_order: position })),
    ]);
    reportOrderError(await saveOrder('chapter_resources', ordered), fetchResources);
  };

  const reorderPodcasts = async (ordered: Podcast[]) => {
    setPodcasts(ordered.map((p, position) => ({ ...p, display_order: position })));
    reportOrderError(await saveOrder('chapter_podcasts', ordered), fetchResources);
  };

  // Liste des ressources d'une rubrique du chapitre (les cinq rubriques partagent le même affichage)
  const resourceList = (section: string, showCorrection: boolean) => {
    const sectionResources = resources.filter(r => r.section === section);
    return (
      <SortableList
        items={sectionResources}
        getLabel={r => r.title}
        onReorder={ordered => reorderResources(section, ordered)}
        className="space-y-2"
      >
        {(r, handle, i) => (
          editingId === r.id ? (
            <ResourceEditForm resource={r} onUpload={uploadFile} uploading={uploading}
              onCancel={() => setEditingId(null)} onSave={values => updateResource(r.id, values)} showCorrection={showCorrection} />
          ) : (
            <Card className="p-3 flex flex-wrap items-start gap-2">
              {handle}
              <div className="min-w-0 flex-[1_1_12rem]">
                <p className="font-semibold">{r.title} <span className="text-xs text-muted-foreground">({r.kind})</span></p>
                {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                <div className="flex flex-wrap gap-3 mt-1">
                  {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-rainbow-blue underline">{showCorrection ? 'Voir le fichier' : 'Voir la ressource'}</a>}
                  {showCorrection && r.correction_url && (
                    <a href={r.correction_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-rainbow-green underline">
                      <CheckCircle2 className="w-3 h-3" /> Voir le corrigé
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <PublishToggle table="chapter_resources" id={r.id} published={(r as any).is_published} onDone={fetchResources} />
                <MoveButtons index={i} total={sectionResources.length} onMove={d => move('chapter_resources', sectionResources, i, d, fetchResources)} />
                <Button variant="ghost" size="icon" onClick={() => setEditingId(r.id)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteResource(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </Card>
          )
        )}
      </SortableList>
    );
  };

  return (
    <div className="space-y-6">
      {/* Chapters list */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Chapitres</h3>
          <Button size="sm" onClick={() => setShowNewChapter(s => !s)}><Plus className="w-4 h-4 mr-1" /> Nouveau chapitre</Button>
        </div>
        {showNewChapter && (
          <div className="space-y-2 mb-4 p-3 rounded-lg bg-muted/40">
            <Input placeholder="Titre" value={chapterForm.title} onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Description (optionnel)" value={chapterForm.description} onChange={e => setChapterForm(f => ({ ...f, description: e.target.value }))} />
            <Button onClick={createChapter}>Créer</Button>
          </div>
        )}
        <SortableList
          items={chapters}
          getLabel={c => c.title}
          onReorder={reorderChapters}
          layout="grid"
          className="flex flex-wrap gap-2"
          itemClassName="flex max-w-full items-center gap-1 rounded-lg bg-card"
        >
          {(c, handle) => (
            <>
              {handle}
              <Button
                variant={selectedChapter === c.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChapter(c.id)}
                className={`h-auto min-h-9 min-w-0 shrink whitespace-normal py-1.5 text-left ${c.is_published === false ? 'opacity-60 border-dashed' : ''}`}
                title={c.is_published === false ? 'Chapitre masqué aux élèves' : undefined}
              >
                {c.title}{c.is_published === false ? ' (masqué)' : ''}
              </Button>
              <PublishToggle table="tab_chapters" id={c.id} published={c.is_published} onDone={() => fetchChapters()} />
              <Button variant="ghost" size="icon" title="Renommer le chapitre" aria-label={`Renommer le chapitre ${c.title}`}
                onClick={() => setEditingChapter({ id: c.id, title: c.title, description: c.description || '' })}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Supprimer le chapitre" aria-label={`Supprimer le chapitre ${c.title}`} onClick={() => deleteChapter(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </>
          )}
        </SortableList>
        {chapters.length === 0 && <p className="text-sm text-muted-foreground">Aucun chapitre pour cette classe et cette année.</p>}
        {editingChapter && (
          <div className="space-y-2 mt-4 p-3 rounded-lg border border-rainbow-blue/50">
            <p className="text-sm font-semibold">Modifier le chapitre</p>
            <Input placeholder="Titre" value={editingChapter.title} onChange={e => setEditingChapter(c => c && ({ ...c, title: e.target.value }))} />
            <Textarea placeholder="Description (optionnel)" value={editingChapter.description} onChange={e => setEditingChapter(c => c && ({ ...c, description: e.target.value }))} />
            <div className="flex gap-2">
              <Button onClick={saveChapter} disabled={!editingChapter.title.trim()}><Save className="w-4 h-4 mr-1" /> Enregistrer</Button>
              <Button variant="outline" onClick={() => setEditingChapter(null)}><X className="w-4 h-4 mr-1" /> Annuler</Button>
            </div>
          </div>
        )}
      </Card>

      {selectedChapter && (
        <Tabs defaultValue="activite_decouverte" className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            {SUBSECTIONS.map(s => (
              <TabsTrigger key={s.id} value={s.id} className="grow"><s.icon className="w-4 h-4 mr-1" />{s.label}</TabsTrigger>
            ))}
            <TabsTrigger value="multimedia" className="grow"><Clapperboard className="w-4 h-4 mr-1" />Vidéo, Podcast & autres</TabsTrigger>
          </TabsList>

          {SUBSECTIONS.map(s => (
            <TabsContent key={s.id} value={s.id} className="space-y-4">
              <ResourceForm onAdd={(kind, title, url, desc, correction) => addResource(s.id, kind, title, url, desc, correction)} onUpload={uploadFile} uploading={uploading} />
              {resourceList(s.id, true)}
            </TabsContent>
          ))}

          <TabsContent value="multimedia" className="space-y-4">
            <ResourceForm onAdd={(kind, title, url, desc) => addResource('multimedia', kind, title, url, desc, '')} onUpload={uploadFile} uploading={uploading} showCorrection={false} />
            {resourceList('multimedia', false)}
            <SortableList
              items={podcasts}
              getLabel={p => p.title}
              onReorder={reorderPodcasts}
              className="space-y-2"
            >
              {(p, handle, i) => (
                <Card className="p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {handle}
                    <div className="min-w-0 flex-[1_1_12rem]">
                      <p className="font-semibold">{p.title}</p>
                      {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                      {p.duration_seconds && <p className="text-xs text-muted-foreground">{Math.floor(p.duration_seconds / 60)}:{(p.duration_seconds % 60).toString().padStart(2,'0')}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <PublishToggle table="chapter_podcasts" id={p.id} published={(p as any).is_published} onDone={fetchResources} /><MoveButtons index={i} total={podcasts.length} onMove={d => move('chapter_podcasts', podcasts, i, d, fetchResources)} />
                      <Button variant="ghost" size="icon" onClick={() => deletePodcast(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                  <audio controls src={p.audio_url} className="w-full" />
                </Card>
              )}
            </SortableList>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

const detectKind = (name: string) => {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'pdf';
  if (/\.(docx?|odt)$/.test(n)) return 'word';
  if (/\.(pptx?|odp)$/.test(n)) return 'powerpoint';
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(n)) return 'image';
  if (/\.(mp3|m4a|wav|ogg)$/.test(n)) return 'audio';
  if (/\.(mp4|mov|webm)$/.test(n)) return 'video';
  return null;
};

const CorrectionField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onUpload: (f: File) => Promise<string | null>;
  uploading: boolean;
}> = ({ value, onChange, onUpload, uploading }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  return (
    <div className="space-y-2 p-3 rounded-lg border border-dashed border-rainbow-green/50">
      <p className="text-xs font-semibold text-rainbow-green flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Corrigé (optionnel)</p>
      <Input placeholder="URL du corrigé (ou téléverser)" value={value} onChange={e => onChange(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept={FILE_ACCEPT} hidden
          onChange={async e => {
            const f = e.target.files?.[0];
            if (!f) return;
            const u = await onUpload(f);
            if (u) { onChange(u); setFileName(f.name); }
          }} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Téléverser le corrigé
        </Button>
        {fileName && <span className="text-xs text-muted-foreground truncate max-w-[220px]">{fileName}</span>}
        {value && <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(''); setFileName(''); }}>Retirer</Button>}
      </div>
    </div>
  );
};

const ResourceForm: React.FC<{ onAdd: (kind: string, title: string, url: string, desc: string, correction: string) => void; onUpload: (f: File) => Promise<string | null>; uploading: boolean; showCorrection?: boolean }> = ({ onAdd, onUpload, uploading, showCorrection = true }) => {
  const [kind, setKind] = useState('pdf');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [correction, setCorrection] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const handleFile = async (f: File) => {
    const u = await onUpload(f);
    if (u) {
      setUrl(u);
      setFileName(f.name);
      const k = detectKind(f.name);
      if (k) setKind(k);
      if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
    }
  };

  const submit = () => {
    if (!title.trim()) return; // sans titre rien n'est enregistré : on garde le formulaire tel quel
    onAdd(kind, title, url, desc, correction);
    setTitle(''); setUrl(''); setDesc(''); setFileName(''); setCorrection('');
  };

  return (
    <Card className="p-4 space-y-3 bg-muted/30">
      <div className="grid md:grid-cols-2 gap-2">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{KINDS.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Titre" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <Input placeholder="URL (ou téléverser)" value={url} onChange={e => setUrl(e.target.value)} />
      <Textarea placeholder="Description (optionnel)" value={desc} onChange={e => setDesc(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept={FILE_ACCEPT} hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Téléverser un fichier
        </Button>
        {fileName && <span className="text-xs text-muted-foreground truncate max-w-[220px]">{fileName}</span>}
      </div>
      {showCorrection && <CorrectionField value={correction} onChange={setCorrection} onUpload={onUpload} uploading={uploading} />}
      <Button onClick={submit} disabled={uploading || !title.trim()}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
    </Card>
  );
};

const ResourceEditForm: React.FC<{
  resource: Resource;
  onSave: (values: Partial<Resource>) => void;
  onCancel: () => void;
  onUpload: (f: File) => Promise<string | null>;
  uploading: boolean;
  showCorrection?: boolean;
}> = ({ resource, onSave, onCancel, onUpload, uploading, showCorrection = true }) => {
  const [kind, setKind] = useState(resource.kind);
  const [title, setTitle] = useState(resource.title);
  const [url, setUrl] = useState(resource.url || '');
  const [desc, setDesc] = useState(resource.description || '');
  const [correction, setCorrection] = useState(resource.correction_url || '');
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="p-4 space-y-3 border-rainbow-blue/50">
      <div className="grid md:grid-cols-2 gap-2">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{KINDS.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Titre" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <Input placeholder="URL du fichier" value={url} onChange={e => setUrl(e.target.value)} />
      <Textarea placeholder="Description (optionnel)" value={desc} onChange={e => setDesc(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept={FILE_ACCEPT} hidden onChange={async e => {
          const f = e.target.files?.[0];
          if (!f) return;
          const u = await onUpload(f);
          if (u) { setUrl(u); const k = detectKind(f.name); if (k) setKind(k); }
        }} />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Remplacer le fichier
        </Button>
      </div>
      {showCorrection && <CorrectionField value={correction} onChange={setCorrection} onUpload={onUpload} uploading={uploading} />}
      <div className="flex gap-2">
        <Button onClick={() => onSave({ title, kind, url, description: desc, correction_url: correction })} disabled={uploading}>
          <Save className="w-4 h-4 mr-1" /> Enregistrer
        </Button>
        <Button variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-1" /> Annuler</Button>
      </div>
    </Card>
  );
};

export default CoursChapterManager;
