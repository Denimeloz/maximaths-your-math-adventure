import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Route, ArrowRight } from 'lucide-react';

interface Year { id: string; label: string; start_year: number; is_active: boolean; }
interface YearClass { id: string; academic_year_id: string; class_level: string; }

const LEVEL_LABELS: Record<string, string> = {
  '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
  'seconde': 'Seconde', 'premiere': 'Première', 'terminale': 'Terminale',
};

const RevisionPathsSection = () => {
  const navigate = useNavigate();
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<YearClass[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: y }, { data: c }] = await Promise.all([
        (supabase as any).from('academic_years').select('*').gte('start_year', 2026).order('start_year', { ascending: false }),
        (supabase as any).from('year_classes').select('*'),
      ]);
      setYears(y || []);
      setClasses(c || []);
    })();
  }, []);

  if (years.length === 0) return null;

  return (
    <section className="py-20 bg-card relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-purple/10 rounded-full mb-4">
            <Route className="w-5 h-5 text-rainbow-purple" />
            <span className="font-display text-rainbow-purple">Parcours de révision</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display text-foreground mb-2">Construis ta progression</h2>
          <p className="text-muted-foreground font-body max-w-2xl mx-auto">
            5 étapes pour réactiver, revoir, t'entraîner, vérifier tes acquis et t'autoévaluer.
          </p>
        </div>

        <div className="space-y-8 max-w-5xl mx-auto">
          {years.map(year => {
            const yLevels = classes.filter(c => c.academic_year_id === year.id);
            if (yLevels.length === 0) return null;
            return (
              <div key={year.id}>
                <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rainbow-purple" /> {year.label}
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {yLevels.map(c => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/parcours-revision?year=${year.id}&level=${c.class_level}`)}
                      className="card-sticker bg-card border-rainbow-purple/30 hover:border-rainbow-purple p-5 text-left group transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Entrée en </p>
                          <p className="font-display text-foreground">{LEVEL_LABELS[c.class_level] || c.class_level}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-rainbow-purple group-hover:translate-x-1 transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RevisionPathsSection;
