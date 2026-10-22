-- Notifications push (21/10/2026)
-- 1. push_subscriptions : les appareils qui ont accepté les notifications (pas besoin de compte).
-- 2. pending_notifications : la file des contenus publiés à annoncer, remplie par des déclencheurs.
-- L'envoi est fait par la fonction send-push-notifications, appelée toutes les 5 minutes (voir docs).

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  -- Plus tard : la classe de l'élève, pour n'envoyer que ce qui le concerne
  level TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Personne ne lit les abonnements depuis le site, sauf l'administrateur (pour compter les abonnés)
CREATE POLICY "Admins can view push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Les visiteurs s'abonnent et se désabonnent par ces deux fonctions, sans accès direct à la table
CREATE OR REPLACE FUNCTION public.subscribe_push(
  p_endpoint TEXT, p_p256dh TEXT, p_auth TEXT, p_level TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.push_subscriptions (endpoint, p256dh, auth, level, user_agent)
  VALUES (p_endpoint, p_p256dh, p_auth, p_level, left(p_user_agent, 300))
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        level = COALESCE(EXCLUDED.level, push_subscriptions.level),
        last_seen_at = now();
$$;

CREATE OR REPLACE FUNCTION public.unsubscribe_push(p_endpoint TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint;
$$;

GRANT EXECUTE ON FUNCTION public.subscribe_push(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_push(TEXT) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.pending_notifications (
  id BIGSERIAL PRIMARY KEY,
  source_table TEXT NOT NULL,
  row_id TEXT NOT NULL,
  title TEXT NOT NULL,
  level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  UNIQUE (source_table, row_id)
);

ALTER TABLE public.pending_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pending notifications"
  ON public.pending_notifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Un contenu est annoncé quand il est publié : à sa création s'il est publié tout de suite,
-- ou au moment où il passe de « brouillon » à « publié ». Une seule annonce par contenu.
CREATE OR REPLACE FUNCTION public.queue_new_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nouveau JSONB := to_jsonb(NEW);
BEGIN
  IF COALESCE((nouveau->>'is_published')::BOOLEAN, TRUE) IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND COALESCE((to_jsonb(OLD)->>'is_published')::BOOLEAN, TRUE) IS TRUE THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.pending_notifications (source_table, row_id, title, level)
  VALUES (TG_TABLE_NAME, nouveau->>'id', COALESCE(NULLIF(nouveau->>'title', ''), 'Nouveau contenu'), nouveau->>'level')
  ON CONFLICT (source_table, row_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Les tables de documents et d'activités (pas la structure : cours, chapitres, onglets, photos)
DO $$
DECLARE
  t TEXT;
  a_publication BOOLEAN;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'activities', 'assignments', 'automatisms', 'chapter_podcasts', 'chapter_resources', 'class_info',
    'club_activities', 'club_subjects', 'course_files', 'dnb_content', 'dnb_revision_resources',
    'evaluations', 'exercises', 'games_genially', 'lessons', 'parent_resources', 'revision_path_files',
    'revision_path_resources', 'spiral_resources', 'training_exercises', 'training_tests', 'videos'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'is_published'
    ) INTO a_publication;
    EXECUTE format('DROP TRIGGER IF EXISTS queue_new_content ON public.%I', t);
    IF a_publication THEN
      EXECUTE format(
        'CREATE TRIGGER queue_new_content AFTER INSERT OR UPDATE OF is_published ON public.%I '
        'FOR EACH ROW EXECUTE FUNCTION public.queue_new_content()', t);
    ELSE
      EXECUTE format(
        'CREATE TRIGGER queue_new_content AFTER INSERT ON public.%I '
        'FOR EACH ROW EXECUTE FUNCTION public.queue_new_content()', t);
    END IF;
  END LOOP;
END;
$$;
