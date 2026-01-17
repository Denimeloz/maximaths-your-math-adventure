import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, FileText, Calendar, ChevronRight, ExternalLink } from "lucide-react";
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
  "6eme": { bg: "bg-rainbow-green/10", text: "text-rainbow-green", border: "border-rainbow-green/30" },
  "5eme": { bg: "bg-rainbow-blue/10", text: "text-rainbow-blue", border: "border-rainbow-blue/30" },
  "4eme": { bg: "bg-rainbow-purple/10", text: "text-rainbow-purple", border: "border-rainbow-purple/30" },
  "3eme": { bg: "bg-rainbow-orange/10", text: "text-rainbow-orange", border: "border-rainbow-orange/30" },
  "seconde": { bg: "bg-rainbow-pink/10", text: "text-rainbow-pink", border: "border-rainbow-pink/30" },
  "premiere": { bg: "bg-rainbow-coral/10", text: "text-rainbow-coral", border: "border-rainbow-coral/30" },
  "terminale": { bg: "bg-rainbow-yellow/10", text: "text-rainbow-yellow", border: "border-rainbow-yellow/30" },
};

const ClassInfoSection = () => {
  const [classInfos, setClassInfos] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  useEffect(() => {
    fetchClassInfos();
  }, []);

  const fetchClassInfos = async () => {
    try {
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

  const availableLevels = [...new Set(classInfos.map((info) => info.level))];
  
  const filteredInfos = selectedLevel === "all" 
    ? classInfos 
    : classInfos.filter((info) => info.level === selectedLevel);

  if (loading) {
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
              <Megaphone className="w-7 h-7 text-white" />
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
                  className={`rounded-xl ${selectedLevel === level ? "" : levelColors[level]?.text}`}
                >
                  {levelLabels[level] || level}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Info cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {filteredInfos.map((info) => {
            const attachments = getFileAttachments(info);
            const colors = levelColors[info.level] || levelColors["6eme"];
            
            return (
              <Card 
                key={info.id} 
                className={`group relative overflow-hidden border-2 ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Level badge */}
                <div className="absolute top-4 right-4">
                  <Badge 
                    variant="secondary" 
                    className={`${colors.bg} ${colors.text} border ${colors.border} font-medium`}
                  >
                    {levelLabels[info.level] || info.level}
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
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">
                        {info.content}
                      </p>
                    </div>
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
