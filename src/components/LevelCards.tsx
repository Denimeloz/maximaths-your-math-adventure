import { Button } from "@/components/ui/button";
import { ChevronRight, Calculator, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import brainIcon from "@/assets/brain-icon.png";

const LevelCards = () => {
  const navigate = useNavigate();
  const collegeClasses = ["6ème", "5ème", "4ème", "3ème"];
  const lyceeClasses = ["2nde", "1ère", "Terminale"];

  return (
    <section className="py-24 bg-sky-light relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-sky-base/50 to-transparent" />
      <div className="absolute inset-0 math-pattern opacity-30" />
      
      <div className="container mx-auto px-4 relative">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-display text-center mb-4">
          <span className="text-foreground">Choisis ton </span>
          <span className="text-rainbow">niveau</span>
          <span className="text-foreground"> ! 🎯</span>
        </h2>
        <p className="text-muted-foreground text-center text-lg md:text-xl mb-16 font-body">
          Sélectionne ta classe pour accéder à tes cours
        </p>

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Collège Card */}
          <div className="card-sticker bg-gradient-to-br from-feature-green to-feature-blue border-rainbow-green p-8 group cursor-pointer sticker-wiggle">
            {/* Floating icon */}
            <div className="absolute -top-10 -right-6 w-24 h-24 animate-icon-float">
              <img src={brainIcon} alt="" className="w-full h-full drop-shadow-xl" />
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-rainbow-green/30 flex items-center justify-center shadow-inner-glow border-4 border-rainbow-green/50">
                <Sparkles className="w-10 h-10 text-rainbow-green" />
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-display text-foreground">Collège</h3>
                <p className="text-muted-foreground font-body font-semibold">De la 6ème à la 3ème</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {collegeClasses.map((classe, index) => (
                <div 
                  key={classe}
                  className="bg-sky-cloud rounded-2xl py-4 px-5 text-center font-body font-bold text-foreground border-4 border-transparent hover:border-rainbow-green hover:scale-105 hover:shadow-glow-blue transition-all cursor-pointer shadow-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {classe}
                </div>
              ))}
            </div>

            <Button 
              variant="default" 
              className="w-full gap-2 bg-rainbow-green hover:bg-rainbow-green/90 text-foreground h-14 text-lg shadow-[0_6px_0_hsl(145_70%_35%)] hover:shadow-[0_4px_0_hsl(145_70%_35%)] hover:translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_hsl(145_70%_35%)]"
              onClick={() => navigate('/college')}
            >
              Explorer le Collège
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Lycée Card */}
          <div className="card-sticker bg-gradient-to-br from-feature-purple to-feature-pink border-rainbow-purple p-8 group cursor-pointer sticker-wiggle">
            {/* Floating icon */}
            <div className="absolute -top-10 -left-6 w-24 h-24 animate-icon-float" style={{ animationDelay: "0.5s" }}>
              <div className="w-full h-full bg-rainbow-purple/20 rounded-2xl flex items-center justify-center border-4 border-rainbow-purple/30 shadow-xl">
                <Calculator className="w-12 h-12 text-rainbow-purple" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-rainbow-purple/30 flex items-center justify-center shadow-inner-glow border-4 border-rainbow-purple/50">
                <Calculator className="w-10 h-10 text-rainbow-purple" />
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-display text-foreground">Lycée</h3>
                <p className="text-muted-foreground font-body font-semibold">De la 2nde à la Terminale</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {lyceeClasses.map((classe, index) => (
                <div 
                  key={classe}
                  className="bg-sky-cloud rounded-2xl py-4 px-5 text-center font-body font-bold text-foreground border-4 border-transparent hover:border-rainbow-purple hover:scale-105 hover:shadow-glow-purple transition-all cursor-pointer shadow-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {classe}
                </div>
              ))}
              {/* E=mc² decoration */}
              <div className="bg-rainbow-purple/20 rounded-2xl py-4 px-5 text-center font-display text-rainbow-purple text-xl flex items-center justify-center border-4 border-rainbow-purple/30 shadow-lg">
                E=mc²
              </div>
            </div>

            <Button 
              variant="default" 
              className="w-full gap-2 bg-rainbow-purple hover:bg-rainbow-purple/90 text-accent-foreground h-14 text-lg shadow-[0_6px_0_hsl(260_50%_45%)] hover:shadow-[0_4px_0_hsl(260_50%_45%)] hover:translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_hsl(260_50%_45%)]"
              onClick={() => navigate('/lycee')}
            >
              Explorer le Lycée
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LevelCards;