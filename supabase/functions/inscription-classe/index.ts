// Inscription par classe (28/10/2026). Fonction publique : appelée par la page /rejoindre/<code>,
// ouverte depuis le QR code projeté en classe ou le lien posté dans le groupe WhatsApp.
// Corps : { action, code, ... }
// - info { code } : la classe et le type de compte du lien, s'il est encore valable
// - join { code, first_name, last_name } : crée le compte déjà rangé (classe, type, Jules Verne) avec un pseudo
//   prenom.nom et un code de 6 chiffres, et les renvoie ; la page connecte l'élève aussitôt.
// Le lien porte sa date limite et son nombre de places ; une place est réservée avant la création du compte.
import { createClient } from "npm:@supabase/supabase-js@2.89.0";
import { adresseTechnique, nomValide, nouveauCode, pseudoLibre } from "../_shared/eleves.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

const INVALIDE = "Ce lien d'inscription n'est plus valable (expiré, désactivé ou complet). Demande un nouveau lien à ton professeur.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const corps = await req.json().catch(() => ({}));
  const code = String(corps?.code ?? "").trim();
  if (!/^[A-Za-z0-9]{6,16}$/.test(code)) return json({ erreur: INVALIDE }, 400);

  try {
    if (corps.action === "info") {
      const { data: lien } = await supabaseAdmin
        .from("signup_links")
        .select("label, classe, account_type, expires_at, max_uses, uses, active")
        .eq("code", code)
        .maybeSingle();
      if (!lien || !lien.active || new Date(lien.expires_at) <= new Date() || lien.uses >= lien.max_uses) {
        return json({ erreur: INVALIDE }, 404);
      }
      return json({ label: lien.label, classe: lien.classe, account_type: lien.account_type, expires_at: lien.expires_at });
    }

    if (corps.action === "join") {
      const prenom = String(corps.first_name ?? "").trim().replace(/\s+/g, " ");
      const nom = String(corps.last_name ?? "").trim().replace(/\s+/g, " ");
      if (!nomValide(prenom) || !nomValide(nom)) {
        return json({ erreur: "Écris ton vrai prénom et ton vrai nom (lettres seulement)." }, 400);
      }

      const { data: places, error: erreurPlace } = await supabaseAdmin.rpc("reserver_place_inscription", { p_code: code });
      if (erreurPlace) throw new Error(erreurPlace.message);
      const lien = places?.[0];
      if (!lien) return json({ erreur: INVALIDE }, 404);

      const pseudo = await pseudoLibre(supabaseAdmin, prenom, nom);
      const secret = nouveauCode();
      const { data: cree, error } = await supabaseAdmin.auth.admin.createUser({
        email: adresseTechnique(pseudo),
        password: secret,
        email_confirm: true,
        user_metadata: { first_name: prenom, last_name: nom },
      });
      if (error || !cree?.user) {
        await supabaseAdmin.rpc("rendre_place_inscription", { p_id: lien.id });
        throw new Error(error?.message ?? "Création du compte impossible");
      }

      // Le profil est créé par le déclencheur handle_new_user ; on le range dans la classe du lien
      const { error: erreurProfil } = await supabaseAdmin.from("profiles").update({
        username: pseudo,
        account_type: lien.account_type,
        classes: [lien.classe],
        jules_verne: lien.jules_verne,
        signup_link_id: lien.id,
      }).eq("user_id", cree.user.id);
      if (erreurProfil) console.error("inscription-classe profil", erreurProfil.message);

      return json({ ok: true, pseudo, code: secret, email: adresseTechnique(pseudo) });
    }

    return json({ erreur: "Action inconnue" }, 400);
  } catch (e) {
    console.error("inscription-classe", corps?.action, (e as Error).message);
    return json({ erreur: "Inscription impossible pour le moment. Réessaie dans un instant." }, 500);
  }
});
