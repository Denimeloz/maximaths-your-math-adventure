-- Add file_urls column for multiple attachments
ALTER TABLE public.class_info 
ADD COLUMN IF NOT EXISTS file_urls jsonb DEFAULT '[]'::jsonb;