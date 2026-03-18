import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Calendar, Images } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ClassPhoto {
  id: string;
  level: string;
  title: string;
  description: string | null;
  image_urls: unknown;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

interface ImageItem {
  url: string;
  name: string;
}

const levelLabels: Record<string, string> = {
  "3eme": "3ème",
  "seconde": "Seconde",
};

const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  "3eme": { bg: "bg-rainbow-orange/10", text: "text-rainbow-orange", border: "border-rainbow-orange/30" },
  "seconde": { bg: "bg-rainbow-pink/10", text: "text-rainbow-pink", border: "border-rainbow-pink/30" },
};

const ClassPhotosSection = () => {
  const [photos, setPhotos] = useState<ClassPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("class_photos")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImages = (photo: ClassPhoto): ImageItem[] => {
    if (photo.image_urls && Array.isArray(photo.image_urls)) {
      return photo.image_urls as ImageItem[];
    }
    return [];
  };

  const availableLevels = [...new Set(photos.map((p) => p.level))];
  const filteredPhotos = selectedLevel === "all"
    ? photos
    : photos.filter((p) => p.level === selectedLevel);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-rainbow-pink/20 flex items-center justify-center">
              <Camera className="w-6 h-6 text-rainbow-pink" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display">Classe en activité</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-xl mb-3"></div>
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (photos.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-sky-cloud/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rainbow-pink to-rainbow-coral flex items-center justify-center shadow-lg shadow-rainbow-pink/30">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display mb-3">
            <span className="text-foreground">Classe </span>
            <span className="text-rainbow-pink">en activité</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvre les moments forts et les activités de nos classes en images !
          </p>
        </div>

        {/* Level filter */}
        {availableLevels.length > 1 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex flex-wrap gap-2 p-2 bg-card rounded-2xl border border-border shadow-sm">
              <Button
                variant={selectedLevel === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedLevel("all")}
                className="rounded-xl"
              >
                Toutes
              </Button>
              {availableLevels.map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                  className={`rounded-xl ${selectedLevel === level ? "" : levelColors[level]?.text}`}
                >
                  {levelLabels[level] || level}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Photo cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {filteredPhotos.map((photo) => {
            const images = getImages(photo);
            const colors = levelColors[photo.level] || levelColors["3eme"];
            const previewImages = images.slice(0, 4);

            return (
              <Card
                key={photo.id}
                className={`group overflow-hidden border-2 ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Image grid preview */}
                {previewImages.length > 0 && (
                  <div className={`grid ${previewImages.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1 p-2`}>
                    {previewImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setLightboxImage(img.url); setLightboxOpen(true); }}
                        className={`relative overflow-hidden rounded-xl ${previewImages.length === 1 ? "aspect-video" : previewImages.length === 3 && idx === 0 ? "row-span-2 aspect-square" : "aspect-square"} cursor-pointer`}
                      >
                        <img
                          src={img.url}
                          alt={img.name || photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {idx === 3 && images.length > 4 && (
                          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center rounded-xl">
                            <span className="text-white font-display text-2xl">+{images.length - 4}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <CardHeader className="pb-2 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display text-foreground line-clamp-1">
                      {photo.title}
                    </CardTitle>
                    <Badge variant="secondary" className={`${colors.bg} ${colors.text} border ${colors.border} font-medium shrink-0 ml-2`}>
                      {levelLabels[photo.level] || photo.level}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  {photo.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{photo.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(photo.created_at), "d MMM yyyy", { locale: fr })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Images className="w-3.5 h-3.5" />
                      {images.length} photo{images.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredPhotos.length === 0 && (
          <div className="text-center py-12">
            <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune photo disponible pour cette classe.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur-sm border-border">
          <DialogTitle className="sr-only">Photo</DialogTitle>
          <img
            src={lightboxImage}
            alt="Photo agrandie"
            className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ClassPhotosSection;
