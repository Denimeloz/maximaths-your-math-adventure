ALTER TABLE public.chapter_resources
  DROP CONSTRAINT IF EXISTS chapter_resources_section_check;

ALTER TABLE public.chapter_resources
  ADD CONSTRAINT chapter_resources_section_check
  CHECK (section = ANY (ARRAY[
    'decouverte',
    'activite_decouverte',
    'cours',
    'exercices',
    'exercices_entrainement',
    'accompagnement',
    'accompagnement_personnalise',
    'multimedia'
  ]));