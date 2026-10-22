import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { levelLabel } from '@/lib/levels';
import { RevisionResource } from '@/lib/parcoursRevision';
import { Route, ArrowLeft, FileText, Video, Mic, Link as LinkIcon, ExternalLink, Download, Image as ImageIcon, FileType, Presentation, CheckCircle2 } from 'lucide-react';

const ICONS: Record<string, any> = { pdf: FileText, word: FileType, powerpoint: Presentation, image: ImageIcon, audio: Mic, podcast: Mic, video: Video, canva: ExternalLink, link: LinkIcon, lesson: FileText };

interface Year { id: string; label: string; start_year: number; is_active: boolean; }
interface YearClass { academic_year_id: string; class_level: string; }

const ParcoursRevision = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [yearId, setYearId] = useState<string | null>(null);
  const [classes, setClasses] = useState<YearClass[]>([]);
  const [yearsLoaded, setYearsLoaded] = useState(false);
  const [items, setItems] = useState<RevisionResource[]>([]);

  const level = params.get('level');

  // On ne choisit que la classe : l'année est celle en cours (sinon la plus récente)
  useEffect(() => {
    (async () => {
      const [{ data: y }, { data: c }] = await Promise.all([
        (supabase as any).from('academic_years').select('*').gte('start_year', 2026).order('start_year', { ascending: false }),
        (supabase as any).from('year_classes').select('*'),
      ]);
      const years: Year[] = y || [];
      setYearId(years.length ? (years.find(item => item.is_active) || years[0]).id : null);
      setClasses(c || []);
      setYearsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!yearId || !level) { setItems([]); return; }
    (async () => {
      const { data } = await (supabase as any).from('revision_path_resources')
        .select('*').eq('academic_year_id', yearId).eq('level', level).eq('is_published', true)
        .order('display_order').order('created_at');
      setItems(data || []);
    })();
  }, [yearId, level]);

  const yClasses = classes.filter(c => c.academic_year_id === yearId);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" /> Accueil</Button>
        <div className="flex items-center gap-3 mb-2">
          <Route className="w-8 h-8 text-rainbow-purple" />
          <h1 className="text-3xl font-display text-foreground">Parcours de révision</h1>
        </div>
        <p className="text-muted-foreground mb-6">Les fiches de révision de ta classe, avec leurs corrigés.</p>

        {yearId && (
          <div className="mb-6">
            <Select value={level || ''} onValueChange={v => setParams({ level: v })}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Classe" /></SelectTrigger>
              <SelectContent>{yClasses.map(c => <SelectItem key={c.class_level} value={c.class_level}>{levelLabel(c.class_level)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        {yearsLoaded && !yearId && (
          <p className="text-muted-foreground italic">Les parcours de révision seront disponibles à partir de l'année 2026-2027.</p>
        )}
        {yearId && !level && <p className="text-muted-foreground italic">Choisis ta classe.</p>}
        {level && items.length === 0 && <p className="text-muted-foreground italic">Aucune ressource pour l'instant.</p>}

        <div className="space-y-3">
          {level && items.map(r => {
            const Icon = ICONS[r.kind] || LinkIcon;
            return (
              <div key={r.id} className="card-sticker bg-card border-2 border-rainbow-purple/30 p-4 flex items-start gap-3">
                <Icon className="w-5 h-5 text-rainbow-purple mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg">{r.title}</h3>
                  {r.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{r.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                    {(r.files || []).map(f => (
                      <a key={f.url} href={f.url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-rainbow-purple hover:underline">
                        <Download className="w-4 h-4" /> {f.name}
                      </a>
                    ))}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-rainbow-blue hover:underline">
                        <ExternalLink className="w-4 h-4" /> Ouvrir le lien
                      </a>
                    )}
                    {r.correction_url && (
                      <a href={r.correction_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-rainbow-green hover:underline">
                        <CheckCircle2 className="w-4 h-4" /> Voir le corrigé
                      </a>
                    )}
                  </div>
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
