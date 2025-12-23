import { BookOpen, Calculator, TrendingUp, Star, Trophy, ChevronRight, Zap } from "lucide-react";
import brainIcon from "@/assets/brain-icon.png";

const chapters = [
  { name: "Les fractions", progress: 100, color: "bg-rainbow-green" },
  { name: "Équations du 1er degré", progress: 75, color: "bg-rainbow-blue" },
  { name: "Géométrie dans l'espace", progress: 40, color: "bg-rainbow-purple" },
  { name: "Statistiques", progress: 20, color: "bg-rainbow-pink" },
];

const DashboardPreview = () => {
  return (
    <section className="py-24 bg-hero-gradient relative overflow-hidden">
      {/* Math pattern */}
      <div className="absolute inset-0 math-pattern opacity-30" />
      
      {/* Decorative elements */}
      <Star className="absolute top-20 left-[10%] w-8 h-8 text-rainbow-yellow fill-rainbow-yellow opacity-70 animate-float" />
      <Zap className="absolute top-40 right-[15%] w-7 h-7 text-rainbow-orange fill-rainbow-orange opacity-70 animate-wiggle" />
      
      <div className="container mx-auto px-4 relative">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-display text-center mb-4">
          <span className="text-foreground">Ton </span>
          <span className="text-rainbow-blue">espace élève</span>
          <span className="text-foreground"> 📚</span>
        </h2>
        <p className="text-muted-foreground text-center text-lg md:text-xl mb-16 font-body">
          Un tableau de bord personnalisé pour suivre ta progression
        </p>

        {/* Dashboard mockup - enhanced */}
        <div className="max-w-5xl mx-auto">
          <div className="card-sticker bg-card border-rainbow-purple p-0 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar - more vibrant */}
              <div className="lg:w-72 bg-gradient-to-b from-sidebar to-rainbow-purple/90 p-6 text-sidebar-foreground">
                <div className="flex items-center gap-4 mb-10 p-4 rounded-2xl bg-sidebar-accent/30">
                  <img src={brainIcon} alt="" className="w-14 h-14 rounded-xl shadow-lg" />
                  <div>
                    <p className="font-display text-xl">Maxime</p>
                    <p className="text-sm opacity-90 font-body font-semibold">Classe de 3ème</p>
                  </div>
                </div>

                <nav className="space-y-3">
                  {[
                    { icon: BookOpen, label: "Mes cours", active: true },
                    { icon: Calculator, label: "Exercices", active: false },
                    { icon: TrendingUp, label: "Progression", active: false },
                    { icon: Trophy, label: "Succès", active: false },
                  ].map((item) => (
                    <div 
                      key={item.label}
                      className={`flex items-center gap-3 px-5 py-4 rounded-2xl cursor-pointer transition-all ${
                        item.active 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg scale-105" 
                          : "hover:bg-sidebar-accent/50 hover:scale-102"
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="font-body font-bold">{item.label}</span>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Main content - enhanced */}
              <div className="flex-1 p-6 lg:p-8 bg-gradient-to-br from-card to-sky-light">
                {/* Level badge - more game-like */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 p-6 rounded-3xl bg-gradient-to-r from-feature-orange to-rainbow-yellow/30 border-4 border-rainbow-orange shadow-lg">
                  <div className="w-20 h-20 rounded-2xl bg-rainbow-orange flex items-center justify-center shadow-lg border-4 border-rainbow-yellow/50">
                    <Star className="w-12 h-12 text-secondary-foreground fill-secondary-foreground" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm text-muted-foreground font-body font-semibold">Niveau actuel</p>
                    <p className="text-2xl md:text-3xl font-display text-foreground">Niveau 5</p>
                    <p className="text-lg font-body font-bold text-rainbow-orange">Expert des fractions</p>
                  </div>
                  <div className="text-center bg-sky-cloud rounded-2xl p-4 shadow-inner">
                    <p className="text-3xl font-display text-rainbow-orange">1250</p>
                    <p className="text-sm text-muted-foreground font-body font-semibold">XP ⚡</p>
                  </div>
                </div>

                {/* Progress bar - enhanced */}
                <div className="mb-10 p-5 rounded-2xl bg-sky-cloud border-4 border-border">
                  <div className="flex justify-between mb-3">
                    <span className="font-body font-bold text-foreground text-lg">Progression vers niveau 6</span>
                    <span className="font-display text-rainbow-purple">750/1000 XP</span>
                  </div>
                  <div className="h-6 rounded-full bg-muted overflow-hidden border-2 border-border">
                    <div 
                      className="h-full bg-rainbow rounded-full transition-all duration-500 shadow-inner"
                      style={{ width: "75%" }}
                    />
                  </div>
                </div>

                {/* Chapters - enhanced cards */}
                <h3 className="font-display text-2xl text-foreground mb-6">Chapitres récents 📖</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  {chapters.map((chapter) => (
                    <div 
                      key={chapter.name}
                      className="p-5 rounded-2xl bg-sky-cloud border-4 border-border hover:border-rainbow-purple hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-body font-bold text-foreground text-lg">{chapter.name}</span>
                        <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-rainbow-purple group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-4 rounded-full bg-border overflow-hidden border-2 border-muted">
                          <div 
                            className={`h-full ${chapter.color} rounded-full transition-all duration-500`}
                            style={{ width: `${chapter.progress}%` }}
                          />
                        </div>
                        <span className="text-lg font-display text-muted-foreground">{chapter.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;