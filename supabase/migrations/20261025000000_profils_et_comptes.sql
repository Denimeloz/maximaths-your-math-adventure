-- Profils et comptes (25/10/2026)
-- 1. Nouveaux champs du profil, pensés pour les futurs comptes élèves et parents.
-- 2. Champs réservés à l'administration (Jules Verne vérifié, accès payant) : une personne ne peut pas
--    les changer elle-même, ni son e-mail (il se change par la connexion).
-- 3. L'administrateur peut modifier tous les profils.
-- 4. Nettoyage : un compte administrateur n'a plus, en double, une ligne « user » (le rôle affiché était parfois faux).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  -- enseignant, eleve, parent ou autre
  ADD COLUMN IF NOT EXISTS account_type TEXT,
  -- classes suivies : celle de l'élève, celles des enfants d'un parent, celles d'un enseignant
  ADD COLUMN IF NOT EXISTS classes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  -- Réservés à l'administration
  ADD COLUMN IF NOT EXISTS jules_verne BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS access_until DATE,
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IS NULL OR account_type IN ('enseignant', 'eleve', 'parent', 'autre'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_classes_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_classes_check
  CHECK (classes <@ ARRAY['6eme', '5eme', '4eme', '3eme', 'seconde', 'premiere', 'terminale']::TEXT[]);

-- Une personne ne change pas elle-même les champs réservés (l'administration et les fonctions serveur, si)
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.jules_verne := OLD.jules_verne;
    NEW.access_until := OLD.access_until;
    NEW.admin_note := OLD.admin_note;
    NEW.email := OLD.email;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_admin_fields ON public.profiles;
CREATE TRIGGER protect_profile_admin_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Rôles : un seul par compte
DELETE FROM public.user_roles r
 WHERE r.role = 'user'
   AND EXISTS (SELECT 1 FROM public.user_roles a WHERE a.user_id = r.user_id AND a.role = 'admin');
