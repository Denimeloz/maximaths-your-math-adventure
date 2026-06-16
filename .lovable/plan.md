# Plan — Gestion des années scolaires sur MAXIMATHS

## 1. Suppression de l'inscription publique

- **`src/pages/Auth.tsx`** : supprimer l'onglet "Inscription" et tout le formulaire de signup. Garder uniquement le formulaire de connexion email/mot de passe pour l'admin.
- **`src/contexts/AuthContext.tsx`** : retirer la fonction `signUp` et `signInWithGoogle` du contexte (ou les garder inutilisées, mais préférable de les retirer).
- **`src/pages/AdminLogin.tsx`** : rediriger directement vers `/auth` (login only).
- **Supabase Auth** : indiquer à l'utilisateur de désactiver "Enable signups" dans le dashboard Supabase (Authentication → Providers → Email), car côté serveur le signup reste sinon possible via API.
- **Trigger `handle_new_user`** : garder tel quel (utile si un admin est créé manuellement par Supabase Dashboard).

## 2. Modèle de données — années scolaires

Nouvelle migration Supabase :

### Tables

```sql
-- Années scolaires
CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,        -- "2025-2026"
  start_year int NOT NULL,
  end_year int NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Classes ouvertes pour une année
CREATE TABLE public.year_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_level text NOT NULL,         -- '6eme' | '5eme' | ... | 'terminale'
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, class_level)   -- pas de doublon
);
```

### GRANTS + RLS

- `GRANT SELECT` à `anon` et `authenticated` (lecture publique).
- `GRANT ALL` à `service_role`.
- `GRANT INSERT/UPDATE/DELETE` à `authenticated` (utilisé seulement par les admins via policy).
- RLS :
  - Lecture publique : `USING (true)`.
  - Écriture admin uniquement : `USING/WITH CHECK (has_role(auth.uid(),'admin'))`.

### Liaison aux contenus existants

Ajouter une colonne `academic_year_id uuid REFERENCES public.academic_years(id)` (nullable au début) sur toutes les tables de contenu liées à un niveau :

`activities, courses, exercises, training_exercises, training_tests, assignments, evaluations, games_genially, dnb_content, dnb_revision_resources, class_info, class_photos, chapters, course_files, videos, lessons, spiral_resources`.

(On garde la colonne `level` existante — la combinaison `(level, academic_year_id)` détermine l'affichage.)

### Backfill

```sql
INSERT INTO public.academic_years (label, start_year, end_year, is_active, display_order)
VALUES ('2025-2026', 2025, 2026, false, 0),
       ('2026-2027', 2026, 2027, true, 1);

-- Rattacher tout l'existant à 2025-2026
UPDATE public.<table> SET academic_year_id = (SELECT id FROM public.academic_years WHERE label='2025-2026')
WHERE academic_year_id IS NULL;

-- Classes réellement utilisées en 2025-2026 : 3ème et Seconde
INSERT INTO public.year_classes (academic_year_id, class_level)
SELECT id, unnest(ARRAY['3eme','seconde']) FROM public.academic_years WHERE label='2025-2026';
```

Une fois backfillé, on pourra rendre `academic_year_id` `NOT NULL` (migration séparée plus tard pour éviter les ruptures).

## 3. Frontend — accueil public

- **`src/components/FeaturesSection.tsx`** (section "Choisis ta classe") : charger `academic_years` + `year_classes`, afficher chaque année comme un groupe titré avec les classes disponibles en cartes. Le lien devient `/niveau/:levelId/:contentType?year=<yearId>` (ou route imbriquée — query string suffit, plus simple).
- **`src/pages/LevelContent.tsx`** : lire `?year=` depuis l'URL, et passer `academic_year_id` aux requêtes Supabase pour filtrer chaque section. Si aucun year n'est fourni, fallback sur l'année active.
- **`src/pages/CourseView.tsx`** : pas de changement majeur (un cours appartient déjà à une année via sa colonne).
- Les autres sections d'accueil (`DnbRevisionSection`, `SpiralProgressionSection`, `ClassInfoSection`, `ClassPhotosSection`) : filtrer par année active par défaut, ou inclure toutes les années (à clarifier — par défaut, on filtre sur l'année active).

## 4. Frontend — sidebar admin

- **`src/components/AdminSidebar.tsx`** : remplacer la liste fixe `levels` par une liste dynamique chargée depuis `academic_years` + `year_classes`. Conserver les entrées spéciales **Club Jules Verne** et **Progression Spiralée** (hors années).
- Ajouter en haut une entrée **"Nouvelle année"** qui ouvre un panneau de gestion (création année + ajout/suppression de classes dans l'année).
- Structure rendue :
  ```
  Nouvelle année
  Années scolaires
    2026-2027
      6ème, 4ème, 3ème, Terminale
    2025-2026
      3ème, Seconde
  Club Jules Verne
  Progression Spiralée
  ```
- **`src/pages/Admin.tsx`** : étendre l'état pour stocker `(academicYearId, level, section)` au lieu de juste `(level, section)`. Passer `academicYearId` à tous les managers admin existants.
- Chaque manager admin (ActivityManager, ExerciseManager, etc.) : recevoir `academicYearId` en prop, l'utiliser dans les `select` (filtre) et `insert` (valeur).

## 5. Nouveau composant admin

- **`src/components/admin/AcademicYearsManager.tsx`** : créer / éditer / activer une année, gérer ses classes (ajout via select des niveaux, suppression). Empêche les doublons côté UI en plus de la contrainte DB.

## 6. Sécurité

- Vérifier que toutes les RLS sur les tables de contenu sont déjà admin-only en écriture (déjà le cas a priori).
- Désactiver le signup Supabase (action utilisateur, hors code).
- Confirmer la suppression de tout chemin `/auth` signup.

## 7. Hors scope (à signaler à l'utilisateur)

- Migration de la colonne `academic_year_id` en `NOT NULL` à faire dans un second temps.
- Désactivation des signups dans Supabase Dashboard : action manuelle requise.
- Pas de changement sur Club Jules Verne ni Progression Spiralée (transverses aux années).

## Ordre d'exécution

1. Migration SQL (tables + GRANT + RLS + backfill + colonnes `academic_year_id`).
2. Suppression du signup (Auth.tsx, AuthContext.tsx).
3. AdminSidebar dynamique + AcademicYearsManager + Admin.tsx étendu.
4. Propagation de `academicYearId` dans les managers admin (filtre + insert).
5. FeaturesSection groupé par année + LevelContent filtré par `?year=`.
6. QA visuel rapide.
