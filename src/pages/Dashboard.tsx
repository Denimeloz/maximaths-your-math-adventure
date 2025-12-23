import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { UserProfileCard } from '@/components/UserProfileCard';
import { 
  BookOpen, 
  Trophy, 
  Star,
  Sparkles,
  GraduationCap,
  Target,
  Clock,
  TrendingUp,
  ArrowRight,
  Play,
  CheckCircle,
  Menu
} from 'lucide-react';

interface UserStats {
  coursesCompleted: number;
  exercisesCompleted: number;
  badges: number;
  progression: number;
}

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  category: string;
}

const Dashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats>({
    coursesCompleted: 0,
    exercisesCompleted: 0,
    badges: 0,
    progression: 0,
  });
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setStatsLoading(true);
    
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user?.id);
    
    const completedExercises = progress?.filter(p => p.is_completed).length || 0;
    
    const { data: badgesData } = await supabase
      .from('user_badges')
      .select('badge_id, badges(id, name, description, icon)')
      .eq('user_id', user?.id);
    
    const badges = badgesData?.map(b => (b.badges as unknown as Badge)) || [];
    
    const userLevel = profile?.level;
    type CourseLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';
    let levelFilter: CourseLevel[] = [];
    
    if (userLevel === 'college') {
      levelFilter = ['6eme', '5eme', '4eme', '3eme'];
    } else if (userLevel === 'lycee') {
      levelFilter = ['seconde', 'premiere', 'terminale'];
    } else {
      levelFilter = ['6eme', '5eme', '4eme', '3eme', 'seconde', 'premiere', 'terminale'];
    }

    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .in('level', levelFilter)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(4);

    setRecentCourses(courses || []);
    setUserBadges(badges);
    setUserStats({
      coursesCompleted: 0,
      exercisesCompleted: completedExercises,
      badges: badges.length,
      progression: Math.min(100, completedExercises * 10),
    });
    setStatsLoading(false);
  };

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

  const stats = [
    { icon: BookOpen, label: 'Cours suivis', value: userStats.coursesCompleted.toString(), color: 'text-rainbow-blue' },
    { icon: Target, label: 'Exercices', value: userStats.exercisesCompleted.toString(), color: 'text-rainbow-green' },
    { icon: Trophy, label: 'Badges', value: userStats.badges.toString(), color: 'text-rainbow-yellow' },
    { icon: TrendingUp, label: 'Progression', value: `${userStats.progression}%`, color: 'text-rainbow-purple' },
  ];

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      '6eme': '6ème',
      '5eme': '5ème',
      '4eme': '4ème',
      '3eme': '3ème',
      'seconde': 'Seconde',
      'premiere': 'Première',
      'terminale': 'Terminale',
    };
    return labels[level] || level;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-hero-gradient">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40 px-4 py-3">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-xl font-display text-rainbow">MAXIMATHS</h1>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-auto">
            {/* Welcome section */}
            <div className="mb-8">
              <h2 className="text-3xl font-display text-foreground mb-2">
                Bienvenue, {profile?.first_name || 'Aventurier'} !
                <Sparkles className="inline-block w-8 h-8 ml-2 text-rainbow-yellow" />
              </h2>
              <p className="text-muted-foreground font-body">
                Voici un aperçu de votre progression en mathématiques
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div 
                      key={index}
                      className="card-cartoon bg-card border-border p-4 text-center"
                    >
                      <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                      <p className="text-2xl font-display text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => navigate('/college')}
                    className="card-sticker bg-gradient-to-br from-rainbow-blue/10 to-rainbow-green/10 border-rainbow-blue/30 p-5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-rainbow-blue/20 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-rainbow-blue" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-display text-foreground">Cours Collège</h3>
                        <p className="text-muted-foreground font-body text-sm">6ème à 3ème</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-rainbow-blue group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div 
                    onClick={() => navigate('/lycee')}
                    className="card-sticker bg-gradient-to-br from-rainbow-purple/10 to-rainbow-pink/10 border-rainbow-purple/30 p-5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-rainbow-purple/20 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-rainbow-purple" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-display text-foreground">Cours Lycée</h3>
                        <p className="text-muted-foreground font-body text-sm">Seconde à Terminale</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-rainbow-purple group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Recent Courses */}
                {recentCourses.length > 0 && (
                  <div>
                    <h3 className="text-xl font-display text-foreground mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-rainbow-blue" />
                      Cours recommandés
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {recentCourses.map((course) => (
                        <div 
                          key={course.id}
                          className="card-cartoon bg-card border-border p-4 cursor-pointer group"
                        >
                          <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-body text-muted-foreground">
                            {getLevelLabel(course.level)}
                          </span>
                          <h4 className="text-lg font-display text-foreground mt-2 mb-1 group-hover:text-rainbow-blue transition-colors">
                            {course.title}
                          </h4>
                          <p className="text-sm text-muted-foreground font-body capitalize">{course.category}</p>
                          <Button variant="ghost" size="sm" className="w-full mt-3 rounded-xl">
                            <Play className="w-4 h-4 mr-2" />
                            Commencer
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity & Badges */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card-cartoon bg-card border-border p-5">
                    <h3 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-rainbow-orange" />
                      Activité récente
                    </h3>
                    {userStats.exercisesCompleted > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-rainbow-green" />
                          <span className="font-body text-foreground text-sm">
                            {userStats.exercisesCompleted} exercice(s) complété(s)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground font-body text-center py-6 text-sm">
                        Aucune activité pour le moment
                      </p>
                    )}
                  </div>
                  
                  <div className="card-cartoon bg-card border-border p-5">
                    <h3 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-rainbow-yellow" />
                      Mes badges
                    </h3>
                    {userBadges.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userBadges.map((badge) => (
                          <div 
                            key={badge.id}
                            className="flex items-center gap-2 px-3 py-2 bg-rainbow-yellow/10 rounded-full"
                            title={badge.description || ''}
                          >
                            <span className="text-lg">{badge.icon}</span>
                            <span className="font-body text-xs text-foreground">{badge.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground font-body text-center py-6 text-sm">
                        Complétez des activités pour débloquer des badges !
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile sidebar */}
              <div className="lg:col-span-1">
                <UserProfileCard />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
