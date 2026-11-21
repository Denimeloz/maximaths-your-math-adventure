# Coups de pouce (vidéos et conseils sur certaines notions)

Rubrique demandée par l'oncle, au même niveau que les automatismes : des vidéos et des conseils sur les notions qui posent difficulté aux élèves, par année scolaire et par classe. Seules les années 2026-2027 et suivantes y ont accès (comme les automatismes).

## Ce que l'oncle voit

- **Administration › Espaces transverses › Coups de pouce › Gérer les coups de pouce** (l'année scolaire se choisit dans le menu de gauche, comme pour les automatismes).
- Un formulaire : titre, notion ou chapitre (facultatif), conseil écrit (facultatif), puis un ou plusieurs médias :
  - **fichiers envoyés** (vidéo, audio, PowerPoint, PDF, image), 50 Mo au maximum par fichier ;
  - **liens** YouTube (de préférence en « non répertoriée »), Google Drive, Canva…
- Les médias se réordonnent par glisser-déposer, ainsi que les cartes. Un œil publie ou masque.
- À la publication, une notification push part comme pour les autres documents (envoi immédiat, résumé au-delà de 5 en 2 minutes).

## Ce que voient les élèves

- Page `/coups-de-pouce?year=…&level=…` : choix de l'année et de la classe, puis des cartes avec la notion, le conseil et les lecteurs (vidéo YouTube intégrée, lecteur de fichier vidéo ou audio, aperçu PDF).
- Entrée « Coups de pouce » dans le menu Ressources de l'en-tête, dans le menu de chaque classe (après Automatismes), dans « Pour toutes les classes » de l'accueil, dans la recherche du site et dans « Quoi de neuf ».

## Mise en service (à faire par Narcisse)

1. **Migration SQL** : exécuter `supabase/migrations/20261121000000_coups_de_pouce.sql` dans l'éditeur SQL de Supabase (ou `supabase db push --linked`). Elle crée la table `coups_de_pouce`, ses règles de sécurité (lecture publique des contenus publiés, gestion réservée aux administrateurs) et le déclencheur des notifications.
2. **Redéployer la fonction** `send-push-notifications` (une ligne ajoutée pour afficher « Coups de pouce » comme nature du document ; sans ce redéploiement, la notification s'afficherait « Document »).
3. Fusionner la PR, publier le site, puis tester : ajouter un coup de pouce de test dans une classe, vérifier la page publique, la recherche et la notification, puis le supprimer.

## Fichiers

- `src/pages/CoupsDePouce.tsx` : page publique
- `src/components/admin/CoupsDePouceManager.tsx` : écran d'administration
- `src/lib/coupsDePouce.ts` : titre, sous-titre, types, adresse
- Réutilisés des projets des élèves : `ProjectMediaView` (lecteurs) et `studentProjects.ts` (reconnaissance du type de média)
- Branchements : `App.tsx`, `Header.tsx`, `levelMenus.ts`, `QuickAccessSection.tsx`, `SiteSearch.tsx`, `nouveautes.ts`, `AdminSidebar.tsx`, `Admin.tsx`

## Hors périmètre (volontairement)

- Le tableau de bord de l'administration ne compte pas encore cette rubrique (sa fonction SQL liste les tables en dur).
- Pas de filtre par notion sur la page publique : la notion s'affiche en étiquette sur chaque carte.
