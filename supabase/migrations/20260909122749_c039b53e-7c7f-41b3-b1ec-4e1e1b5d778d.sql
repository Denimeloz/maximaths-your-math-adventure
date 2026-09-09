ALTER TABLE public.revision_path_resources DROP CONSTRAINT IF EXISTS revision_path_resources_kind_check;
ALTER TABLE public.revision_path_resources ADD CONSTRAINT revision_path_resources_kind_check CHECK (kind = ANY (ARRAY['pdf','word','powerpoint','image','audio','podcast','video','canva','link','lesson']));

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon', t.relname);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t.relname);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.relname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t.relname);
  END LOOP;
END $$;
