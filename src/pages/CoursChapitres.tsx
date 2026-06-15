import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, FileText, Video, Palette, Headphones, ChevronRight, ExternalLink } from 'lucide-react';

const LEVELS = [
  { id: '6eme', label: '6ème' }, { id: '5eme', label: '5ème' },
  { id: '4eme', label: '4ème' }, { id: '3eme', label: '3ème' },
  { id: 'seconde', label: 'Seconde' }, { id: 'premiere', label: 'Première' },
  { id: 'terminale', label: 'Terminale' },
];

const SECTIONS = [
  { id: 'decouverte', label: 'Activité de découverte' },
  { id: 'cours', label: 'Cours' },
  { id: 'exercices', label: "Exercices d'entraînement" },
  { id: 'accompagnement', label: 'Accompagnement perso.' },
];

interface Chapter { id: string; title: string; description: string | null; level: string; }
interface Resource { id: string; section: string; kind: string; title: string; url: string; description: string | null; }
interface Podcast { id: string; title: string; description: string | null; audio_url: string; duration_seconds: number | null; }

const KindIcon = ({ kind }: { kind: string }) => {
  const Icon = kind === 'pdf' ? FileText : kind === 'video' ? Video : Palette;
  return <Icon className="w-5 h-5 text-rainbow-blue" />;
};

const formatDuration = (s: number | null) => {
  if (!s) return '';
  const m = Math.floor(s / 60); const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, '0')}`;
};

const CoursChapitres = () => {
  const navigate = useNavigate();
  const { level, chapterId } = useParams();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  useEffect(() => {
    if (!level) return;
    (async () => {
      const { data } = await (supabase as any).from('tab_chapters').select('*').eq('level', level).eq('is_published', true).order('display_order');
      setChapters(data || []);
    })();
  }, [level]);

  useEffect(() => {
    if (!chapterId) { setChapter(null); return; }
    (async () => {
      const { data: c } = await (supabase as any).from('tab_chapters').select('*').eq('id', chapterId).maybeSingle();
      setChapter(c);
      const { data: r } = await (supabase as any).from('chapter_resources').select('*').eq('chapter_id', chapterId).order('display_order');
      setResources(r || []);
      const { data: p } = await (supabase as any).from('chapter_podcasts').select('*').eq('chapter_id', chapterId).order('display_order');
      setPodcasts(p || []);
    })();
  }, [chapterId]);

  if (!level) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-display text-center mb-8 flex items-center justify-center gap-2">
            <BookOpen className="w-8 h-8 text-rainbow-blue" /> Cours par niveau
          </h1>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {LEVELS.map(l => (
              <Card key={l.id} onClick={() => navigate(`/cours-chapitres/${l.id}`)} className="cursor-pointer hover:scale-105 transition-all border-2 hover:border-rainbow-blue">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-rainbow-blue" />
                  <h3 className="font-display text-xl">{l.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!chapterId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-4xl">
          <Button variant="outline" onClick={() => navigate('/cours-chapitres')} className="mb-4 rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Tous les niveaux</Button>
          <h1 className="text-3xl font-display mb-6 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-rainbow-blue" /> Chapitres — {LEVELS.find(l => l.id === level)?.label}
          </h1>
          {chapters.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Aucun chapitre publié.</p>
          ) : (
            <div className="space-y-3">
              {chapters.map(c => (
                <Card key={c.id} onClick={() => navigate(`/cours-chapitres/${level}/${c.id}`)} className="cursor-pointer hover:border-rainbow-blue">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg">{c.title}</h3>
                      {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  if (!chapter) {
    return <div className="min-h-screen flex flex-col"><Header /><main className="flex-1 p-12 text-center pt-24">Chargement…</main><Footer /></div>;
  }

  const renderResource = (r: Resource) => {
    if (r.kind === 'canva') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><KindIcon kind={r.kind} /><p className="font-medium">{r.title}</p></div>
          {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
          <div className="w-full aspect-video rounded-xl overflow-hidden border"><iframe src={r.url} className="w-full h-full" allowFullScreen loading="lazy" title={r.title} /></div>
        </div>
      );
    }
    if (r.kind === 'video') {
      // Try YouTube embed
      const isYT = /youtube\.com|youtu\.be/.test(r.url);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><KindIcon kind={r.kind} /><p className="font-medium">{r.title}</p></div>
          {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
          {isYT ? (
            <div className="w-full aspect-video rounded-xl overflow-hidden border"><iframe src={r.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full" allowFullScreen title={r.title} /></div>
          ) : (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-rainbow-blue hover:underline inline-flex items-center gap-1">Ouvrir la vidéo <ExternalLink className="w-3 h-3" /></a>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
        <KindIcon kind={r.kind} />
        <div className="flex-1 min-w-0">
          <p className="font-medium">{r.title}</p>
          {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-rainbow-blue hover:underline inline-flex items-center gap-1 mt-1">Télécharger / Ouvrir <ExternalLink className="w-3 h-3" /></a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-5xl">
        <Button variant="outline" onClick={() => navigate(`/cours-chapitres/${level}`)} className="mb-4 rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Chapitres</Button>
        <h1 className="text-3xl font-display mb-6">{chapter.title}</h1>
        {chapter.description && <p className="text-muted-foreground mb-6">{chapter.description}</p>}

        <Tabs defaultValue="decouverte">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
            {SECTIONS.map(s => <TabsTrigger key={s.id} value={s.id} className="text-xs whitespace-normal">{s.label}</TabsTrigger>)}
            <TabsTrigger value="podcast" className="text-xs">Podcast</TabsTrigger>
          </TabsList>
          {SECTIONS.map(s => (
            <TabsContent key={s.id} value={s.id} className="space-y-4 mt-4">
              {resources.filter(r => r.section === s.id).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucune ressource.</p>
              ) : resources.filter(r => r.section === s.id).map(r => <div key={r.id}>{renderResource(r)}</div>)}
            </TabsContent>
          ))}
          <TabsContent value="podcast" className="space-y-4 mt-4">
            {podcasts.length === 0 ? <p className="text-sm text-muted-foreground italic">Aucun podcast.</p> : podcasts.map(p => (
              <Card key={p.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-rainbow-blue" />
                    <p className="font-display flex-1">{p.title}</p>
                    {p.duration_seconds && <span className="text-xs text-muted-foreground">{formatDuration(p.duration_seconds)}</span>}
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  <audio controls src={p.audio_url} className="w-full" />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default CoursChapitres;
