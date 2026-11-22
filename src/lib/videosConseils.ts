import type { ProjectMedia } from '@/lib/studentProjects';

/**
 * « Vidéos et conseils pour progresser » : vidéos et conseils de l'oncle pour progresser en mathématiques.
 * Une table à part (`videos_et_conseils_pour_progresser`) ; les médias réutilisent le format des projets des élèves
 * (vidéo YouTube, fichier envoyé, audio, PDF, image ou lien) et s'affichent avec le même lecteur.
 */
export const VIDEOS_CONSEILS_TITRE = 'Vidéos et conseils pour progresser';
export const VIDEOS_CONSEILS_SOUS_TITRE = 'Méthodes et conseils pour progresser en mathématiques';

export interface VideoConseil {
  id: string;
  level: string;
  academic_year_id: string | null;
  chapter: string | null;
  title: string;
  description: string | null;
  media: ProjectMedia[];
  is_published: boolean;
  display_order: number;
}

/** Transforme une ligne de la table en vidéo ou conseil, sans jamais planter sur un JSON inattendu. */
export const toVideoConseil = (row: any): VideoConseil => ({
  id: row.id,
  level: row.level,
  academic_year_id: row.academic_year_id ?? null,
  chapter: row.chapter ?? null,
  title: row.title,
  description: row.description ?? null,
  is_published: row.is_published !== false,
  display_order: row.display_order ?? 0,
  media: Array.isArray(row.media)
    ? row.media
        .filter((m: any) => m && typeof m.url === 'string' && m.url.trim())
        .map((m: any) => ({ url: m.url, label: typeof m.label === 'string' ? m.label : '', fileName: m.fileName || null }))
    : [],
});

/** Adresse de la page publique, pour une classe et une année données. */
export const videosConseilsPath = (level?: string | null, yearId?: string | null): string => {
  const params = new URLSearchParams();
  if (yearId) params.set('year', yearId);
  if (level) params.set('level', level);
  const query = params.toString();
  return `/videos-et-conseils-pour-progresser${query ? `?${query}` : ''}`;
};
