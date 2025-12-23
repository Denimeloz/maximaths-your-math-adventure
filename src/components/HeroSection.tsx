import { Button } from "@/components/ui/button";
import { Sparkles, Star } from "lucide-react";
import heroImage from "@/assets/maximaths-hero.jpeg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-sky-gradient overflow-hidden pt-20">
      {/* Decorative clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="cloud w-40 h-20 top-24 left-10 opacity-80 animate-float" />
        <div className="cloud w-60 h-28 top-32 right-20 opacity-70 animate-float-delayed" />
        <div className="cloud w-32 h-16 top-48 left-1/4 opacity-60 animate-float" />
        <div className="cloud w-48 h-24 bottom-40 right-1/3 opacity-70 animate-float-delayed" />
        
        {/* Decorative stars */}
        <Star className="absolute top-32 left-20 w-6 h-6 text-rainbow-yellow fill-rainbow-yellow twinkle" />
        <Star className="absolute top-40 right-32 w-4 h-4 text-rainbow-pink fill-rainbow-pink twinkle" style={{ animationDelay: "0.5s" }} />
        <Star className="absolute top-60 left-1/3 w-5 h-5 text-rainbow-purple fill-rainbow-purple twinkle" style={{ animationDelay: "1s" }} />
        <Star className="absolute bottom-60 right-1/4 w-6 h-6 text-rainbow-orange fill-rainbow-orange twinkle" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Sun rays background */}
      <div className="absolute inset-0 sun-rays opacity-30" />

      {/* Content */}
      <div className="relative container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Hero Image */}
        <div className="relative mb-8 animate-bounce-in">
          <img 
            src={heroImage} 
            alt="MAXIMATHS - Plateforme de mathématiques ludique" 
            className="w-full max-w-2xl rounded-3xl shadow-2xl border-4 border-sky-cloud"
          />
          <div className="absolute -inset-4 bg-rainbow rounded-[2rem] opacity-20 blur-xl -z-10" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-center mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <span className="text-rainbow">Deviens un pro des maths</span>
          <br />
          <span className="text-foreground">avec </span>
          <span className="text-rainbow-yellow">MAXI</span>
          <span className="text-rainbow-purple">MATHS</span>
          <span className="text-foreground"> !</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl mb-10 animate-slide-up font-body font-semibold" style={{ animationDelay: "0.4s" }}>
          Cours, exercices et suivi pour le <span className="text-rainbow-blue font-bold">Collège</span> et le <span className="text-rainbow-purple font-bold">Lycée</span>. 
          <br />Apprends dans la bonne humeur ! 🎉
        </p>

        {/* CTA Button */}
        <div className="animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <Button variant="hero" size="xl" className="gap-3 text-xl">
            <Sparkles className="w-6 h-6" />
            Commencer l'aventure
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-4 border-muted-foreground/30 flex items-start justify-center pt-2">
            <div className="w-2 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
