import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LessonProgress {
  lesson_id: string;
  is_read: boolean;
  read_at: string | null;
}

export const useLessonProgress = (courseId?: string) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress(new Map());
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('lesson_progress')
        .select('lesson_id, is_read, read_at')
        .eq('user_id', user.id);

      // If courseId is provided, filter by lessons in that course
      if (courseId) {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', courseId);
        
        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map(l => l.id);
          query = query.in('lesson_id', lessonIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const progressMap = new Map<string, LessonProgress>();
      data?.forEach(item => {
        progressMap.set(item.lesson_id, item);
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, courseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const markAsRead = async (lessonId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_read: true,
          read_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
        });

      if (error) throw error;

      // Update local state
      setProgress(prev => {
        const newProgress = new Map(prev);
        newProgress.set(lessonId, {
          lesson_id: lessonId,
          is_read: true,
          read_at: new Date().toISOString(),
        });
        return newProgress;
      });

      return true;
    } catch (error) {
      console.error('Error marking lesson as read:', error);
      return false;
    }
  };

  const markAsUnread = async (lessonId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .update({
          is_read: false,
          read_at: null,
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);

      if (error) throw error;

      // Update local state
      setProgress(prev => {
        const newProgress = new Map(prev);
        newProgress.set(lessonId, {
          lesson_id: lessonId,
          is_read: false,
          read_at: null,
        });
        return newProgress;
      });

      return true;
    } catch (error) {
      console.error('Error marking lesson as unread:', error);
      return false;
    }
  };

  const isLessonRead = (lessonId: string): boolean => {
    return progress.get(lessonId)?.is_read ?? false;
  };

  const getReadCount = (): number => {
    let count = 0;
    progress.forEach(p => {
      if (p.is_read) count++;
    });
    return count;
  };

  return {
    progress,
    isLoading,
    markAsRead,
    markAsUnread,
    isLessonRead,
    getReadCount,
    refetch: fetchProgress,
  };
};
