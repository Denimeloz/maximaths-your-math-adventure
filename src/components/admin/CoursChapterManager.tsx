import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, Loader2, BookOpen, Lightbulb, Dumbbell, HeartHandshake, Mic } from 'lucide-react';
import { useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface Chapter { id: string; title: string; description: string | null; display_order: number; }
interface Resource { id: string; chapter_id: string; section: string; kind: string; title: string; url: string | null; description: string | null; display_order: number; }
interface Podcast { id: string; chapter_id: string; title: string; description: string | null; audio_url: string; duration_seconds: number | null; display_order: number; }

const SUBSECTIONS = [
  { id: 'activite_decouverte', label: 'Activité de découverte', icon: Lightbulb },
    { id: 'cours', label: 'Cours', icon: BookOpen },
  { id: 'exercices_entrainement', label: "Exercices d'entraînement", icon: Dumbbell },
  { id: 'accompagnement_personnalise', label: 'Accompagnement personnalisé', icon: HeartHandshake },
] as const;

const KINDS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'video', label: 'Vidéo' },
  { id: 'canva', label: 'Canva' },
  { id: 'link', label: 'Lien externe' },
  { id: 'lesson', label: 'Leçon' },
];

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
  const podcastFileRef = useRef<HTMLInputElement>(null);
  const resourceFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchChapters(); }, [selectedLevel, academicYearId]);
  useEffect(() => { if (selectedChapter) fetchResources(); }, [selectedChapter]);

  const fetchChapters = async () => {
    if (!academicYearId) return;
    const { data } = await (supabase as any).from('tab_chapters').select('*')
      .eq('level', selectedLevel).eq('academic_year_id', academicYearId)
      .order('display_order');
    setChapters(data || []);
    if (data?.length && !selectedChapter) setSelectedChapter(data[0].id);
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

  const deleteChapter = async (id: string) => {
    if (!confirm('Supprimer ce chapitre et toutes ses ressources ?')) return;
    await (supabase as any).from('tab_chapters').delete().eq('id', id);
    setSelectedChapter(null);
    fetchChapters();
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const path = `chapters/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('course-files').upload(path, file);
      if (error) throw error;
      return supabase.storage.from('course-files').getPublicUrl(path).data.publicUrl;
    } catch (e: any) {
      toast({ title: 'Upload échoué', description: e.message, variant: 'destructive' });
      return null;
    } finally { setUploading(false); }
  };

  const addResource = async (section: string, kind: string, title: string, url: string, description: string) => {
    if (!selectedChapter || !title.trim()) return;
    const { error } = await (supabase as any).from('chapter_resources').insert({
      chapter_id: selectedChapter, section, kind, title, url: url || null,
      description: description || null,
      display_order: resources.filter(r => r.section === section).length,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ajouté' }); fetchResources(); }
  };

  const deleteResource = async (id: string) => {
    await (supabase as any).from('chapter_resources').delete().eq('id', id);
    fetchResources();
  };

  const addPodcast = async (title: string, audio_url: string, duration: number, description: string) => {
    if (!selectedChapter || !title.trim() || !audio_url.trim()) return;
    const { error } = await (supabase as any).from('chapter_podcasts').insert({
      chapter_id: selectedChapter, title, audio_url, duration_seconds: duration || null,
      description: description || null, display_order: podcasts.length,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Podcast ajouté' }); fetchResources(); }
  };

  const deletePodcast = async (id: string) => {
    await (supabase as any).from('chapter_podcasts').delete().eq('id', id);
    fetchResources();
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
        <div className="flex flex-wrap gap-2">
          {chapters.map(c => (
            <div key={c.id} className="flex items-center gap-1">
              <Button variant={selectedChapter === c.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedChapter(c.id)}>{c.title}</Button>
              <Button variant="ghost" size="icon" onClick={() => deleteChapter(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
          {chapters.length === 0 && <p className="text-sm text-muted-foreground">Aucun chapitre pour cette classe et cette année.</p>}
        </div>
      </Card>

      {selectedChapter && (
        <Tabs defaultValue="activite_decouverte" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            {SUBSECTIONS.map(s => (
              <TabsTrigger key={s.id} value={s.id}><s.icon className="w-4 h-4 mr-1" />{s.label}</TabsTrigger>
            ))}
            <TabsTrigger value="podcast"><Mic className="w-4 h-4 mr-1" />Podcast</TabsTrigger>
          </TabsList>

          {SUBSECTIONS.map(s => (
            <TabsContent key={s.id} value={s.id} className="space-y-4">
              <ResourceForm onAdd={(kind, title, url, desc) => addResource(s.id, kind, title, url, desc)} onUpload={uploadFile} uploading={uploading} />
              <div className="space-y-2">
                {resources.filter(r => r.section === s.id).map(r => (
                  <Card key={r.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{r.title} <span className="text-xs text-muted-foreground">({r.kind})</span></p>
                      {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                      {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-rainbow-blue underline">Voir</a>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteResource(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="podcast" className="space-y-4">
            <PodcastForm onAdd={addPodcast} onUpload={uploadFile} uploading={uploading} />
            <div className="space-y-2">
              {podcasts.map(p => (
                <Card key={p.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{p.title}</p>
                      {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                      {p.duration_seconds && <p className="text-xs text-muted-foreground">{Math.floor(p.duration_seconds / 60)}:{(p.duration_seconds % 60).toString().padStart(2,'0')}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deletePodcast(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                  <audio controls src={p.audio_url} className="w-full" />
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

const ResourceForm: React.FC<{ onAdd: (kind: string, title: string, url: string, desc: string) => void; onUpload: (f: File) => Promise<string | null>; uploading: boolean }> = ({ onAdd, onUpload, uploading }) => {
  const [kind, setKind] = useState('pdf');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    const u = await onUpload(f);
    if (u) setUrl(u);
  };

  const submit = () => {
    onAdd(kind, title, url, desc);
    setTitle(''); setUrl(''); setDesc('');
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
      <div className="flex gap-2">
        <input ref={fileRef} type="file" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Téléverser
        </Button>
        <Button onClick={submit}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
      </div>
    </Card>
  );
};

const PodcastForm: React.FC<{ onAdd: (title: string, audio: string, dur: number, desc: string) => void; onUpload: (f: File) => Promise<string | null>; uploading: boolean }> = ({ onAdd, onUpload, uploading }) => {
  const [title, setTitle] = useState('');
  const [audio, setAudio] = useState('');
  const [dur, setDur] = useState(0);
  const [desc, setDesc] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    const u = await onUpload(f);
    if (u) setAudio(u);
  };

  return (
    <Card className="p-4 space-y-3 bg-muted/30">
      <Input placeholder="Titre du podcast" value={title} onChange={e => setTitle(e.target.value)} />
      <Input placeholder="URL audio (MP3) ou téléverser" value={audio} onChange={e => setAudio(e.target.value)} />
      <Input type="number" placeholder="Durée (secondes)" value={dur || ''} onChange={e => setDur(parseInt(e.target.value) || 0)} />
      <Textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Téléverser audio
        </Button>
        <Button onClick={() => { onAdd(title, audio, dur, desc); setTitle(''); setAudio(''); setDur(0); setDesc(''); }}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
      </div>
    </Card>
  );
};

export default CoursChapterManager;
