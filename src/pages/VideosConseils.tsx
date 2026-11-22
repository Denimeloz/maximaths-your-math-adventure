import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectMediaView from '@/components/ProjectMediaView';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { levelLabel } from '@/lib/levels';
import { VIDEOS_CONSEILS_SOUS_TITRE, VIDEOS_CONSEILS_TITRE, toVideoConseil, type VideoConseil } from '@/lib/videosConseils';

interface Year { id: string; label: string; start_year: number; is_active: boolean; }
interface YearClass { academic_year_id: string; class_level: string; }

/** Page publique : vidéos et conseils pour progresser en mathématiques, par année et par classe. */
const VideosConseils = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<YearClass[]>([]);
  const [yearsLoaded, setYearsLoaded] = useState(false);
  const [items, setItems] = useState<VideoConseil[]>([]);
  const [loading, setLoading] = useState(false);

  const yearId = params.get('year');
  const level = params.get('level');

  useEffect(() => {
    (async () => {
      const [{ data: y }, { data: c }] = await Promise.all([
        (supabase as any).from('academic_years').select('*').gte('start_year', 2026).order('start_year', { ascending: false }),
        (supabase as any).from('year_classes').select('*'),
      ]);
      const list: Year[] = y || [];
      setYears(list);
      setClasses(c || []);
      // Année absente de l'adresse : on prend l'année en cours (sinon la plus récente) sans perdre la classe
      if (!yearId && list.length) {
        const fallback = (list.find(item => item.is_active) || list[0]).id;
        setParams(level ? { year: fallback, level } : { year: fallback }, { replace: true });
      }
      setYearsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!yearId || !level) { setItems([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any).from('videos_et_conseils_pour_progresser')
        .select('*').eq('academic_year_id', yearId).eq('level', level).eq('is_published', true)
        .order('display_order', { ascending: true });
      if (cancelled) return;
      setItems((data || []).map(toVideoConseil));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [yearId, level]);

  const yClasses = classes.filter(c => c.academic_year_id === yearId);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" /> Accueil</Button>

        <div className="flex items-center gap-3 mb-2">
          <LifeBuoy className="w-8 h-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-display text-foreground">{VIDEOS_CONSEILS_TITRE}</h1>
        </div>
        <p className="font-body text-muted-foreground max-w-2xl mb-8">
          {VIDEOS_CONSEILS_SOUS_TITRE}, par classe et par année scolaire.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          <Select value={yearId || ''} onValueChange={v => setParams({ year: v, ...(level ? { level } : {}) })}>
            <SelectTrigger className="w-52" aria-label="Année scolaire"><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={level || ''} onValueChange={v => setParams({ year: yearId || '', level: v })}>
            <SelectTrigger className="w-52" aria-label="Classe"><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>{yClasses.map(c => <SelectItem key={c.class_level} value={c.class_level}>{levelLabel(c.class_level)}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {yearsLoaded && years.length === 0 && (
          <p className="text-muted-foreground italic">Les vidéos et conseils seront disponibles à partir de l'année 2026-2027.</p>
        )}
        {years.length > 0 && !level && <p className="text-muted-foreground italic">Choisis une classe.</p>}
        {loading && <p className="font-body text-muted-foreground" role="status">Chargement…</p>}
        {level && !loading && items.length === 0 && (
          <div className="card-sticker bg-card border-border p-8 text-center">
            <LifeBuoy className="w-10 h-10 mx-auto text-primary/50" aria-hidden="true" />
            <p className="mt-3 font-display text-lg text-foreground">Pas encore de vidéo ni de conseil pour cette classe.</p>
            <p className="mt-1 font-body text-sm text-muted-foreground">Reviens bientôt : de nouvelles vidéos arrivent au fil de l'année.</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {items.map(item => (
            <article key={item.id} className="card-sticker bg-card border-border p-5 md:p-6">
              {item.chapter && (
                <span className="inline-block rounded-full bg-secondary/25 px-2.5 py-0.5 font-body text-xs font-semibold text-secondary-foreground">
                  {item.chapter}
                </span>
              )}
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">{item.title}</h2>
              {item.description && <p className="mt-3 font-body text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>}
              <div className="mt-4 space-y-5">
                {item.media.map((media, index) => (
                  <ProjectMediaView key={`${media.url}-${index}`} media={media} projectTitle={item.title} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VideosConseils;
