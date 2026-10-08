import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Link as LinkIcon, Puzzle, Route, Spline, UsersRound, Zap, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicYears } from "@/contexts/AcademicYearContext";
import { usesNewArchitecture } from "@/lib/levelMenus";

interface ParentResource {
  id: string;
  title: string;
  file_url: string | null;
}

interface Tile {
  to: string;
  title: string;
  text: string;
  icon: LucideIcon;
}

/**
 * Espaces communs à toutes les classes, regroupés en un seul bloc sur l'accueil.
 * Les automatismes et l'espace parents restent mis en avant ; les autres sont en tuiles.
 */
const QuickAccessSection = () => {
  const { years } = useAcademicYears();
  const [parentItems, setParentItems] = useState<ParentResource[]>([]);

  // Automatismes et parcours n'existent que pour les années 2026-2027 et suivantes
  const hasNewArchitectureYear = years.some(y => usesNewArchitecture(y.start_year));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('parent_resources')
        .select('id,title,file_url')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .limit(3);
      if (!cancelled) setParentItems(data || []);
    })();
    return () => { cancelled = true; };
  }, []);

  const tiles: Tile[] = [
    ...(hasNewArchitectureYear
      ? [{ to: '/parcours-revision', title: 'Parcours de révision', text: '5 étapes pour réactiver, revoir, t\'entraîner, vérifier et t\'autoévaluer.', icon: Route }]
      : []),
    { to: '/progression-spiralee', title: 'Progression spiralée', text: "Fiches, exercices et vidéos à travailler toute l'année, par classe.", icon: Spline },
    { to: '/club-maths', title: 'Club Jules Verne', text: 'Énigmes, défis et projets mathématiques.', icon: Puzzle },
  ];

  return (
    <section className="py-14 md:py-16" aria-labelledby="acces-rapides">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 id="acces-rapides" className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-6">
          Pour toutes les classes
        </h2>

        <div className={`grid gap-5 ${hasNewArchitectureYear ? 'lg:grid-cols-2' : ''}`}>
          {hasNewArchitectureYear && (
            <Link
              to="/automatismes"
              className="card-sticker flex flex-col bg-secondary/15 border-secondary p-6 md:p-8 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Zap className="w-8 h-8 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">Automatismes</h3>
              <p className="mt-2 font-body text-muted-foreground max-w-md">
                Des séries courtes pour garder les réflexes de calcul, classe par classe.
              </p>
              <span className="mt-auto pt-5 font-body font-bold text-primary underline underline-offset-4">
                Ouvrir les automatismes
              </span>
            </Link>
          )}

          <Link
            to="/ressources-parents"
            className="card-sticker flex flex-col bg-primary border-primary text-primary-foreground p-6 md:p-8 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <UsersRound className="w-8 h-8 text-secondary" aria-hidden="true" />
            <h3 className="mt-4 font-display text-2xl font-semibold">Espace parents</h3>
            <p className="mt-2 font-body text-primary-foreground/85 max-w-md">
              Documents, guides et liens pour suivre et accompagner votre enfant.
            </p>
            {parentItems.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {parentItems.map(item => (
                  <li key={item.id} className="flex items-center gap-2 font-body text-sm text-primary-foreground/90">
                    {item.file_url
                      ? <FileText className="w-4 h-4 shrink-0 text-secondary" aria-hidden="true" />
                      : <LinkIcon className="w-4 h-4 shrink-0 text-secondary" aria-hidden="true" />}
                    <span className="truncate">{item.title}</span>
                  </li>
                ))}
              </ul>
            )}
            <span className="mt-auto pt-5 font-body font-bold text-secondary underline underline-offset-4">
              Ouvrir l'espace parents
            </span>
          </Link>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map(tile => (
            <Link
              key={tile.to}
              to={tile.to}
              className="card-sticker flex items-start gap-4 bg-card border-border hover:border-primary p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <tile.icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-lg font-medium text-foreground">{tile.title}</span>
                <span className="block mt-1 font-body text-sm text-muted-foreground">{tile.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccessSection;
