-- Liens d'inscription (02/11/2026) : le compteur d'inscrits suit les comptes réellement existants.
-- Quand un compte élève est supprimé (depuis l'administration ou depuis Supabase), son profil disparaît
-- (ON DELETE CASCADE) et sa place est rendue au lien d'origine : un lien redevient vide, donc supprimable.

CREATE OR REPLACE FUNCTION public.rendre_place_compte_supprime()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.signup_link_id IS NOT NULL THEN
    UPDATE public.signup_links SET uses = GREATEST(uses - 1, 0) WHERE id = OLD.signup_link_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS rendre_place_compte_supprime ON public.profiles;
CREATE TRIGGER rendre_place_compte_supprime
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.rendre_place_compte_supprime();

-- Remise à niveau, une seule fois : chaque lien compte les comptes qui existent encore
UPDATE public.signup_links l
   SET uses = (SELECT count(*) FROM public.profiles p WHERE p.signup_link_id = l.id);
