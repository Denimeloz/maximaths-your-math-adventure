-- Rubrique Videos et conseils pour progresser : les anonymes ne doivent que LIRE.
-- Supabase accorde par defaut tous les droits aux nouvelles tables ; la securite par ligne bloquait deja l'ecriture,
-- on retire en plus les droits d'ecriture a anon (defense en profondeur). Deja execute dans Supabase le 22/11/2026.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.videos_et_conseils_pour_progresser FROM anon;
