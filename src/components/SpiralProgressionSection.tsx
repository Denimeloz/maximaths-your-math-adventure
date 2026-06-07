import { useNavigate } from "react-router-dom";
import { Spline, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LEVELS = [
  { id: '6eme', label: '6ème', color: 'rainbow-blue' },
  { id: '5eme', label: '5ème', color: 'rainbow-green' },
  { id: '4eme', label: '4ème', color: 'rainbow-orange' },
  { id: '3eme', label: '3ème', color: 'rainbow-coral' },
  { id: 'seconde', label: 'Seconde', color: 'rainbow-purple' },
  { id: 'premiere', label: 'Première', color: 'rainbow-pink' },
  { id: 'terminale', label: 'Terminale', color: 'rainbow-blue' },
];

const SpiralProgressionSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-gradient-to-b from-background to-sky-cloud/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center shadow-lg shadow-rainbow-purple/30">
              <Spline className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display mb-3">
            <span className="text-foreground">Progression </span>
            <span className="text-rainbow-purple">Spiralée</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body">
            Retrouve facilement les fiches, exercices, vidéos et ressources à travailler selon ta classe — toute l'année.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 max-w-6xl mx-auto mb-8">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => navigate(`/progression-spiralee?niveau=${lvl.id}`)}
              className={`group relative rounded-2xl border-2 border-${lvl.color}/30 hover:border-${lvl.color} bg-card p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-${lvl.color}/15 flex items-center justify-center`}>
                <Spline className={`w-5 h-5 text-${lvl.color}`} />
              </div>
              <p className={`font-display text-foreground group-hover:text-${lvl.color} transition-colors`}>
                {lvl.label}
              </p>
            </button>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={() => navigate('/progression-spiralee')}
            className="rounded-xl bg-rainbow-purple text-white hover:bg-rainbow-purple/90 shadow-btn hover:shadow-btn-hover"
          >
            <Spline className="w-4 h-4 mr-2" />
            Voir toute la progression
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SpiralProgressionSection;
