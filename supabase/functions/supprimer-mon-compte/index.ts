// Suppression de son propre compte (06/11/2026), exigée par l'App Store et le Play Store.
// Corps : { confirmation: "SUPPRIMER" }. La personne est identifiée par son jeton de connexion.
// Le profil et le rôle partent avec le compte (ON DELETE CASCADE) ; la photo de profil est retirée ici.
// Un administrateur ne peut pas se supprimer ainsi : ses droits doivent d'abord être retirés.
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erreur: "Méthode non autorisée" }, 405);

  try {
    const jeton = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const { data } = jeton ? await supabaseAdmin.auth.getUser(jeton) : { data: { user: null } };
    const moi = data?.user;
    if (!moi) return json({ erreur: "Connexion requise" }, 401);

    const corps = await req.json().catch(() => ({}));
    if (corps?.confirmation !== "SUPPRIMER") return json({ erreur: "Confirmation manquante" }, 400);

    const { data: role, error: erreurRole } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", moi.id).eq("role", "admin").maybeSingle();
    if (erreurRole) throw new Error(erreurRole.message);
    if (role) return json({ erreur: "Un administrateur doit d'abord faire retirer ses droits." }, 400);

    // La photo n'empêche pas la suppression : une erreur ici est seulement notée
    const { data: photos } = await supabaseAdmin.storage.from("avatars").list(moi.id);
    if (photos?.length) {
      const { error } = await supabaseAdmin.storage.from("avatars").remove(photos.map((f) => `${moi.id}/${f.name}`));
      if (error) console.error("supprimer-mon-compte, photo :", error.message);
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(moi.id);
    if (error) throw new Error(error.message);
    return json({ ok: true });
  } catch (e) {
    console.error("supprimer-mon-compte", (e as Error).message);
    return json({ erreur: "Suppression impossible pour le moment." }, 500);
  }
});
