import { Play, Brain, Ruler, TrendingUp, Star, Lightbulb, BookOpen, ClipboardList, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Lightbulb,
    title: "Activités de découverte",
    description: "Des activités interactives pour explorer et comprendre les nouvelles notions en douceur avant d'attaquer le cours !",
    color: "bg-feature-yellow",
    iconBg: "bg-rainbow-yellow/20",
    iconColor: "text-rainbow-yellow",
    borderColor: "border-rainbow-yellow",
    shadowColor: "shadow-glow-yellow",
    emoji: "💡",
  },
  {
    icon: BookOpen,
    title: "Cours structurés",
    description: "Des leçons claires avec des exemples, des définitions et des propriétés pour maîtriser chaque chapitre du programme !",
    color: "bg-feature-blue",
    iconBg: "bg-rainbow-blue/20",
    iconColor: "text-rainbow-blue",
    borderColor: "border-rainbow-blue",
    shadowColor: "shadow-glow-blue",
    emoji: "📚",
  },
  {
    icon: ClipboardList,
    title: "Devoirs de niveaux",
    description: "Des exercices progressifs adaptés à ton niveau pour t'entraîner et consolider tes acquis étape par étape.",
    color: "bg-feature-purple",
    iconBg: "bg-rainbow-purple/20",
    iconColor: "text-rainbow-purple",
    borderColor: "border-rainbow-purple",
    shadowColor: "shadow-glow-purple",
    emoji: "✏️",
  },
  {
    icon: FileCheck,
    title: "Évaluations",
    description: "Teste tes connaissances avec des contrôles type et prépare-toi sereinement aux examens !",
    color: "bg-feature-green",
    iconBg: "bg-rainbow-green/20",
    iconColor: "text-rainbow-green",
    borderColor: "border-rainbow-green",
    shadowColor: "shadow-glow-blue",
    emoji: "📝",
  },
];

const platformDetails = [
  {
    title: "Du collège au lycée",
    description: "Contenu adapté de la 6ème à la Terminale, suivant le programme officiel de l'Éducation nationale.",
    icon: "🎓",
  },
  {
    title: "Préparation au brevet",
    description: "Annales, exercices types et méthodologie pour réussir le DNB avec confiance.",
    icon: "🏆",
  },
  {
    title: "Automatismes",
    description: "Exercices de calcul mental et techniques de base pour développer tes réflexes mathématiques.",
    icon: "⚡",
  },
  {
    title: "Corrections détaillées",
    description: "Chaque exercice est accompagné d'une correction complète et expliquée pas à pas.",
    icon: "✅",
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-sky-cloud relative overflow-hidden">
      {/* Decorative stars */}
      <Star className="absolute top-16 left-[10%] w-8 h-8 text-rainbow-yellow fill-rainbow-yellow opacity-60 animate-float" />
      <Star className="absolute top-32 right-[15%] w-6 h-6 text-rainbow-pink fill-rainbow-pink opacity-60 animate-float-delayed" />
      <Star className="absolute bottom-24 left-[20%] w-7 h-7 text-rainbow-purple fill-rainbow-purple opacity-60 animate-float-slow" />
      
      <div className="container mx-auto px-4 relative">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-display text-center mb-4">
          <span className="text-foreground">Tout ce qu'il te faut pour </span>
          <span className="text-rainbow-orange">réussir en maths</span>
          <span className="text-foreground"> 🚀</span>
        </h2>
        <p className="text-muted-foreground text-center text-lg md:text-xl mb-16 font-body max-w-3xl mx-auto">
          Une plateforme complète avec des cours, exercices et évaluations pour progresser à ton rythme du collège au lycée
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-20">
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
              <p className="text-muted-foreground font-body text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Platform details section */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-display text-center mb-12">
            <span className="text-foreground">Ce que </span>
            <span className="text-rainbow-purple">MAXIMATHS</span>
            <span className="text-foreground"> t'offre</span>
          </h3>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {platformDetails.map((detail, index) => (
              <div 
                key={detail.title}
                className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border hover:border-rainbow-purple/30 transition-colors"
              >
                <span className="text-3xl">{detail.icon}</span>
                <div>
                  <h4 className="font-display text-lg text-foreground mb-1">{detail.title}</h4>
                  <p className="text-muted-foreground font-body text-sm">{detail.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;