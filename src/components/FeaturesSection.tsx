import { Play, Brain, Ruler, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Play,
    title: "Cours & Vidéos",
    description: "Des leçons claires et des vidéos explicatives pour tout comprendre !",
    color: "bg-feature-blue",
    iconColor: "text-rainbow-blue",
    borderColor: "border-rainbow-blue",
  },
  {
    icon: Brain,
    title: "Quiz Fun",
    description: "Teste tes connaissances avec des quiz interactifs et amusants !",
    color: "bg-feature-purple",
    iconColor: "text-rainbow-purple",
    borderColor: "border-rainbow-purple",
  },
  {
    icon: Ruler,
    title: "Entraînement",
    description: "Des exercices progressifs pour maîtriser chaque notion.",
    color: "bg-feature-orange",
    iconColor: "text-rainbow-orange",
    borderColor: "border-rainbow-orange",
  },
  {
    icon: TrendingUp,
    title: "Ton Suivi",
    description: "Visualise ta progression et deviens expert étape par étape !",
    color: "bg-feature-green",
    iconColor: "text-rainbow-green",
    borderColor: "border-rainbow-green",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-sky-cloud relative">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-display text-center mb-4">
          <span className="text-foreground">Tout ce qu'il te faut pour </span>
          <span className="text-rainbow-orange">cartonner</span>
          <span className="text-foreground"> 🚀</span>
        </h2>
        <p className="text-muted-foreground text-center text-lg mb-12 font-body">
          Des outils de réussite pensés pour toi
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`card-cartoon ${feature.color} ${feature.borderColor} p-6 text-center group hover:scale-105 transition-transform`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-cloud flex items-center justify-center shadow-lg group-hover:animate-wiggle`}>
                <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl font-display text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground font-body text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
