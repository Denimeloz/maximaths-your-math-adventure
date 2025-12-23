import { BookOpen, Calculator, TrendingUp, Star, Trophy, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const chapters = [
  { name: "Les fractions", progress: 100, color: "bg-rainbow-green" },
  { name: "Équations du 1er degré", progress: 75, color: "bg-rainbow-blue" },
  { name: "Géométrie dans l'espace", progress: 40, color: "bg-rainbow-purple" },
  { name: "Statistiques", progress: 20, color: "bg-rainbow-pink" },
];

const DashboardPreview = () => {
  return (
    <section className="py-20 bg-sky-gradient relative overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-display text-center mb-4">
          <span className="text-foreground">Ton </span>
          <span className="text-rainbow-blue">espace élève</span>
          <span className="text-foreground"> 📚</span>
        </h2>
        <p className="text-muted-foreground text-center text-lg mb-12 font-body">
          Un tableau de bord personnalisé pour suivre ta progression
        </p>

        {/* Dashboard mockup */}
        <div className="max-w-5xl mx-auto">
          <div className="card-cartoon bg-card border-rainbow-purple p-0 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar */}
              <div className="lg:w-64 bg-sidebar p-6 text-sidebar-foreground">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-full bg-sidebar-primary flex items-center justify-center">
                    <span className="text-xl font-display text-sidebar-primary-foreground">M</span>
                  </div>
                  <div>
                    <p className="font-display text-lg">Maxime</p>
                    <p className="text-sm opacity-80 font-body">Classe de 3ème</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  {[
                    { icon: BookOpen, label: "Mes cours", active: true },
                    { icon: Calculator, label: "Exercices", active: false },
                    { icon: TrendingUp, label: "Progression", active: false },
                    { icon: Trophy, label: "Succès", active: false },
                  ].map((item) => (
                    <div 
                      key={item.label}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                        item.active 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-body font-semibold">{item.label}</span>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Main content */}
              <div className="flex-1 p-6 lg:p-8">
                {/* Level badge */}
                <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-feature-orange border-2 border-rainbow-orange">
                  <div className="w-14 h-14 rounded-xl bg-rainbow-orange flex items-center justify-center">
                    <Star className="w-8 h-8 text-secondary-foreground fill-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground font-body">Niveau actuel</p>
                    <p className="text-xl font-display text-foreground">Niveau 5 - Expert des fractions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display text-rainbow-orange">1250 XP</p>
                    <p className="text-sm text-muted-foreground font-body">Points d'expérience</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    <span className="font-body font-semibold text-foreground">Progression vers niveau 6</span>
                    <span className="font-body text-muted-foreground">750/1000 XP</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-rainbow rounded-full transition-all duration-500"
                      style={{ width: "75%" }}
                    />
                  </div>
                </div>

                {/* Chapters */}
                <h3 className="font-display text-xl text-foreground mb-4">Chapitres récents</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {chapters.map((chapter) => (
                    <div 
                      key={chapter.name}
                      className="p-4 rounded-2xl bg-muted/50 border-2 border-border hover:border-rainbow-purple hover:scale-[1.02] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-body font-bold text-foreground">{chapter.name}</span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-rainbow-purple group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                          <div 
                            className={`h-full ${chapter.color} rounded-full transition-all duration-500`}
                            style={{ width: `${chapter.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-body text-muted-foreground">{chapter.progress}%</span>
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
