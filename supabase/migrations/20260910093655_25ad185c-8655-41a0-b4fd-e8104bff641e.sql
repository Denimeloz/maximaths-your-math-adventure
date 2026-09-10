ALTER TABLE public.chapter_resources ADD COLUMN IF NOT EXISTS correction_url text;
ALTER TABLE public.revision_path_resources ADD COLUMN IF NOT EXISTS correction_url text;