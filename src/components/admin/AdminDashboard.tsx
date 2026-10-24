import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Bell, BookOpen, Eye, FileStack, Globe, RefreshCw, Send, Sparkles, UserPlus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LEVEL_IDS, LEVEL_LABELS } from '@/lib/levels';

// Tableau de bord de l'administration (refait le 24/10/2026) : visites du site (Cloudflare),
// activité de publication, contenu par classe, notifications et utilisateurs.

interface LigneContenu {
  table: string;
  total: number;
  publies: number;
  semaine: number;
  par_niveau: Record<string, number>;
}

interface StatsBase {
  contenu: LigneContenu[];
  publications_par_jour: { jour: string; n: number }[];
}

interface Profil {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: string;
}

interface Visites {
  configure: boolean;
  erreur?: string;
  jours?: { jour: string; visiteurs: number; pages: number; requetes: number }[];
}

// Palette du site : bleu nuit, orange, bleu clair, jaune, gris bleuté
const COULEURS = ['hsl(218 81% 23%)', 'hsl(38 95% 50%)', 'hsl(210 70% 55%)', 'hsl(44 100% 48%)', 'hsl(218 25% 65%)'];

// Les tables regroupées en grandes rubriques pour le diagramme par classe
const GROUPES: { nom: string; tables: string[] }[] = [
  { nom: 'Cours', tables: ['courses', 'chapter_resources', 'course_files', 'lessons', 'chapter_podcasts', 'videos'] },
  { nom: 'Exercices', tables: ['exercises', 'training_exercises', 'activities', 'automatisms'] },
  { nom: 'Devoirs', tables: ['assignments'] },
  { nom: 'Tests et évaluations', tables: ['training_tests', 'evaluations', 'dnb_content'] },
  {
    nom: 'Autres',
    tables: ['games_genially', 'class_info', 'revision_path_resources', 'revision_path_files', 'spiral_resources',
      'dnb_revision_resources', 'club_activities', 'club_subjects', 'parent_resources'],
  },
];

const jourCourt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/** Les N derniers jours (aaaa-mm-jj, heure d'Abidjan = UTC), du plus ancien au plus récent. */
const derniersJours = (n: number) =>
  Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 86400000).toISOString().slice(0, 10));

const systeme = (ua: string | null) => {
  const u = ua ?? '';
  return /android/i.test(u) ? 'Android' : /iphone|ipad/i.test(u) ? 'iPhone' : /windows/i.test(u) ? 'Windows' : /mac os/i.test(u) ? 'Mac' : 'Autre';
};

const nomComplet = (p: Profil) => [p.first_name, p.last_name].filter((x) => x && x.trim()).join(' ');
const initiale = (p: Profil) => (nomComplet(p) || p.email || '?').trim()[0]?.toUpperCase() ?? '?';

const Carte: React.FC<{ titre: string; icone: React.ElementType; children: React.ReactNode; className?: string }> = ({
  titre,
  icone: Icone,
  children,
  className = '',
}) => (
  <section className={`card-cartoon bg-card border-border p-5 ${className}`}>
    <h2 className="font-display text-lg text-foreground flex items-center gap-2 mb-4">
      <Icone className="w-5 h-5 text-rainbow-orange" />
      {titre}
    </h2>
    {children}
  </section>
);

const Chiffre: React.FC<{ icone: React.ElementType; valeur: React.ReactNode; libelle: string; detail?: string }> = ({ icone: Icone, valeur, libelle, detail }) => (
  <div className="card-cartoon bg-card border-border p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-rainbow-blue/10 flex items-center justify-center shrink-0">
      <Icone className="w-6 h-6 text-rainbow-blue" />
    </div>
    <div className="min-w-0">
      <p className="text-3xl font-display text-foreground leading-none">{valeur}</p>
      <p className="text-sm font-body text-muted-foreground mt-1">{libelle}</p>
      {detail && <p className="text-xs font-body text-rainbow-orange font-semibold">{detail}</p>}
    </div>
  </div>
);

const Vide: React.FC<{ texte: string }> = ({ texte }) => <p className="text-sm text-muted-foreground py-8 text-center">{texte}</p>;

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsBase | null>(null);
  const [erreurStats, setErreurStats] = useState<string | null>(null);
  const [profils, setProfils] = useState<Profil[]>([]);
  const [admins, setAdmins] = useState(0);
  const [appareils, setAppareils] = useState<string[]>([]);
  const [envois, setEnvois] = useState<{ sent_at: string; delivered: number; failed: number }[]>([]);
  const [visites, setVisites] = useState<Visites | null>(null);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setChargement(true);
    // Tables et fonctions récentes, pas encore dans les types générés par Lovable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const depuis14 = new Date(Date.now() - 14 * 86400000).toISOString();
    const [s, p, r, a, e] = await Promise.all([
      db.rpc('admin_dashboard_stats'),
      supabase.from('profiles').select('id, first_name, last_name, email, created_at').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('role').eq('role', 'admin'),
      db.from('push_subscriptions').select('user_agent'),
      db.from('push_send_log').select('sent_at, delivered, failed').neq('kind', 'test').gte('sent_at', depuis14),
    ]);
    setStats(s.data ?? null);
    setErreurStats(s.error ? s.error.message : null);
    setProfils(p.data ?? []);
    setAdmins(r.data?.length ?? 0);
    setAppareils((a.data ?? []).map((x: { user_agent: string | null }) => systeme(x.user_agent)));
    setEnvois(e.data ?? []);
    setChargement(false);

    // Les visites viennent de Cloudflare : plus lentes, elles arrivent après le reste
    setVisites(null);
    const v = await supabase.functions.invoke('statistiques-site', { body: {} });
    setVisites(v.error ? { configure: false, erreur: v.error.message } : (v.data as Visites));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const contenu = useMemo(() => stats?.contenu ?? [], [stats]);
  const enLigne = contenu.reduce((s, l) => s + l.publies, 0);
  const cetteSemaine = contenu.reduce((s, l) => s + l.semaine, 0);

  const publications = useMemo(() => {
    const parJour = new Map((stats?.publications_par_jour ?? []).map((j) => [j.jour, j.n]));
    return derniersJours(30).map((j) => ({ jour: jourCourt(j), documents: parJour.get(j) ?? 0 }));
  }, [stats]);

  const parClasse = useMemo(
    () =>
      LEVEL_IDS.map((niveau) => {
        const ligne: Record<string, string | number> = { classe: LEVEL_LABELS[niveau] };
        for (const g of GROUPES) {
          ligne[g.nom] = contenu.filter((l) => g.tables.includes(l.table)).reduce((s, l) => s + (l.par_niveau[niveau] ?? 0), 0);
        }
        return ligne;
      }),
    [contenu],
  );

  const parAppareil = useMemo(() => {
    const compte = appareils.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {});
    return Object.entries(compte).map(([nom, valeur]) => ({ nom, valeur }));
  }, [appareils]);

  const envoisParJour = useMemo(() => {
    const jours = derniersJours(14).map((j) => ({ cle: j, jour: jourCourt(j), reussis: 0, echecs: 0 }));
    for (const e of envois) {
      const j = jours.find((x) => x.cle === e.sent_at.slice(0, 10));
      if (j) {
        j.reussis += e.delivered;
        j.echecs += e.failed;
      }
    }
    return jours;
  }, [envois]);

  const inscriptions = useMemo(() => {
    const mois = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (11 - i));
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { cle, mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), comptes: 0 };
    });
    for (const p of profils) {
      const m = mois.find((x) => x.cle === p.created_at.slice(0, 7));
      if (m) m.comptes += 1;
    }
    return mois;
  }, [profils]);

  const joursVisites = visites?.jours ?? [];
  const visitesGraphe = joursVisites.map((j) => ({ jour: jourCourt(j.jour), visiteurs: j.visiteurs, pages: j.pages }));
  const hier = joursVisites.length >= 2 ? joursVisites[joursVisites.length - 2] : joursVisites[0];
  const visiteurs30 = joursVisites.reduce((s, j) => s + j.visiteurs, 0);

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const infobulle = { contentStyle: { borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 13 } };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={charger} className="inline-flex items-center gap-2 text-sm font-semibold rounded-full border px-4 py-2 hover:bg-muted">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {erreurStats && (
        <p className="rounded-xl border border-orange-300 bg-orange-50 text-orange-800 p-3 text-sm">
          Statistiques du contenu indisponibles : exécuter la migration <code>20261024230000_tableau_de_bord.sql</code> dans Supabase. ({erreurStats})
        </p>
      )}

      {/* Chiffres clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Chiffre icone={Globe} valeur={hier ? hier.visiteurs : '—'} libelle="Visiteurs hier" detail={visiteurs30 ? `${visiteurs30} sur 30 jours` : undefined} />
        <Chiffre icone={FileStack} valeur={enLigne} libelle="Documents en ligne" detail={cetteSemaine ? `+${cetteSemaine} cette semaine` : undefined} />
        <Chiffre icone={Bell} valeur={appareils.length} libelle="Appareils abonnés aux notifications" />
        <Chiffre icone={Users} valeur={profils.length} libelle="Comptes" detail={`dont ${admins} administrateur${admins > 1 ? 's' : ''}`} />
      </div>

      {/* Visites (Cloudflare) */}
      <Carte titre="Visites du site (30 jours)" icone={Eye}>
        {!visites ? (
          <Vide texte="Chargement des visites…" />
        ) : visites.erreur || !visites.configure ? (
          <p className="text-sm text-muted-foreground py-6">
            Visites indisponibles : {visites.erreur ?? 'statistiques Cloudflare non configurées'}. Voir <code>docs/tableau-de-bord.md</code>.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={visitesGraphe} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="degradeVisiteurs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COULEURS[0]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COULEURS[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="jour" tick={{ fontSize: 12 }} interval="preserveStartEnd" minTickGap={20} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip {...infobulle} />
              <Legend />
              <Area type="monotone" dataKey="visiteurs" name="Visiteurs uniques" stroke={COULEURS[0]} fill="url(#degradeVisiteurs)" strokeWidth={2} />
              <Area type="monotone" dataKey="pages" name="Pages vues" stroke={COULEURS[1]} fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Carte>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Activité de publication */}
        <Carte titre="Publications par jour (30 jours)" icone={Sparkles}>
          {publications.every((p) => p.documents === 0) ? (
            <Vide texte="Aucune publication ces 30 derniers jours." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={publications} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="jour" tick={{ fontSize: 12 }} interval="preserveStartEnd" minTickGap={20} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip {...infobulle} />
                <Bar dataKey="documents" name="Documents ajoutés" fill={COULEURS[1]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Carte>

        {/* Contenu par classe */}
        <Carte titre="Contenu par classe" icone={BookOpen}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={parClasse} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="classe" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip {...infobulle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {GROUPES.map((g, i) => (
                <Bar key={g.nom} dataKey={g.nom} stackId="classe" fill={COULEURS[i % COULEURS.length]} radius={i === GROUPES.length - 1 ? [6, 6, 0, 0] : 0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Carte>

        {/* Notifications */}
        <Carte titre="Notifications" icone={Send}>
          <div className="grid gap-4 sm:grid-cols-[1fr_1.6fr] items-center">
            {parAppareil.length === 0 ? (
              <Vide texte="Aucun appareil abonné." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={parAppareil} dataKey="valeur" nameKey="nom" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {parAppareil.map((_, i) => (
                      <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...infobulle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Envois aux appareils sur 14 jours (hors tests)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={envoisParJour} margin={{ left: -24, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip {...infobulle} />
                  <Bar dataKey="reussis" name="Acceptés" stackId="e" fill={COULEURS[0]} />
                  <Bar dataKey="echecs" name="Échecs" stackId="e" fill="hsl(0 75% 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Carte>

        {/* Utilisateurs */}
        <Carte titre="Utilisateurs" icone={UserPlus}>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={inscriptions} margin={{ left: -24, right: 4 }}>
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip {...infobulle} />
              <Bar dataKey="comptes" name="Nouveaux comptes" fill={COULEURS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <ul className="mt-3 space-y-2">
            {profils.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
                <span className="w-9 h-9 rounded-full bg-rainbow-blue text-white flex items-center justify-center font-display text-sm shrink-0">{initiale(p)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-foreground truncate">{nomComplet(p) || <span className="text-muted-foreground italic">Nom non renseigné</span>}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
              </li>
            ))}
            {profils.length === 0 && <Vide texte="Aucun compte." />}
          </ul>
        </Carte>
      </div>
    </div>
  );
};
