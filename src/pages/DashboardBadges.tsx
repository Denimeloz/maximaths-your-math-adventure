import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Trophy, Star, Lock, Menu, Sparkles } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  condition_type: string;
  condition_value: number;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

const DashboardBadges = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    setIsLoading(true);

    // Fetch all badges
    const { data: badges } = await supabase
      .from('badges')
      .select('*')
      .order('condition_value', { ascending: true });

    // Fetch user's earned badges
    const { data: earned } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges(*)')
      .eq('user_id', user?.id);

    setAllBadges(badges || []);
    setUserBadges(
      earned?.map((e) => ({
        badge_id: e.badge_id,
        earned_at: e.earned_at,
        badge: e.badges as unknown as Badge,
      })) || []
    );
    setIsLoading(false);
  };

  const isEarned = (badgeId: string) => {
    return userBadges.some((ub) => ub.badge_id === badgeId);
  };

  const getConditionLabel = (type: string, value: number) => {
    const labels: Record<string, string> = {
      exercises_completed: `Compléter ${value} exercice(s)`,
      quizzes_passed: `Réussir ${value} quiz`,
      streak_days: `${value} jours consécutifs`,
      courses_completed: `Terminer ${value} cours`,
    };
    return labels[type] || `${type}: ${value}`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const earnedCount = userBadges.length;
  const totalCount = allBadges.length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-hero-gradient">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-4 py-3">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div>
                <h1 className="text-lg font-display text-foreground flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-rainbow-yellow" />
                  Mes Badges
                </h1>
                <p className="text-xs text-muted-foreground font-body">
                  {earnedCount} / {totalCount} badges débloqués
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              {/* Progress summary */}
              <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-rainbow-yellow/10 to-rainbow-orange/10 border border-rainbow-yellow/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-display text-foreground mb-1">
                      Collection de badges
                    </h2>
                    <p className="text-muted-foreground font-body">
                      Complétez des activités pour débloquer de nouveaux badges !
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-rainbow-yellow" />
                    <div className="text-right">
                      <p className="text-3xl font-display text-rainbow-yellow">{earnedCount}</p>
                      <p className="text-xs text-muted-foreground">Débloqués</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Earned badges */}
              {userBadges.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-rainbow-yellow" />
                    Badges débloqués
                  </h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {userBadges.map((ub) => (
                      <div
                        key={ub.badge_id}
                        className="p-5 rounded-xl bg-gradient-to-br from-rainbow-yellow/10 to-rainbow-orange/5 border border-rainbow-yellow/30 text-center"
                      >
                        <span className="text-4xl mb-3 block">{ub.badge.icon}</span>
                        <h4 className="font-display text-foreground mb-1">{ub.badge.name}</h4>
                        {ub.badge.description && (
                          <p className="text-xs text-muted-foreground mb-2">{ub.badge.description}</p>
                        )}
                        <span className="text-xs text-rainbow-green font-medium">
                          Obtenu le {new Date(ub.earned_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked badges */}
              <div>
                <h3 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  Badges à débloquer
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {allBadges
                    .filter((b) => !isEarned(b.id))
                    .map((badge) => (
                      <div
                        key={badge.id}
                        className="p-5 rounded-xl bg-card border border-border text-center opacity-60"
                      >
                        <div className="relative inline-block mb-3">
                          <span className="text-4xl grayscale">{badge.icon}</span>
                          <Lock className="w-4 h-4 text-muted-foreground absolute -bottom-1 -right-1" />
                        </div>
                        <h4 className="font-display text-foreground mb-1">{badge.name}</h4>
                        {badge.description && (
                          <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {getConditionLabel(badge.condition_type, badge.condition_value)}
                        </span>
                      </div>
                    ))}
                </div>

                {allBadges.filter((b) => !isEarned(b.id)).length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-rainbow-yellow mx-auto mb-4" />
                    <p className="text-foreground font-display text-lg">
                      Félicitations ! Vous avez débloqué tous les badges !
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardBadges;
