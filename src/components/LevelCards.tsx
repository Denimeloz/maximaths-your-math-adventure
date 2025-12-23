import { Button } from "@/components/ui/button";
import { Brain, Calculator, ChevronRight } from "lucide-react";

const LevelCards = () => {
  const collegeClasses = ["6ème", "5ème", "4ème", "3ème"];
  const lyceeClasses = ["2nde", "1ère", "Terminale"];

  return (
    <section className="py-20 bg-sky-light relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-sky-base to-transparent" />
      
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-display text-center mb-4">
          <span className="text-foreground">Choisis ton </span>
          <span className="text-rainbow">niveau</span>
          <span className="text-foreground"> ! 🎯</span>
        </h2>
        <p className="text-muted-foreground text-center text-lg mb-12 font-body">
          Sélectionne ta classe pour accéder à tes cours
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Collège Card */}
          <div className="card-cartoon bg-feature-green border-rainbow-green p-8 group cursor-pointer">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-rainbow-green/30 flex items-center justify-center">
                <Brain className="w-10 h-10 text-rainbow-green" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-display text-foreground">Collège</h3>
                <p className="text-muted-foreground font-body">De la 6ème à la 3ème</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {collegeClasses.map((classe) => (
                <div 
                  key={classe}
                  className="bg-sky-cloud rounded-xl py-3 px-4 text-center font-body font-bold text-foreground border-2 border-transparent hover:border-rainbow-green hover:scale-105 transition-all cursor-pointer"
                >
                  {classe}
                </div>
              ))}
            </div>

            <Button variant="default" className="w-full gap-2 bg-rainbow-green hover:bg-rainbow-green/90 text-foreground">
              Explorer le Collège
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Lycée Card */}
          <div className="card-cartoon bg-feature-purple border-rainbow-purple p-8 group cursor-pointer">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-rainbow-purple/30 flex items-center justify-center">
                <Calculator className="w-10 h-10 text-rainbow-purple" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-display text-foreground">Lycée</h3>
                <p className="text-muted-foreground font-body">De la 2nde à la Terminale</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {lyceeClasses.map((classe) => (
                <div 
                  key={classe}
                  className="bg-sky-cloud rounded-xl py-3 px-4 text-center font-body font-bold text-foreground border-2 border-transparent hover:border-rainbow-purple hover:scale-105 transition-all cursor-pointer"
                >
                  {classe}
                </div>
              ))}
              {/* E=mc² decoration */}
              <div className="bg-rainbow-purple/20 rounded-xl py-3 px-4 text-center font-display text-rainbow-purple text-lg flex items-center justify-center">
                E=mc²
              </div>
            </div>

            <Button variant="default" className="w-full gap-2 bg-rainbow-purple hover:bg-rainbow-purple/90 text-accent-foreground">
              Explorer le Lycée
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LevelCards;
