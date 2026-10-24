// Envoie les notifications push des contenus publiés (file pending_notifications).
// Appelée tout de suite à chaque publication (déclencheur send_push_now, pg_net) et, en secours,
// par la tâche planifiée chaque minute (voir docs/notifications-push.md).
// Règle (choix du 24/10/2026) : une notification par document ; si plus de 5 documents partent en
// 2 minutes, les suivants attendent 1 minute de calme et partent en un seul résumé.
// Mode test : corps {"test": true} (et "endpoint" pour viser un seul appareil). Il est permis avec
// le mot de passe de la tâche planifiée ou depuis l'administration (compte administrateur connecté).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:maximathsclass@gmail.com";
// Mot de passe de la tâche planifiée : la fonction est déployée sans vérification JWT
const CRON_SECRET = Deno.env.get("CRON_SECRET");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !CRON_SECRET) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY et CRON_SECRET doivent être définis.");
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MAX_PAR_RAFALE = 5;
const FENETRE_RAFALE_MS = 2 * 60 * 1000;
const CALME_MS = 60 * 1000;

const NIVEAUX: Record<string, string> = {
  "6eme": "6e", "5eme": "5e", "4eme": "4e", "3eme": "3e",
  seconde: "2nde", premiere: "1re", terminale: "Tle",
};

// Nature du document, d'après la table où il a été publié
const RUBRIQUES: Record<string, string> = {
  activities: "Activité", assignments: "Devoir", automatisms: "Automatismes",
  chapter_podcasts: "Podcast", chapter_resources: "Cours", class_info: "Info de classe",
  club_activities: "Club maths", club_subjects: "Club maths", course_files: "Cours",
  dnb_content: "Prépa DNB", dnb_revision_resources: "Révision DNB", evaluations: "Évaluation",
  exercises: "Exercices", games_genially: "Jeu", lessons: "Cours", parent_resources: "Espace parents",
  revision_path_files: "Parcours de révision", revision_path_resources: "Parcours de révision",
  spiral_resources: "Progression spiralée", training_exercises: "Exercices", training_tests: "Test",
  videos: "Vidéo",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Annonce = { id: number; title: string; level: string | null; source_table: string; created_at: string };
type Message = { title: string; body: string; url: string; tag: string };

const niveau = (n: string | null) => (n && NIVEAUX[n] ? NIVEAUX[n] : null);

const libelle = (a: Annonce) => {
  const classe = niveau(a.level);
  return classe ? `${a.title} (${classe})` : a.title;
};

const appareil = (userAgent: string | null) => {
  const ua = userAgent ?? "";
  const systeme = /android/i.test(ua) ? "Android" : /iphone|ipad/i.test(ua) ? "iPhone" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "Mac" : "autre";
  const navigateur = /edg\//i.test(ua) ? "Edge" : /firefox/i.test(ua) ? "Firefox" : /samsungbrowser/i.test(ua) ? "Samsung Internet" : /chrome/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "?";
  return `${systeme} / ${navigateur}`;
};

// Envoie un message à tous les abonnés (ou à un seul appareil), en parallèle, et l'écrit au journal
const envoyer = async (kind: "test" | "document" | "resume", message: Message, endpoint?: string) => {
  let requete = supabaseAdmin.from("push_subscriptions").select("endpoint, p256dh, auth, user_agent");
  if (endpoint) requete = requete.eq("endpoint", endpoint);
  const { data: abonnes, error } = await requete;
  if (error) throw new Error(error.message);

  const charge = JSON.stringify(message);
  const perimes: string[] = [];
  const resultats = await Promise.all((abonnes ?? []).map(async (a) => {
    const service = new URL(a.endpoint).host;
    try {
      const reponse = await webpush.sendNotification(
        { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
        charge,
        { TTL: 60 * 60 * 24, urgency: "high" },
      );
      return { appareil: appareil(a.user_agent), service, ok: true, code: reponse.statusCode };
    } catch (e) {
      const err = e as { statusCode?: number; body?: string; message?: string };
      // 404 / 410 : l'appareil s'est désabonné ou le navigateur a été réinstallé
      if (err.statusCode === 404 || err.statusCode === 410) perimes.push(a.endpoint);
      const detail = String(err.body || err.message || e).slice(0, 300);
      console.error("Échec d'envoi", appareil(a.user_agent), service, err.statusCode, detail);
      return { appareil: appareil(a.user_agent), service, ok: false, code: err.statusCode, detail };
    }
  }));

  if (perimes.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", perimes);
  }
  const reussis = resultats.filter((r) => r.ok).length;
  await supabaseAdmin.from("push_send_log").insert({
    kind,
    title: message.title,
    body: message.body,
    devices: resultats.length,
    delivered: reussis,
    failed: resultats.length - reussis,
    details: { resultats, abonnes_supprimes: perimes.length },
  });
  return { appareils: resultats.length, reussis, resultats, abonnes_supprimes: perimes.length };
};

// Réserve des annonces avant de les envoyer : si deux appels arrivent en même temps, une annonce
// n'est réservée (et donc envoyée) qu'une seule fois.
const reserver = async (ids: number[]): Promise<Annonce[]> => {
  if (ids.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from("pending_notifications")
    .update({ sent_at: new Date().toISOString() })
    .in("id", ids)
    .is("sent_at", null)
    .select("id, title, level, source_table, created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Annonce[];
};

const messageDocument = (a: Annonce): Message => {
  const rubrique = RUBRIQUES[a.source_table] ?? "Document";
  const classe = niveau(a.level);
  return {
    title: `Nouveau sur MAXIMATHS · ${rubrique}${classe ? ` (${classe})` : ""}`,
    body: a.title,
    url: "/nouveautes",
    tag: `maximaths-${a.id}`,
  };
};

const messageResume = (annonces: Annonce[]): Message => ({
  title: `${annonces.length} nouveautés sur MAXIMATHS`,
  body: annonces.slice(0, 3).map(libelle).join(" · ") + (annonces.length > 3 ? ` et ${annonces.length - 3} autres` : ""),
  url: "/nouveautes",
  tag: `maximaths-resume-${annonces[0].id}`,
});

const estAdministrateur = async (req: Request) => {
  const jeton = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!jeton) return false;
  const { data } = await supabaseAdmin.auth.getUser(jeton);
  if (!data?.user) return false;
  const { data: role } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  return !!role;
};

const traiterLaFile = async () => {
  const { data, error } = await supabaseAdmin
    .from("pending_notifications")
    .select("id, title, level, source_table, created_at")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  const file = (data ?? []) as Annonce[];
  if (file.length === 0) return { envoye: 0, raison: "rien à annoncer" };

  // Combien de documents sont déjà partis ces 2 dernières minutes ?
  const { count } = await supabaseAdmin
    .from("pending_notifications")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", new Date(Date.now() - FENETRE_RAFALE_MS).toISOString());
  const places = Math.max(0, MAX_PAR_RAFALE - (count ?? 0));

  const bilans = [];
  const individuelles = await reserver(file.slice(0, places).map((a) => a.id));
  for (const a of individuelles) {
    bilans.push({ document: a.title, ...(await envoyer("document", messageDocument(a))) });
  }

  // Au-delà de 5 : on attend 1 minute de calme, puis un seul résumé (la tâche planifiée y repasse)
  const reste = file.slice(places);
  if (reste.length > 0) {
    const dernier = new Date(reste[reste.length - 1].created_at).getTime();
    if (Date.now() - dernier < CALME_MS) {
      return { envoye: individuelles.length, en_attente: reste.length, raison: "rafale de publications, résumé au prochain passage", bilans };
    }
    const groupe = await reserver(reste.map((a) => a.id));
    if (groupe.length === 1) {
      bilans.push({ document: groupe[0].title, ...(await envoyer("document", messageDocument(groupe[0]))) });
    } else if (groupe.length > 1) {
      bilans.push({ resume: groupe.length, ...(await envoyer("resume", messageResume(groupe))) });
    }
    return { envoye: individuelles.length + groupe.length, bilans };
  }
  return { envoye: individuelles.length, bilans };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const parLaTache = req.headers.get("x-cron-secret") === CRON_SECRET;
  const corps = await req.json().catch(() => ({}));

  try {
    if (!parLaTache && !(await estAdministrateur(req))) return json({ erreur: "non autorisé" }, 401);

    if (corps?.test === true) {
      const bilan = await envoyer("test", {
        title: "Test MAXIMATHS",
        body: "Si tu lis ce message, les notifications fonctionnent sur cet appareil.",
        url: "/nouveautes",
        tag: `maximaths-test-${Date.now()}`,
      }, typeof corps.endpoint === "string" ? corps.endpoint : undefined);
      return json({ mode: "test", ...bilan });
    }

    // L'administrateur peut aussi forcer le traitement de la file depuis son écran
    return json(await traiterLaFile());
  } catch (e) {
    console.error("Erreur de la fonction", (e as Error).message);
    return json({ erreur: (e as Error).message }, 500);
  }
});
