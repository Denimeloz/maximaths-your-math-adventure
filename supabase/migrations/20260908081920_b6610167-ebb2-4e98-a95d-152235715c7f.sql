GRANT SELECT ON public.tab_chapters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tab_chapters TO authenticated;
GRANT ALL ON public.tab_chapters TO service_role;
GRANT SELECT ON public.chapter_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_resources TO authenticated;
GRANT ALL ON public.chapter_resources TO service_role;
GRANT SELECT ON public.chapter_podcasts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_podcasts TO authenticated;
GRANT ALL ON public.chapter_podcasts TO service_role;