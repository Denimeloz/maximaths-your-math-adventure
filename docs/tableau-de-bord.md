# Tableau de bord de l'administration : mise en service (24/10/2026)

Le tableau de bord montre : visiteurs (Cloudflare), documents en ligne, publications par jour, contenu par classe, notifications (appareils et envois) et utilisateurs.

## 1. Statistiques du contenu (Supabase, 1 min)

SQL Editor : exécuter `supabase/migrations/20261024230000_tableau_de_bord.sql` (fonction `admin_dashboard_stats`, réservée aux administrateurs).

## 2. Visites du site (Cloudflare, 5 min)

1. **ID de zone** : Cloudflare › maximaths.com › Vue d'ensemble, colonne de droite « API » › **ID de zone**. Le copier.
2. **Jeton en lecture seule** : en haut à droite, icône du profil › **Mon profil** › **Jetons API** › **Créer un jeton** › modèle **« Lire les analyses et les journaux »** (Read analytics and logs) › Ressources de zone : *Inclure* › *Zone spécifique* › `maximaths.com` › Continuer › Créer. Copier le jeton (il n'est affiché qu'une fois).
3. **Supabase** › Edge Functions › **Secrets** : ajouter
   - `CLOUDFLARE_API_TOKEN` = le jeton ;
   - `CLOUDFLARE_ZONE_ID` = l'ID de zone.
   Garder aussi le jeton dans `secrets/.env` de Jarvis (`CLOUDFLARE_API_TOKEN`), jamais ailleurs.
4. **Déployer la fonction** (PowerShell, dans le dossier du projet) :
   ```
   npx.cmd supabase functions deploy statistiques-site --project-ref aqztamfuvtiidsevjawr
   ```

## 3. Mettre le site à jour

Fusionner la branche `claude/tableau-de-bord`, puis **Publish** dans Lovable.

## À savoir

- Les visiteurs uniques sont ceux comptés par Cloudflare (adresses différentes par jour), comme sur la page Vue d'ensemble de Cloudflare.
- Les publications par jour comptent les documents **créés** (toutes rubriques), y compris ceux restés en brouillon.
- Les « Nom non renseigné » viennent des comptes dont le prénom et le nom sont vides dans `profiles` : la requête est juste.
