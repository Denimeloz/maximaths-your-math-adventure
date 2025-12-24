import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Clock, FileText, ExternalLink, Save } from 'lucide-react';

interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string | null;
  file_url: string | null;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

interface Assignment {
  id: string;
  title: string;
  max_points: number;
}

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export const SubmissionGrader: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ grade: 0, feedback: '' });
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [submissionsRes, assignmentsRes, profilesRes] = await Promise.all([
      supabase.from('assignment_submissions').select('*').order('submitted_at', { ascending: false }),
      supabase.from('assignments').select('id, title, max_points'),
      supabase.from('profiles').select('id, user_id, first_name, last_name, email'),
    ]);
    if (submissionsRes.data) setSubmissions(submissionsRes.data);
    if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
  };

  const handleGrade = async () => {
    if (!selectedSubmission || !user) return;

    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        grade: gradeForm.grade,
        feedback: gradeForm.feedback || null,
        graded_at: new Date().toISOString(),
        graded_by: user.id,
      })
      .eq('id', selectedSubmission);

    if (!error) {
      toast({ title: "Succès", description: "Note enregistrée" });
      fetchData();
      setSelectedSubmission(null);
      setGradeForm({ grade: 0, feedback: '' });
    }
  };

  const getAssignment = (id: string) => assignments.find(a => a.id === id);
  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'pending') return !s.graded_at;
    if (filter === 'graded') return !!s.graded_at;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Correction des Devoirs</h2>
        <div className="flex gap-2">
          {(['pending', 'graded', 'all'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="rounded-xl"
              size="sm"
            >
              {f === 'pending' ? 'À corriger' : f === 'graded' ? 'Corrigés' : 'Tous'}
            </Button>
          ))}
        </div>
      </div>

      {selectedSubmission && (
        <div className="card-sticker bg-card border-rainbow-green/30 p-6">
          <h3 className="text-xl font-display text-foreground mb-4">Noter le devoir</h3>
          
          {(() => {
            const submission = submissions.find(s => s.id === selectedSubmission);
            const assignment = submission ? getAssignment(submission.assignment_id) : null;
            
            return (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-body text-muted-foreground mb-1 block">
                      Note (max {assignment?.max_points || 100})
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={assignment?.max_points || 100}
                      value={gradeForm.grade}
                      onChange={(e) => setGradeForm(prev => ({ ...prev, grade: parseInt(e.target.value) || 0 }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">Commentaire</label>
                  <Textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                    placeholder="Commentaire pour l'élève"
                    className="rounded-xl"
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={handleGrade} className="btn-3d bg-primary rounded-xl">
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer la note
                  </Button>
                  <Button onClick={() => setSelectedSubmission(null)} variant="outline" className="rounded-xl">
                    Annuler
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="space-y-4">
        {filteredSubmissions.map(submission => {
          const assignment = getAssignment(submission.assignment_id);
          const profile = getProfile(submission.user_id);
          
          return (
            <div key={submission.id} className="card-cartoon bg-card border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    submission.graded_at ? 'bg-rainbow-green/20' : 'bg-rainbow-orange/20'
                  }`}>
                    {submission.graded_at ? (
                      <CheckCircle className="w-5 h-5 text-rainbow-green" />
                    ) : (
                      <Clock className="w-5 h-5 text-rainbow-orange" />
                    )}
                  </div>
                  <div>
                    <p className="font-display text-foreground">{assignment?.title || 'Devoir'}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile ? `${profile.first_name} ${profile.last_name}` : 'Utilisateur inconnu'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {submission.graded_at ? (
                    <span className="px-3 py-1 rounded-full bg-rainbow-green/20 text-rainbow-green text-sm font-body">
                      {submission.grade}/{assignment?.max_points || 100}
                    </span>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedSubmission(submission.id);
                        setGradeForm({ grade: 0, feedback: '' });
                      }}
                      className="rounded-xl"
                      size="sm"
                    >
                      Noter
                    </Button>
                  )}
                  
                  {submission.file_url && (
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className="rounded-xl"
                    >
                      <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              
              {submission.content && (
                <div className="mt-3 p-3 bg-muted/30 rounded-xl">
                  <p className="text-sm text-foreground">{submission.content}</p>
                </div>
              )}
              
              {submission.feedback && (
                <div className="mt-3 p-3 bg-rainbow-green/10 rounded-xl">
                  <p className="text-sm text-foreground font-medium">Commentaire:</p>
                  <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredSubmissions.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            {filter === 'pending' ? 'Aucun devoir à corriger' : 'Aucune soumission'}
          </p>
        )}
      </div>
    </div>
  );
};
