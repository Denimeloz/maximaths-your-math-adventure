import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Route, ArrowLeft, FileText, Video, Mic, Link as LinkIcon, ExternalLink } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Réactiver les connaissances' },
  { id: 2, label: 'Revoir les notions essentielles' },
  { id: 3, label: "S'entraîner" },
  { id: 4, label: 'Vérifier ses acquis' },
  { id: 5, label: "S'autoévaluer" },
];

const LEVEL_LABELS: Record<string, string> = {
  '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
  'seconde': 'Seconde', 'premiere': 'Première', 'terminale': 'Terminale',
};

const ICONS: Record<string, any> = { pdf: FileText, video: Video, podcast: Mic, canva: ExternalLink, link: LinkIcon };

interface Year { id: string; label: string; start_year: number; }
interface YearClass { academic_year_id: string; class_level: string; }
interface Resource { id: string; step: number; kind: string; title: string; description: string | null; url: string | null; }

const ParcoursRevision = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<YearClass[]>([]);
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
      if (!yearId && y?.length) setParams({ year: y[0].id });
    })();
  }, []);

  useEffect(() => {
    if (!yearId || !level) { setItems([]); return; }
    (async () => {
      const { data } = await (supabase as any).from('revision_path_resources')
        .select('*').eq('academic_year_id', yearId).eq('level', level)
        .order('step').order('display_order');
      setItems(data || []);
    })();
  }, [yearId, level]);

  const yClasses = classes.filter(c => c.academic_year_id === yearId);
  const stepsWithContent = useMemo(() => new Set(items.map(i => i.step)), [items]);
  const totalSteps = stepsWithContent.size || 5;
  const progress = Math.round((completed.size / totalSteps) * 100);

  const toggleStep = (id: number) => setCompleted(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
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
            <SelectContent>{yClasses.map(c => <SelectItem key={c.class_level} value={c.class_level}>{LEVEL_LABELS[c.class_level] || c.class_level}</SelectItem>)}</SelectContent>
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

        {!level && <p className="text-muted-foreground italic">Choisis une classe pour démarrer ton parcours.</p>}

        <div className="space-y-6">
          {level && STEPS.map(step => {
            const stepItems = items.filter(i => i.step === step.id);
            const isDone = completed.has(step.id);
            return (
              <div key={step.id} className={`card-sticker bg-card border-2 p-5 ${isDone ? 'border-rainbow-green' : 'border-rainbow-purple/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display ${isDone ? 'bg-rainbow-green text-white' : 'bg-rainbow-purple/20 text-rainbow-purple'}`}>{step.id}</div>
                    <h3 className="font-display text-lg">{step.label}</h3>
                  </div>
                  {stepItems.length > 0 && (
                    <Button size="sm" variant={isDone ? 'outline' : 'default'} onClick={() => toggleStep(step.id)}>
                      {isDone ? 'À refaire' : 'Marquer comme fait'}
                    </Button>
                  )}
                </div>
                <div className="space-y-2 pl-13">
                  {stepItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic ml-13">Aucune ressource.</p>
                  ) : stepItems.map(r => {
                    const Icon = ICONS[r.kind] || LinkIcon;
                    return (
                      <a key={r.id} href={r.url || '#'} target={r.url ? '_blank' : undefined} rel="noreferrer" className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition">
                        <Icon className="w-5 h-5 text-rainbow-purple mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{r.title}</p>
                          {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                        </div>
                      </a>
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
