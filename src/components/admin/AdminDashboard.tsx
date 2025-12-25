import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Award,
  TrendingUp,
  Calendar,
  ClipboardList,
  CheckCircle,
  FileText,
  Video,
  HelpCircle
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalAdmins: number;
  totalExercises: number;
  totalQuizzes: number;
  totalAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  totalFiles: number;
  totalVideos: number;
  recentUsers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
  }>;
  coursesByLevel: Record<string, number>;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalAdmins: 0,
    totalExercises: 0,
    totalQuizzes: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    gradedSubmissions: 0,
    totalFiles: 0,
    totalVideos: 0,
    recentUsers: [],
    coursesByLevel: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [
        usersRes,
        rolesRes,
        coursesRes,
        exercisesRes,
        quizzesRes,
        assignmentsRes,
        submissionsRes,
        filesRes,
        videosRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('user_roles').select('*'),
        supabase.from('courses').select('id, level, is_published'),
        supabase.from('exercises').select('id'),
        supabase.from('quizzes').select('id'),
        supabase.from('assignments').select('id'),
        supabase.from('assignment_submissions').select('id, graded_at'),
        supabase.from('course_files').select('id'),
        supabase.from('videos').select('id'),
      ]);

      const courses = coursesRes.data || [];
      const roles = rolesRes.data || [];
      const submissions = submissionsRes.data || [];

      // Calculate courses by level
      const coursesByLevel: Record<string, number> = {};
      courses.forEach(course => {
        coursesByLevel[course.level] = (coursesByLevel[course.level] || 0) + 1;
      });

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalCourses: courses.length,
        publishedCourses: courses.filter(c => c.is_published).length,
        totalAdmins: roles.filter(r => r.role === 'admin').length,
        totalExercises: exercisesRes.data?.length || 0,
        totalQuizzes: quizzesRes.data?.length || 0,
        totalAssignments: assignmentsRes.data?.length || 0,
        totalSubmissions: submissions.length,
        gradedSubmissions: submissions.filter(s => s.graded_at).length,
        totalFiles: filesRes.data?.length || 0,
        totalVideos: videosRes.data?.length || 0,
        recentUsers: usersRes.data || [],
        coursesByLevel,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const mainStats = [
    { icon: Users, label: 'Utilisateurs', value: stats.totalUsers, color: 'text-rainbow-blue', bg: 'bg-rainbow-blue/10' },
    { icon: BookOpen, label: 'Cours', value: stats.totalCourses, color: 'text-rainbow-green', bg: 'bg-rainbow-green/10' },
    { icon: GraduationCap, label: 'Publiés', value: stats.publishedCourses, color: 'text-rainbow-purple', bg: 'bg-rainbow-purple/10' },
    { icon: Award, label: 'Admins', value: stats.totalAdmins, color: 'text-rainbow-orange', bg: 'bg-rainbow-orange/10' },
  ];

  const contentStats = [
    { icon: FileText, label: 'Exercices', value: stats.totalExercises, color: 'text-rainbow-pink' },
    { icon: HelpCircle, label: 'Quiz', value: stats.totalQuizzes, color: 'text-rainbow-blue' },
    { icon: ClipboardList, label: 'Devoirs', value: stats.totalAssignments, color: 'text-rainbow-green' },
    { icon: Video, label: 'Vidéos', value: stats.totalVideos, color: 'text-rainbow-purple' },
    { icon: FileText, label: 'Fichiers', value: stats.totalFiles, color: 'text-rainbow-orange' },
  ];

  return (
    <div className="space-y-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <div 
            key={index}
            className="card-cartoon bg-card border-border p-6"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-3xl font-display text-foreground">{stat.value}</p>
            <p className="text-muted-foreground font-body text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Content Stats */}
      <div className="card-sticker bg-card border-rainbow-purple/30 p-6">
        <h2 className="text-xl font-display text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-rainbow-purple" />
          Contenu de la plateforme
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {contentStats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-muted/50 rounded-xl">
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
              <p className="text-2xl font-display text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Submissions Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-cartoon bg-card border-border p-6">
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-rainbow-green" />
            Soumissions de devoirs
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total soumissions</span>
              <span className="font-display text-foreground">{stats.totalSubmissions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Corrigées</span>
              <span className="font-display text-rainbow-green">{stats.gradedSubmissions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">En attente</span>
              <span className="font-display text-rainbow-orange">{stats.totalSubmissions - stats.gradedSubmissions}</span>
            </div>
            {stats.totalSubmissions > 0 && (
              <div className="pt-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rainbow-green rounded-full transition-all"
                    style={{ width: `${(stats.gradedSubmissions / stats.totalSubmissions) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {Math.round((stats.gradedSubmissions / stats.totalSubmissions) * 100)}% corrigées
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card-cartoon bg-card border-border p-6">
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rainbow-blue" />
            Cours par niveau
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.coursesByLevel).length > 0 ? (
              Object.entries(stats.coursesByLevel)
                .sort(([a], [b]) => {
                  const order = ['6eme', '5eme', '4eme', '3eme', 'seconde', 'premiere', 'terminale'];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([level, count]) => (
                  <div key={level} className="flex justify-between items-center p-2 bg-muted/50 rounded-xl">
                    <span className="text-foreground font-body">{getLevelLabel(level)}</span>
                    <span className="font-display text-rainbow-blue">{count}</span>
                  </div>
                ))
            ) : (
              <p className="text-muted-foreground text-center py-4">Aucun cours</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card-cartoon bg-card border-border p-6">
        <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rainbow-purple" />
          Derniers utilisateurs inscrits
        </h3>
        <div className="space-y-3">
          {stats.recentUsers.slice(0, 5).map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
                <span className="text-sm font-display text-secondary-foreground">
                  {user.first_name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-foreground font-medium truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          ))}
          {stats.recentUsers.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Aucun utilisateur</p>
          )}
        </div>
      </div>
    </div>
  );
};
