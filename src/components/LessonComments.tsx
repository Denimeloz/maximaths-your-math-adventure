import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Trash2, CheckCircle, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  is_resolved: boolean;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

interface LessonCommentsProps {
  lessonId: string;
}

export const LessonComments: React.FC<LessonCommentsProps> = ({ lessonId }) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [lessonId, showComments]);

  const fetchComments = async () => {
    setIsLoading(true);
    const { data: commentsData } = await supabase
      .from('lesson_comments')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (commentsData && commentsData.length > 0) {
      // Fetch user profiles for comments
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const commentsWithUsers = commentsData.map(comment => ({
        ...comment,
        user: profiles?.find(p => p.user_id === comment.user_id),
      }));

      setComments(commentsWithUsers);
    } else {
      setComments([]);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('lesson_comments')
      .insert({
        lesson_id: lessonId,
        user_id: user.id,
        content: newComment.trim(),
      });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de poster le commentaire",
        variant: "destructive",
      });
    } else {
      toast({ title: "Commentaire ajouté" });
      setNewComment('');
      fetchComments();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    
    await supabase.from('lesson_comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleResolve = async (id: string, currentState: boolean) => {
    await supabase
      .from('lesson_comments')
      .update({ is_resolved: !currentState })
      .eq('id', id);
    
    setComments(prev =>
      prev.map(c => (c.id === id ? { ...c, is_resolved: !currentState } : c))
    );
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (!user) return null;

  return (
    <div className="mt-6 border-t border-border pt-4">
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-body">
          {comments.length > 0 ? `${comments.length} question(s)` : 'Poser une question'}
        </span>
      </button>

      {showComments && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* New comment form */}
          <div className="flex gap-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Poser une question sur cette leçon..."
              className="flex-1 rounded-xl resize-none"
              rows={2}
            />
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              size="icon"
              className="h-auto rounded-xl"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Comments list */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune question pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-xl ${
                    comment.is_resolved
                      ? 'bg-rainbow-green/10 border border-rainbow-green/30'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-body text-sm font-medium text-foreground">
                          {comment.user?.first_name || 'Utilisateur'} {comment.user?.last_name?.[0] || ''}.
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(comment.created_at)}
                        </span>
                        {comment.is_resolved && (
                          <span className="text-xs text-rainbow-green flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Résolu
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResolve(comment.id, comment.is_resolved)}
                          className="h-8 w-8 rounded-lg"
                          title={comment.is_resolved ? 'Marquer non résolu' : 'Marquer résolu'}
                        >
                          <CheckCircle className={`w-4 h-4 ${comment.is_resolved ? 'text-rainbow-green' : 'text-muted-foreground'}`} />
                        </Button>
                      )}
                      {(comment.user_id === user.id || isAdmin) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(comment.id)}
                          className="h-8 w-8 rounded-lg text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
