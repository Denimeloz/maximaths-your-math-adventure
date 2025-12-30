import { Button } from "@/components/ui/button";
import { Sparkles, Star, Zap, ChevronDown, ChevronUp, BookOpen, Lightbulb, ClipboardList, FileCheck, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/maximaths-hero.jpeg";
import brainIcon from "@/assets/brain-icon.png";

const levels = [
  { id: '6eme', label: '6ème', color: 'bg-rainbow-blue', textColor: 'text-rainbow-blue', borderColor: 'border-rainbow-blue' },
  { id: '5eme', label: '5ème', color: 'bg-rainbow-green', textColor: 'text-rainbow-green', borderColor: 'border-rainbow-green' },
  { id: '4eme', label: '4ème', color: 'bg-rainbow-orange', textColor: 'text-rainbow-orange', borderColor: 'border-rainbow-orange' },
  { id: '3eme', label: '3ème', color: 'bg-rainbow-coral', textColor: 'text-rainbow-coral', borderColor: 'border-rainbow-coral' },
  { id: 'seconde', label: 'Seconde', color: 'bg-rainbow-pink', textColor: 'text-rainbow-pink', borderColor: 'border-rainbow-pink' },
  { id: 'premiere', label: 'Première', color: 'bg-rainbow-purple', textColor: 'text-rainbow-purple', borderColor: 'border-rainbow-purple' },
  { id: 'terminale', label: 'Terminale', color: 'bg-rainbow-yellow', textColor: 'text-rainbow-yellow', borderColor: 'border-rainbow-yellow' },
];

const subMenuItems = [
  { id: 'activites', label: 'Activités', description: 'Découverte et exploration', icon: Lightbulb },
  { id: 'cours', label: 'Cours', description: 'Leçons et chapitres', icon: BookOpen },
  { id: 'exercices-entrainement', label: 'Exercices', description: 'Entraînement', icon: ClipboardList },
  { id: 'tests-entrainement', label: 'Tests', description: 'Tests (Évaluations formatives)', icon: FileCheck },
  { id: 'devoirs', label: 'Devoirs', description: 'Devoirs de niveaux', icon: ClipboardList },
  { id: 'evaluations', label: 'Évaluations', description: 'Tests et examens', icon: FileCheck },
];

const subMenuItems3eme = [
  ...subMenuItems,
  { id: 'prepa-dnb', label: 'Prépa DNB', description: 'Préparation au brevet', icon: GraduationCap },
];

const getSubMenuForLevel = (levelId: string) => {
  return levelId === '3eme' ? subMenuItems3eme : subMenuItems;
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

  return (
    <section className="relative min-h-screen bg-hero-gradient overflow-hidden pt-20">
      {/* Math pattern overlay */}
      <div className="absolute inset-0 math-pattern opacity-40" />
      
      {/* Decorative clouds - enhanced */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="cloud w-48 h-24 top-24 left-5 opacity-90 animate-float" />
        <div className="cloud w-72 h-32 top-28 right-10 opacity-80 animate-float-delayed" />
        <div className="cloud w-40 h-20 top-52 left-1/4 opacity-70 animate-float-slow" />
        <div className="cloud w-56 h-28 bottom-32 right-1/4 opacity-80 animate-float" />
        <div className="cloud w-36 h-18 bottom-48 left-10 opacity-60 animate-float-delayed" />
        
        {/* Decorative stars - more vibrant */}
        <Star className="absolute top-28 left-[15%] w-8 h-8 text-rainbow-yellow fill-rainbow-yellow twinkle drop-shadow-lg" />
        <Star className="absolute top-36 right-[20%] w-6 h-6 text-rainbow-pink fill-rainbow-pink twinkle drop-shadow-lg" style={{ animationDelay: "0.5s" }} />
        <Star className="absolute top-56 left-[40%] w-7 h-7 text-rainbow-purple fill-rainbow-purple twinkle drop-shadow-lg" style={{ animationDelay: "1s" }} />
        <Star className="absolute bottom-52 right-[35%] w-8 h-8 text-rainbow-orange fill-rainbow-orange twinkle drop-shadow-lg" style={{ animationDelay: "1.5s" }} />
        <Star className="absolute top-72 right-[10%] w-5 h-5 text-rainbow-blue fill-rainbow-blue twinkle drop-shadow-lg" style={{ animationDelay: "0.8s" }} />
        <Zap className="absolute bottom-64 left-[20%] w-7 h-7 text-rainbow-yellow fill-rainbow-yellow animate-wiggle drop-shadow-lg" />
      </div>

      {/* Sun rays background */}
      <div className="absolute inset-0 sun-rays opacity-40" />

      {/* Content */}
      <div className="relative container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Hero Image with enhanced 3D effect */}
        <div className="relative mb-10 animate-bounce-in group">
          {/* Glow effect behind */}
          <div className="absolute -inset-8 bg-rainbow rounded-[3rem] opacity-30 blur-2xl group-hover:opacity-40 transition-opacity" />
          
          {/* Main image */}
          <div className="relative">
            <img 
              src={heroImage} 
              alt="MAXIMATHS - Plateforme de mathématiques ludique" 
              className="w-full max-w-2xl rounded-[2rem] shadow-sticker border-[6px] border-sky-cloud transition-transform duration-300 group-hover:scale-[1.02]"
            />
            
            {/* Floating brain icon */}
            <div className="absolute -top-8 -right-8 w-20 h-20 animate-icon-float">
              <img src={brainIcon} alt="" className="w-full h-full drop-shadow-xl" />
            </div>
          </div>
        </div>

        {/* Inspirational Quotes */}
        <div className="max-w-4xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <blockquote className="relative p-6 md:p-8 bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-rainbow-yellow/30 shadow-xl mb-4 group hover:scale-[1.02] transition-transform">
            <div className="absolute -top-4 -left-2 text-6xl text-rainbow-yellow opacity-60 font-serif">«</div>
            <p className="text-xl md:text-2xl lg:text-3xl font-display text-center leading-relaxed">
              <span className="text-rainbow">Le génie, c'est 1 % d'inspiration</span>
              <br className="hidden md:block" />
              <span className="text-foreground"> et </span>
              <span className="text-rainbow-coral">99 % de transpiration.</span>
            </p>
            <footer className="mt-4 text-center">
              <cite className="text-lg md:text-xl font-body text-muted-foreground not-italic">
                — <span className="font-semibold text-rainbow-orange">Thomas Edison</span>
              </cite>
            </footer>
            <div className="absolute -bottom-4 -right-2 text-6xl text-rainbow-yellow opacity-60 font-serif rotate-180">«</div>
          </blockquote>

          <blockquote className="relative p-6 md:p-8 bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-rainbow-purple/30 shadow-xl group hover:scale-[1.02] transition-transform">
            <div className="absolute -top-4 -left-2 text-6xl text-rainbow-purple opacity-60 font-serif">«</div>
            <p className="text-xl md:text-2xl lg:text-3xl font-display text-center leading-relaxed">
              <span className="text-rainbow">Le génie, c'est 1 % de talent</span>
              <br className="hidden md:block" />
              <span className="text-foreground"> et </span>
              <span className="text-rainbow-blue">99 % de travail acharné.</span>
            </p>
            <footer className="mt-4 text-center">
              <cite className="text-lg md:text-xl font-body text-muted-foreground not-italic">
                — <span className="font-semibold text-rainbow-purple">Albert Einstein</span>
              </cite>
            </footer>
            <div className="absolute -bottom-4 -right-2 text-6xl text-rainbow-purple opacity-60 font-serif rotate-180">«</div>
          </blockquote>
        </div>

        {/* Subtitle - enhanced */}
        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground text-center max-w-3xl mb-8 animate-slide-up font-body font-semibold leading-relaxed" style={{ animationDelay: "0.4s" }}>
          La plateforme de mathématiques pour les élèves du <span className="text-rainbow-blue font-bold">Collège</span> et du <span className="text-rainbow-purple font-bold">Lycée</span>
        </p>

        {/* Class Selection - Click to expand */}
        <div className="w-full max-w-4xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <h3 className="text-xl md:text-2xl font-display text-center mb-6 text-foreground">
            Choisis ta classe 👇
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {levels.map((level) => (
              <div key={level.id} className="relative">
                <button
                  onClick={() => handleLevelClick(level.id)}
                  className={`w-full p-3 rounded-xl font-display font-bold text-sm md:text-base transition-all border-2 ${
                    expandedLevel === level.id 
                      ? `${level.color} text-white ${level.borderColor} scale-105 shadow-lg` 
                      : `bg-card ${level.textColor} ${level.borderColor} hover:scale-105 hover:shadow-md`
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    {level.label}
                    {expandedLevel === level.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>
              </div>
            ))}
          </div>

          {/* Expanded submenu */}
          {expandedLevel && (
            <div className="mt-6 p-4 bg-card/95 backdrop-blur-sm rounded-2xl border-2 border-border animate-slide-up shadow-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {getSubMenuForLevel(expandedLevel).map((item) => {
                  const level = levels.find(l => l.id === expandedLevel);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSubMenuClick(expandedLevel, item.id)}
                      className={`p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all hover:scale-105 text-left group border border-transparent hover:${level?.borderColor || 'border-border'}`}
                    >
                      <item.icon className={`w-6 h-6 mb-2 ${level?.textColor || 'text-foreground'} group-hover:scale-110 transition-transform`} />
                      <div className="font-display text-sm text-foreground">{item.label}</div>
                      <p className="text-xs text-muted-foreground font-body mt-1">{item.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;