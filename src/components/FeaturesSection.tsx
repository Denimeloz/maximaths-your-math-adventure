import { Play, Brain, Ruler, TrendingUp, Star } from "lucide-react";

const features = [
  {
    icon: Play,
    title: "Cours & Vidéos",
    description: "Des leçons claires et des vidéos explicatives pour tout comprendre !",
    color: "bg-feature-blue",
    iconBg: "bg-rainbow-blue/20",
    iconColor: "text-rainbow-blue",
    borderColor: "border-rainbow-blue",
    shadowColor: "shadow-glow-blue",
    emoji: "📚",
  },
  {
    icon: Brain,
    title: "Quiz Fun",
    description: "Teste tes connaissances avec des quiz interactifs et amusants !",
    color: "bg-feature-purple",
    iconBg: "bg-rainbow-purple/20",
    iconColor: "text-rainbow-purple",
    borderColor: "border-rainbow-purple",
    shadowColor: "shadow-glow-purple",
    emoji: "🧠",
  },
  {
    icon: Ruler,
    title: "Entraînement",
    description: "Des exercices progressifs pour maîtriser chaque notion.",
    color: "bg-feature-orange",
    iconBg: "bg-rainbow-orange/20",
    iconColor: "text-rainbow-orange",
    borderColor: "border-rainbow-orange",
    shadowColor: "shadow-glow-yellow",
    emoji: "✏️",
  },
  {
    icon: TrendingUp,
    title: "Ton Suivi",
    description: "Visualise ta progression et deviens expert étape par étape !",
    color: "bg-feature-green",
    iconBg: "bg-rainbow-green/20",
    iconColor: "text-rainbow-green",
    borderColor: "border-rainbow-green",
    shadowColor: "shadow-glow-blue",
    emoji: "📈",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-sky-cloud relative overflow-hidden">
      {/* Decorative stars */}
      <Star className="absolute top-16 left-[10%] w-8 h-8 text-rainbow-yellow fill-rainbow-yellow opacity-60 animate-float" />
      <Star className="absolute top-32 right-[15%] w-6 h-6 text-rainbow-pink fill-rainbow-pink opacity-60 animate-float-delayed" />
      <Star className="absolute bottom-24 left-[20%] w-7 h-7 text-rainbow-purple fill-rainbow-purple opacity-60 animate-float-slow" />
      
      <div className="container mx-auto px-4 relative">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-display text-center mb-4">
          <span className="text-foreground">Tout ce qu'il te faut pour </span>
          <span className="text-rainbow-orange">cartonner</span>
          <span className="text-foreground"> 🚀</span>
        </h2>
        <p className="text-muted-foreground text-center text-lg md:text-xl mb-16 font-body">
          Des outils de réussite pensés pour toi
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`card-sticker ${feature.color} ${feature.borderColor} p-6 text-center group hover:${feature.shadowColor} transition-all`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Emoji badge */}
              <div className="absolute -top-4 -right-2 text-3xl animate-wiggle">
                {feature.emoji}
              </div>
              
              <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl ${feature.iconBg} flex items-center justify-center shadow-lg border-4 border-sky-cloud group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <feature.icon className={`w-10 h-10 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl md:text-2xl font-display text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground font-body">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;