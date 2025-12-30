import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { UserProfileCard } from '@/components/UserProfileCard';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Trophy, 
  Sparkles,
  GraduationCap,
  Target,
  Clock,
  TrendingUp,
  ArrowRight,
  Play,
  CheckCircle,
  Menu,
  Calendar,
  Flame,
  Star
} from 'lucide-react';

interface UserStats {
  coursesCompleted: number;
  exercisesCompleted: number;
  badges: number;
  progression: number;
  streak: number;
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
    streak: 0,
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
    
    // Simple stats without non-existent tables
    const completedExercises = 0;
    const badges: Badge[] = [];
    
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
      streak: 0,
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
    { icon: BookOpen, label: 'Cours suivis', value: userStats.coursesCompleted.toString(), color: 'bg-rainbow-blue/10 text-rainbow-blue', iconBg: 'bg-rainbow-blue/20' },
    { icon: Target, label: 'Exercices', value: userStats.exercisesCompleted.toString(), color: 'bg-rainbow-green/10 text-rainbow-green', iconBg: 'bg-rainbow-green/20' },
    { icon: Trophy, label: 'Badges', value: userStats.badges.toString(), color: 'bg-rainbow-yellow/10 text-rainbow-yellow', iconBg: 'bg-rainbow-yellow/20' },
    { icon: Flame, label: 'Série', value: `${userStats.streak} jours`, color: 'bg-rainbow-coral/10 text-rainbow-coral', iconBg: 'bg-rainbow-coral/20' },
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-hero-gradient">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-lg font-display text-foreground">
                    {getGreeting()}, {profile?.first_name || 'Aventurier'} !
                  </h1>
                  <p className="text-xs text-muted-foreground font-body">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* Welcome banner */}
              <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-rainbow-purple/10 to-rainbow-pink/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-display text-foreground mb-2 flex items-center gap-2">
                      Bienvenue sur votre espace
                      <Sparkles className="w-6 h-6 text-rainbow-yellow" />
                    </h2>
                    <p className="text-muted-foreground font-body">
                      Continuez votre apprentissage en mathématiques
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Progression globale</p>
                      <p className="text-2xl font-display text-primary">{userStats.progression}%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={userStats.progression} className="h-2" />
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stats.map((stat, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-xl border border-border/50 ${stat.color} transition-transform hover:scale-[1.02]`}
                      >
                        <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center mb-3`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-display">{stat.value}</p>
                        <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => navigate('/college')}
                      className="p-5 rounded-xl bg-gradient-to-br from-rainbow-blue/10 to-rainbow-green/5 border border-rainbow-blue/20 cursor-pointer group hover:border-rainbow-blue/40 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-rainbow-blue/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <GraduationCap className="w-7 h-7 text-rainbow-blue" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-display text-foreground">Cours Collège</h3>
                          <p className="text-muted-foreground font-body text-sm">De la 6ème à la 3ème</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-rainbow-blue group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => navigate('/lycee')}
                      className="p-5 rounded-xl bg-gradient-to-br from-rainbow-purple/10 to-rainbow-pink/5 border border-rainbow-purple/20 cursor-pointer group hover:border-rainbow-purple/40 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-rainbow-purple/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Sparkles className="w-7 h-7 text-rainbow-purple" />
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
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-display text-foreground flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-rainbow-blue" />
                          Cours recommandés
                        </h3>
                        <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/college')}>
                          Voir tout
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {recentCourses.map((course) => (
                          <div 
                            key={course.id}
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="p-4 rounded-xl bg-card border border-border cursor-pointer group hover:border-primary/30 hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-rainbow-purple/20 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-body text-muted-foreground">
                                  {getLevelLabel(course.level)}
                                </span>
                                <h4 className="text-base font-display text-foreground mt-1 group-hover:text-primary transition-colors line-clamp-1">
                                  {course.title}
                                </h4>
                                <p className="text-xs text-muted-foreground font-body capitalize mt-0.5">{course.category}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full mt-3 rounded-lg group-hover:bg-primary/10 group-hover:text-primary">
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
                    <div className="p-5 rounded-xl bg-card border border-border">
                      <h3 className="text-base font-display text-foreground mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-rainbow-orange" />
                        Activité récente
                      </h3>
                      {userStats.exercisesCompleted > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-3 bg-rainbow-green/5 rounded-lg border border-rainbow-green/20">
                            <CheckCircle className="w-5 h-5 text-rainbow-green" />
                            <span className="font-body text-foreground text-sm">
                              {userStats.exercisesCompleted} exercice(s) complété(s)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-muted-foreground font-body text-sm">
                            Aucune activité pour le moment
                          </p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/college')}>
                            Commencer un cours
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 rounded-xl bg-card border border-border">
                      <h3 className="text-base font-display text-foreground mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-rainbow-yellow" />
                        Mes badges
                      </h3>
                      {userBadges.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {userBadges.slice(0, 4).map((badge) => (
                            <div 
                              key={badge.id}
                              className="flex items-center gap-2 px-3 py-2 bg-rainbow-yellow/10 rounded-full border border-rainbow-yellow/20"
                              title={badge.description || ''}
                            >
                              <span className="text-lg">{badge.icon}</span>
                              <span className="font-body text-xs text-foreground">{badge.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-muted-foreground font-body text-sm">
                            Complétez des activités pour débloquer des badges !
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile sidebar */}
                <div className="lg:col-span-1">
                  <UserProfileCard />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
