import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export interface LightboxImage {
  url: string;
  name?: string;
}

interface PhotoLightboxProps {
  images: LightboxImage[];
  /** Position de la photo affichée, ou `null` quand la visionneuse est fermée */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  title?: string;
}

/**
 * Visionneuse d'album : une photo à la fois, avec précédent / suivant
 * (boutons, flèches du clavier ou glissement du doigt).
 */
const PhotoLightbox = ({ images, index, onIndexChange, title }: PhotoLightboxProps) => {
  const touchStartX = useRef<number | null>(null);
  const open = index !== null && images.length > 0;
  const current = open ? images[Math.min(index!, images.length - 1)] : null;
  const many = images.length > 1;

  const go = useCallback(
    (delta: number) => {
      if (index === null || images.length === 0) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    if (!open || !many) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, many, go]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onIndexChange(null); }}>
      <DialogContent className="max-w-5xl p-3 bg-background border-border">
        <DialogTitle className="pr-10 font-display text-base md:text-lg text-foreground">
          {title || "Photo"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {many ? "Utilise les flèches pour passer d'une photo à l'autre." : "Photo agrandie."}
        </DialogDescription>

        {current && (
          <div
            className="relative flex min-h-[40vh] items-center justify-center"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null || !many) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            }}
          >
            <img
              src={current.url}
              alt={current.name || title || "Photo"}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
            />

            {many && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Photo précédente"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Photo suivante"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        )}

        {many && index !== null && (
          <p className="text-center text-sm font-body text-muted-foreground" aria-live="polite">
            Photo {Math.min(index, images.length - 1) + 1} sur {images.length}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PhotoLightbox;
