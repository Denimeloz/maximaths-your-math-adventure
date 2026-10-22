// Parcours de révision : une liste de ressources par classe (plus d'étapes depuis le 22/10/2026).
// Une ressource = un titre, une description, un ou plusieurs fichiers, un lien et un corrigé.

export interface RevisionFile { name: string; url: string; }

export interface RevisionResource {
  id: string;
  level: string;
  academic_year_id: string | null;
  kind: string;
  title: string;
  description: string | null;
  files: RevisionFile[] | null;
  url: string | null;
  correction_url: string | null;
  display_order: number;
  is_published?: boolean;
}

/** Type d'un fichier ou d'un lien, d'après son adresse (sert à choisir l'icône) */
export const kindFromUrl = (url: string): string => {
  const u = url.toLowerCase().split('?')[0];
  if (u.endsWith('.pdf')) return 'pdf';
  if (/\.docx?$/.test(u)) return 'word';
  if (/\.pptx?$/.test(u)) return 'powerpoint';
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(u)) return 'image';
  if (/\.(mp3|m4a|wav|ogg)$/.test(u)) return 'podcast';
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(u)) return 'video';
  if (/canva\.(com|link)/.test(u)) return 'canva';
  return 'link';
};

/** Type enregistré pour une ressource : celui du premier fichier, sinon celui du lien */
export const resourceKind = (files: RevisionFile[], link: string): string =>
  files.length ? kindFromUrl(files[0].url) : link ? kindFromUrl(link) : 'link';
