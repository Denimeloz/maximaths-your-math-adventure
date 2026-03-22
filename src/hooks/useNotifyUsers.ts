import { supabase } from '@/integrations/supabase/client';

interface NotifyParams {
  level: string;
  title: string;
  message?: string;
  link?: string;
  type?: 'assignment' | 'grade' | 'comment' | 'system';
}

export const notifyUsers = async (params: NotifyParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('notify-users', {
      body: params,
    });

    if (error) {
      console.error('Error sending notifications:', error);
      return false;
    }

    return data?.success ?? false;
  } catch (err) {
    console.error('Error invoking notify-users:', err);
    return false;
  }
};

// Helper to get French level label
const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
    'seconde': 'Seconde', 'premiere': 'Première', 'terminale': 'Terminale',
  };
  return labels[level] || level;
};

// Pre-built notification helpers
export const notifyNewCourse = (level: string, courseTitle: string) =>
  notifyUsers({
    level,
    type: 'system',
    title: `📚 Nouveau cours disponible (${getLevelLabel(level)})`,
    message: courseTitle,
    link: `/niveau/${level}/cours`,
  });

export const notifyNewAssignment = (level: string, title: string) =>
  notifyUsers({
    level,
    type: 'assignment',
    title: `📝 Nouveau devoir (${getLevelLabel(level)})`,
    message: title,
    link: `/niveau/${level}/devoirs`,
  });

export const notifyNewEvaluation = (level: string, title: string) =>
  notifyUsers({
    level,
    type: 'assignment',
    title: `📋 Nouvelle évaluation (${getLevelLabel(level)})`,
    message: title,
    link: `/niveau/${level}/evaluations`,
  });

export const notifyNewActivity = (level: string, title: string) =>
  notifyUsers({
    level,
    type: 'system',
    title: `🎯 Nouvelle activité (${getLevelLabel(level)})`,
    message: title,
    link: `/niveau/${level}/activites`,
  });

export const notifyNewExercise = (level: string, title: string) =>
  notifyUsers({
    level,
    type: 'system',
    title: `✏️ Nouvel exercice d'entraînement (${getLevelLabel(level)})`,
    message: title,
    link: `/niveau/${level}/exercices-entrainement`,
  });

export const notifyNewTrainingTest = (level: string, title: string) =>
  notifyUsers({
    level,
    type: 'system',
    title: `📝 Nouveau devoir d'entraînement (${getLevelLabel(level)})`,
    message: title,
    link: `/niveau/${level}/devoirs-entrainement`,
  });

export const notifyNewClassInfo = (level: string, title: string) =>
  notifyUsers({
    level,
    type: 'system',
    title: `ℹ️ Nouvelle info de classe (${getLevelLabel(level)})`,
    message: title,
    link: `/niveau/${level}/infos`,
  });

export const notifyNewClassPhotos = (level: string, title: string) =>
  notifyUsers({
    level,
    type: 'system',
    title: `📸 Nouvelles photos de classe (${getLevelLabel(level)})`,
    message: title,
    link: `/niveau/${level}/classe-en-activite`,
  });

export const notifyContentUpdate = (level: string, contentType: string, title: string) =>
  notifyUsers({
    level,
    type: 'system',
    title: `🔄 Mise à jour: ${contentType} (${getLevelLabel(level)})`,
    message: title,
  });
