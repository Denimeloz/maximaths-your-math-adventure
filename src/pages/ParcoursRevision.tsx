import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Route, ArrowLeft, FileText, Download } from 'lucide-react';

const LEVEL_LABELS: Record<string, string> = {
  '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
  'seconde': 'Seconde', 'premiere': 'Première', 'terminale': 'Terminale',
};

interface Year { id: string; label: string; start_year: number; }
interface YearClass { academic_year_id: string; class_level: string; }
interface RevisionFile { id: string; title: string | null; description: string | null; file_url: string | null; file_name: string | null; }

const ParcoursRevision = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<YearClass[]>([]);
  const [item, setItem] = useState<RevisionFile | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!yearId || !level) { setItem(null); return; }
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any).from('revision_path_files')
        .select('*').eq('academic_year_id', yearId).eq('level', level).maybeSingle();
      setItem(data || null);
      setLoading(false);
    })();
  }, [yearId, level]);

  const yClasses = classes.filter(c => c.academic_year_id === yearId);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" /> Accueil</Button>
        <div className="flex items-center gap-3 mb-2">
          <Route className="w-8 h-8 text-rainbow-purple" />
          <h1 className="text-3xl font-display text-foreground">Parcours de révision</h1>
        </div>
        <p className="text-muted-foreground mb-6">Télécharge le parcours de révision correspondant à ta classe.</p>

        <div className="flex flex-wrap gap-3 mb-8">
          <Select value={yearId || ''} onValueChange={v => setParams({ year: v, ...(level ? { level } : {}) })}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={level || ''} onValueChange={v => setParams({ year: yearId || '', level: v })}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>{yClasses.map(c => <SelectItem key={c.class_level} value={c.class_level}>{LEVEL_LABELS[c.class_level] || c.class_level}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {!level && <p className="text-muted-foreground italic">Choisis une classe pour voir le parcours.</p>}

        {level && loading && <p className="text-muted-foreground">Chargement…</p>}

        {level && !loading && !item?.file_url && (
          <div className="card-sticker bg-card border-border p-10 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucun parcours disponible pour le moment.</p>
          </div>
        )}

        {level && !loading && item?.file_url && (
          <div className="card-sticker bg-card border-2 border-rainbow-purple/40 p-6">
            <h2 className="font-display text-2xl mb-2">{item.title || 'Parcours de révision'}</h2>
            {item.description && <p className="text-muted-foreground mb-4">{item.description}</p>}
            <a href={item.file_url} target="_blank" rel="noreferrer" download
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rainbow-purple text-white font-semibold hover:opacity-90 transition">
              <Download className="w-5 h-5" /> Télécharger {item.file_name ? `(${item.file_name})` : ''}
            </a>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ParcoursRevision;
