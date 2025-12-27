-- Add level column to assignments table
ALTER TABLE public.assignments 
ADD COLUMN level TEXT NULL;

-- Add level column to evaluations table
ALTER TABLE public.evaluations 
ADD COLUMN level TEXT NULL;

-- Create index for better performance
CREATE INDEX idx_assignments_level ON public.assignments(level);
CREATE INDEX idx_evaluations_level ON public.evaluations(level);