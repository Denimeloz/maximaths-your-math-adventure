// Gestion des comptes depuis l'administration (25/10/2026). Réservée aux administrateurs connectés.
// Corps : { action, ... }
// - list : tous les comptes (profil, rôle, dernière connexion, e-mail confirmé)
// - invite { email, first_name, last_name, account_type?, admin? } : crée le compte et renvoie un lien
//   d'invitation à envoyer (WhatsApp ou e-mail) ; la personne y choisit son mot de passe.
//   Le lien mène à la page /activer du site (et non à Supabase) : l'aperçu de WhatsApp ne peut pas l'user.
// - link { userId } : nouveau lien pour choisir un mot de passe (compte déjà créé)
// - reset_code { userId } : compte élève (pseudo, sans e-mail) : nouveau code de 6 chiffres, à envoyer (28/10/2026)
// - set_admin { userId, admin } ; update { userId, ...champs du profil } ; delete { userId }
// Garde-fous : on ne se retire pas soi-même les droits, on garde au moins un administrateur,
// on ne supprime ni soi-même ni un administrateur.
import { createClient } from "npm:@supabase/supabase-js@2.89.0";
import { DOMAINE_ELEVES, nouveauCode } from "../_shared/eleves.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = Deno.env.get("SITE_URL") ?? "https://maximaths.com";

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

const TYPES = ["enseignant", "eleve", "parent", "autre"];
const CLASSES = ["6eme", "5eme", "4eme", "3eme", "seconde", "premiere", "terminale"];
const CHAMPS_PROFIL = ["first_name", "last_name", "phone", "profession", "account_type", "classes", "school", "city", "country", "bio", "jules_verne", "access_until", "admin_note"];

const appelant = async (req: Request) => {
  const jeton = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!jeton) return null;
  const { data } = await supabaseAdmin.auth.getUser(jeton);
  if (!data?.user) return null;
  const { data: role } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  return role ? data.user : null;
};

const estAdmin = async (userId: string) => {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
};

const nombreAdmins = async () => {
  const { count } = await supabaseAdmin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "admin");
  return count ?? 0;
};

// Un seul rôle par compte
const definirRole = async (userId: string, admin: boolean) => {
  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: admin ? "admin" : "user" });
  if (error) throw new Error(error.message);
};

// Lien du site : le code n'est utilisé qu'au clic sur « Activer mon compte » (page /activer)
const lienDuSite = (hashedToken: string, type: "invite" | "recovery") =>
  `${SITE}/activer?token_hash=${encodeURIComponent(hashedToken)}&type=${type}`;

const nettoyer = (champs: Record<string, unknown>) => {
  const propre: Record<string, unknown> = {};
  for (const cle of CHAMPS_PROFIL) {
    if (!(cle in champs)) continue;
    let valeur = champs[cle];
    if (typeof valeur === "string") valeur = valeur.trim() === "" ? null : valeur.trim().slice(0, 500);
    if (cle === "account_type" && valeur !== null && !TYPES.includes(String(valeur))) continue;
    if (cle === "classes") valeur = Array.isArray(valeur) ? valeur.filter((c) => CLASSES.includes(String(c))) : [];
    if (cle === "jules_verne") valeur = valeur === true;
    if ((cle === "first_name" || cle === "last_name") && valeur === null) valeur = "";
    propre[cle] = valeur;
  }
  return propre;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const moi = await appelant(req);
  if (!moi) return json({ erreur: "Réservé aux administrateurs connectés" }, 401);

  const corps = await req.json().catch(() => ({}));
  const action = corps?.action;

  try {
    if (action === "list") {
      const { data: liste, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw new Error(error.message);
      const [{ data: profils }, { data: roles }] = await Promise.all([
        supabaseAdmin.from("profiles").select("*"),
        supabaseAdmin.from("user_roles").select("user_id, role"),
      ]);
      const comptes = liste.users.map((u) => {
        const profil = profils?.find((p) => p.user_id === u.id) ?? null;
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          email_confirmed_at: u.email_confirmed_at ?? null,
          invited_at: u.invited_at ?? null,
          admin: (roles ?? []).some((r) => r.user_id === u.id && r.role === "admin"),
          moi: u.id === moi.id,
          profil,
        };
      }).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return json({ comptes });
    }

    if (action === "invite") {
      const email = String(corps.email ?? "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ erreur: "Adresse e-mail invalide" }, 400);
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: { first_name: String(corps.first_name ?? "").trim(), last_name: String(corps.last_name ?? "").trim() },
          redirectTo: `${SITE}/profil?bienvenue=1`,
        },
      });
      if (error) {
        const deja = /already|registered|exists/i.test(error.message);
        return json({ erreur: deja ? "Un compte existe déjà avec cette adresse : utilise « Lien de connexion »." : error.message }, 400);
      }
      const id = data.user.id;
      const champs = nettoyer({ account_type: corps.account_type, classes: corps.classes });
      if (Object.keys(champs).length) await supabaseAdmin.from("profiles").update(champs).eq("user_id", id);
      if (corps.admin === true) await definirRole(id, true);
      return json({ ok: true, lien: lienDuSite(data.properties.hashed_token, "invite"), userId: id });
    }

    if (action === "link") {
      const { data: cible } = await supabaseAdmin.auth.admin.getUserById(String(corps.userId));
      if (!cible?.user?.email) return json({ erreur: "Compte introuvable" }, 404);
      // Compte jamais activé : on renvoie une invitation ; sinon, un lien pour changer de mot de passe
      const type = cible.user.email_confirmed_at ? "recovery" : "invite";
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type,
        email: cible.user.email,
        options: { redirectTo: `${SITE}/profil?${type === "invite" ? "bienvenue" : "mot-de-passe"}=1` },
      });
      if (error) throw new Error(error.message);
      return json({ ok: true, lien: lienDuSite(data.properties.hashed_token, type) });
    }

    if (action === "reset_code") {
      const userId = String(corps.userId);
      const { data: cible } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!cible?.user?.email?.endsWith(`@${DOMAINE_ELEVES}`)) {
        return json({ erreur: "Ce compte a une adresse e-mail : utilise « Lien de connexion »." }, 400);
      }
      const code = nouveauCode();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: code });
      if (error) throw new Error(error.message);
      return json({ ok: true, code });
    }

    if (action === "set_admin") {
      const userId = String(corps.userId);
      const admin = corps.admin === true;
      if (!admin && userId === moi.id) return json({ erreur: "Tu ne peux pas te retirer toi-même les droits d'administrateur." }, 400);
      if (!admin && (await estAdmin(userId)) && (await nombreAdmins()) <= 1) {
        return json({ erreur: "Il faut garder au moins un administrateur." }, 400);
      }
      await definirRole(userId, admin);
      return json({ ok: true });
    }

    if (action === "update") {
      const champs = nettoyer(corps);
      if (!Object.keys(champs).length) return json({ erreur: "Rien à modifier" }, 400);
      const { error } = await supabaseAdmin.from("profiles").update(champs).eq("user_id", String(corps.userId));
      if (error) throw new Error(error.message);
      return json({ ok: true });
    }

    if (action === "delete") {
      const userId = String(corps.userId);
      if (userId === moi.id) return json({ erreur: "Tu ne peux pas supprimer ton propre compte." }, 400);
      if (await estAdmin(userId)) return json({ erreur: "Retire d'abord ses droits d'administrateur." }, 400);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw new Error(error.message);
      return json({ ok: true });
    }

    return json({ erreur: "Action inconnue" }, 400);
  } catch (e) {
    console.error("admin-users", action, (e as Error).message);
    return json({ erreur: (e as Error).message }, 500);
  }
});
