
-- 1. academic_years
CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  start_year integer NOT NULL,
  end_year integer NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academic_years TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read academic years" ON public.academic_years FOR SELECT USING (true);
CREATE POLICY "Admins manage academic years" ON public.academic_years FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. year_classes
CREATE TABLE public.year_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_level text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, class_level)
);
GRANT SELECT ON public.year_classes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.year_classes TO authenticated;
GRANT ALL ON public.year_classes TO service_role;
ALTER TABLE public.year_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read year classes" ON public.year_classes FOR SELECT USING (true);
CREATE POLICY "Admins manage year classes" ON public.year_classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Seed initial years
INSERT INTO public.academic_years (label, start_year, end_year, is_active, display_order) VALUES
  ('2025-2026', 2025, 2026, false, 0),
  ('2026-2027', 2026, 2027, true, 1);

-- 4. Add academic_year_id to existing content tables
ALTER TABLE public.activities ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.assignments ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.class_info ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.class_photos ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.courses ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.evaluations ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.games_genially ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.spiral_resources ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.training_exercises ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.training_tests ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.dnb_content ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
ALTER TABLE public.dnb_revision_resources ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);

-- 5. Backfill: tout l'existant -> 2025-2026
DO $$
DECLARE y uuid;
BEGIN
  SELECT id INTO y FROM public.academic_years WHERE label='2025-2026';
  UPDATE public.activities SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.assignments SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.class_info SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.class_photos SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.courses SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.evaluations SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.games_genially SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.spiral_resources SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.training_exercises SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.training_tests SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.dnb_content SET academic_year_id = y WHERE academic_year_id IS NULL;
  UPDATE public.dnb_revision_resources SET academic_year_id = y WHERE academic_year_id IS NULL;

  -- Classes effectives en 2025-2026: 3eme et seconde
  INSERT INTO public.year_classes (academic_year_id, class_level, display_order) VALUES
    (y, '3eme', 0), (y, 'seconde', 1)
  ON CONFLICT DO NOTHING;
END $$;
