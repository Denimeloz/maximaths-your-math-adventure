import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Lightbulb, Dumbbell, HeartHandshake, Mic, FileText, Video, ExternalLink, Link as LinkIcon } from 'lucide-react';

interface Chapter { id: string; title: string; description: string | null; display_order: number; }
interface Resource { id: string; chapter_id: string; section: string; kind: string; title: string; url: string | null; description: string | null; }
interface Podcast { id: string; chapter_id: string; title: string; description: string | null; audio_url: string; duration_seconds: number | null; }

const SECTIONS = [
  { id: 'activite_decouverte', label: 'Activité de découverte', icon: Lightbulb },
  { id: 'cours', label: 'Cours', icon: BookOpen },
  { id: 'exercices_entrainement', label: "Exercices d'entraînement", icon: Dumbbell },
  { id: 'accompagnement_personnalise', label: 'Accompagnement personnalisé', icon: HeartHandshake },
];

const ICONS: Record<string, any> = { pdf: FileText, video: Video, canva: ExternalLink, link: LinkIcon, lesson: BookOpen };

interface Props { level: string; academicYearId: string; }

export const CoursChapterView: React.FC<Props> = ({ level, academicYearId }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  useEffect(() => {
    (async () => {
      const { data: chs } = await (supabase as any).from('tab_chapters')
        .select('*').eq('level', level).eq('academic_year_id', academicYearId)
        .eq('is_published', true).order('display_order');
      setChapters(chs || []);
      const ids = (chs || []).map((c: Chapter) => c.id);
      if (ids.length === 0) return;
      const [{ data: r }, { data: p }] = await Promise.all([
        (supabase as any).from('chapter_resources').select('*').in('chapter_id', ids).order('display_order'),
        (supabase as any).from('chapter_podcasts').select('*').in('chapter_id', ids).order('display_order'),
      ]);
      setResources(r || []);
      setPodcasts(p || []);
    })();
  }, [level, academicYearId]);

  if (chapters.length === 0) {
    return <p className="text-center text-muted-foreground italic py-12">Aucun chapitre publié pour cette classe.</p>;
  }

  return (
    <Accordion type="single" collapsible className="space-y-4">
      {chapters.map(ch => {
        const chResources = resources.filter(r => r.chapter_id === ch.id);
        const chPodcasts = podcasts.filter(p => p.chapter_id === ch.id);
        return (
          <AccordionItem key={ch.id} value={ch.id} className="card-sticker bg-card border-rainbow-blue/30 px-4">
            <AccordionTrigger className="font-display text-lg hover:no-underline">
              <div className="text-left">
                <div>{ch.title}</div>
                {ch.description && <p className="text-xs font-body text-muted-foreground font-normal">{ch.description}</p>}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Tabs defaultValue="cours">
                <TabsList className="flex flex-wrap h-auto">
                  {SECTIONS.map(s => (
                    <TabsTrigger key={s.id} value={s.id}><s.icon className="w-4 h-4 mr-1" />{s.label}</TabsTrigger>
                  ))}
                  <TabsTrigger value="podcast"><Mic className="w-4 h-4 mr-1" />Podcast</TabsTrigger>
                </TabsList>
                {SECTIONS.map(s => {
                  const items = chResources.filter(r => r.section === s.id);
                  return (
                    <TabsContent key={s.id} value={s.id} className="space-y-2">
                      {items.length === 0 ? (
                        <p className="text-sm italic text-muted-foreground">Aucune ressource.</p>
                      ) : items.map(r => {
                        const Icon = ICONS[r.kind] || LinkIcon;
                        return (
                          <a key={r.id} href={r.url || '#'} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition">
                            <Icon className="w-5 h-5 text-rainbow-blue mt-0.5" />
                            <div>
                              <p className="font-semibold text-sm">{r.title}</p>
                              {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                            </div>
                          </a>
                        );
                      })}
                    </TabsContent>
                  );
                })}
                <TabsContent value="podcast" className="space-y-3">
                  {chPodcasts.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">Aucun podcast.</p>
                  ) : chPodcasts.map(p => (
                    <Card key={p.id} className="p-3">
                      <p className="font-semibold">{p.title}</p>
                      {p.description && <p className="text-xs text-muted-foreground mb-2">{p.description}</p>}
                      <audio controls src={p.audio_url} className="w-full" />
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default CoursChapterView;
