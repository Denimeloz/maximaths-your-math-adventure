-- « Vidéos et conseils pour progresser » : vidéos et conseils de l'oncle pour progresser en mathématiques.
-- Rubrique de l'oncle, au même niveau que les automatismes : par année scolaire et par classe.
-- Les médias (vidéos YouTube, fichiers envoyés, PDF, audio, images, liens) sont rangés dans la colonne JSON `media`,
-- au même format que les projets des élèves : [{ "url": "...", "label": "...", "fileName": "..." }].

CREATE TABLE IF NOT EXISTS public.videos_et_conseils_pour_progresser (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  level text NOT NULL,
  chapter text,
  title text NOT NULL,
  description text,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS videos_et_conseils_pour_progresser_annee_classe_idx
  ON public.videos_et_conseils_pour_progresser (academic_year_id, level, display_order);

GRANT SELECT ON public.videos_et_conseils_pour_progresser TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos_et_conseils_pour_progresser TO authenticated;
GRANT ALL ON public.videos_et_conseils_pour_progresser TO service_role;

ALTER TABLE public.videos_et_conseils_pour_progresser ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published videos and tips" ON public.videos_et_conseils_pour_progresser;
CREATE POLICY "Anyone can view published videos and tips"
ON public.videos_et_conseils_pour_progresser FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage all videos and tips" ON public.videos_et_conseils_pour_progresser;
CREATE POLICY "Admins can manage all videos and tips"
ON public.videos_et_conseils_pour_progresser FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_videos_et_conseils_pour_progresser_updated_at ON public.videos_et_conseils_pour_progresser;
CREATE TRIGGER update_videos_et_conseils_pour_progresser_updated_at
BEFORE UPDATE ON public.videos_et_conseils_pour_progresser
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification push à la publication, comme pour les autres documents
-- (même fonction que celle posée par la migration notifications_push)
DROP TRIGGER IF EXISTS queue_new_content ON public.videos_et_conseils_pour_progresser;
CREATE TRIGGER queue_new_content
AFTER INSERT OR UPDATE OF is_published ON public.videos_et_conseils_pour_progresser
FOR EACH ROW EXECUTE FUNCTION public.queue_new_content();
