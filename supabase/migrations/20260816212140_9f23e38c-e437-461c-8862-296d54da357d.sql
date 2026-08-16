CREATE TABLE public.parent_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  file_url text,
  file_name text,
  resource_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.parent_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_resources TO authenticated;
GRANT ALL ON public.parent_resources TO service_role;

ALTER TABLE public.parent_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published parent resources"
ON public.parent_resources FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all parent resources"
ON public.parent_resources FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_parent_resources_updated_at
BEFORE UPDATE ON public.parent_resources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.training_exercises ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.training_tests ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.class_info ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.dnb_content ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.spiral_resources ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.revision_path_files ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.club_subjects ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;