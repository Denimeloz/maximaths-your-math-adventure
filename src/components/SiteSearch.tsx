import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ClipboardList, FileText, GraduationCap, Layers, Loader2, Search, Spline, UsersRound, Zap, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAcademicYears } from "@/contexts/AcademicYearContext";
import { levelLabel } from "@/lib/levels";
import { CHAPTER_SECTIONS } from "@/lib/levelMenus";

interface SearchResult {
  key: string;
  title: string;
  /** Ce que c'est et où ça se trouve : « Chapitre · 5ème · 2026-2027 » */
  detail: string;
  to: string;
  icon: LucideIcon;
  yearId?: string | null;
}

const MIN_LENGTH = 3;
const PER_SOURCE = 5;

// `%` et `_` sont des jokers dans une recherche SQL : on les neutralise dans ce que tape l'élève
const toPattern = (text: string) => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// section en base → rubrique dans l'adresse (y compris les anciens noms de section)
const SECTION_ROUTES: Record<string, string> = {
  ...Object.fromEntries(Object.entries(CHAPTER_SECTIONS).map(([route, section]) => [section, route])),
  decouverte: "chap-activite",
  exercices: "chap-exercices",
  accompagnement: "chap-accompagnement",
};

// Fiches rangées par classe : table → rubrique et nom affiché
const LEVEL_TABLES: { table: string; route: string; label: string }[] = [
  { table: "activities", route: "activites", label: "Activité" },
  { table: "training_exercises", route: "exercices-entrainement", label: "Exercices" },
  { table: "training_tests", route: "tests-entrainement", label: "Test" },
  { table: "assignments", route: "devoirs", label: "Devoir" },
  { table: "evaluations", route: "evaluations", label: "Évaluation" },
];

const withYear = (path: string, yearId?: string | null) => (yearId ? `${path}${path.includes("?") ? "&" : "?"}year=${yearId}` : path);

interface SiteSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Recherche dans tout le site : chapitres, ressources, automatismes, fiches et devoirs publiés. */
const SiteSearch = ({ open, onOpenChange }: SiteSearchProps) => {
  const navigate = useNavigate();
  const { years, activeYear } = useAcademicYears();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState("");
  const requestId = useRef(0);

  const yearLabel = useMemo(() => {
    const map = new Map(years.map((y) => [y.id, y.label]));
    return (id?: string | null) => (id ? map.get(id) : undefined);
  }, [years]);

  // On repart d'une recherche vide à chaque ouverture
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSearched("");
    }
  }, [open]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < MIN_LENGTH) {
      setResults([]);
      setSearched("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const pattern = toPattern(text);
      const db = supabase as any;
      const detail = (...parts: (string | undefined | null)[]) => parts.filter(Boolean).join(" · ");

      try {
        const [chapters, resources, automatisms, spiral, dnb, parents, courses, ...levelTables] = await Promise.all([
          db.from("tab_chapters").select("id,title,level,academic_year_id").eq("is_published", true).ilike("title", pattern).limit(PER_SOURCE),
          db.from("chapter_resources").select("id,title,section,chapter_id").eq("is_published", true).ilike("title", pattern).limit(PER_SOURCE * 2),
          db.from("automatisms").select("id,title,level,academic_year_id").eq("is_published", true).ilike("title", pattern).limit(PER_SOURCE),
          db.from("spiral_resources").select("id,title,level").eq("is_published", true).ilike("title", pattern).limit(PER_SOURCE),
          db.from("dnb_revision_resources").select("id,title").eq("is_published", true).ilike("title", pattern).limit(PER_SOURCE),
          db.from("parent_resources").select("id,title").eq("is_published", true).ilike("title", pattern).limit(PER_SOURCE),
          db.from("courses").select("id,title,level,academic_year_id").eq("is_published", true).ilike("title", pattern).limit(PER_SOURCE),
          ...LEVEL_TABLES.map((t) =>
            db.from(t.table).select("id,title,level,academic_year_id").eq("is_published", true).ilike("title", pattern).limit(PER_SOURCE),
          ),
        ]);

        // Les ressources de chapitre ont besoin de leur chapitre (publié) pour connaître la classe et l'année
        const resourceRows: any[] = resources.data || [];
        const chapterIds = [...new Set(resourceRows.map((r) => r.chapter_id))];
        const parentChapters: Record<string, any> = {};
        if (chapterIds.length > 0) {
          const { data } = await db.from("tab_chapters").select("id,title,level,academic_year_id").in("id", chapterIds).eq("is_published", true);
          (data || []).forEach((c: any) => { parentChapters[c.id] = c; });
        }

        if (id !== requestId.current) return; // une recherche plus récente est partie entre-temps

        const found: SearchResult[] = [
          ...(chapters.data || []).map((c: any) => ({
            key: `chapitre-${c.id}`, title: c.title, icon: Layers, yearId: c.academic_year_id,
            detail: detail("Chapitre", levelLabel(c.level), yearLabel(c.academic_year_id)),
            to: withYear(`/niveau/${c.level}/chap-cours`, c.academic_year_id),
          })),
          ...resourceRows.filter((r) => parentChapters[r.chapter_id] && SECTION_ROUTES[r.section]).map((r) => {
            const chapter = parentChapters[r.chapter_id];
            return {
              key: `ressource-${r.id}`, title: r.title, icon: FileText, yearId: chapter.academic_year_id,
              detail: detail(chapter.title, levelLabel(chapter.level), yearLabel(chapter.academic_year_id)),
              to: withYear(`/niveau/${chapter.level}/${SECTION_ROUTES[r.section]}`, chapter.academic_year_id),
            };
          }),
          ...(automatisms.data || []).map((a: any) => ({
            key: `automatisme-${a.id}`, title: a.title, icon: Zap, yearId: a.academic_year_id,
            detail: detail("Automatismes", levelLabel(a.level), yearLabel(a.academic_year_id)),
            to: withYear(`/automatismes?level=${a.level}`, a.academic_year_id),
          })),
          ...levelTables.flatMap((res: any, i: number) =>
            (res.data || []).filter((row: any) => row.level).map((row: any) => ({
              key: `${LEVEL_TABLES[i].table}-${row.id}`, title: row.title, icon: ClipboardList, yearId: row.academic_year_id,
              detail: detail(LEVEL_TABLES[i].label, levelLabel(row.level), yearLabel(row.academic_year_id)),
              to: withYear(`/niveau/${row.level}/${LEVEL_TABLES[i].route}`, row.academic_year_id),
            })),
          ),
          ...(courses.data || []).map((c: any) => ({
            key: `cours-${c.id}`, title: c.title, icon: BookOpen, yearId: c.academic_year_id,
            detail: detail("Cours", levelLabel(c.level), yearLabel(c.academic_year_id)),
            to: `/course/${c.id}`,
          })),
          ...(spiral.data || []).map((s: any) => ({
            key: `spirale-${s.id}`, title: s.title, icon: Spline,
            detail: detail("Progression spiralée", levelLabel(s.level)),
            to: `/progression-spiralee?niveau=${s.level}`,
          })),
          ...(dnb.data || []).map((d: any) => ({
            key: `dnb-${d.id}`, title: d.title, icon: GraduationCap, detail: "Ressources DNB", to: "/ressources-dnb",
          })),
          ...(parents.data || []).map((p: any) => ({
            key: `parents-${p.id}`, title: p.title, icon: UsersRound, detail: "Espace parents", to: "/ressources-parents",
          })),
        ];

        // L'année en cours d'abord ; l'ordre des rubriques est conservé pour le reste
        const rank = (r: SearchResult) => (r.yearId && activeYear && r.yearId !== activeYear.id ? 1 : 0);
        setResults(found.map((r, i) => ({ r, i })).sort((a, b) => rank(a.r) - rank(b.r) || a.i - b.i).map((x) => x.r));
      } catch (error) {
        console.error("Erreur de recherche :", error);
        if (id === requestId.current) setResults([]);
      } finally {
        if (id === requestId.current) {
          setSearched(text);
          setIsLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, yearLabel, activeYear]);

  const openResult = (result: SearchResult) => {
    onOpenChange(false);
    navigate(result.to);
  };

  const tooShort = query.trim().length > 0 && query.trim().length < MIN_LENGTH;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 top-[12vh] translate-y-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-display text-lg text-foreground">Rechercher sur MAXIMATHS</DialogTitle>
          <DialogDescription className="text-sm font-body text-muted-foreground">
            Un chapitre, une fiche, une série d'automatismes, un devoir…
          </DialogDescription>
          <form
            className="relative mt-3"
            role="search"
            onSubmit={(e) => { e.preventDefault(); if (results[0]) openResult(results[0]); }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Par exemple : Pythagore"
              aria-label="Rechercher"
              className="pl-10 h-12 rounded-xl text-base"
            />
          </form>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2" aria-live="polite">
          {tooShort && (
            <p className="p-4 text-sm font-body text-muted-foreground">Tape au moins {MIN_LENGTH} lettres.</p>
          )}

          {isLoading && (
            <div className="p-6 flex justify-center" role="status" aria-label="Recherche en cours">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && searched && results.length === 0 && (
            <p className="p-4 text-sm font-body text-muted-foreground">
              Rien trouvé pour « {searched} ». Essaie un autre mot, ou une partie du titre.
            </p>
          )}

          {!isLoading && results.length > 0 && (
            <ul>
              {results.map((result) => (
                <li key={result.key}>
                  <button
                    type="button"
                    onClick={() => openResult(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-muted focus-visible:bg-muted outline-none"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <result.icon className="w-4 h-4 text-primary" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-body font-semibold text-foreground truncate">{result.title}</span>
                      <span className="block text-xs font-body text-muted-foreground truncate">{result.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SiteSearch;
