// Envoie les notifications push des contenus publiés (file pending_notifications).
// Appelée toutes les 5 minutes par une tâche planifiée (voir docs/notifications-push.md).
// Les dépôts rapprochés sont regroupés : on attend 5 minutes de calme avant d'envoyer un seul message.
// Mode test : corps {"test": true} → une notification d'essai part tout de suite vers chaque appareil,
// sans toucher à la file, et la réponse détaille le résultat appareil par appareil.
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

const ATTENTE_MINUTES = 5;
const NIVEAUX: Record<string, string> = {
  "6eme": "6e", "5eme": "5e", "4eme": "4e", "3eme": "3e",
  seconde: "2nde", premiere: "1re", terminale: "Tle",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const libelle = (titre: string, niveau: string | null) =>
  niveau && NIVEAUX[niveau] ? `${titre} (${NIVEAUX[niveau]})` : titre;

const appareil = (userAgent: string | null) => {
  const ua = userAgent ?? "";
  const systeme = /android/i.test(ua) ? "Android" : /iphone|ipad/i.test(ua) ? "iPhone" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "Mac" : "autre";
  const navigateur = /edg\//i.test(ua) ? "Edge" : /firefox/i.test(ua) ? "Firefox" : /chrome/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "?";
  return `${systeme} / ${navigateur}`;
};

// Envoie un message à tous les abonnés et rend compte de chaque envoi
const envoyerATous = async (message: { title: string; body: string; url: string }) => {
  const { data: abonnes, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_agent");
  if (error) throw new Error(error.message);

  const charge = JSON.stringify(message);
  const resultats: { appareil: string; service: string; ok: boolean; code?: number; detail?: string }[] = [];
  const perimes: string[] = [];

  for (const a of abonnes ?? []) {
    const service = new URL(a.endpoint).host;
    try {
      const reponse = await webpush.sendNotification(
        { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
        charge,
        { TTL: 60 * 60 * 24, urgency: "high" },
      );
      resultats.push({ appareil: appareil(a.user_agent), service, ok: true, code: reponse.statusCode });
    } catch (e) {
      const err = e as { statusCode?: number; body?: string; message?: string };
      // 404 / 410 : l'appareil s'est désabonné ou le navigateur a été réinstallé
      if (err.statusCode === 404 || err.statusCode === 410) perimes.push(a.endpoint);
      const detail = String(err.body || err.message || e).slice(0, 300);
      console.error("Échec d'envoi", appareil(a.user_agent), service, err.statusCode, detail);
      resultats.push({ appareil: appareil(a.user_agent), service, ok: false, code: err.statusCode, detail });
    }
  }

  if (perimes.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", perimes);
  }
  console.log("Envoi terminé", JSON.stringify(resultats));
  return { resultats, abonnes_supprimes: perimes.length };
};

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ erreur: "non autorisé" }, 401);
  }

  const corps = await req.json().catch(() => ({}));
  try {
    if (corps?.test === true) {
      const bilan = await envoyerATous({
        title: "Test MAXIMATHS",
        body: "Si tu lis ce message, les notifications fonctionnent sur cet appareil.",
        url: "/",
      });
      return json({ mode: "test", ...bilan });
    }

    const { data: file, error } = await supabaseAdmin
      .from("pending_notifications")
      .select("id, title, level, created_at")
      .is("sent_at", null)
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) return json({ erreur: error.message }, 500);
    if (!file || file.length === 0) return json({ envoye: 0, raison: "rien à annoncer" });

    // L'administrateur dépose peut-être encore des documents : on attend la fin de la série
    const dernier = new Date(file[file.length - 1].created_at).getTime();
    if (Date.now() - dernier < ATTENTE_MINUTES * 60 * 1000) {
      return json({ envoye: 0, raison: "dépôts en cours, envoi au prochain passage" });
    }

    const titres = file.map((n) => libelle(n.title, n.level));
    const message = file.length === 1
      ? { title: "Nouveau sur MAXIMATHS", body: titres[0], url: "/" }
      : {
        title: `${file.length} nouveautés sur MAXIMATHS`,
        body: titres.slice(0, 3).join(" · ") + (file.length > 3 ? ` et ${file.length - 3} autres` : ""),
        url: "/",
      };

    const bilan = await envoyerATous(message);
    await supabaseAdmin
      .from("pending_notifications")
      .update({ sent_at: new Date().toISOString() })
      .in("id", file.map((n) => n.id));

    return json({ annonces: file.length, ...bilan });
  } catch (e) {
    console.error("Erreur de la fonction", (e as Error).message);
    return json({ erreur: (e as Error).message }, 500);
  }
});
