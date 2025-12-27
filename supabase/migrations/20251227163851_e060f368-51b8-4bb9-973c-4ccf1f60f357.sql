-- Add file_url column to evaluations table
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS file_url text;

-- Add file_url column to assignments table for consistency
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS file_url text;