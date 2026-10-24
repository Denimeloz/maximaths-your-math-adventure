// Visites du site (24/10/2026) : visiteurs uniques, pages vues et requêtes par jour sur 30 jours,
// lus dans les statistiques de Cloudflare (API GraphQL). Réservée aux administrateurs connectés.
// Secrets à définir dans Supabase (Edge Functions › Secrets) :
// - CLOUDFLARE_API_TOKEN : jeton Cloudflare en lecture seule (Zone › Analytics › Read, zone maximaths.com)
// - CLOUDFLARE_ZONE_ID : « ID de zone » affiché sur la page Vue d'ensemble de maximaths.com
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
const CLOUDFLARE_ZONE_ID = Deno.env.get("CLOUDFLARE_ZONE_ID");

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const estAdministrateur = async (req: Request) => {
  const jeton = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!jeton) return false;
  const { data } = await supabaseAdmin.auth.getUser(jeton);
  if (!data?.user) return false;
  const { data: role } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  return !!role;
};

const REQUETE = `
query Visites($zone: string, $depuis: Date, $jusqua: Date) {
  viewer {
    zones(filter: { zoneTag: $zone }) {
      httpRequests1dGroups(limit: 31, filter: { date_geq: $depuis, date_leq: $jusqua }, orderBy: [date_ASC]) {
        dimensions { date }
        sum { requests pageViews }
        uniq { uniques }
      }
    }
  }
}`;

const jour = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!(await estAdministrateur(req))) return json({ erreur: "non autorisé" }, 401);
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    return json({ configure: false, erreur: "Secrets CLOUDFLARE_API_TOKEN et CLOUDFLARE_ZONE_ID à définir dans Supabase" });
  }

  const maintenant = new Date();
  const depuis = new Date(maintenant.getTime() - 29 * 24 * 60 * 60 * 1000);
  try {
    const reponse = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: REQUETE,
        variables: { zone: CLOUDFLARE_ZONE_ID, depuis: jour(depuis), jusqua: jour(maintenant) },
      }),
    });
    const resultat = await reponse.json();
    if (resultat.errors?.length) {
      return json({ configure: true, erreur: resultat.errors.map((e: { message: string }) => e.message).join(" ; ") }, 502);
    }
    const groupes = resultat.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? [];
    const jours = groupes.map((g: { dimensions: { date: string }; sum: { requests: number; pageViews: number }; uniq: { uniques: number } }) => ({
      jour: g.dimensions.date,
      visiteurs: g.uniq.uniques,
      pages: g.sum.pageViews,
      requetes: g.sum.requests,
    }));
    return json({ configure: true, jours });
  } catch (e) {
    return json({ configure: true, erreur: (e as Error).message }, 502);
  }
});
