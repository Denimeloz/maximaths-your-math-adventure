ALTER TABLE public.automatisms ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.chapter_resources ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.chapter_podcasts ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.revision_path_resources ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;