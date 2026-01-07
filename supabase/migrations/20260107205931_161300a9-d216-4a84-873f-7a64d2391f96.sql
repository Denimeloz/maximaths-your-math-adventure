-- Create table for club activities (like "Enigmes hebdomadaires", "Projets pédagogiques")
CREATE TABLE public.club_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'puzzle',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for club subjects (sujets with corrections)
CREATE TABLE public.club_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.club_activities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  correction_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.club_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_subjects ENABLE ROW LEVEL SECURITY;

-- RLS policies for club_activities
CREATE POLICY "Admins can manage all club activities"
ON public.club_activities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published club activities"
ON public.club_activities
FOR SELECT
USING (is_published = true);

-- RLS policies for club_subjects
CREATE POLICY "Admins can manage all club subjects"
ON public.club_subjects
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published club subjects"
ON public.club_subjects
FOR SELECT
USING (is_published = true);

-- Triggers for updated_at
CREATE TRIGGER update_club_activities_updated_at
BEFORE UPDATE ON public.club_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_club_subjects_updated_at
BEFORE UPDATE ON public.club_subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();