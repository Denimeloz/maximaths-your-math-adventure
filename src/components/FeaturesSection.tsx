import { Star, Lightbulb, BookOpen, ClipboardList, FileCheck, Megaphone } from "lucide-react";

const features = [
  {
    icon: Megaphone,
    title: "Infos pour la classe",
    description: "Retrouve ici toutes les informations importantes : dates d'examens, directives et consignes spéciales !",
    color: "bg-feature-orange",
    iconBg: "bg-rainbow-orange/20",
    iconColor: "text-rainbow-orange",
    borderColor: "border-rainbow-orange",
    emoji: "📢",
  },
  {
    icon: Lightbulb,
    title: "Activités de découverte",
    description: "Des activités interactives pour explorer et comprendre les nouvelles notions en douceur avant d'attaquer le cours !",
    color: "bg-feature-yellow",
    iconBg: "bg-rainbow-yellow/20",
    iconColor: "text-rainbow-yellow",
    borderColor: "border-rainbow-yellow",
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
  return (
    <section className="py-16 md:py-20 bg-sky-cloud relative overflow-hidden">
      {/* Decorative stars */}
      <Star className="absolute top-16 left-[10%] w-8 h-8 text-rainbow-yellow fill-rainbow-yellow opacity-60 animate-float" />
      <Star className="absolute top-32 right-[15%] w-6 h-6 text-rainbow-pink fill-rainbow-pink opacity-60 animate-float-delayed" />
      <Star className="absolute bottom-24 left-[20%] w-7 h-7 text-rainbow-purple fill-rainbow-purple opacity-60 animate-float-slow" />
      
      <div className="container mx-auto px-4 relative">
        <h2 className="text-2xl md:text-3xl font-display text-center mb-4 italic max-w-4xl mx-auto">
          <span className="text-foreground">"La vie est une équation mathématique et le défi est de transformer les </span>
          <span className="text-rainbow-coral">négatifs</span>
          <span className="text-foreground"> en </span>
          <span className="text-rainbow-green">positifs</span>
          <span className="text-foreground">."</span>
        </h2>
        <p className="text-muted-foreground text-center text-lg md:text-xl mb-12 font-body max-w-3xl mx-auto">
          La plateforme de mathématiques pour les élèves du <span className="text-rainbow-blue font-bold">Collège</span> et du <span className="text-rainbow-purple font-bold">Lycée</span>
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto mb-16">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className={`card-sticker relative ${feature.color} ${feature.borderColor} p-6 text-center`}
            >
              {/* Emoji badge */}
              <div className="absolute -top-4 -right-2 text-3xl" aria-hidden="true">
                {feature.emoji}
              </div>
              
              <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl ${feature.iconBg} flex items-center justify-center border-4 border-sky-cloud`}>
                <feature.icon className={`w-10 h-10 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg md:text-xl font-display text-foreground mb-3">{feature.title}</h3>
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