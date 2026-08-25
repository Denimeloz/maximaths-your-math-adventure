import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Target, 
  Users, 
  Sparkles, 
  GraduationCap,
  BookOpen,
  Star,
  ArrowRight,
  Mail
} from 'lucide-react';
import brainIcon from '@/assets/brain-icon.png';

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Heart,
      title: 'Passion',
      description: 'Transmettre l\'amour des mathématiques à chaque élève',
      color: 'text-rainbow-pink',
      bg: 'bg-rainbow-pink/20',
    },
    {
      icon: Target,
      title: 'Excellence',
      description: 'Des cours de qualité pour une compréhension optimale',
      color: 'text-rainbow-blue',
      bg: 'bg-rainbow-blue/20',
    },
    {
      icon: Users,
      title: 'Accessibilité',
      description: 'Une plateforme gratuite pour tous les élèves',
      color: 'text-rainbow-green',
      bg: 'bg-rainbow-green/20',
    },
    {
      icon: Sparkles,
      title: 'Innovation',
      description: 'Des méthodes modernes et interactives',
      color: 'text-rainbow-purple',
      bg: 'bg-rainbow-purple/20',
    },
  ];

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-purple/20 rounded-full mb-6">
            <Star className="w-5 h-5 text-rainbow-yellow fill-rainbow-yellow" />
            <span className="text-rainbow-purple font-body font-semibold">Notre histoire</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-foreground mb-6">
            À propos de
            <span className="text-rainbow"> MAXIMATHS</span>
          </h1>
          
          <p className="text-xl text-muted-foreground font-body max-w-3xl mx-auto mb-12">
            Une plateforme créée avec passion pour rendre les mathématiques 
            accessibles et amusantes pour tous les élèves.
          </p>

          <div className="relative max-w-md mx-auto mb-16">
            <div className="absolute -inset-4 bg-rainbow rounded-3xl opacity-20 blur-xl" />
            <img 
              src={brainIcon} 
              alt="MAXIMATHS Logo" 
              className="relative w-40 h-40 mx-auto drop-shadow-xl"
            />
          </div>
        </section>

        {/* Story Section */}
        <section className="bg-card/50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="card-sticker bg-card border-rainbow-blue/30 p-8 md:p-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-rainbow-blue/20 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-rainbow-blue" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display text-foreground">
                    Notre Mission
                  </h2>
                </div>
                
                <p className="text-lg text-muted-foreground font-body leading-relaxed mb-6">
                  MAXIMATHS est née d'une conviction simple : chaque élève peut réussir 
                  en mathématiques avec les bons outils et la bonne approche. Notre plateforme 
                  propose des cours structurés, des exercices interactifs et un suivi 
                  personnalisé pour accompagner les élèves du collège au lycée.
                </p>
                
                <p className="text-lg text-muted-foreground font-body leading-relaxed">
                  Créée par <strong className="text-foreground">APELETE Maxime</strong>, 
                  passionné de mathématiques et de pédagogie, MAXIMATHS vise à démystifier 
                  les maths et à donner confiance à chaque élève dans sa capacité à progresser.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-display text-center text-foreground mb-4">
              Nos <span className="text-rainbow">Valeurs</span>
            </h2>
            <p className="text-center text-muted-foreground font-body mb-12 max-w-2xl mx-auto">
              Les principes qui guident notre approche pédagogique
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="card-sticker bg-card border-border p-6 text-center group hover:scale-105 transition-transform"
                >
                  <div className={`w-16 h-16 rounded-2xl ${value.bg} flex items-center justify-center mx-auto mb-4`}>
                    <value.icon className={`w-8 h-8 ${value.color}`} />
                  </div>
                  <h3 className="text-xl font-display text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground font-body text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Levels Section */}
        <section className="bg-card/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-display text-center text-foreground mb-12">
              Pour qui ?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div 
                onClick={() => navigate('/college')}
                className="card-sticker bg-gradient-to-br from-rainbow-blue/10 to-rainbow-green/10 border-rainbow-blue/30 p-8 cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-rainbow-blue/20 flex items-center justify-center">
                    <GraduationCap className="w-7 h-7 text-rainbow-blue" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display text-foreground">Collège</h3>
                    <p className="text-muted-foreground font-body">6ème à 3ème</p>
                  </div>
                </div>
                <p className="text-muted-foreground font-body mb-4">
                  Des cours adaptés pour maîtriser les bases et préparer le brevet.
                </p>
                <Button variant="ghost" className="group-hover:bg-rainbow-blue/10">
                  Découvrir
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div 
                onClick={() => navigate('/lycee')}
                className="card-sticker bg-gradient-to-br from-rainbow-purple/10 to-rainbow-pink/10 border-rainbow-purple/30 p-8 cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-rainbow-purple/20 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-rainbow-purple" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display text-foreground">Lycée</h3>
                    <p className="text-muted-foreground font-body">Seconde à Terminale</p>
                  </div>
                </div>
                <p className="text-muted-foreground font-body mb-4">
                  Des cours approfondis pour réussir le baccalauréat.
                </p>
                <Button variant="ghost" className="group-hover:bg-rainbow-purple/10">
                  Découvrir
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="card-sticker bg-gradient-to-r from-rainbow-orange/10 to-rainbow-yellow/10 border-rainbow-orange/30 p-8 md:p-12 text-center max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-display text-foreground mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-muted-foreground font-body mb-8 text-lg">
                Rejoins des milliers d'élèves qui progressent chaque jour avec MAXIMATHS !
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => window.location.href = 'mailto:maximathsclasse@gmail.com'}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Nous contacter
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;