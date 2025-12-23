-- Add PDF file URL column to courses table
ALTER TABLE public.courses 
ADD COLUMN pdf_url TEXT;