-- Create table for Exercices d'entrainement
CREATE TABLE public.training_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  correction_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all training exercises" 
  ON public.training_exercises 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published training exercises" 
  ON public.training_exercises 
  FOR SELECT 
  USING (is_published = true);

-- Create table for Tests d'entraînement
CREATE TABLE public.training_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  correction_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_tests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all training tests" 
  ON public.training_tests 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published training tests" 
  ON public.training_tests 
  FOR SELECT 
  USING (is_published = true);