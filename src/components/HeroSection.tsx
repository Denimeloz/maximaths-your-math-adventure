import { Button } from "@/components/ui/button";
import { Sparkles, Star, Zap, ChevronDown, ChevronUp, BookOpen, Lightbulb, ClipboardList, FileCheck, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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

const quotes = [
  {
    text1: "Le génie, c'est 1 % d'inspiration",
    text2: "99 % de transpiration.",
    author: "Thomas Edison",
    borderColor: "border-rainbow-yellow/30",
    quoteColor: "text-rainbow-yellow",
    highlightColor: "text-rainbow-coral",
    authorColor: "text-rainbow-orange",
  },
  {
    text1: "Le génie, c'est 1 % de talent",
    text2: "99 % de travail acharné.",
    author: "Albert Einstein",
    borderColor: "border-rainbow-purple/30",
    quoteColor: "text-rainbow-purple",
    highlightColor: "text-rainbow-blue",
    authorColor: "text-rainbow-purple",
  },
];

const QuotesCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideDirection('left');
      setIsSliding(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
        setIsSliding(false);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleIndicatorClick = (index: number) => {
    if (index === currentIndex) return;
    setSlideDirection(index > currentIndex ? 'left' : 'right');
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsSliding(false);
    }, 500);
  };

  const quote = quotes[currentIndex];

  return (
    <div className="max-w-2xl mx-auto mb-6 animate-slide-up px-4" style={{ animationDelay: "0.2s" }}>
      <div className="relative min-h-[120px] md:min-h-[140px] overflow-hidden">
        <blockquote
          key={currentIndex}
          className={`absolute inset-0 p-4 md:p-6 bg-card/90 backdrop-blur-md rounded-xl border-2 ${quote.borderColor} shadow-lg transition-all duration-500 ease-out ${
            isSliding 
              ? slideDirection === 'left' 
                ? '-translate-x-full opacity-0' 
                : 'translate-x-full opacity-0'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <div className={`absolute -top-2 -left-1 text-4xl ${quote.quoteColor} opacity-50 font-serif`}>«</div>
          <p className="text-base md:text-lg lg:text-xl font-display text-center leading-relaxed pt-2">
            <span className="text-rainbow">{quote.text1}</span>
            <span className="text-foreground"> et </span>
            <span className={quote.highlightColor}>{quote.text2}</span>
          </p>
          <footer className="mt-2 text-center">
            <cite className="text-sm md:text-base font-body text-muted-foreground not-italic">
              — <span className={`font-semibold ${quote.authorColor}`}>{quote.author}</span>
            </cite>
          </footer>
          <div className={`absolute -bottom-2 -right-1 text-4xl ${quote.quoteColor} opacity-50 font-serif rotate-180`}>«</div>
        </blockquote>
      </div>
      
      {/* Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {quotes.map((_, index) => (
          <button
            key={index}
            onClick={() => handleIndicatorClick(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-primary scale-110"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Citation ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
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

        {/* Inspirational Quotes - Animated Carousel */}
        <QuotesCarousel />

        {/* Subtitle - enhanced */}
        <p className="text-base md:text-lg lg:text-xl text-muted-foreground text-center max-w-3xl mb-8 animate-slide-up font-body font-medium italic leading-relaxed" style={{ animationDelay: "0.4s" }}>
          "La vie est une équation mathématique et le défi est de transformer les <span className="text-rainbow-coral font-bold">négatifs</span> en <span className="text-rainbow-green font-bold">positifs</span>."
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