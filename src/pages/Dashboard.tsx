import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  User, 
  BookOpen, 
  Trophy, 
  Settings, 
  LogOut, 
  Star,
  Sparkles,
  GraduationCap,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground font-body">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const stats = [
    { icon: BookOpen, label: 'Cours suivis', value: '0', color: 'text-rainbow-blue' },
    { icon: Target, label: 'Exercices', value: '0', color: 'text-rainbow-green' },
    { icon: Trophy, label: 'Badges', value: '0', color: 'text-rainbow-yellow' },
    { icon: TrendingUp, label: 'Progression', value: '0%', color: 'text-rainbow-purple' },
  ];

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="text-2xl font-display text-rainbow"
          >
            MAXIMATHS
          </button>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <span className="px-3 py-1 bg-rainbow-purple/20 text-rainbow-purple rounded-full text-sm font-body font-semibold">
                Admin
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="card-sticker bg-card border-rainbow-purple/30 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
              <User className="w-12 h-12 text-secondary-foreground" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-display text-foreground mb-2">
                Bienvenue, {profile?.first_name || 'Aventurier'} ! 
                <Sparkles className="inline-block w-8 h-8 ml-2 text-rainbow-yellow" />
              </h1>
              <p className="text-muted-foreground font-body">
                {profile?.profession || 'Explorateur des maths'} • {profile?.level === 'college' ? 'Collège' : profile?.level === 'lycee' ? 'Lycée' : 'Multi-niveau'}
              </p>
            </div>
            <div className="md:ml-auto flex gap-2">
              <Button 
                variant="outline" 
                className="rounded-xl border-2"
              >
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="card-cartoon bg-card border-border p-6 text-center"
            >
              <stat.icon className={`w-10 h-10 mx-auto mb-3 ${stat.color}`} />
              <p className="text-3xl font-display text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground font-body">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main content placeholder */}
        <div className="card-sticker bg-card border-rainbow-blue/30 p-12 text-center">
          <GraduationCap className="w-20 h-20 mx-auto mb-6 text-rainbow-blue opacity-50" />
          <h2 className="text-2xl font-display text-foreground mb-4">
            Votre aventure commence bientôt !
          </h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto mb-8">
            Les cours, exercices et quiz seront bientôt disponibles. 
            Revenez vite pour commencer votre apprentissage !
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              className="btn-3d bg-primary hover:bg-primary/90 rounded-xl"
            >
              <Star className="w-4 h-4 mr-2" />
              Explorer les niveaux
            </Button>
          </div>
        </div>

        {/* Activity placeholder */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="card-cartoon bg-card border-border p-6">
            <h3 className="text-xl font-display text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rainbow-orange" />
              Activité récente
            </h3>
            <p className="text-muted-foreground font-body text-center py-8">
              Aucune activité pour le moment
            </p>
          </div>
          
          <div className="card-cartoon bg-card border-border p-6">
            <h3 className="text-xl font-display text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-rainbow-yellow" />
              Mes badges
            </h3>
            <p className="text-muted-foreground font-body text-center py-8">
              Complétez des activités pour débloquer des badges !
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
