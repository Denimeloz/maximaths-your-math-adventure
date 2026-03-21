ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS video_links jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS game_links jsonb DEFAULT '[]'::jsonb;