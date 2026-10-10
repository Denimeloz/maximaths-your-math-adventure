/**
 * Projets des élèves : des élèves de 3ème et de Seconde expliquent une notion du cours
 * en vidéo, en audio ou en diaporama.
 *
 * Rangement : aucune table dédiée. Les projets sont des lignes de `spiral_resources`
 * dont `resource_type` vaut PROJECT_TYPE ; la colonne JSON `resource_links` porte
 * les auteurs, l'accord des parents et la liste des médias (voir ProjectDetails).
 * Tout ce qui lit `spiral_resources` pour la progression spiralée doit donc exclure ce type.
 */
export const PROJECT_TYPE = 'projet_eleve';

/** Classes concernées par les projets */
export const PROJECT_LEVELS = ['3eme', 'seconde'] as const;
export type ProjectLevel = (typeof PROJECT_LEVELS)[number];

export const isProjectLevel = (value: string | null | undefined): value is ProjectLevel =>
  (PROJECT_LEVELS as readonly string[]).includes(value || '');

export interface ProjectMedia {
  /** Adresse du fichier déposé ou du lien */
  url: string;
  /** Nom affiché (« Diaporama », « Vidéo de Koffi »…) */
  label: string;
  /** Nom du fichier d'origine, pour reconnaître son type quand l'adresse ne le dit pas */
  fileName?: string | null;
}

/** Contenu de la colonne JSON `resource_links` pour un projet */
export interface ProjectDetails {
  authors: string;
  /** Les parents ont autorisé la diffusion : indispensable pour publier */
  consent: boolean;
  media: ProjectMedia[];
}

export interface StudentProject extends ProjectDetails {
  id: string;
  level: string;
  academic_year_id: string | null;
  title: string;
  description: string | null;
  is_published: boolean;
  order_index: number;
}

/** Transforme une ligne de `spiral_resources` en projet, sans jamais planter sur un JSON inattendu. */
export const toStudentProject = (row: any): StudentProject => {
  const details = row?.resource_links && !Array.isArray(row.resource_links) && typeof row.resource_links === 'object'
    ? row.resource_links
    : {};
  const media: ProjectMedia[] = Array.isArray(details.media)
    ? details.media
        .filter((m: any) => m && typeof m.url === 'string' && m.url.trim())
        .map((m: any) => ({ url: m.url, label: typeof m.label === 'string' ? m.label : '', fileName: m.fileName || null }))
    : [];
  return {
    id: row.id,
    level: row.level,
    academic_year_id: row.academic_year_id ?? null,
    title: row.title,
    description: row.description ?? null,
    is_published: !!row.is_published,
    order_index: row.order_index ?? 0,
    authors: typeof details.authors === 'string' ? details.authors : '',
    consent: details.consent === true,
    media,
  };
};

export type MediaKind = 'video' | 'audio' | 'youtube' | 'vimeo' | 'drive' | 'canva' | 'slides' | 'document' | 'image' | 'link';

const extensionOf = (value: string | null | undefined): string => {
  if (!value) return '';
  const clean = value.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  return dot === -1 || dot < clean.lastIndexOf('/') ? '' : clean.slice(dot + 1).toLowerCase();
};

const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'ogv'];
// `.ogg` et `.opus` : c'est le format des messages vocaux WhatsApp
const AUDIO_EXT = ['mp3', 'm4a', 'aac', 'ogg', 'oga', 'opus', 'wav', 'weba'];
const SLIDES_EXT = ['ppt', 'pptx', 'pps', 'ppsx'];
const DOCUMENT_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

const hostOf = (url: string): string => {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
};

/** Identifiant d'une vidéo YouTube (lien classique, court, Shorts, direct ou déjà intégré). */
export const youtubeId = (url: string): string | null => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '').toLowerCase();
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.split('/')[1] || null;
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts[0] === 'watch') id = u.searchParams.get('v');
      else if (['shorts', 'embed', 'live'].includes(parts[0])) id = parts[1] || null;
    }
    return id && /^[\w-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};

export const mediaKind = (media: Pick<ProjectMedia, 'url' | 'fileName'>): MediaKind => {
  const host = hostOf(media.url);
  if (youtubeId(media.url)) return 'youtube';
  if (host === 'vimeo.com' || host === 'player.vimeo.com') return 'vimeo';
  if (host === 'drive.google.com' || host === 'docs.google.com') return 'drive';
  if (host === 'canva.com') return 'canva';
  const ext = extensionOf(media.fileName) || extensionOf(media.url);
  if (VIDEO_EXT.includes(ext)) return 'video';
  if (AUDIO_EXT.includes(ext)) return 'audio';
  if (SLIDES_EXT.includes(ext)) return 'slides';
  if (DOCUMENT_EXT.includes(ext)) return 'document';
  if (IMAGE_EXT.includes(ext)) return 'image';
  return 'link';
};

/** Adresse à mettre dans un cadre intégré, ou `null` si le lien ne peut que s'ouvrir dans un nouvel onglet. */
export const embedUrl = (media: Pick<ProjectMedia, 'url' | 'fileName'>): string | null => {
  const kind = mediaKind(media);
  try {
    const u = new URL(media.url);
    if (kind === 'youtube') return `https://www.youtube-nocookie.com/embed/${youtubeId(media.url)}`;
    if (kind === 'vimeo') {
      const id = u.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (kind === 'drive') {
      // Fichier Drive : …/file/d/ID/view → …/file/d/ID/preview ; Docs/Slides : …/d/ID/edit → …/d/ID/preview
      const match = u.pathname.match(/^(.*\/d\/[^/]+)(?:\/.*)?$/);
      return match ? `${u.origin}${match[1]}/preview` : null;
    }
    if (kind === 'canva') {
      // Lien de partage Canva « …/view » : il s'intègre avec ?embed
      return /\/view\/?$/.test(u.pathname) ? `${u.origin}${u.pathname}?embed` : null;
    }
  } catch {
    return null;
  }
  return null;
};

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  video: 'Vidéo',
  youtube: 'Vidéo',
  vimeo: 'Vidéo',
  audio: 'Audio',
  slides: 'Diaporama',
  canva: 'Présentation',
  drive: 'Fichier Drive',
  document: 'Document',
  image: 'Image',
  link: 'Lien',
};

/** Adresse de la page publique, pour une classe et une année données. */
export const projectsPath = (level?: string | null, yearId?: string | null): string => {
  const params = new URLSearchParams();
  if (yearId) params.set('year', yearId);
  if (level) params.set('level', level);
  const query = params.toString();
  return `/projets-eleves${query ? `?${query}` : ''}`;
};
