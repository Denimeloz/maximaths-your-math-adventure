import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Route, FileText, Video, Headphones, Link as LinkIcon, Palette, ExternalLink } from 'lucide-react';

const LEVELS = [
  { id: '6eme', label: '6ème', color: 'rainbow-blue' },
  { id: '5eme', label: '5ème', color: 'rainbow-green' },
  { id: '4eme', label: '4ème', color: 'rainbow-orange' },
  { id: '3eme', label: '3ème', color: 'rainbow-coral' },
  { id: 'seconde', label: 'Seconde', color: 'rainbow-pink' },
  { id: 'premiere', label: 'Première', color: 'rainbow-purple' },
  { id: 'terminale', label: 'Terminale', color: 'rainbow-yellow' },
];

const STEPS = [
  { n: 1, label: 'Réactiver les connaissances' },
  { n: 2, label: 'Revoir les notions essentielles' },
  { n: 3, label: "S'entraîner" },
  { n: 4, label: 'Vérifier ses acquis' },
  { n: 5, label: "S'autoévaluer" },
];

const KIND_ICONS: Record<string, any> = { pdf: FileText, video: Video, podcast: Headphones, link: LinkIcon, canva: Palette };

interface Item { id: string; level: string; step: number; kind: string; title: string; description: string | null; url: string; }

const ParcoursRevision = () => {
  const navigate = useNavigate();
  const { level } = useParams();
  const [items, setItems] = useState<Item[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    if (!level) return {};
    try { return JSON.parse(localStorage.getItem(`pr_done_${level}`) || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    if (!level) return;
    (async () => {
      const { data } = await (supabase as any).from('revision_path_resources').select('*').eq('level', level).order('step').order('display_order');
      setItems(data || []);
    })();
  }, [level]);

  useEffect(() => {
    if (level) localStorage.setItem(`pr_done_${level}`, JSON.stringify(done));
  }, [done, level]);

  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    const checked = items.filter(i => done[i.id]).length;
    return Math.round((checked / items.length) * 100);
  }, [items, done]);

  if (!level) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-display mb-2 flex items-center justify-center gap-2">
              <Route className="w-8 h-8 text-rainbow-blue" /> Parcours de révision
            </h1>
            <p className="text-muted-foreground">Choisis ton niveau pour démarrer ton parcours en 5 étapes</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {LEVELS.map(l => (
              <Card key={l.id} onClick={() => navigate(`/parcours-revision/${l.id}`)} className={`cursor-pointer hover:scale-105 transition-all border-2 hover:border-${l.color}`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-full bg-${l.color}/20 flex items-center justify-center`}>
                    <Route className={`w-7 h-7 text-${l.color}`} />
                  </div>
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

  const lvl = LEVELS.find(l => l.id === level);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <Button variant="outline" onClick={() => navigate('/parcours-revision')} className="mb-4 rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Tous les niveaux
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-display mb-2 flex items-center gap-2">
            <Route className="w-7 h-7 text-rainbow-blue" /> Parcours de révision — {lvl?.label}
          </h1>
        </div>

        <div className="sticky top-20 z-30 bg-card/95 backdrop-blur p-4 rounded-xl border mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Ta progression</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aucune ressource pour ce parcours.</p>
        ) : (
          <Accordion type="multiple" defaultValue={['1']} className="space-y-2">
            {STEPS.map(s => {
              const stepItems = items.filter(i => i.step === s.n);
              const stepDone = stepItems.filter(i => done[i.id]).length;
              return (
                <AccordionItem key={s.n} value={String(s.n)} className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="w-8 h-8 rounded-full bg-rainbow-blue text-white flex items-center justify-center font-bold shrink-0">{s.n}</span>
                      <div>
                        <p className="font-display">{s.label}</p>
                        <p className="text-xs text-muted-foreground font-normal">{stepDone}/{stepItems.length} terminé{stepDone > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    {stepItems.length === 0 ? <p className="text-sm text-muted-foreground italic">Aucune ressource pour cette étape.</p> : stepItems.map(i => {
                      const Icon = KIND_ICONS[i.kind] || FileText;
                      return (
                        <div key={i.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <Checkbox checked={!!done[i.id]} onCheckedChange={(v) => setDone(prev => ({ ...prev, [i.id]: !!v }))} className="mt-1" />
                          <Icon className="w-5 h-5 text-rainbow-blue shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{i.title}</p>
                            {i.description && <p className="text-xs text-muted-foreground">{i.description}</p>}
                            {i.kind === 'podcast' ? (
                              <audio controls src={i.url} className="w-full mt-2" />
                            ) : (
                              <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-xs text-rainbow-blue hover:underline inline-flex items-center gap-1 mt-1">
                                Ouvrir <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ParcoursRevision;
