
CREATE TABLE public.revision_path_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  title TEXT,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, level)
);
GRANT SELECT ON public.revision_path_files TO anon, authenticated;
GRANT ALL ON public.revision_path_files TO service_role, authenticated;
ALTER TABLE public.revision_path_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read revision path files" ON public.revision_path_files FOR SELECT USING (true);
CREATE POLICY "Admins manage revision path files" ON public.revision_path_files FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_revision_path_files_updated_at BEFORE UPDATE ON public.revision_path_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
