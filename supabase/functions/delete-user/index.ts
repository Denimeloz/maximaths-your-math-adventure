import { serve } from "https://deno.land/std@0.205.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Nécessaire pour que le navigateur accepte l'appel depuis le site
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { Allow: "POST, OPTIONS" });
  }

  // 1. Qui appelle ? La clé publique du site ne suffit pas : il faut la session d'un utilisateur connecté.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json({ error: "Authentification requise" }, 401);
  }

  const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);
  const caller = callerData?.user;
  if (callerError || !caller) {
    return json({ error: "Session invalide ou expirée" }, 401);
  }

  // 2. Cet utilisateur est-il administrateur ?
  const { data: adminRole, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    return json({ error: roleError.message }, 500);
  }
  if (!adminRole) {
    return json({ error: "Réservé aux administrateurs" }, 403);
  }

  // 3. Quel compte supprimer ?
  let body: { userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const userId = body?.userId;
  if (!userId || typeof userId !== "string") {
    return json({ error: "Missing userId" }, 400);
  }

  if (userId === caller.id) {
    return json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, 400);
  }

  const { error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", userId);

  if (rolesError) {
    return json({ error: rolesError.message }, 500);
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("user_id", userId);

  if (profileError) {
    return json({ error: profileError.message }, 500);
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) {
    return json({ error: authError.message }, 500);
  }

  return json({ success: true });
});
