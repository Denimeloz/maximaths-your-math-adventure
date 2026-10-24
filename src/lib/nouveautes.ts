import { supabase } from '@/integrations/supabase/client';
import { isLevelId, levelLabel } from '@/lib/levels';
import { levelMenuPath } from '@/lib/levelMenus';

// « Quoi de neuf » : les documents publiés ces 7 derniers jours (fonction recent_news de Supabase).
// La pastille compte ce qui est arrivé depuis la dernière visite de la page, mémorisée dans le navigateur.

export interface Nouveaute {
  id: number;
  source_table: string;
  title: string;
  level: string | null;
  created_at: string;
}

export const JOURS_NOUVEAUTES = 7;
const CLE_DERNIERE_VISITE = 'maximaths.nouveautes.vu';
const EVENEMENT = 'maximaths:nouveautes-vues';

const RUBRIQUES: Record<string, string> = {
  activities: 'Activité', assignments: 'Devoir', automatisms: 'Automatismes',
  chapter_podcasts: 'Podcast', chapter_resources: 'Cours', class_info: 'Info de classe',
  club_activities: 'Club maths', club_subjects: 'Club maths', course_files: 'Cours',
  dnb_content: 'Prépa DNB', dnb_revision_resources: 'Révision DNB', evaluations: 'Évaluation',
  exercises: 'Exercices', games_genially: 'Jeu', lessons: 'Cours', parent_resources: 'Espace parents',
  revision_path_files: 'Parcours de révision', revision_path_resources: 'Parcours de révision',
  spiral_resources: 'Progression spiralée', training_exercises: 'Exercices', training_tests: 'Test',
  videos: 'Vidéo',
};

// Rubrique du site où se trouve chaque type de document
const RUBRIQUE_DU_SITE: Record<string, string> = {
  activities: 'activites', assignments: 'devoirs', class_info: 'infos', evaluations: 'evaluations',
  games_genially: 'jeux-genially', training_exercises: 'exercices-entrainement',
  training_tests: 'tests-entrainement', dnb_content: 'prepa-dnb', automatisms: 'automatismes',
  revision_path_files: 'parcours-revision', revision_path_resources: 'parcours-revision',
  chapter_podcasts: 'cours', chapter_resources: 'cours', course_files: 'cours', lessons: 'cours',
  exercises: 'cours', videos: 'cours',
};

const PAGES_SANS_CLASSE: Record<string, string> = {
  dnb_revision_resources: '/ressources-dnb',
  parent_resources: '/ressources-parents',
  spiral_resources: '/progression-spiralee',
  club_activities: '/club-maths',
  club_subjects: '/club-maths',
};

export const rubrique = (n: Nouveaute) => RUBRIQUES[n.source_table] ?? 'Document';
export const classe = (n: Nouveaute) => (isLevelId(n.level) ? levelLabel(n.level) : null);

/** Adresse où voir le document (la rubrique de sa classe), sinon l'accueil. */
export const lien = (n: Nouveaute): string => {
  if (PAGES_SANS_CLASSE[n.source_table]) return PAGES_SANS_CLASSE[n.source_table];
  const rubriqueDuSite = RUBRIQUE_DU_SITE[n.source_table];
  if (rubriqueDuSite && isLevelId(n.level)) return levelMenuPath(n.level, rubriqueDuSite);
  return '/';
};

export const chargerNouveautes = async (): Promise<Nouveaute[]> => {
  // Tables et fonction du 24/10, pas encore dans les types générés par Lovable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('recent_news', { p_days: JOURS_NOUVEAUTES });
  if (error) throw error;
  return (data ?? []) as Nouveaute[];
};

const lireDerniereVisite = (): number => {
  try {
    return Number(localStorage.getItem(CLE_DERNIERE_VISITE)) || 0;
  } catch {
    return 0;
  }
};

export const nombreNonVues = (liste: Nouveaute[]) => {
  const vu = lireDerniereVisite();
  return liste.filter((n) => new Date(n.created_at).getTime() > vu).length;
};

export const estNouvelle = (n: Nouveaute, vu: number) => new Date(n.created_at).getTime() > vu;

/** À l'ouverture de la page : renvoie l'ancienne date de visite (pour mettre en avant ce qui est nouveau). */
export const marquerCommeVues = (): number => {
  const avant = lireDerniereVisite();
  try {
    localStorage.setItem(CLE_DERNIERE_VISITE, String(Date.now()));
  } catch {
    // navigation privée : la pastille ne sera simplement pas remise à zéro
  }
  window.dispatchEvent(new Event(EVENEMENT));
  return avant;
};

export const surNouveautesVues = (rappel: () => void) => {
  window.addEventListener(EVENEMENT, rappel);
  return () => window.removeEventListener(EVENEMENT, rappel);
};

/** « il y a 5 min », « il y a 3 h », « hier à 18:40 », « lundi à 09:15 » */
export const quand = (date: string): string => {
  const d = new Date(date);
  const minutes = Math.round((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 24 * 60) return `il y a ${Math.round(minutes / 60)} h`;
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const hier = new Date();
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return `hier à ${heure}`;
  return `${d.toLocaleDateString('fr-FR', { weekday: 'long' })} à ${heure}`;
};
