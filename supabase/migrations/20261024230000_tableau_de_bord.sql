-- Tableau de bord de l'administration (24/10/2026)
-- admin_dashboard_stats() : nombre de documents par table (total, publiés, de la semaine, par classe)
-- et publications par jour sur 30 jours, calculés côté base en une seule requête.
-- Réservée aux administrateurs.

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t TEXT;
  a_niveau BOOLEAN;
  a_publication BOOLEAN;
  a_date BOOLEAN;
  total BIGINT;
  publies BIGINT;
  semaine BIGINT;
  par_niveau JSONB;
  contenu JSONB := '[]'::jsonb;
  dates_sql TEXT := '';
  jours JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux administrateurs';
  END IF;

  FOREACH t IN ARRAY ARRAY[
    'courses', 'activities', 'assignments', 'automatisms', 'chapter_podcasts', 'chapter_resources', 'class_info',
    'club_activities', 'club_subjects', 'course_files', 'dnb_content', 'dnb_revision_resources',
    'evaluations', 'exercises', 'games_genially', 'lessons', 'parent_resources', 'revision_path_files',
    'revision_path_resources', 'spiral_resources', 'training_exercises', 'training_tests', 'videos'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    SELECT COALESCE(bool_or(column_name = 'level'), FALSE),
           COALESCE(bool_or(column_name = 'is_published'), FALSE),
           COALESCE(bool_or(column_name = 'created_at'), FALSE)
      INTO a_niveau, a_publication, a_date
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = t;

    EXECUTE format(
      'SELECT count(*), count(*) FILTER (WHERE %s), %s FROM public.%I',
      CASE WHEN a_publication THEN 'is_published IS NOT FALSE' ELSE 'TRUE' END,
      CASE WHEN a_date THEN 'count(*) FILTER (WHERE created_at > now() - interval ''7 days'')' ELSE '0' END,
      t)
      INTO total, publies, semaine;

    par_niveau := '{}'::jsonb;
    IF a_niveau THEN
      EXECUTE format(
        'SELECT COALESCE(jsonb_object_agg(niveau, n), ''{}''::jsonb) '
        'FROM (SELECT COALESCE(level::text, ''sans classe'') AS niveau, count(*) AS n FROM public.%I GROUP BY 1) s', t)
        INTO par_niveau;
    END IF;

    contenu := contenu || jsonb_build_array(jsonb_build_object(
      'table', t, 'total', total, 'publies', publies, 'semaine', semaine, 'par_niveau', par_niveau));

    IF a_date THEN
      dates_sql := dates_sql || CASE WHEN dates_sql = '' THEN '' ELSE ' UNION ALL ' END
        || format('SELECT created_at FROM public.%I WHERE created_at > now() - interval ''30 days''', t);
    END IF;
  END LOOP;

  IF dates_sql <> '' THEN
    EXECUTE 'SELECT COALESCE(jsonb_agg(jsonb_build_object(''jour'', jour, ''n'', n) ORDER BY jour), ''[]''::jsonb) '
         || 'FROM (SELECT (created_at AT TIME ZONE ''Africa/Abidjan'')::date AS jour, count(*) AS n '
         || 'FROM (' || dates_sql || ') d GROUP BY 1) s'
      INTO jours;
  END IF;

  RETURN jsonb_build_object('contenu', contenu, 'publications_par_jour', jours);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
