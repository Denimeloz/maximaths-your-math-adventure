CREATE TABLE public.dnb_revision_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text,
  file_name text,
  is_published boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dnb_revision_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published dnb revision resources"
  ON public.dnb_revision_resources FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all dnb revision resources"
  ON public.dnb_revision_resources FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_dnb_revision_resources_updated_at
  BEFORE UPDATE ON public.dnb_revision_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();