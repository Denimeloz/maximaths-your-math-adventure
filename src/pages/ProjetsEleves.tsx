import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Presentation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectMediaView from '@/components/ProjectMediaView';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { levelLabel } from '@/lib/levels';
import { PROJECT_LEVELS, PROJECT_TYPE, isProjectLevel, toStudentProject, type StudentProject } from '@/lib/studentProjects';

interface Year { id: string; label: string; start_year: number; is_active: boolean; }

// La Seconde d'abord, puis la 3ème : même ordre que les boutons de filtre
const SECTIONS = [...PROJECT_LEVELS].reverse();

/** Page publique : les élèves de 3ème et de Seconde expliquent le cours en vidéo, en audio ou en diaporama. */
const ProjetsEleves = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [years, setYears] = useState<Year[]>([]);
  const [yearsLoaded, setYearsLoaded] = useState(false);
  const [projects, setProjects] = useState<StudentProject[]>([]);
  const [loading, setLoading] = useState(true);

  const yearId = params.get('year');
  const levelParam = params.get('level');
  const level = isProjectLevel(levelParam) ? levelParam : null;

  const update = (next: { year?: string | null; level?: string | null }) => {
    const year = next.year !== undefined ? next.year : yearId;
    const lvl = next.level !== undefined ? next.level : level;
    setParams({ ...(year ? { year } : {}), ...(lvl ? { level: lvl } : {}) }, { replace: true });
  };

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('academic_years').select('*').gte('start_year', 2026).order('start_year', { ascending: false });
      const list: Year[] = data || [];
      setYears(list);
      // Année absente de l'adresse : on prend l'année en cours (sinon la plus récente) sans perdre la classe
      if (!yearId && list.length) update({ year: (list.find(y => y.is_active) || list[0]).id });
      setYearsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!yearId) { setProjects([]); setLoading(!yearsLoaded); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any).from('spiral_resources')
        .select('*')
        .eq('resource_type', PROJECT_TYPE)
        .eq('academic_year_id', yearId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      if (cancelled) return;
      // Un projet n'apparaît que si l'accord des parents a été coché dans l'admin
      setProjects((data || []).map(toStudentProject).filter((p: StudentProject) => p.consent && isProjectLevel(p.level)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [yearId, yearsLoaded]);

  const sections = SECTIONS
    .filter(id => !level || id === level)
    .map(id => ({ id, items: projects.filter(p => p.level === id) }))
    .filter(section => section.items.length > 0);

  const filterButton = (value: string | null, label: string) => {
    const active = level === value;
    return (
      <button
        key={label}
        type="button"
        aria-pressed={active}
        onClick={() => update({ level: value })}
        className={`rounded-full border-2 px-4 py-2 font-body text-sm font-semibold transition-colors ${
          active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-primary border-border hover:border-primary'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" /> Accueil</Button>

        <div className="flex items-center gap-3 mb-2">
          <Presentation className="w-8 h-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-display text-foreground">Projets des élèves</h1>
        </div>
        <p className="font-body text-muted-foreground max-w-2xl mb-8">
          Des élèves de 3ème et de Seconde expliquent, avec leurs mots, les notions du cours : en vidéo, en audio ou en diaporama.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Classe">
            {filterButton(null, 'Toutes les classes')}
            {SECTIONS.map(id => filterButton(id, levelLabel(id)))}
          </div>
          {years.length > 1 && (
            <Select value={yearId || ''} onValueChange={v => update({ year: v })}>
              <SelectTrigger className="w-44" aria-label="Année scolaire"><SelectValue placeholder="Année" /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>

        {loading && <p className="font-body text-muted-foreground" role="status">Chargement des projets…</p>}

        {!loading && sections.length === 0 && (
          <div className="card-sticker bg-card border-border p-8 text-center">
            <Presentation className="w-10 h-10 mx-auto text-primary/50" aria-hidden="true" />
            <p className="mt-3 font-display text-lg text-foreground">
              {yearsLoaded && years.length === 0
                ? "Les projets des élèves arrivent avec l'année 2026-2027."
                : level ? `Pas encore de projet en ${levelLabel(level)}.` : 'Les premiers projets arrivent bientôt.'}
            </p>
            <p className="mt-1 font-body text-sm text-muted-foreground">Reviens après la prochaine séance.</p>
          </div>
        )}

        {sections.map(section => (
          <section key={section.id} className="mb-10" aria-labelledby={`projets-${section.id}`}>
            {/* Le titre de classe n'est visible que si les deux classes sont affichées */}
            <h2 id={`projets-${section.id}`} className={level ? 'sr-only' : 'font-display text-2xl font-semibold text-foreground mb-4'}>
              {levelLabel(section.id)}
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {section.items.map(project => (
                <article key={project.id} className="card-sticker bg-card border-border p-5 md:p-6">
                  <span className="inline-block rounded-full bg-secondary/25 px-2.5 py-0.5 font-body text-xs font-semibold text-secondary-foreground">
                    {levelLabel(project.level)}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-semibold text-foreground">{project.title}</h3>
                  {project.authors.trim() && (
                    <p className="mt-1 font-body text-sm text-muted-foreground">Expliqué par <span className="font-semibold text-foreground">{project.authors}</span></p>
                  )}
                  {project.description && <p className="mt-3 font-body text-sm text-muted-foreground whitespace-pre-line">{project.description}</p>}
                  <div className="mt-4 space-y-5">
                    {project.media.map((media, index) => (
                      <ProjectMediaView key={`${media.url}-${index}`} media={media} projectTitle={project.title} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {!loading && sections.length > 0 && (
          <p className="font-body text-sm text-muted-foreground">Ces projets sont diffusés avec l'accord des familles.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProjetsEleves;
