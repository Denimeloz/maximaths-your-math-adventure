-- Modifier la table exercises pour rendre question et answer optionnels
-- et ajouter un champ file_url pour les pièces jointes
ALTER TABLE public.exercises 
ALTER COLUMN question DROP NOT NULL,
ALTER COLUMN answer DROP NOT NULL;

-- Ajouter le champ file_url s'il n'existe pas
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Créer une table pour le suivi de progression des leçons
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on lesson_progress
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_progress
CREATE POLICY "Users can view their own lesson progress" 
ON public.lesson_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson progress" 
ON public.lesson_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress" 
ON public.lesson_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all lesson progress" 
ON public.lesson_progress 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_lesson_progress_updated_at
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();