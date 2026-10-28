-- Inscription par classe (28/10/2026)
-- 1. Les élèves se connectent avec un pseudo (prenom.nom) et un code de 6 chiffres, sans e-mail.
--    En interne, le compte Supabase a une adresse technique <pseudo>@eleves.maximaths.com (jamais utilisée pour écrire).
-- 2. Liens d'inscription par classe (QR code projeté en classe ou lien posté dans le groupe WhatsApp) :
--    le compte est créé déjà rangé (classe, type, Jules Verne), dans la limite d'une date et d'un nombre de places.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS signup_link_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (username) WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.signup_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT '',
  classe TEXT NOT NULL CHECK (classe IN ('6eme', '5eme', '4eme', '3eme', 'seconde', 'premiere', 'terminale')),
  account_type TEXT NOT NULL DEFAULT 'eleve' CHECK (account_type IN ('eleve', 'parent')),
  jules_verne BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 40 CHECK (max_uses > 0),
  uses INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_links ENABLE ROW LEVEL SECURITY;

-- Seuls les administrateurs voient et gèrent les liens ; les élèves passent par la fonction inscription-classe
DROP POLICY IF EXISTS "Admins manage signup links" ON public.signup_links;
CREATE POLICY "Admins manage signup links" ON public.signup_links
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Réserve une place sur un lien valide, en une seule opération (deux élèves qui scannent en même temps
-- ne peuvent pas dépasser le nombre de places). Renvoie le lien, ou rien s'il est expiré, désactivé ou complet.
CREATE OR REPLACE FUNCTION public.reserver_place_inscription(p_code TEXT)
RETURNS SETOF public.signup_links
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.signup_links
     SET uses = uses + 1
   WHERE code = p_code AND active AND expires_at > now() AND uses < max_uses
  RETURNING *;
$$;

-- Rend la place si la création du compte a échoué
CREATE OR REPLACE FUNCTION public.rendre_place_inscription(p_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.signup_links SET uses = GREATEST(uses - 1, 0) WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.reserver_place_inscription(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rendre_place_inscription(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserver_place_inscription(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.rendre_place_inscription(UUID) TO service_role;

-- Le pseudo et le lien d'origine ne se modifient que par l'administration (comme Jules Verne et la date d'accès)
CREATE OR REPLACE FUNCTION public.protect_profile_identity_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.username := OLD.username;
    NEW.signup_link_id := OLD.signup_link_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_identity_fields ON public.profiles;
CREATE TRIGGER protect_profile_identity_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_identity_fields();
