import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, FileText, ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface GameGenially {
  id: string;
  level: string;
  title: string;
  description: string | null;
  file_url: string | null;
  links: unknown;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

interface LinkItem {
  title: string;
  url: string;
}

const levelLabels: Record<string, string> = {
  "6eme": "6ème",
  "5eme": "5ème",
  "4eme": "4ème",
  "3eme": "3ème",
  "seconde": "Seconde",
  "premiere": "Première",
  "terminale": "Terminale",
};

const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  "6eme": { bg: "bg-rainbow-blue/10", text: "text-rainbow-blue", border: "border-rainbow-blue/30" },
  "5eme": { bg: "bg-rainbow-green/10", text: "text-rainbow-green", border: "border-rainbow-green/30" },
  "4eme": { bg: "bg-rainbow-orange/10", text: "text-rainbow-orange", border: "border-rainbow-orange/30" },
  "3eme": { bg: "bg-rainbow-coral/10", text: "text-rainbow-coral", border: "border-rainbow-coral/30" },
  "seconde": { bg: "bg-rainbow-pink/10", text: "text-rainbow-pink", border: "border-rainbow-pink/30" },
  "premiere": { bg: "bg-rainbow-purple/10", text: "text-rainbow-purple", border: "border-rainbow-purple/30" },
  "terminale": { bg: "bg-rainbow-yellow/10", text: "text-rainbow-yellow", border: "border-rainbow-yellow/30" },
};

const GamesGeniallySection = () => {
  const [items, setItems] = useState<GameGenially[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("games_genially")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(9);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des jeux et genially:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLinks = (item: GameGenially): LinkItem[] => {
    if (item.links && Array.isArray(item.links)) {
      return item.links as LinkItem[];
    }
    return [];
  };

  const availableLevels = [...new Set(items.map((i) => i.level))];
  const filteredItems = selectedLevel === "all"
    ? items
    : items.filter((i) => i.level === selectedLevel);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-sky-cloud/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-rainbow-purple/20 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-rainbow-purple" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display">Jeux et Genially</h2>
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
    <section className="py-16 bg-gradient-to-b from-background to-sky-cloud/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rainbow-purple to-rainbow-blue flex items-center justify-center shadow-lg shadow-rainbow-purple/30">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display mb-3">
            <span className="text-foreground">Jeux et </span>
            <span className="text-rainbow-purple">Genially</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvre des jeux éducatifs et des présentations interactives pour apprendre en t'amusant !
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

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {filteredItems.map((item) => {
            const links = getLinks(item);
            const colors = levelColors[item.level] || levelColors["6eme"];

            return (
              <Card
                key={item.id}
                className={`group overflow-hidden border-2 ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display text-foreground line-clamp-1">
                      {item.title}
                    </CardTitle>
                    <Badge variant="secondary" className={`${colors.bg} ${colors.text} border ${colors.border} font-medium shrink-0 ml-2`}>
                      {levelLabels[item.level] || item.level}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pb-5">
                  {item.description && (
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{item.description}</p>
                  )}

                  {/* File PDF */}
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors mb-3 group/link"
                    >
                      <FileText className="w-5 h-5 text-rainbow-coral shrink-0" />
                      <span className="text-sm font-medium text-foreground group-hover/link:text-rainbow-coral transition-colors line-clamp-1">
                        Voir le fichier PDF
                      </span>
                    </a>
                  )}

                  {/* External links */}
                  {links.length > 0 && (
                    <div className="space-y-2">
                      {links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group/link"
                        >
                          <ExternalLink className="w-4 h-4 text-rainbow-blue shrink-0" />
                          <span className="text-sm font-medium text-foreground group-hover/link:text-rainbow-blue transition-colors line-clamp-1">
                            {link.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-4">
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Gamepad2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun jeu ou Genially disponible pour cette classe.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GamesGeniallySection;
