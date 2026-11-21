import type { ProjectMedia } from '@/lib/studentProjects';

/**
 * « Coups de pouce » : vidéos et conseils de l'oncle sur certaines notions qui posent difficulté aux élèves.
 * Une table à part (`coups_de_pouce`) ; les médias réutilisent le format des projets des élèves
 * (vidéo YouTube, fichier envoyé, audio, PDF, image ou lien) et s'affichent avec le même lecteur.
 */
export const COUPS_DE_POUCE_TITRE = 'Coups de pouce';
export const COUPS_DE_POUCE_SOUS_TITRE = 'Vidéos et conseils sur certaines notions';

export interface CoupDePouce {
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

/** Transforme une ligne de la table en coup de pouce, sans jamais planter sur un JSON inattendu. */
export const toCoupDePouce = (row: any): CoupDePouce => ({
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
export const coupsDePoucePath = (level?: string | null, yearId?: string | null): string => {
  const params = new URLSearchParams();
  if (yearId) params.set('year', yearId);
  if (level) params.set('level', level);
  const query = params.toString();
  return `/coups-de-pouce${query ? `?${query}` : ''}`;
};
