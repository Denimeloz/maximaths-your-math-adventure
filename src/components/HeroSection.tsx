import { ChevronDown, ChevronUp, BookOpen, Lightbulb, ClipboardList, FileCheck, GraduationCap, Puzzle, Camera, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const levels = [
  { id: '6eme', label: '6ème', isClub: false },
  { id: '5eme', label: '5ème', isClub: false },
  { id: '4eme', label: '4ème', isClub: false },
  { id: '3eme', label: '3ème', isClub: false },
  { id: 'seconde', label: 'Seconde', isClub: false },
  { id: 'premiere', label: 'Première', isClub: false },
  { id: 'terminale', label: 'Terminale', isClub: false },
  { id: 'club-maths', label: 'Club de maths', isClub: true },
];

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
  if (levelId === 'club-maths') return [];
  return subMenuItems;
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);

  const handleLevelClick = (levelId: string) => {
    setExpandedLevel(expandedLevel === levelId ? null : levelId);
  };

  const handleSubMenuClick = (levelId: string, subMenuId: string) => {
    navigate(`/niveau/${levelId}/${subMenuId}`);
  };

  const handleClubClick = () => navigate('/club-maths');

  return (
    <section className="relative bg-hero-gradient overflow-hidden pt-24 pb-16">
      {/* Soft golden glow */}
      <div className="absolute inset-0 sun-rays opacity-30 pointer-events-none" />

      <div className="relative container mx-auto px-4">
        {/* Banner */}
        <div className="relative mx-auto max-w-6xl animate-fade-in-up">
          <div className="absolute -inset-4 md:-inset-6 bg-gradient-to-br from-primary/10 via-transparent to-secondary/20 rounded-[2.5rem] blur-2xl" />
          <div className="relative rounded-[1.75rem] md:rounded-[2.25rem] overflow-hidden ring-1 ring-border shadow-[0_20px_60px_-20px_hsl(218_81%_18%/0.25)] bg-card animate-float-slow">
            <img
              src="/images/maximaths-banner.png"
              alt="MAXIMATHS — Curiosité, Assiduité, Rigueur. Comprendre, S'entraîner, Progresser."
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

        {/* Class Selection */}
        <div className="w-full max-w-5xl mx-auto mt-12 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <h3 className="text-lg md:text-xl font-display text-center mb-6 text-foreground tracking-wide">
            Choisis ta classe
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {levels.map((level) => (
              <div key={level.id} className={`relative ${level.isClub ? 'col-span-2 sm:col-span-4 lg:col-span-8' : ''}`}>
                <button
                  onClick={() => level.isClub ? handleClubClick() : handleLevelClick(level.id)}
                  className={`w-full px-3 py-3 rounded-xl font-display font-semibold text-sm md:text-base transition-all border ${
                    level.isClub
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-primary hover:shadow-lg hover:-translate-y-0.5'
                      : expandedLevel === level.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-card text-primary border-border hover:border-secondary hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {level.label}
                    {level.isClub ? (
                      <Puzzle className="w-4 h-4" />
                    ) : expandedLevel === level.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>
              </div>
            ))}
          </div>

          {expandedLevel && !levels.find(l => l.id === expandedLevel)?.isClub && (
            <div className="mt-6 p-5 bg-card rounded-2xl border border-border animate-fade-in-up shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {getSubMenuForLevel(expandedLevel).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSubMenuClick(expandedLevel, item.id)}
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
      </div>
    </section>
  );
};

export default HeroSection;
