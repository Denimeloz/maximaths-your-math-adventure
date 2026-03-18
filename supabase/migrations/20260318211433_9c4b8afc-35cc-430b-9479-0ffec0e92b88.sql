
CREATE TABLE public.class_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL,
  image_urls JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.class_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all class photos"
ON public.class_photos
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published class photos"
ON public.class_photos
FOR SELECT
TO public
USING (is_published = true);
