-- Add correction_url column to exercises table
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS correction_url text;

-- Add correction_url column to assignments table  
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS correction_url text;

-- Add correction_url column to evaluations table
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS correction_url text;