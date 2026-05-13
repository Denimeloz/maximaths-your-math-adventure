import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Download, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface DnbResource {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

const DnbRevisionSection = () => {
  const [items, setItems] = useState<DnbResource[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("dnb_revision_resources")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des ressources DNB:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-sky-cloud/30 to-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-rainbow-coral/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-rainbow-coral" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display">Ressources révision DNB</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-xl mb-3" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-sky-cloud/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rainbow-coral to-rainbow-orange flex items-center justify-center shadow-lg shadow-rainbow-coral/30">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display mb-3">
            <span className="text-foreground">Ressources </span>
            <span className="text-rainbow-coral">révision DNB</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fiches, annales et supports pour réviser sereinement le Diplôme National du Brevet !
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {items.map((item) => {
            return (
              <Card
                key={item.id}
                className="group overflow-hidden border-2 border-rainbow-coral/30 hover:border-rainbow-coral hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display text-foreground line-clamp-1">
                      {item.title}
                    </CardTitle>
                    <div className="w-8 h-8 rounded-lg bg-rainbow-coral/10 flex items-center justify-center shrink-0 ml-2">
                      <GraduationCap className="w-4 h-4 text-rainbow-coral" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-5">
                  {item.description && (
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{item.description}</p>
                  )}

                  {item.file_url ? (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-2 p-3 rounded-xl bg-rainbow-coral text-white hover:bg-rainbow-coral/90 transition-colors mb-3 group/link font-medium"
                    >
                      <Download className="w-5 h-5 shrink-0" />
                      <span className="text-sm line-clamp-1">Télécharger</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted text-muted-foreground text-sm mb-3">
                      <FileText className="w-4 h-4" /> Aucun fichier
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(item.created_at), "d MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button
            onClick={() => navigate("/ressources-dnb")}
            className="rounded-xl bg-rainbow-coral text-white hover:bg-rainbow-coral/90 shadow-btn hover:shadow-btn-hover"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Voir toutes les ressources DNB
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DnbRevisionSection;
