
-- 1) Add external links to DNB revision resources
ALTER TABLE public.dnb_revision_resources
  ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Spiral progression resources
CREATE TABLE IF NOT EXISTS public.spiral_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  resource_type text NOT NULL DEFAULT 'fiche',
  title text NOT NULL,
  description text,
  file_url text,
  file_name text,
  external_url text,
  is_published boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.spiral_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spiral_resources TO authenticated;
GRANT ALL ON public.spiral_resources TO service_role;

ALTER TABLE public.spiral_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published spiral resources"
  ON public.spiral_resources FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all spiral resources"
  ON public.spiral_resources FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_spiral_resources_updated_at
  BEFORE UPDATE ON public.spiral_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
