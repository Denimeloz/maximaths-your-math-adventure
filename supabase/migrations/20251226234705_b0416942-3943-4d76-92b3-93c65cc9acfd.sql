-- Create table for DNB preparation content
CREATE TABLE public.dnb_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  file_url TEXT,
  correction_url TEXT,
  category TEXT NOT NULL DEFAULT 'exercice',
  year INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dnb_content ENABLE ROW LEVEL SECURITY;

-- Admins can manage all DNB content
CREATE POLICY "Admins can manage all DNB content"
  ON public.dnb_content
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view published DNB content
CREATE POLICY "Anyone can view published DNB content"
  ON public.dnb_content
  FOR SELECT
  USING (is_published = true);

-- Add trigger for updated_at
CREATE TRIGGER update_dnb_content_updated_at
  BEFORE UPDATE ON public.dnb_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();