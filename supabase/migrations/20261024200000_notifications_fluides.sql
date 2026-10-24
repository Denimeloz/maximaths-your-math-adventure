-- Notifications fluides (24/10/2026)
-- 1. Envoi immédiat : chaque publication appelle tout de suite la fonction send-push-notifications
--    (pg_net). La tâche planifiée reste en secours (à passer à une fois par minute, voir docs).
-- 2. push_send_log : le journal des envois, lu par l'écran « Notifications » de l'administration.
-- 3. recent_news() : la liste « Quoi de neuf » des 7 derniers jours, lisible par tous les visiteurs.
--
-- Prérequis (une seule fois, dans SQL Editor) : enregistrer le mot de passe de la fonction dans le coffre
--   select vault.create_secret('<valeur de CRON_SECRET>', 'maximaths_cron_secret');
-- Sans ce secret, rien ne casse : l'envoi se fait simplement au passage suivant de la tâche planifiée.

CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Envoi immédiat -------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.send_push_now()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret TEXT;
BEGIN
  SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'maximaths_cron_secret' LIMIT 1;
  IF secret IS NULL THEN
    RETURN NULL;
  END IF;
  -- pg_net envoie la requête après la validation de la publication, sans la ralentir
  PERFORM net.http_post(
    url := 'https://aqztamfuvtiidsevjawr.supabase.co/functions/v1/send-push-notifications',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    timeout_milliseconds := 10000
  );
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  -- Une publication ne doit jamais échouer à cause d'une notification
  RAISE WARNING 'send_push_now : %', SQLERRM;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS send_push_now ON public.pending_notifications;
CREATE TRIGGER send_push_now
  AFTER INSERT ON public.pending_notifications
  FOR EACH STATEMENT EXECUTE FUNCTION public.send_push_now();

-- 2. Journal des envois ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.push_send_log (
  id BIGSERIAL PRIMARY KEY,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- test, document (une notification par document) ou resume (rafale de publications)
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  devices INT NOT NULL DEFAULT 0,
  delivered INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  details JSONB
);

ALTER TABLE public.push_send_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view push send log" ON public.push_send_log;
CREATE POLICY "Admins can view push send log"
  ON public.push_send_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS push_send_log_sent_at_idx ON public.push_send_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS pending_notifications_created_at_idx ON public.pending_notifications (created_at DESC);

-- 3. « Quoi de neuf » : les publications récentes encore en ligne -----------------------------------

CREATE OR REPLACE FUNCTION public.recent_news(p_days INT DEFAULT 7)
RETURNS TABLE (id BIGINT, source_table TEXT, title TEXT, level TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  n RECORD;
  visible BOOLEAN;
BEGIN
  FOR n IN
    SELECT p.id, p.source_table, p.row_id, p.title, p.level, p.created_at
    FROM public.pending_notifications p
    WHERE p.created_at > now() - make_interval(days => LEAST(GREATEST(COALESCE(p_days, 7), 1), 30))
    ORDER BY p.created_at DESC
    LIMIT 100
  LOOP
    -- Un document supprimé ou repassé en brouillon disparaît de la liste
    BEGIN
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM public.%I t WHERE t.id::text = $1 '
        'AND COALESCE((to_jsonb(t)->>''is_published'')::boolean, true))', n.source_table)
        INTO visible USING n.row_id;
    EXCEPTION WHEN OTHERS THEN
      visible := FALSE;
    END;
    IF visible THEN
      id := n.id;
      source_table := n.source_table;
      title := n.title;
      level := n.level;
      created_at := n.created_at;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recent_news(INT) TO anon, authenticated;
