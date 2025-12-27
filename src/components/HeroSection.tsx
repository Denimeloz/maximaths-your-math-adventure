import { Button } from "@/components/ui/button";
import { Sparkles, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/maximaths-hero.jpeg";
import brainIcon from "@/assets/brain-icon.png";

const HeroSection = () => {
  const navigate = useNavigate();

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

        {/* Title - more impactful */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-center mb-6 animate-slide-up drop-shadow-sm" style={{ animationDelay: "0.2s" }}>
          <span className="text-rainbow">Deviens un pro des maths</span>
          <br />
          <span className="text-foreground">avec </span>
          <span className="inline-block">
            <span className="text-rainbow-coral">M</span>
            <span className="text-rainbow-yellow">A</span>
            <span className="text-rainbow-orange">X</span>
            <span className="text-rainbow-pink">I</span>
            <span className="text-rainbow-purple">M</span>
            <span className="text-rainbow-blue">A</span>
            <span className="text-rainbow-green">T</span>
            <span className="text-rainbow-coral">H</span>
            <span className="text-rainbow-yellow">S</span>
          </span>
          <span className="text-foreground"> !</span>
        </h1>

        {/* Subtitle - enhanced */}
        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground text-center max-w-3xl mb-12 animate-slide-up font-body font-semibold leading-relaxed" style={{ animationDelay: "0.4s" }}>
          Cours, exercices et suivi pour le <span className="text-rainbow-blue font-bold">Collège</span> et le <span className="text-rainbow-purple font-bold">Lycée</span>. 
          <br />Apprends dans la bonne humeur ! 🎉
        </p>

        {/* Removed CTA Button - Public signup disabled */}
      </div>
    </section>
  );
};

export default HeroSection;