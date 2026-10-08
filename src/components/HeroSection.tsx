import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAcademicYears } from "@/contexts/AcademicYearContext";
import { fetchSiteLabels } from "@/lib/siteLabels";
import { levelLabel } from "@/lib/levels";
import { getLevelMenu, levelMenuPath, usesNewArchitecture } from "@/lib/levelMenus";

const HeroSection = () => {
  const { years, classes, loading, activeYear } = useAcademicYears();
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null); // clé : `${yearId}:${classe}`
  const [bannerZoom, setBannerZoom] = useState(false);

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

  // Année en cours d'abord, puis les années précédentes de la plus récente à la plus ancienne
  const sortedYears = [...years].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return b.start_year - a.start_year;
  });

  return (
    <section className="relative bg-hero-gradient overflow-hidden pt-24 pb-12 md:pb-16">
      <div className="absolute inset-0 sun-rays opacity-30 pointer-events-none" />

      <div className="relative container mx-auto px-4 max-w-6xl">
        <h1 className="sr-only">MAXIMATHS — Curiosité, Assiduité, Rigueur</h1>

        {/* Bannière : même image qu'avant, servie en WebP (bien plus légère) avec le PNG d'origine en secours */}
        <div className="relative animate-fade-in-up">
          <div className="absolute -inset-4 md:-inset-6 bg-gradient-to-br from-primary/10 via-transparent to-secondary/20 rounded-[2.5rem] blur-2xl" />
          <div className="relative rounded-[1.75rem] md:rounded-[2.25rem] overflow-hidden ring-1 ring-border shadow-[0_20px_60px_-20px_hsl(218_81%_18%/0.25)] bg-card animate-float-slow">
            <picture>
              <source
                type="image/webp"
                srcSet="/images/maximaths-banner-768.webp 768w, /images/maximaths-banner.webp 1536w"
                sizes="(min-width: 1200px) 1104px, 100vw"
              />
              <img
                src="/images/maximaths-banner.png"
                alt="MAXIMATHS, École Internationale Jules Verne — Curiosité, Assiduité, Rigueur. Comprendre, s'entraîner, progresser."
                width={1536}
                height={1024}
                className="w-full h-auto block"
                loading="eager"
                {...{ fetchpriority: 'high' }}
              />
            </picture>
          </div>
        </div>

        {/* Sur téléphone, le texte de la bannière est trop petit : ce bouton l'ouvre en grand */}
        <div className="mt-3 flex justify-end md:hidden">
          <button
            type="button"
            onClick={() => setBannerZoom(true)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-body font-semibold text-primary"
          >
            <ZoomIn className="w-4 h-4" aria-hidden="true" />
            Agrandir la bannière
          </button>
        </div>

        <Dialog open={bannerZoom} onOpenChange={setBannerZoom}>
          <DialogContent className="max-w-[100vw] w-screen h-[100dvh] p-0 gap-0 flex flex-col rounded-none sm:rounded-none">
            <div className="shrink-0 px-4 py-3 pr-12 border-b border-border">
              <DialogTitle className="font-display text-base text-foreground">Bannière MAXIMATHS</DialogTitle>
              <DialogDescription className="text-xs font-body text-muted-foreground">
                Fais glisser l'image pour la parcourir.
              </DialogDescription>
            </div>
            <div className="flex-1 overflow-auto bg-muted">
              <img
                src="/images/maximaths-banner.webp"
                alt="MAXIMATHS, École Internationale Jules Verne — Curiosité, Assiduité, Rigueur. Comprendre, s'entraîner, progresser."
                width={1536}
                height={1024}
                className="block h-auto w-[960px] max-w-none"
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Choix de la classe, toutes années confondues */}
        <div id="classes" className="scroll-mt-28 mt-10 md:mt-12 rounded-3xl border-2 border-primary/15 bg-card p-5 md:p-8 shadow-[0_18px_40px_-24px_hsl(218_81%_18%/0.35)]">
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
                    {year.is_active ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary/25 text-secondary-foreground font-body font-semibold">
                        En cours
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-body font-semibold">
                        Année précédente
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
    </section>
  );
};

export default HeroSection;
