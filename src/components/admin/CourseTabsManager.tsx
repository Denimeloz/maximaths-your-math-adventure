import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, X, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';
import { useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

export const TAB_SECTIONS = [
  { id: 'decouverte', label: 'Activité de découverte' },
  { id: 'cours', label: 'Cours' },
  { id: 'exercices', label: "Exercices d'entraînement" },
  { id: 'accompagnement', label: 'Accompagnement personnalisé' },
] as const;

export const RESOURCE_KINDS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'video', label: 'Vidéo (URL YouTube ou autre)' },
  { id: 'canva', label: 'Canva (URL d\'intégration)' },
];

interface Chapter { id: string; title: string; description: string | null; display_order: number; is_published: boolean; }
interface Resource { id: string; chapter_id: string; section: string; kind: string; title: string; url: string; description: string | null; display_order: number; }
interface Podcast { id: string; chapter_id: string; title: string; description: string | null; audio_url: string; duration_seconds: number | null; display_order: number; }

interface Props { selectedLevel: Level }

export const CourseTabsManager: React.FC<Props> = ({ selectedLevel }) => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  // chapter form
  const [chapForm, setChapForm] = useState({ open: false, editing: null as Chapter | null, title: '', description: '' });
  // resource form
  const [resForm, setResForm] = useState({ open: false, editing: null as Resource | null, section: 'decouverte', kind: 'pdf', title: '', url: '', description: '' });
  // podcast form
  const [podForm, setPodForm] = useState({ open: false, editing: null as Podcast | null, title: '', description: '', audio_url: '', duration_seconds: '' });

  useEffect(() => { fetchChapters(); setActiveChapter(null); }, [selectedLevel, academicYearId]);
  useEffect(() => { if (activeChapter) { fetchResources(); fetchPodcasts(); } }, [activeChapter]);

  const fetchChapters = async () => {
    let q = (supabase as any).from('tab_chapters').select('*').eq('level', selectedLevel).order('display_order');
    if (academicYearId) q = q.eq('academic_year_id', academicYearId);
    const { data } = await q;
    setChapters(data || []);
  };
  const fetchResources = async () => {
    if (!activeChapter) return;
    const { data } = await (supabase as any).from('chapter_resources').select('*').eq('chapter_id', activeChapter.id).order('display_order');
    setResources(data || []);
  };
  const fetchPodcasts = async () => {
    if (!activeChapter) return;
    const { data } = await (supabase as any).from('chapter_podcasts').select('*').eq('chapter_id', activeChapter.id).order('display_order');
    setPodcasts(data || []);
  };

  // Chapter CRUD
  const saveChapter = async () => {
    if (!chapForm.title.trim()) return toast({ title: 'Titre requis', variant: 'destructive' });
    const payload: any = { title: chapForm.title, description: chapForm.description || null, level: selectedLevel, academic_year_id: academicYearId };
    if (chapForm.editing) {
      await (supabase as any).from('tab_chapters').update(payload).eq('id', chapForm.editing.id);
    } else {
      await (supabase as any).from('tab_chapters').insert({ ...payload, display_order: chapters.length });
    }
    setChapForm({ open: false, editing: null, title: '', description: '' });
    fetchChapters();
  };
  const deleteChapter = async (id: string) => {
    if (!confirm('Supprimer ce chapitre et toutes ses ressources ?')) return;
    await (supabase as any).from('tab_chapters').delete().eq('id', id);
    if (activeChapter?.id === id) setActiveChapter(null);
    fetchChapters();
  };

  // Resource CRUD
  const saveResource = async () => {
    if (!resForm.title.trim() || !resForm.url.trim()) return toast({ title: 'Titre et URL requis', variant: 'destructive' });
    const payload: any = {
      chapter_id: activeChapter!.id, section: resForm.section, kind: resForm.kind,
      title: resForm.title, url: resForm.url, description: resForm.description || null,
    };
    if (resForm.editing) {
      await (supabase as any).from('chapter_resources').update(payload).eq('id', resForm.editing.id);
    } else {
      await (supabase as any).from('chapter_resources').insert({ ...payload, display_order: resources.filter(r => r.section === resForm.section).length });
    }
    setResForm({ open: false, editing: null, section: 'decouverte', kind: 'pdf', title: '', url: '', description: '' });
    fetchResources();
  };
  const deleteResource = async (id: string) => {
    if (!confirm('Supprimer ?')) return;
    await (supabase as any).from('chapter_resources').delete().eq('id', id);
    fetchResources();
  };

  // Podcast CRUD
  const savePodcast = async () => {
    if (!podForm.title.trim() || !podForm.audio_url.trim()) return toast({ title: 'Titre et URL audio requis', variant: 'destructive' });
    const payload: any = {
      chapter_id: activeChapter!.id, title: podForm.title,
      description: podForm.description || null, audio_url: podForm.audio_url,
      duration_seconds: podForm.duration_seconds ? Number(podForm.duration_seconds) : null,
    };
    if (podForm.editing) {
      await (supabase as any).from('chapter_podcasts').update(payload).eq('id', podForm.editing.id);
    } else {
      await (supabase as any).from('chapter_podcasts').insert({ ...payload, display_order: podcasts.length });
    }
    setPodForm({ open: false, editing: null, title: '', description: '', audio_url: '', duration_seconds: '' });
    fetchPodcasts();
  };
  const deletePodcast = async (id: string) => {
    if (!confirm('Supprimer ?')) return;
    await (supabase as any).from('chapter_podcasts').delete().eq('id', id);
    fetchPodcasts();
  };

  if (!activeChapter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-rainbow-blue" /> Chapitres détaillés (5 onglets)
          </h2>
          <Button onClick={() => setChapForm({ open: true, editing: null, title: '', description: '' })} className="btn-3d bg-primary rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Nouveau chapitre
          </Button>
        </div>

        {chapForm.open && (
          <Card className="border-rainbow-blue/30">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-display">{chapForm.editing ? 'Modifier' : 'Nouveau chapitre'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setChapForm({ open: false, editing: null, title: '', description: '' })}><X className="w-5 h-5" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Titre *</Label><Input value={chapForm.title} onChange={e => setChapForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl mt-1" /></div>
              <div><Label>Description</Label><Textarea value={chapForm.description} onChange={e => setChapForm(p => ({ ...p, description: e.target.value }))} rows={2} className="rounded-xl mt-1" /></div>
              <Button onClick={saveChapter} className="btn-3d bg-primary rounded-xl">{chapForm.editing ? 'Enregistrer' : 'Créer'}</Button>
            </CardContent>
          </Card>
        )}

        {chapters.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Aucun chapitre.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {chapters.map(c => (
              <Card key={c.id} className="cursor-pointer hover:border-rainbow-blue/50" onClick={() => setActiveChapter(c)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display">{c.title}</h3>
                    {c.description && <p className="text-sm text-muted-foreground line-clamp-1">{c.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setChapForm({ open: true, editing: c, title: c.title, description: c.description || '' }); }}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteChapter(c.id); }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Chapter detail with 5 tabs
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setActiveChapter(null)} className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-1" /> Retour</Button>
        <h2 className="text-2xl font-display">{activeChapter.title}</h2>
      </div>

      <Tabs defaultValue="decouverte" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
          {TAB_SECTIONS.map(s => <TabsTrigger key={s.id} value={s.id} className="text-xs">{s.label}</TabsTrigger>)}
          <TabsTrigger value="podcast" className="text-xs">Podcast</TabsTrigger>
        </TabsList>

        {TAB_SECTIONS.map(s => (
          <TabsContent key={s.id} value={s.id} className="space-y-3 mt-4">
            <Button size="sm" onClick={() => setResForm({ open: true, editing: null, section: s.id, kind: 'pdf', title: '', url: '', description: '' })} className="bg-primary rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
            {resForm.open && resForm.section === s.id && (
              <Card className="border-rainbow-blue/30">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Type</Label>
                      <Select value={resForm.kind} onValueChange={v => setResForm(p => ({ ...p, kind: v }))}>
                        <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{RESOURCE_KINDS.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Titre *</Label><Input value={resForm.title} onChange={e => setResForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>URL *</Label><Input value={resForm.url} onChange={e => setResForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." className="rounded-xl mt-1" /></div>
                  <div><Label>Description</Label><Textarea value={resForm.description} onChange={e => setResForm(p => ({ ...p, description: e.target.value }))} rows={2} className="rounded-xl mt-1" /></div>
                  <div className="flex gap-2"><Button onClick={saveResource} className="bg-primary rounded-xl">Enregistrer</Button><Button variant="outline" onClick={() => setResForm({ open: false, editing: null, section: 'decouverte', kind: 'pdf', title: '', url: '', description: '' })} className="rounded-xl">Annuler</Button></div>
                </CardContent>
              </Card>
            )}
            {resources.filter(r => r.section === s.id).map(r => (
              <Card key={r.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-rainbow-blue/20 text-rainbow-blue font-semibold uppercase">{r.kind}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.title}</p>
                    {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setResForm({ open: true, editing: r, section: r.section, kind: r.kind, title: r.title, url: r.url, description: r.description || '' })}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteResource(r.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}

        <TabsContent value="podcast" className="space-y-3 mt-4">
          <Button size="sm" onClick={() => setPodForm({ open: true, editing: null, title: '', description: '', audio_url: '', duration_seconds: '' })} className="bg-primary rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Ajouter un podcast
          </Button>
          {podForm.open && (
            <Card className="border-rainbow-blue/30">
              <CardContent className="p-4 space-y-3">
                <div><Label>Titre *</Label><Input value={podForm.title} onChange={e => setPodForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl mt-1" /></div>
                <div><Label>URL audio (mp3) *</Label><Input value={podForm.audio_url} onChange={e => setPodForm(p => ({ ...p, audio_url: e.target.value }))} placeholder="https://.../episode.mp3" className="rounded-xl mt-1" /></div>
                <div><Label>Durée (en secondes)</Label><Input type="number" value={podForm.duration_seconds} onChange={e => setPodForm(p => ({ ...p, duration_seconds: e.target.value }))} className="rounded-xl mt-1" /></div>
                <div><Label>Description</Label><Textarea value={podForm.description} onChange={e => setPodForm(p => ({ ...p, description: e.target.value }))} rows={2} className="rounded-xl mt-1" /></div>
                <div className="flex gap-2"><Button onClick={savePodcast} className="bg-primary rounded-xl">Enregistrer</Button><Button variant="outline" onClick={() => setPodForm({ open: false, editing: null, title: '', description: '', audio_url: '', duration_seconds: '' })} className="rounded-xl">Annuler</Button></div>
              </CardContent>
            </Card>
          )}
          {podcasts.map(p => (
            <Card key={p.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{p.title}</p>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setPodForm({ open: true, editing: p, title: p.title, description: p.description || '', audio_url: p.audio_url, duration_seconds: p.duration_seconds?.toString() || '' })}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deletePodcast(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
                <audio controls src={p.audio_url} className="w-full" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseTabsManager;
