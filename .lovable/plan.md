# Plan — Évolutions MAXIMATHS pour 2026-2027

L'année **2025-2026 reste totalement intacte**. Toutes les nouveautés ne s'activent que pour les années dont le `start_year >= 2026`.

## 1. Suppression de l'inscription publique

- **`src/pages/Auth.tsx`** : déjà connexion seule (vérifié). Retirer définitivement `signUp` et `signInWithGoogle` de **`src/contexts/AuthContext.tsx`** et de son type pour qu'aucun composant ne puisse les rappeler.
- **`src/pages/AdminLogin.tsx`** : redirection simple vers `/auth`.
- Recommander à l'utilisateur de désactiver "Enable signups" dans Supabase Dashboard (Auth → Providers → Email).

## 2. Base de données (migration Supabase)

Aucune table existante n'est supprimée. Ajouts uniquement.

### Nouvelle structure Cours (2026-2027+)

Étendre `chapters` (déjà liée à `level` + `academic_year_id`) avec 5 sous-sections via une table générique :

```sql
CREATE TYPE chapter_subsection AS ENUM
  ('activite_decouverte','cours','exercices_entrainement','accompagnement_personnalise','podcast');

CREATE TABLE public.chapter_resources (
  id uuid PK,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  subsection chapter_subsection NOT NULL,
  resource_type text NOT NULL,   -- 'pdf' | 'video' | 'canva' | 'link' | 'lesson'
  title text NOT NULL,
  url text,                      -- lien externe / iframe / fichier
  file_path text,                -- pour upload Supabase storage
  description text,
  display_order int DEFAULT 0,
  created_at, updated_at
);

CREATE TABLE public.chapter_podcasts (
  id uuid PK,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  audio_url text NOT NULL,
  duration_seconds int,
  description text,
  display_order int DEFAULT 0,
  created_at, updated_at
);
```

GRANT lecture publique (`anon`,`authenticated`), écriture admin via `has_role(auth.uid(),'admin')`.

### Automatismes (indépendant)

```sql
CREATE TABLE public.automatisms (
  id uuid PK,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  level text NOT NULL,            -- '6eme'...'terminale'
  chapter text,
  title text NOT NULL,
  description text,
  canva_url text,
  canva_embed text,
  display_order int DEFAULT 0,
  created_at, updated_at
);
```

### Parcours de révision (indépendant)

```sql
CREATE TABLE public.revision_paths (
  id uuid PK,
  academic_year_id uuid REFERENCES academic_years(id),
  level text NOT NULL,
  title text NOT NULL,
  description text,
  display_order int DEFAULT 0,
  created_at, updated_at
);

CREATE TYPE revision_step AS ENUM
  ('reactiver','revoir','sentrainer','verifier','autoevaluer');

CREATE TABLE public.revision_path_resources (
  id uuid PK,
  path_id uuid REFERENCES revision_paths(id) ON DELETE CASCADE,
  step revision_step NOT NULL,
  resource_type text NOT NULL,    -- 'pdf' | 'video' | 'canva' | 'podcast' | 'link'
  title text NOT NULL,
  url text,
  file_path text,
  description text,
  display_order int DEFAULT 0
);
```

Toutes les tables : GRANT public read + écriture admin uniquement (RLS).

## 3. Frontend — Admin

Dans **`src/pages/Admin.tsx`** + **`src/components/AdminSidebar.tsx`** :

- Pour chaque classe d'une année **>= 2026**, remplacer les rubriques "Activité de découverte" et "Exercices d'entraînement" indépendantes par une rubrique unique **Cours** qui ouvre un nouveau gestionnaire `ChaptersWithSubsectionsManager` (5 onglets).
- Pour 2025-2026 : laisser exactement la structure actuelle.
- Ajouter au même niveau que Club Jules Verne / Progression Spiralée :
  - **Automatismes** → `AutomatismsManager` (filtré par année + classe)
  - **Parcours de révision** → `RevisionPathsManager` (filtré par année + classe, gestion des 5 étapes)

Nouveaux composants :
- `src/components/admin/ChaptersWithSubsectionsManager.tsx`
- `src/components/admin/AutomatismsManager.tsx`
- `src/components/admin/RevisionPathsManager.tsx`

## 4. Frontend — Public

- **`src/pages/LevelContent.tsx`** : si l'année sélectionnée a `start_year >= 2026`, la route `cours` affiche la nouvelle vue à 5 onglets ; les anciennes routes `activites` et `exercices` redirigent vers `cours`. Sinon, comportement actuel inchangé.
- **`src/pages/Index.tsx`** : insérer `<RevisionPathsSection />` juste après `<FeaturesSection />` (Choisis ta classe) et avant `<DnbRevisionSection />`.
- Nouvelles pages publiques :
  - `src/pages/Automatismes.tsx` (accessible depuis le header/footer)
  - `src/pages/ParcoursRevision.tsx`
- Nouveaux composants publics : `RevisionPathsSection.tsx`, `AutomatismsSection.tsx` (cartes modernes, filtrage par classe, barre de progression visuelle pour les parcours).

## 5. Design

Respect strict de l'identité actuelle (bleu marine, jaune/or, blanc, cartes arrondies, responsive). Réutilisation des classes `card-sticker`, tokens `rainbow-*` et composants shadcn existants.

## 6. Sécurité

- RLS : lecture publique sur les nouvelles tables, écriture conditionnée à `has_role(auth.uid(),'admin')`.
- `signUp` / `signInWithGoogle` retirés du contexte → impossible à appeler depuis le code client.

## 7. Ordre d'exécution

1. Migration SQL (4 tables + 2 ENUMs + GRANT + RLS).
2. Retrait `signUp`/`signInWithGoogle` du contexte Auth.
3. Composants admin (3 nouveaux managers) + branchement dans `AdminSidebar` / `Admin.tsx` conditionné à `start_year >= 2026`.
4. Vue publique Cours à 5 onglets pour années 2026+ ; ancien rendu pour 2025-2026.
5. Sections / pages publiques Automatismes & Parcours de révision + insertion dans `Index.tsx`.
6. QA visuel rapide (preview).

## 8. Hors scope

- Migration `academic_year_id` en `NOT NULL` (ultérieure).
- Désactivation manuelle des signups dans le dashboard Supabase.
- Aucun changement structurel sur les contenus 2025-2026.
