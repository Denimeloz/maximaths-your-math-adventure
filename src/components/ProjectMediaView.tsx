import { Download, ExternalLink, FileText, Image as ImageIcon, Link as LinkIcon, Mic, Presentation, Video, type LucideIcon } from 'lucide-react';
import FilePreview from '@/components/FilePreview';
import { MEDIA_KIND_LABELS, embedUrl, mediaKind, type MediaKind, type ProjectMedia } from '@/lib/studentProjects';

export const MEDIA_KIND_ICONS: Record<MediaKind, LucideIcon> = {
  video: Video,
  youtube: Video,
  vimeo: Video,
  audio: Mic,
  slides: Presentation,
  canva: Presentation,
  drive: FileText,
  document: FileText,
  image: ImageIcon,
  link: LinkIcon,
};

const linkClass = 'inline-flex items-center gap-2 text-sm font-body font-semibold text-primary underline underline-offset-4';

interface ProjectMediaViewProps {
  media: ProjectMedia;
  /** Titre du projet, pour nommer les lecteurs et les cadres intégrés */
  projectTitle: string;
}

/** Un média d'un projet d'élève : lecteur vidéo ou audio, diaporama, vidéo intégrée ou simple lien. */
const ProjectMediaView = ({ media, projectTitle }: ProjectMediaViewProps) => {
  const kind = mediaKind(media);
  const Icon = MEDIA_KIND_ICONS[kind];
  const label = media.label.trim() || MEDIA_KIND_LABELS[kind];
  const name = `${label} — ${projectTitle}`;
  const embed = embedUrl(media);

  return (
    <div>
      <p className="flex items-center gap-2 font-body text-sm font-semibold text-foreground">
        <Icon className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
        {label}
      </p>

      {kind === 'video' && (
        <>
          <video controls preload="metadata" src={media.url} aria-label={name} className="mt-2 w-full aspect-video rounded-lg bg-foreground/90" />
          <a href={media.url} target="_blank" rel="noreferrer" download className={`mt-2 ${linkClass}`}>
            <Download className="w-4 h-4" aria-hidden="true" />La vidéo ne se lance pas ? Télécharge-la
          </a>
        </>
      )}

      {kind === 'audio' && (
        <audio controls preload="none" src={media.url} aria-label={name} className="mt-2 w-full" />
      )}

      {embed && (
        <>
          <div className="mt-2 aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
            <iframe
              src={embed}
              title={name}
              className="w-full h-full"
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
          <a href={media.url} target="_blank" rel="noreferrer" className={`mt-2 ${linkClass}`}>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />Ouvrir dans un nouvel onglet
          </a>
        </>
      )}

      {(kind === 'slides' || kind === 'document') && (
        <>
          <a href={media.url} target="_blank" rel="noreferrer" download className={`mt-2 ${linkClass}`}>
            <Download className="w-4 h-4" aria-hidden="true" />{media.fileName || 'Télécharger le fichier'}
          </a>
          <FilePreview url={media.url} fileName={media.fileName} title={name} />
        </>
      )}

      {kind === 'image' && (
        <img src={media.url} alt={name} loading="lazy" className="mt-2 w-full h-auto rounded-lg border border-border" />
      )}

      {/* Lien quelconque, ou lien Drive / Canva / Vimeo qu'on ne sait pas intégrer */}
      {!embed && ['link', 'drive', 'canva', 'vimeo'].includes(kind) && (
        <a href={media.url} target="_blank" rel="noreferrer" className={`mt-2 ${linkClass}`}>
          <ExternalLink className="w-4 h-4" aria-hidden="true" />Ouvrir le lien
        </a>
      )}
    </div>
  );
};

export default ProjectMediaView;
