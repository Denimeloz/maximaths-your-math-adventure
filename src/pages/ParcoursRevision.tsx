import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { levelLabel } from '@/lib/levels';
import { Route, ArrowLeft, FileText, Video, Mic, Link as LinkIcon, ExternalLink, Download, Image as ImageIcon, FileType, Presentation, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Réactiver les connaissances' },
  { id: 2, label: 'Revoir les notions essentielles' },
  { id: 3, label: "S'entraîner" },
  { id: 4, label: 'Vérifier ses acquis' },
  { id: 5, label: "S'autoévaluer" },
];


const ICONS: Record<string, any> = { pdf: FileText, word: FileType, powerpoint: Presentation, image: ImageIcon, audio: Mic, podcast: Mic, video: Video, canva: ExternalLink, link: LinkIcon, lesson: FileText };
const FILE_KINDS = ['pdf', 'word', 'powerpoint', 'image', 'audio', 'podcast'];
// La progression est gardée dans le navigateur de l'élève (aucun compte, rien en base)
const progressKey = (yearId: string, level: string) => `maximaths:parcours:${yearId}:${level}`;

const readProgress = (yearId: string | null, level: string | null): Set<number> => {
  if (!yearId || !level) return new Set();
  try {
    const raw = localStorage.getItem(progressKey(yearId, level));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((n: unknown) => typeof n === 'number') : []);
  } catch {
    return new Set();
  }
};

const writeProgress = (yearId: string | null, level: string | null, steps: Set<number>) => {
  if (!yearId || !level) return;
  try {
    localStorage.setItem(progressKey(yearId, level), JSON.stringify([...steps]));
  } catch {
    // Stockage indisponible (navigation privée…) : la progression reste valable pour la visite en cours
  }
};

const isFileResource = (kind: string, url: string | null) => FILE_KINDS.includes(kind) || /\.(pdf|docx?|pptx?|png|jpe?g|gif|webp|mp3|m4a|wav)(\?|$)/i.test(url || '');

interface Year { id: string; label: string; start_year: number; is_active: boolean; }
interface YearClass { academic_year_id: string; class_level: string; }
interface Resource { id: string; step: number; kind: string; title: string; description: string | null; url: string | null; correction_url: string | null; }

const ParcoursRevision = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<YearClass[]>([]);
  const [yearsLoaded, setYearsLoaded] = useState(false);
  const [items, setItems] = useState<Resource[]>([]);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const yearId = params.get('year');
  const level = params.get('level');

  useEffect(() => {
    (async () => {
      const [{ data: y }, { data: c }] = await Promise.all([
        (supabase as any).from('academic_years').select('*').gte('start_year', 2026).order('start_year', { ascending: false }),
        (supabase as any).from('year_classes').select('*'),
      ]);
      setYears(y || []);
      setClasses(c || []);
      // Année absente de l'adresse : on prend l'année en cours (sinon la plus récente) sans perdre la classe
      if (!yearId && y?.length) {
        const fallback = (y.find((item: Year) => item.is_active) || y[0]).id;
        setParams(level ? { year: fallback, level } : { year: fallback }, { replace: true });
      }
      setYearsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!yearId || !level) { setItems([]); return; }
    (async () => {
      const { data } = await (supabase as any).from('revision_path_resources')
        .select('*').eq('academic_year_id', yearId).eq('level', level).eq('is_published', true)
        .order('step').order('display_order');
      setItems(data || []);
    })();
  }, [yearId, level]);

  // Chaque classe a sa propre progression : on recharge celle de la classe affichée
  useEffect(() => {
    setCompleted(readProgress(yearId, level));
  }, [yearId, level]);

  const yClasses = classes.filter(c => c.academic_year_id === yearId);
  const stepsWithContent = useMemo(() => new Set(items.map(i => i.step)), [items]);
  const totalSteps = stepsWithContent.size || 5;
  const doneCount = [...completed].filter(id => stepsWithContent.size === 0 || stepsWithContent.has(id)).length;
  const progress = Math.min(100, Math.round((doneCount / totalSteps) * 100));

  const toggleStep = (id: number) => setCompleted(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeProgress(yearId, level, next);
    return next;
  });

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" /> Accueil</Button>
        <div className="flex items-center gap-3 mb-2">
          <Route className="w-8 h-8 text-rainbow-purple" />
          <h1 className="text-3xl font-display text-foreground">Parcours de révision</h1>
        </div>
        <p className="text-muted-foreground mb-6">Avance étape par étape pour réviser sereinement.</p>

        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={yearId || ''} onValueChange={v => setParams({ year: v, ...(level ? { level } : {}) })}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={level || ''} onValueChange={v => setParams({ year: yearId || '', level: v })}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>{yClasses.map(c => <SelectItem key={c.class_level} value={c.class_level}>{levelLabel(c.class_level)}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {level && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-body text-muted-foreground">Progression</span>
              <span className="text-sm font-display text-rainbow-purple">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        )}

        {yearsLoaded && years.length === 0 && (
          <p className="text-muted-foreground italic">Les parcours de révision seront disponibles à partir de l'année 2026-2027.</p>
        )}
        {years.length > 0 && !level && <p className="text-muted-foreground italic">Choisis une classe pour démarrer ton parcours.</p>}

        <div className="space-y-6">
          {level && STEPS.map(step => {
            const stepItems = items.filter(i => i.step === step.id);
            const isDone = completed.has(step.id);
            return (
              <div key={step.id} className={`card-sticker bg-card border-2 p-5 ${isDone ? 'border-rainbow-green' : 'border-rainbow-purple/30'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-display ${isDone ? 'bg-rainbow-green text-white' : 'bg-rainbow-purple/20 text-rainbow-purple'}`}>{step.id}</div>
                    <h3 className="font-display text-lg">{step.label}</h3>
                  </div>
                  {stepItems.length > 0 && (
                    <Button size="sm" variant={isDone ? 'outline' : 'default'} onClick={() => toggleStep(step.id)}>
                      {isDone ? 'À refaire' : 'Marquer comme fait'}
                    </Button>
                  )}
                </div>
                <div className="space-y-2 sm:pl-[3.25rem]">
                  {stepItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Aucune ressource.</p>
                  ) : stepItems.map(r => {
                    const Icon = ICONS[r.kind] || LinkIcon;
                    const isFile = isFileResource(r.kind, r.url);
                    return (
                      <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition">
                        <Icon className="w-5 h-5 text-rainbow-purple mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {r.url ? (
                            <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-sm hover:underline">{r.title}</a>
                          ) : (
                            <span className="font-semibold text-sm">{r.title}</span>
                          )}
                          {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            {isFile && r.url && (
                              <a href={r.url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-rainbow-purple hover:underline">
                                <Download className="w-3 h-3" /> Télécharger le fichier
                              </a>
                            )}
                            {r.correction_url && (
                              <a href={r.correction_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-rainbow-green hover:underline">
                                <CheckCircle2 className="w-3 h-3" /> Voir le corrigé
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ParcoursRevision;
