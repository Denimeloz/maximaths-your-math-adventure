import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Menu, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Star,
  Calendar
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_points: number;
  course: {
    title: string;
    level: string;
  } | null;
}

interface Submission {
  assignment_id: string;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

const DashboardAssignments = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch published assignments
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('id, title, description, due_date, max_points, courses(title, level)')
      .eq('is_published', true)
      .order('due_date', { ascending: true });

    // Fetch user's submissions
    const { data: submissionsData } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, grade, feedback, submitted_at, graded_at')
      .eq('user_id', user?.id);

    setAssignments(
      assignmentsData?.map((a) => ({
        ...a,
        course: a.courses as { title: string; level: string } | null,
      })) || []
    );
    setSubmissions(submissionsData || []);
    setIsLoading(false);
  };

  const getSubmission = (assignmentId: string) => {
    return submissions.find((s) => s.assignment_id === assignmentId);
  };

  const getStatus = (assignment: Assignment) => {
    const submission = getSubmission(assignment.id);
    if (submission?.graded_at) return 'graded';
    if (submission) return 'submitted';
    if (assignment.due_date && new Date(assignment.due_date) < new Date()) return 'overdue';
    return 'pending';
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'all') return true;
    const status = getStatus(a);
    if (filter === 'pending') return status === 'pending' || status === 'overdue';
    if (filter === 'submitted') return status === 'submitted';
    if (filter === 'graded') return status === 'graded';
    return true;
  });

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
      'seconde': 'Seconde', 'premiere': 'Première', 'terminale': 'Terminale',
    };
    return labels[level] || level;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const pendingCount = assignments.filter((a) => getStatus(a) === 'pending' || getStatus(a) === 'overdue').length;
  const submittedCount = assignments.filter((a) => getStatus(a) === 'submitted').length;
  const gradedCount = assignments.filter((a) => getStatus(a) === 'graded').length;

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
                  <FileText className="w-5 h-5 text-rainbow-blue" />
                  Mes Devoirs de niveaux
                </h1>
                <p className="text-xs text-muted-foreground font-body">
                  {pendingCount} en attente • {submittedCount} soumis • {gradedCount} noté(s)
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-rainbow-orange/10 border border-rainbow-orange/20 text-center">
                  <Clock className="w-6 h-6 text-rainbow-orange mx-auto mb-2" />
                  <p className="text-2xl font-display text-foreground">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
                <div className="p-4 rounded-xl bg-rainbow-blue/10 border border-rainbow-blue/20 text-center">
                  <Upload className="w-6 h-6 text-rainbow-blue mx-auto mb-2" />
                  <p className="text-2xl font-display text-foreground">{submittedCount}</p>
                  <p className="text-xs text-muted-foreground">Soumis</p>
                </div>
                <div className="p-4 rounded-xl bg-rainbow-green/10 border border-rainbow-green/20 text-center">
                  <CheckCircle className="w-6 h-6 text-rainbow-green mx-auto mb-2" />
                  <p className="text-2xl font-display text-foreground">{gradedCount}</p>
                  <p className="text-xs text-muted-foreground">Notés</p>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {(['all', 'pending', 'submitted', 'graded'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="rounded-full whitespace-nowrap"
                  >
                    {f === 'all' && 'Tous'}
                    {f === 'pending' && 'En attente'}
                    {f === 'submitted' && 'Soumis'}
                    {f === 'graded' && 'Notés'}
                  </Button>
                ))}
              </div>

              {/* Assignments list */}
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-body">
                    Aucun devoir {filter !== 'all' ? 'dans cette catégorie' : 'disponible'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment) => {
                    const status = getStatus(assignment);
                    const submission = getSubmission(assignment.id);

                    return (
                      <div
                        key={assignment.id}
                        className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {assignment.course && (
                                <span className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
                                  {getLevelLabel(assignment.course.level)}
                                </span>
                              )}
                              {status === 'graded' && (
                                <span className="px-2 py-0.5 bg-rainbow-green/10 text-rainbow-green rounded-full text-xs font-medium">
                                  Noté
                                </span>
                              )}
                              {status === 'submitted' && (
                                <span className="px-2 py-0.5 bg-rainbow-blue/10 text-rainbow-blue rounded-full text-xs font-medium">
                                  Soumis
                                </span>
                              )}
                              {status === 'overdue' && (
                                <span className="px-2 py-0.5 bg-destructive/10 text-destructive rounded-full text-xs font-medium">
                                  En retard
                                </span>
                              )}
                            </div>
                            <h3 className="font-display text-foreground mb-1">{assignment.title}</h3>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              {assignment.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {assignment.max_points} pts
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {status === 'graded' && submission?.grade !== null && (
                              <div className="mb-2">
                                <p className="text-2xl font-display text-rainbow-green">
                                  {submission.grade}/{assignment.max_points}
                                </p>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant={status === 'pending' || status === 'overdue' ? 'default' : 'outline'}
                              onClick={() => navigate(`/assignment/${assignment.id}`)}
                            >
                              {status === 'pending' && 'Rendre'}
                              {status === 'overdue' && 'Rendre (retard)'}
                              {status === 'submitted' && 'Voir'}
                              {status === 'graded' && 'Détails'}
                            </Button>
                          </div>
                        </div>

                        {status === 'graded' && submission?.feedback && (
                          <div className="mt-4 p-3 rounded-lg bg-rainbow-green/5 border border-rainbow-green/20">
                            <p className="text-sm text-foreground">
                              <span className="font-medium">Feedback :</span> {submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardAssignments;
