// Menus d'une classe, partagés par l'en-tête et par l'accueil.
// Avant, chaque composant avait sa propre copie et elles avaient divergé.
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Camera,
  ClipboardList,
  Dumbbell,
  FileCheck,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  Info,
  Lightbulb,
  Route,
  Star,
  Target,
  Video,
  Zap,
} from 'lucide-react';

export interface LevelMenuItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Une année scolaire utilise la nouvelle organisation à partir de 2026-2027. */
export const usesNewArchitecture = (startYear: number | null | undefined): boolean =>
  typeof startYear === 'number' && startYear >= 2026;

/** Rubriques de chapitre (nouvelle organisation) → valeur de `section` en base. */
export const CHAPTER_SECTIONS: Record<string, string> = {
  'chap-activite': 'activite_decouverte',
  'chap-cours': 'cours',
  'chap-exercices': 'exercices_entrainement',
  'chap-accompagnement': 'accompagnement_personnalise',
  'chap-multimedia': 'multimedia',
};

/** Toutes les rubriques acceptées dans l'adresse /niveau/:classe/:rubrique. */
export const LEVEL_CONTENT_TYPES = [
  'infos',
  'activites',
  'cours',
  'exercices-entrainement',
  'tests-entrainement',
  'devoirs',
  'evaluations',
  'prepa-dnb',
  'classe-activite',
  'jeux-genially',
  ...Object.keys(CHAPTER_SECTIONS),
] as const;

export type LevelContentType = (typeof LEVEL_CONTENT_TYPES)[number];

export const isLevelContentType = (value: string | null | undefined): value is LevelContentType =>
  !!value && (LEVEL_CONTENT_TYPES as readonly string[]).includes(value);

const classeActivite: LevelMenuItem = {
  id: 'classe-activite',
  label: 'Classe en activité',
  description: 'Photos et moments de classe',
  icon: Camera,
};

const prepaDnb: LevelMenuItem = {
  id: 'prepa-dnb',
  label: 'Prépa DNB',
  description: 'Préparation au brevet',
  icon: Star,
};

const ressourcesDnb: LevelMenuItem = {
  id: 'ressources-dnb',
  label: 'Ressources révision DNB',
  description: 'Fiches et supports à télécharger',
  icon: GraduationCap,
};

// Ancienne organisation (années jusqu'à 2025-2026)
const legacyMenu = (levelId: string): LevelMenuItem[] => {
  const is3eme = levelId === '3eme';
  const items: LevelMenuItem[] = [
    { id: 'infos', label: 'Infos pour la classe', description: 'Informations importantes', icon: Info },
    { id: 'activites', label: 'Activités', description: 'Découverte et exploration', icon: Lightbulb },
    { id: 'cours', label: 'Cours et chapitres', description: 'Leçons et chapitres', icon: BookOpen },
    { id: 'exercices-entrainement', label: "Exercices d'entraînement", description: 'Exercices à pratiquer', icon: Dumbbell },
    {
      id: 'tests-entrainement',
      label: is3eme ? 'Tests ou Mini DNB' : 'Tests (Évaluations formatives)',
      description: 'Tests',
      icon: Target,
    },
    { id: 'devoirs', label: 'Devoirs de niveaux', description: 'Devoirs de niveaux', icon: ClipboardList },
    { id: 'evaluations', label: 'Évaluations', description: 'Tests et examens', icon: FileCheck },
    { id: 'jeux-genially', label: 'Jeux et Genially', description: 'Jeux éducatifs et présentations', icon: Gamepad2 },
  ];
  if (is3eme) items.push(prepaDnb, ressourcesDnb);
  if (is3eme || levelId === 'seconde') items.push(classeActivite);
  return items;
};

// Nouvelle organisation (2026-2027 et suivantes)
const newMenu = (levelId: string): LevelMenuItem[] => {
  const is3eme = levelId === '3eme';
  const items: LevelMenuItem[] = [
    { id: 'infos', label: 'Infos pour la classe', description: 'Informations importantes', icon: Info },
    { id: 'automatismes', label: 'Automatismes', description: 'Entraînement régulier', icon: Zap },
    { id: 'chap-activite', label: 'Activité de découverte', description: 'Découverte des notions', icon: Lightbulb },
    { id: 'chap-cours', label: 'Cours', description: 'Leçons et chapitres', icon: BookOpen },
    { id: 'chap-exercices', label: "Exercices d'entraînement", description: 'Pour pratiquer', icon: Dumbbell },
    { id: 'chap-accompagnement', label: 'Accompagnement personnalisé', description: 'Soutien et approfondissement', icon: HeartHandshake },
    { id: 'chap-multimedia', label: 'Vidéo, Podcast & autres', description: 'Vidéos, audios et liens', icon: Video },
    { id: 'jeux-genially', label: 'Jeux et Genially', description: 'Jeux éducatifs et présentations', icon: Gamepad2 },
    classeActivite,
    { id: 'exercices-entrainement', label: 'Devoirs de maison', description: 'À réaliser à la maison', icon: ClipboardList },
    { id: 'activites', label: "Espace d'approfondissement", description: 'Pour aller plus loin', icon: Lightbulb },
    { id: 'tests-entrainement', label: is3eme ? 'Tests ou Mini DNB' : 'Test', description: 'Tests', icon: Target },
    { id: 'evaluations', label: 'Évaluations', description: 'Tests et examens', icon: FileCheck },
    { id: 'parcours-revision', label: 'Parcours de révision', description: '5 étapes pour réviser', icon: Route },
  ];
  if (is3eme) items.push(prepaDnb);
  items.push({ id: 'devoirs', label: 'Devoirs de niveaux', description: 'Devoirs de niveaux', icon: ClipboardList });
  if (is3eme) items.push(ressourcesDnb);
  return items;
};

export const getLevelMenu = (levelId: string, isNewArchitecture: boolean): LevelMenuItem[] =>
  isNewArchitecture ? newMenu(levelId) : legacyMenu(levelId);

/** Adresse d'une rubrique pour une classe et une année données. */
export const levelMenuPath = (levelId: string, itemId: string, yearId?: string | null): string => {
  if (itemId === 'ressources-dnb') return '/ressources-dnb';
  if (itemId === 'automatismes' || itemId === 'parcours-revision') {
    const params = new URLSearchParams();
    if (yearId) params.set('year', yearId);
    params.set('level', levelId);
    return `/${itemId}?${params.toString()}`;
  }
  return `/niveau/${levelId}/${itemId}${yearId ? `?year=${yearId}` : ''}`;
};
