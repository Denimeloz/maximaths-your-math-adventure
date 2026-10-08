import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type PreviewKind = "office" | "pdf" | "image" | null;

const extensionOf = (value: string | null | undefined): string => {
  if (!value) return "";
  const clean = value.split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot === -1 ? "" : clean.slice(dot + 1).toLowerCase();
};

/** Type d'aperçu possible pour un fichier, d'après son extension. */
export const previewKind = (url: string | null | undefined, fileName?: string | null): PreviewKind => {
  const ext = extensionOf(fileName) || extensionOf(url);
  if (["ppt", "pptx", "pps", "ppsx", "doc", "docx", "xls", "xlsx"].includes(ext)) return "office";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  return null;
};

const LABELS: Record<Exclude<PreviewKind, null>, { show: string; hide: string }> = {
  office: { show: "Voir le diaporama", hide: "Masquer le diaporama" },
  pdf: { show: "Voir le document", hide: "Masquer le document" },
  image: { show: "Voir l'image", hide: "Masquer l'image" },
};

interface FilePreviewProps {
  url: string;
  fileName?: string | null;
  title: string;
}

/**
 * Aperçu d'un fichier directement dans la page, sans téléchargement.
 * Les fichiers Office (PowerPoint, Word…) passent par la visionneuse en ligne de Microsoft,
 * qui a besoin d'une adresse publique : c'est le cas des fichiers déposés depuis l'admin.
 * L'aperçu n'est chargé qu'au clic, pour ne pas ralentir la page.
 */
const FilePreview = ({ url, fileName, title }: FilePreviewProps) => {
  const [open, setOpen] = useState(false);
  const kind = previewKind(url, fileName);
  if (!kind) return null;

  // « Diaporama » pour PowerPoint, « document » pour Word et Excel
  const isSlides = ["ppt", "pptx", "pps", "ppsx"].includes(extensionOf(fileName) || extensionOf(url));
  const labels = kind === "office" && !isSlides ? LABELS.pdf : LABELS[kind];

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="rounded-xl gap-2"
      >
        {open ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {open ? labels.hide : labels.show}
      </Button>

      {open && (
        <div className="mt-3">
          {kind === "image" ? (
            <img src={url} alt={title} className="w-full h-auto rounded-lg border border-border" loading="lazy" />
          ) : (
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
              <iframe
                src={kind === "office" ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}` : url}
                title={`Aperçu : ${title}`}
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
          {kind !== "image" && (
            <p className="mt-2 text-xs font-body text-muted-foreground">
              L'aperçu ne s'affiche pas ? Télécharge le fichier avec le lien juste au-dessus.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FilePreview;
