import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicYears } from "@/contexts/AcademicYearContext";
import { useYearTabs } from "@/hooks/useYearTabs";
import { levelLabel, levelStyle } from "@/lib/levels";
import { Megaphone, FileText, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FileAttachment {
  url: string;
  name: string;
}

interface ClassInfo {
  id: string;
  level: string;
  title: string;
  content: string | null;
  file_url: string | null;
  file_urls: unknown;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  academic_year_id?: string | null;
}

const ClassInfoSection = () => {
  const [classInfos, setClassInfos] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const { loading: yearsLoading } = useAcademicYears();
  const { yearsWithItems, currentYearId, setYear, visible } = useYearTabs(classInfos);

  useEffect(() => {
    fetchClassInfos();
  }, []);

  const fetchClassInfos = async () => {
    try {
      // Toutes les années sont chargées ; le tri par année se fait à l'affichage
      const { data, error } = await supabase
        .from("class_info")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClassInfos(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des informations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileAttachments = (info: ClassInfo): FileAttachment[] => {
    if (info.file_urls && Array.isArray(info.file_urls) && info.file_urls.length > 0) {
      return info.file_urls as FileAttachment[];
    }
    if (info.file_url) {
      return [{ url: info.file_url, name: "Pièce jointe" }];
    }
    return [];
  };

  const availableLevels = [...new Set(visible.map((info) => info.level))];
  
  const filteredInfos = selectedLevel === "all" 
    ? visible 
    : visible.filter((info) => info.level === selectedLevel);

  if (loading || yearsLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-rainbow-orange/20 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-rainbow-orange" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display">Informations pour la classe</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (classInfos.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-sky-cloud/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rainbow-orange to-rainbow-coral flex items-center justify-center shadow-lg shadow-rainbow-orange/30">
              <Megaphone className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display mb-3">
            <span className="text-foreground">Informations </span>
            <span className="text-rainbow-orange">pour la classe</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Retrouve ici toutes les informations importantes concernant tes cours : 
            dates d'examens, directives et consignes spéciales.
          </p>
        </div>

        {/* Années : l'année en cours par défaut, les précédentes restent consultables */}
        {yearsWithItems.length > 1 && (
          <div className="flex justify-center mb-4">
            <div className="inline-flex flex-wrap gap-2 p-2 bg-card rounded-2xl border border-border shadow-sm" role="group" aria-label="Année scolaire">
              {yearsWithItems.map((year) => (
                <Button
                  key={year.id}
                  variant={currentYearId === year.id ? "default" : "ghost"}
                  size="sm"
                  aria-pressed={currentYearId === year.id}
                  onClick={() => { setYear(year.id); setSelectedLevel("all"); }}
                  className="rounded-xl"
                >
                  {year.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Level filter tabs */}
        {availableLevels.length > 1 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex flex-wrap gap-2 p-2 bg-card rounded-2xl border border-border shadow-sm">
              <Button
                variant={selectedLevel === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedLevel("all")}
                className="rounded-xl"
              >
                Toutes les classes
              </Button>
              {availableLevels.map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                  className={`rounded-xl ${selectedLevel === level ? "" : levelStyle(level).text}`}
                >
                  {levelLabel(level)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Info cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {filteredInfos.map((info) => {
            const attachments = getFileAttachments(info);
            const style = levelStyle(info.level);
            const colors = { bg: style.tint, text: style.text, border: style.border };
            
            return (
              <Card 
                key={info.id} 
                className={`group relative overflow-hidden border-2 ${colors.border} transition-shadow hover:shadow-lg`}
              >
                {/* Level badge */}
                <div className="absolute top-4 right-4">
                  <Badge 
                    variant="secondary" 
                    className={`${colors.bg} ${colors.text} border ${colors.border} font-medium`}
                  >
                    {levelLabel(info.level)}
                  </Badge>
                </div>

                <CardHeader className="pb-3 pr-24">
                  <CardTitle className="text-lg font-display text-foreground line-clamp-2 group-hover:text-rainbow-orange transition-colors">
                    {info.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(info.created_at), "d MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Content */}
                  {info.content && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">
                      {info.content}
                    </p>
                  )}

                  {/* Attachments */}
                  {attachments.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        Pièces jointes ({attachments.length})
                      </p>
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-xl ${colors.bg} hover:bg-opacity-80 transition-all group/file`}
                          >
                            <div className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center`}>
                              <FileText className={`w-4 h-4 ${colors.text}`} />
                            </div>
                            <span className="text-sm font-medium text-foreground flex-1 truncate">
                              {file.name}
                            </span>
                            <ExternalLink className={`w-4 h-4 ${colors.text} opacity-0 group-hover/file:opacity-100 transition-opacity`} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/niveau/${info.level}/infos${(info.academic_year_id || currentYearId) ? `?year=${info.academic_year_id || currentYearId}` : ''}`}
                    className="inline-block text-sm font-body font-semibold text-primary underline underline-offset-4"
                  >
                    Toutes les infos de la classe
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredInfos.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune information disponible pour cette classe.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ClassInfoSection;
