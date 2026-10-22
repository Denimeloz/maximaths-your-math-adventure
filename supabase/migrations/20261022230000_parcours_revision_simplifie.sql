-- Parcours de révision simplifié (22/10/2026) : plus d'étapes, une seule liste de ressources par classe.
-- Une ressource = un titre, une description, un ou plusieurs fichiers, un lien et un corrigé (tous facultatifs sauf le titre).

-- Plusieurs fichiers par ressource : [{ "name": "...", "url": "..." }, ...]
ALTER TABLE public.revision_path_resources ADD COLUMN IF NOT EXISTS files jsonb NOT NULL DEFAULT '[]'::jsonb;

-- La colonne url ne sert plus qu'au lien (vidéo, Canva...) : elle peut rester vide
ALTER TABLE public.revision_path_resources ALTER COLUMN url DROP NOT NULL;

-- Les étapes disparaissent : la colonne reste, avec une valeur par défaut
ALTER TABLE public.revision_path_resources ALTER COLUMN step SET DEFAULT 1;

-- Reprise des ressources déjà saisies : le fichier unique passe dans la liste des fichiers
UPDATE public.revision_path_resources
SET files = jsonb_build_array(jsonb_build_object('name', title, 'url', url)),
    url = NULL
WHERE files = '[]'::jsonb
  AND url IS NOT NULL AND url <> ''
  AND kind IN ('pdf', 'word', 'powerpoint', 'image', 'audio', 'podcast');

-- Une seule liste par classe et par année, dans l'ordre des anciennes étapes
WITH ordre AS (
  SELECT id,
         row_number() OVER (PARTITION BY level, academic_year_id ORDER BY step, display_order, created_at) - 1 AS position
  FROM public.revision_path_resources
)
UPDATE public.revision_path_resources r
SET display_order = ordre.position,
    step = 1
FROM ordre
WHERE r.id = ordre.id;
