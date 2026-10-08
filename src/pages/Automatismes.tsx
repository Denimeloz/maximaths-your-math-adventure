import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, ArrowLeft, Download } from 'lucide-react';
import { levelLabel } from '@/lib/levels';
import FilePreview from '@/components/FilePreview';

interface Year { id: string; label: string; start_year: number; is_active: boolean; }
interface YearClass { academic_year_id: string; class_level: string; }
interface Item {
  id: string; level: string; chapter: string | null; title: string;
  description: string | null; canva_embed_url: string | null; thumbnail_url: string | null;
  academic_year_id: string; file_url: string | null; file_name: string | null;
}


const Automatismes = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<YearClass[]>([]);
  const [yearsLoaded, setYearsLoaded] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

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
      const { data } = await (supabase as any).from('automatisms')
        .select('*').eq('academic_year_id', yearId).eq('is_published', true).eq('level', level)
        .order('display_order');
      setItems(data || []);
    })();
  }, [yearId, level]);

  const yClasses = classes.filter(c => c.academic_year_id === yearId);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" /> Accueil</Button>
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-rainbow-yellow" />
          <h1 className="text-3xl font-display text-foreground">Automatismes</h1>
        </div>
        <p className="text-muted-foreground mb-8">Supports d'entraînement aux automatismes par classe et par année scolaire.</p>

        <div className="flex flex-wrap gap-3 mb-8">
          <Select value={yearId || ''} onValueChange={v => setParams({ year: v, ...(level ? { level } : {}) })}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={level || ''} onValueChange={v => setParams({ year: yearId || '', level: v })}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>{yClasses.map(c => <SelectItem key={c.class_level} value={c.class_level}>{levelLabel(c.class_level)}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {yearsLoaded && years.length === 0 && (
          <p className="text-muted-foreground italic">Les automatismes seront disponibles à partir de l'année 2026-2027.</p>
        )}
        {years.length > 0 && !level && <p className="text-muted-foreground italic">Choisis une classe.</p>}
        {level && items.length === 0 && <p className="text-muted-foreground italic">Aucun support pour cette classe.</p>}

        <div className="grid md:grid-cols-2 gap-6">
          {items.map(it => (
            <div key={it.id} className="card-sticker bg-card border-rainbow-yellow/30 p-5">
              <h3 className="font-display text-lg">{it.title}</h3>
              {it.chapter && <p className="text-xs text-muted-foreground">{it.chapter}</p>}
              {it.description && <p className="text-sm mt-2 text-muted-foreground">{it.description}</p>}
              {it.file_url && (
                <a href={it.file_url} target="_blank" rel="noreferrer" download className="mt-3 inline-flex items-center gap-2 text-sm text-rainbow-purple hover:underline">
                  <Download className="w-4 h-4" />{it.file_name || 'Télécharger le fichier'}
                </a>
              )}
              {it.file_url && <FilePreview url={it.file_url} fileName={it.file_name} title={it.title} />}
              {it.canva_embed_url && (
                <div className="mt-4 aspect-video">
                  <iframe src={it.canva_embed_url} title={it.title} className="w-full h-full rounded-lg border" allow="fullscreen" />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Automatismes;
