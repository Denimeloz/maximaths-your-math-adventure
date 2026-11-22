-- Nettoyage (22/11/2026) : tables vides et inutilisees par l'application (ancien module de cours en ligne).
-- Deja executees dans Supabase ; fichier ajoute pour que l'historique du depot reste fidele a la base.
DROP TABLE IF EXISTS public.lesson_comments;
DROP TABLE IF EXISTS public.lesson_progress;
DROP TABLE IF EXISTS public.evaluation_submissions;
