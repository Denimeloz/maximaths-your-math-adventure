import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Star } from "lucide-react";
import { useAcademicYears } from "@/contexts/AcademicYearContext";
import { fetchSiteLabels } from "@/lib/siteLabels";
import { levelLabel } from "@/lib/levels";
import { getLevelMenu, levelMenuPath, usesNewArchitecture } from "@/lib/levelMenus";

const PILLARS = [
  { title: "Comprendre", text: "Des cours clairs et structurés pour comprendre chaque notion." },
  { title: "S'entraîner", text: "Des exercices variés et progressifs pour s'entraîner efficacement." },
  { title: "Progresser", text: "Des corrigés détaillés et des conseils pour gagner en confiance." },
];

const MOTTO = ["Curiosité", "Assiduité", "Rigueur"];

const HeroSection = () => {
  const { years, classes, loading, activeYear } = useAcademicYears();
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null); // clé : `${yearId}:${classe}`

  // Libellés personnalisés : ils ne concernent que l'année en cours
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (activeYear && usesNewArchitecture(activeYear.start_year)) {
        const labels = await fetchSiteLabels(activeYear.id);
        if (mounted) setLabelMap(labels || {});
      } else {
        setLabelMap({});
      }
    }
    load();
    return () => { mounted = false; };
  }, [activeYear]);

  // Année en cours d'abord, puis les plus récentes
  const sortedYears = [...years].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return b.start_year - a.start_year;
  });

  return (
    <section className="bg-grid-paper border-b border-border pt-28 pb-12 md:pt-32 md:pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Sur téléphone : titre, puis choix de la classe, puis les trois piliers.
            Sur ordinateur : titre et piliers côte à côte, choix de la classe en dessous. */}
        <div className="grid gap-8 md:gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
          <div>
            <p className="font-body text-sm md:text-base text-muted-foreground">École Internationale Jules Verne</p>
            <h1 className="mt-2 font-display font-bold leading-[0.9] tracking-tight text-[clamp(3rem,11vw,6.5rem)]">
              <span className="text-primary">MAXI</span>
              <span className="text-secondary">MATHS</span>
            </h1>
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-lg md:text-xl font-semibold text-primary">
              {MOTTO.map((word, i) => (
                <span key={word} className="inline-flex items-center gap-3">
                  {i > 0 && <Star className="w-4 h-4 text-secondary fill-secondary" aria-hidden="true" />}
                  {word}
                </span>
              ))}
            </p>
            <p className="mt-4 max-w-xl font-body text-base md:text-lg text-muted-foreground">
              Cours, exercices et corrigés de mathématiques, de la 6ème à la Terminale.
            </p>
          </div>

          <dl className="order-3 lg:order-none grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {PILLARS.map(pillar => (
              <div key={pillar.title} className="border-l-4 border-secondary pl-4">
                <dt className="font-display text-lg font-semibold text-primary">{pillar.title}</dt>
                <dd className="mt-1 font-body text-sm text-muted-foreground">{pillar.text}</dd>
              </div>
            ))}
          </dl>

        {/* Choix de la classe */}
        <div id="classes" className="order-2 lg:order-none lg:col-span-2 scroll-mt-28 rounded-3xl border-2 border-primary/15 bg-card p-5 md:p-8 shadow-[0_18px_40px_-24px_hsl(218_81%_18%/0.35)]">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">Choisis ta classe</h2>

          {loading && <p className="mt-4 text-muted-foreground font-body" role="status">Chargement des classes…</p>}

          {!loading && sortedYears.length === 0 && (
            <p className="mt-4 text-muted-foreground font-body">Aucune année scolaire n'est encore ouverte.</p>
          )}

          <div className="mt-5 space-y-8">
            {sortedYears.map(year => {
              const yClasses = classes
                .filter(c => c.academic_year_id === year.id)
                .sort((a, b) => a.display_order - b.display_order);
              if (yClasses.length === 0) return null;

              const openLevel = expanded?.startsWith(`${year.id}:`) ? expanded.split(':')[1] : null;
              const isNew = usesNewArchitecture(year.start_year);
              const labels = year.id === activeYear?.id ? labelMap : {};

              return (
                <div key={year.id}>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="font-display text-base md:text-lg font-medium text-foreground">Année {year.label}</h3>
                    {year.is_active && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary/25 text-secondary-foreground font-body font-semibold">
                        En cours
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {yClasses.map(c => {
                      const key = `${year.id}:${c.class_level}`;
                      const isOpen = expanded === key;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setExpanded(isOpen ? null : key)}
                          aria-expanded={isOpen}
                          className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-display font-semibold text-sm md:text-base border-2 transition-colors ${
                            isOpen
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-primary border-border hover:border-primary'
                          }`}
                        >
                          {levelLabel(c.class_level)}
                          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>

                  {openLevel && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 rounded-2xl bg-muted/50 p-3 md:p-4">
                      {getLevelMenu(openLevel, isNew).map(item => (
                        <Link
                          key={item.id}
                          to={levelMenuPath(openLevel, item.id, year.id)}
                          className="group rounded-xl bg-card border border-border p-3.5 transition-colors hover:border-primary focus-visible:border-primary outline-none"
                        >
                          <item.icon className="w-5 h-5 mb-2 text-primary" aria-hidden="true" />
                          <div className="font-display text-sm font-medium text-foreground">{labels[item.id] || item.label}</div>
                          <p className="text-xs text-muted-foreground font-body mt-1">{item.description}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </div>

        <figure className="mt-8 max-w-3xl">
          <blockquote className="font-body italic text-base md:text-lg text-foreground/90">
            « Le génie, c'est 1 % d'inspiration et 99 % de transpiration. »
          </blockquote>
          <figcaption className="mt-1 font-body text-sm text-muted-foreground">Thomas Edison</figcaption>
        </figure>
      </div>
    </section>
  );
};

export default HeroSection;
