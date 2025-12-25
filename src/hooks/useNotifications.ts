import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  type: 'assignment' | 'grade' | 'comment' | 'system';
  title: string;
  message?: string;
  link?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message || null,
      link: params.link || null,
    });

  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }
  return true;
};

export const notifyNewAssignment = async (userIds: string[], assignmentTitle: string, assignmentId: string) => {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    type: 'assignment',
    title: 'Nouveau devoir disponible',
    message: assignmentTitle,
    link: `/dashboard/assignments`,
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  return !error;
};

export const notifyGrade = async (userId: string, assignmentTitle: string, grade: number, maxPoints: number) => {
  return createNotification({
    userId,
    type: 'grade',
    title: 'Devoir corrigé',
    message: `${assignmentTitle}: ${grade}/${maxPoints}`,
    link: '/dashboard/assignments',
  });
};

export const notifyComment = async (userId: string, lessonTitle: string, courseId: string) => {
  return createNotification({
    userId,
    type: 'comment',
    title: 'Réponse à votre question',
    message: `Sur la leçon: ${lessonTitle}`,
    link: `/course/${courseId}`,
  });
};
