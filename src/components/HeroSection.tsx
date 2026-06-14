import { ChevronDown, ChevronUp, BookOpen, Lightbulb, ClipboardList, FileCheck, GraduationCap, Puzzle, Camera, Gamepad2, CalendarRange, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import bannerAsset from "@/assets/maximaths-banner.png.asset.json";
import { AcademicYearProvider, useAcademicYears } from "@/contexts/AcademicYearContext";

const LEVEL_LABELS: Record<string, string> = {
  '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
  'seconde': 'Seconde', 'premiere': 'Première', 'terminale': 'Terminale',
};

const subMenuItems = [
  { id: 'activites', label: 'Activités', description: 'Découverte et exploration', icon: Lightbulb },
  { id: 'cours', label: 'Cours', description: 'Leçons et chapitres', icon: BookOpen },
  { id: 'exercices-entrainement', label: 'Exercices', description: 'Entraînement', icon: ClipboardList },
  { id: 'tests-entrainement', label: 'Tests', description: 'Tests (Évaluations formatives)', icon: FileCheck },
  { id: 'devoirs', label: 'Devoirs', description: 'Devoirs de niveaux', icon: ClipboardList },
  { id: 'evaluations', label: 'Évaluations', description: 'Tests et examens', icon: FileCheck },
  { id: 'jeux-genially', label: 'Jeux & Genially', description: 'Jeux éducatifs et présentations', icon: Gamepad2 },
];

const classeActiviteItem = { id: 'classe-activite', label: 'Classe en activité', description: 'Photos et moments', icon: Camera };

const subMenuItems3eme = [
  ...subMenuItems.map(item => item.id === 'tests-entrainement' ? { ...item, label: 'Tests / Mini DNB', description: 'Tests ou Mini DNB' } : item),
  { id: 'prepa-dnb', label: 'Prépa DNB', description: 'Préparation au brevet', icon: GraduationCap },
  { id: 'ressources-dnb', label: 'Ressources DNB', description: 'Fiches et supports à télécharger', icon: GraduationCap },
  classeActiviteItem,
];

const subMenuItemsSeconde = [...subMenuItems, classeActiviteItem];

const getSubMenuForLevel = (levelId: string) => {
  if (levelId === '3eme') return subMenuItems3eme;
  if (levelId === 'seconde') return subMenuItemsSeconde;
  return subMenuItems;
};

const HeroInner = () => {
  const navigate = useNavigate();
  const { years, classes, loading, activeYear } = useAcademicYears();
  const [expanded, setExpanded] = useState<string | null>(null); // key: yearId:level

  const handleClubClick = () => navigate('/club-maths');
  const handleSubMenuClick = (yearId: string, levelId: string, subMenuId: string) => {
    navigate(`/niveau/${levelId}/${subMenuId}?year=${yearId}`);
  };

  // Sort years: active first, then by display order descending (newer years on top)
  const sortedYears = [...years].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return b.display_order - a.display_order;
  });

  return (
    <section className="relative bg-hero-gradient overflow-hidden pt-24 pb-16">
      <div className="absolute inset-0 sun-rays opacity-30 pointer-events-none" />

      <div className="relative container mx-auto px-4">
        {/* Banner */}
        <div className="relative mx-auto max-w-6xl animate-fade-in-up">
          <div className="absolute -inset-4 md:-inset-6 bg-gradient-to-br from-primary/10 via-transparent to-secondary/20 rounded-[2.5rem] blur-2xl" />
          <div className="relative rounded-[1.75rem] md:rounded-[2.25rem] overflow-hidden ring-1 ring-border shadow-[0_20px_60px_-20px_hsl(218_81%_18%/0.25)] bg-card animate-float-slow">
            <img
              src={bannerAsset.url}
              alt="MAXIMATHS — Curiosité, Assiduité, Rigueur."
              className="w-full h-auto block"
              loading="eager"
            />
          </div>
        </div>

        {/* Quote */}
        <figure className="mt-10 max-w-3xl mx-auto text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <blockquote className="text-lg md:text-xl font-body italic text-foreground/90 leading-relaxed">
            <span className="text-secondary text-3xl font-display leading-none align-top mr-1">“</span>
            Le génie, c'est <span className="text-primary font-semibold not-italic">1 % d'inspiration</span> et <span className="text-primary font-semibold not-italic">99 % de transpiration</span>.
            <span className="text-secondary text-3xl font-display leading-none align-bottom ml-1">”</span>
          </blockquote>
          <figcaption className="mt-3 font-display text-sm tracking-wider uppercase text-muted-foreground">
            — Thomas Edison
          </figcaption>
        </figure>

        {/* Class Selection grouped by academic year */}
        <div className="w-full max-w-5xl mx-auto mt-12 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <h3 className="text-lg md:text-xl font-display text-center mb-6 text-foreground tracking-wide">
            Choisis ta classe
          </h3>

          {loading && (
            <p className="text-center text-muted-foreground font-body">Chargement…</p>
          )}

          {!loading && sortedYears.length === 0 && (
            <p className="text-center text-muted-foreground font-body">Aucune année scolaire disponible.</p>
          )}

          <div className="space-y-8">
            {sortedYears.map(year => {
              const yClasses = classes
                .filter(c => c.academic_year_id === year.id)
                .sort((a, b) => a.display_order - b.display_order);

              if (yClasses.length === 0) return null;

              return (
                <div key={year.id}>
                  <div className="flex items-center gap-3 mb-3 justify-center">
                    <CalendarRange className="w-5 h-5 text-primary" />
                    <h4 className="font-display text-lg text-foreground">
                      Année {year.label}
                    </h4>
                    {year.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-primary font-body inline-flex items-center gap-1">
                        <Star className="w-3 h-3" /> En cours
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
                          className={`px-3 py-3 rounded-xl font-display font-semibold text-sm md:text-base transition-all border ${
                            isOpen
                              ? 'bg-primary text-primary-foreground border-primary shadow-md'
                              : 'bg-card text-primary border-border hover:border-secondary hover:shadow-md hover:-translate-y-0.5'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            {LEVEL_LABELS[c.class_level] || c.class_level}
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {expanded?.startsWith(`${year.id}:`) && (
                    <div className="mt-4 p-5 bg-card rounded-2xl border border-border animate-fade-in-up shadow-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {getSubMenuForLevel(expanded.split(':')[1]).map(item => (
                          <button
                            key={item.id}
                            onClick={() => handleSubMenuClick(year.id, expanded.split(':')[1], item.id)}
                            className="p-4 rounded-xl bg-muted/40 hover:bg-secondary/15 transition-all hover:-translate-y-0.5 text-left group border border-transparent hover:border-secondary"
                          >
                            <item.icon className="w-6 h-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
                            <div className="font-display text-sm text-foreground">{item.label}</div>
                            <p className="text-xs text-muted-foreground font-body mt-1">{item.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Club Jules Verne — transverse */}
          <div className="mt-10">
            <button
              onClick={handleClubClick}
              className="w-full px-3 py-3 rounded-xl font-display font-semibold text-sm md:text-base transition-all border bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-primary hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center gap-1.5">
                Club Jules Verne
                <Puzzle className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const HeroSection = () => (
  <AcademicYearProvider>
    <HeroInner />
  </AcademicYearProvider>
);

export default HeroSection;
