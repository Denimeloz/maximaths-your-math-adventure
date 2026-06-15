# Plan — Évolutions MAXIMATHS

Trois grands chantiers, branchés sur l'architecture multi-années existante (toutes les nouvelles tables incluent `academic_year_id` + `level`).

## 1. Rubrique « Automatismes »

**But** : fiches Canva (5 questions + correction) par niveau.

**Base de données** — nouvelle table `automatisms` :
- `title`, `chapter`, `level`, `academic_year_id`
- `canva_embed_url` (lien d'intégration Canva)
- `thumbnail_url` (optionnelle)
- `description`, `display_order`, `created_at`
- RLS : lecture publique, écriture admin uniquement
- Storage : réutilisation du bucket `course-files` pour les miniatures

**Frontend** :
- Page `/automatismes` : grille de cartes (titre, chapitre, niveau, date)
- Page `/automatismes/:id` : iframe Canva plein écran, sans quitter le site
- Filtre par niveau + recherche
- Lien dans Header (desktop + mobile)

**Admin** : `AutomatismsManager.tsx` (CRUD + reorder dnd-kit, par niveau et par année).

## 2. Refonte « Cours » — 5 sections par chapitre

**But** : chaque chapitre = 5 onglets fixes :
1. Activité de découverte
2. Cours
3. Exercices d'entraînement
4. Accompagnement personnalisé
5. Podcast

**Approche** : on garde la table `chapters` existante et on enrichit le rendu côté `CourseView` / `LevelContent` (section "cours") avec un composant `ChapterTabs` à 5 onglets.

**Nouvelles tables** :
- `chapter_resources` : `chapter_id`, `section` (enum : `decouverte` | `cours` | `exercices` | `accompagnement`), `kind` (`pdf` | `video` | `canva`), `title`, `url`, `display_order`
- `chapter_podcasts` : `chapter_id`, `title`, `description`, `audio_url`, `duration_seconds`, `display_order`
- Bucket Storage `chapter-media` (public) pour audios / PDF
- RLS : lecture publique, écriture admin

**Frontend** :
- `ChapterTabs.tsx` (Tabs shadcn) + sous-composants `PdfList`, `VideoList`, `CanvaEmbed`, `PodcastPlayer` (audio HTML5 natif avec durée + description)

**Admin** : extension de `FileVideoManager` → `ChapterContentManager.tsx` avec sélection de section + ajout de podcasts.

## 3. Rubrique « Parcours de révision »

**But** : parcours par niveau, 5 étapes fixes, ressources mixtes + progression.

**Étapes fixes** (codées en dur, pas de table d'étapes) :
1. Réactiver les connaissances
2. Revoir les notions essentielles
3. S'entraîner
4. Vérifier ses acquis
5. S'autoévaluer

**Base de données** — nouvelle table `revision_path_resources` :
- `level`, `academic_year_id`
- `step` (smallint 1..5)
- `kind` (`canva` | `pdf` | `video` | `podcast` | `link`)
- `title`, `description`, `url`, `display_order`
- RLS : lecture publique, écriture admin

**Progression élève** : stockée en `localStorage` (cases cochées par ressource) — pas d'auth élève sur le site. Barre de progression = % de ressources cochées sur le parcours.

**Frontend** :
- Page `/parcours-revision` : cartes par niveau
- Page `/parcours-revision/:level` : accordéon 5 étapes + barre de progression sticky en haut

**Admin** : `RevisionPathManager.tsx` (CRUD par niveau / étape / année).

## 4. Navigation — ordre du menu principal

Header réorganisé :
`Accueil` · `Classes` (dropdown niveaux existant) · `Parcours de révision` · `Cours` · `Automatismes` · `Ressources DNB` · `À propos`

Note : la rubrique « Cours » du menu reste un raccourci vers la liste des niveaux filtrée sur le sous-onglet "cours" (cohérent avec l'architecture par niveau actuelle).

## 5. Détails techniques

- Toutes les nouvelles tables suivent le pattern : `id uuid`, `created_at`, `updated_at`, `academic_year_id uuid references academic_years`, RLS admin-only en écriture
- GRANT `SELECT` à `anon` + `authenticated`, GRANT complet à `service_role`, GRANT écritures à `authenticated` (filtré par RLS `has_role admin`)
- Lecteur podcast : `<audio controls>` natif + affichage durée formatée (mm:ss)
- Canva : iframe `https://www.canva.com/design/.../view?embed` avec `allowfullscreen`
- Réutilisation des composants UI shadcn (Tabs, Card, Progress, Accordion)
- Tous les nouveaux managers admin branchés sur `AcademicYearContext`

## 6. Hors scope

- Pas de compte élève (cohérent avec la politique actuelle : seul l'admin se connecte)
- Pas de suppression / refonte des sections existantes (Club Jules Verne, Progression Spiralée, Ressources DNB, Classe en activité conservées)
- Progression élève persistée uniquement en localStorage (pas de table de tracking)

## 7. Ordre d'implémentation

1. Migration SQL (3 tables + bucket podcasts)
2. Composants Admin (Automatismes, ChapterContent, RevisionPath) + entrées sidebar
3. Pages publiques (`/automatismes`, `/parcours-revision`) + routes
4. `ChapterTabs` intégré dans la vue cours
5. Mise à jour Header (ordre + nouveaux liens)
6. QA visuel responsive

Confirmes-tu pour que je lance la migration et le code ?
