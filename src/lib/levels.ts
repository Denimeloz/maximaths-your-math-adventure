// Source unique pour les classes : identifiants, libellés et couleurs.
// Les classes Tailwind sont écrites en entier (jamais assemblées avec `${...}`),
// sinon Tailwind ne les génère pas dans la feuille de style finale.

export type LevelId = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

export const LEVEL_IDS: LevelId[] = ['6eme', '5eme', '4eme', '3eme', 'seconde', 'premiere', 'terminale'];

export const LEVEL_LABELS: Record<LevelId, string> = {
  '6eme': '6ème',
  '5eme': '5ème',
  '4eme': '4ème',
  '3eme': '3ème',
  seconde: 'Seconde',
  premiere: 'Première',
  terminale: 'Terminale',
};

export const isLevelId = (value: string | null | undefined): value is LevelId =>
  !!value && (LEVEL_IDS as string[]).includes(value);

/** Libellé affichable d'une classe ; renvoie l'identifiant tel quel s'il est inconnu. */
export const levelLabel = (id: string | null | undefined): string =>
  isLevelId(id) ? LEVEL_LABELS[id] : id || '';

export const LEVEL_GROUPS: { id: 'college' | 'lycee'; label: string; levelIds: LevelId[] }[] = [
  { id: 'college', label: 'Collège', levelIds: ['6eme', '5eme', '4eme', '3eme'] },
  { id: 'lycee', label: 'Lycée', levelIds: ['seconde', 'premiere', 'terminale'] },
];

export interface LevelStyle {
  /** Couleur du texte et des icônes */
  text: string;
  /** Bordure discrète au repos */
  border: string;
  /** Bordure pleine au survol */
  borderHover: string;
  /** Fond très léger (pastilles, badges) */
  tint: string;
  /** Fond léger un peu plus marqué */
  tintStrong: string;
  /** Fond au survol d'une ligne de menu */
  hoverBg: string;
  /** Texte coloré quand le parent `.group` est survolé */
  groupHoverText: string;
}

export const LEVEL_STYLES: Record<LevelId, LevelStyle> = {
  '6eme': {
    text: 'text-rainbow-blue',
    border: 'border-rainbow-blue/30',
    borderHover: 'hover:border-rainbow-blue',
    tint: 'bg-rainbow-blue/10',
    tintStrong: 'bg-rainbow-blue/20',
    hoverBg: 'hover:bg-rainbow-blue/20',
    groupHoverText: 'group-hover:text-rainbow-blue',
  },
  '5eme': {
    text: 'text-rainbow-green',
    border: 'border-rainbow-green/30',
    borderHover: 'hover:border-rainbow-green',
    tint: 'bg-rainbow-green/10',
    tintStrong: 'bg-rainbow-green/20',
    hoverBg: 'hover:bg-rainbow-green/20',
    groupHoverText: 'group-hover:text-rainbow-green',
  },
  '4eme': {
    text: 'text-rainbow-orange',
    border: 'border-rainbow-orange/30',
    borderHover: 'hover:border-rainbow-orange',
    tint: 'bg-rainbow-orange/10',
    tintStrong: 'bg-rainbow-orange/20',
    hoverBg: 'hover:bg-rainbow-orange/20',
    groupHoverText: 'group-hover:text-rainbow-orange',
  },
  '3eme': {
    text: 'text-rainbow-coral',
    border: 'border-rainbow-coral/30',
    borderHover: 'hover:border-rainbow-coral',
    tint: 'bg-rainbow-coral/10',
    tintStrong: 'bg-rainbow-coral/20',
    hoverBg: 'hover:bg-rainbow-coral/20',
    groupHoverText: 'group-hover:text-rainbow-coral',
  },
  seconde: {
    text: 'text-rainbow-pink',
    border: 'border-rainbow-pink/30',
    borderHover: 'hover:border-rainbow-pink',
    tint: 'bg-rainbow-pink/10',
    tintStrong: 'bg-rainbow-pink/20',
    hoverBg: 'hover:bg-rainbow-pink/20',
    groupHoverText: 'group-hover:text-rainbow-pink',
  },
  premiere: {
    text: 'text-rainbow-purple',
    border: 'border-rainbow-purple/30',
    borderHover: 'hover:border-rainbow-purple',
    tint: 'bg-rainbow-purple/10',
    tintStrong: 'bg-rainbow-purple/20',
    hoverBg: 'hover:bg-rainbow-purple/20',
    groupHoverText: 'group-hover:text-rainbow-purple',
  },
  terminale: {
    text: 'text-rainbow-yellow',
    border: 'border-rainbow-yellow/30',
    borderHover: 'hover:border-rainbow-yellow',
    tint: 'bg-rainbow-yellow/10',
    tintStrong: 'bg-rainbow-yellow/20',
    hoverBg: 'hover:bg-rainbow-yellow/20',
    groupHoverText: 'group-hover:text-rainbow-yellow',
  },
};

/** Style d'une classe, avec repli sur la 6ème si l'identifiant est inconnu. */
export const levelStyle = (id: string | null | undefined): LevelStyle =>
  LEVEL_STYLES[isLevelId(id) ? id : '6eme'];
