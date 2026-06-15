
-- Drop FK on previous chapters and rewire to a standalone table
ALTER TABLE public.chapter_resources DROP CONSTRAINT IF EXISTS chapter_resources_chapter_id_fkey;
ALTER TABLE public.chapter_podcasts  DROP CONSTRAINT IF EXISTS chapter_podcasts_chapter_id_fkey;

CREATE TABLE public.tab_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tab_chapters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tab_chapters TO authenticated;
GRANT ALL ON public.tab_chapters TO service_role;
ALTER TABLE public.tab_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tabch_public_read" ON public.tab_chapters FOR SELECT USING (true);
CREATE POLICY "tabch_admin_all" ON public.tab_chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_tabch_updated BEFORE UPDATE ON public.tab_chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rewire resources and podcasts FK to the new standalone table
ALTER TABLE public.chapter_resources
  ADD CONSTRAINT chapter_resources_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.tab_chapters(id) ON DELETE CASCADE;
ALTER TABLE public.chapter_podcasts
  ADD CONSTRAINT chapter_podcasts_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.tab_chapters(id) ON DELETE CASCADE;
