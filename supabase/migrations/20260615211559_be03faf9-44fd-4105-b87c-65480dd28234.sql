
-- AUTOMATISMS
CREATE TABLE public.automatisms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  chapter text,
  level text NOT NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  canva_embed_url text NOT NULL,
  thumbnail_url text,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automatisms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automatisms TO authenticated;
GRANT ALL ON public.automatisms TO service_role;
ALTER TABLE public.automatisms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automatisms_public_read" ON public.automatisms FOR SELECT USING (true);
CREATE POLICY "automatisms_admin_all" ON public.automatisms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_automatisms_updated BEFORE UPDATE ON public.automatisms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CHAPTER RESOURCES
CREATE TABLE public.chapter_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('decouverte','cours','exercices','accompagnement')),
  kind text NOT NULL CHECK (kind IN ('pdf','video','canva')),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chapter_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_resources TO authenticated;
GRANT ALL ON public.chapter_resources TO service_role;
ALTER TABLE public.chapter_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chres_public_read" ON public.chapter_resources FOR SELECT USING (true);
CREATE POLICY "chres_admin_all" ON public.chapter_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_chres_updated BEFORE UPDATE ON public.chapter_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CHAPTER PODCASTS
CREATE TABLE public.chapter_podcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  audio_url text NOT NULL,
  duration_seconds integer,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chapter_podcasts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_podcasts TO authenticated;
GRANT ALL ON public.chapter_podcasts TO service_role;
ALTER TABLE public.chapter_podcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chpod_public_read" ON public.chapter_podcasts FOR SELECT USING (true);
CREATE POLICY "chpod_admin_all" ON public.chapter_podcasts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_chpod_updated BEFORE UPDATE ON public.chapter_podcasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REVISION PATH RESOURCES
CREATE TABLE public.revision_path_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  step smallint NOT NULL CHECK (step BETWEEN 1 AND 5),
  kind text NOT NULL CHECK (kind IN ('canva','pdf','video','podcast','link')),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.revision_path_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revision_path_resources TO authenticated;
GRANT ALL ON public.revision_path_resources TO service_role;
ALTER TABLE public.revision_path_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rpres_public_read" ON public.revision_path_resources FOR SELECT USING (true);
CREATE POLICY "rpres_admin_all" ON public.revision_path_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_rpres_updated BEFORE UPDATE ON public.revision_path_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
