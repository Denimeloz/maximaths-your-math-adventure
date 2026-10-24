# Utilisateurs et profil : mise en service (25/10/2026)

Ce qui change :
- **Administration › Utilisateurs** : tous les comptes avec rôle exact, type, classes, dernière connexion et invitation en attente ; **Inviter un compte** (lien à envoyer par WhatsApp ou e-mail) ; **Lien de connexion** (nouveau mot de passe) ; **Modifier** ; **Rendre / retirer admin** ; **Supprimer** (jamais un administrateur ni soi-même, l'adresse est à retaper).
- **Page `/profil`** (icône dans l'en-tête quand on est connecté, « Mon profil » dans l'administration) : photo, prénom, nom, téléphone, fonction, type de compte, classes, établissement, ville, pays, présentation, mot de passe. Jules Verne et la date d'accès sont gérés par l'administration seulement.

Mise en service, dans l'ordre :

1. **SQL Editor** : exécuter `supabase/migrations/20261025000000_profils_et_comptes.sql`.
2. **Déployer la fonction** (PowerShell, dans le dossier du projet, sur la branche `claude/utilisateurs-et-profil`) :
   ```
   npx.cmd supabase functions deploy admin-users --project-ref aqztamfuvtiidsevjawr
   ```
3. **Authentication › URL Configuration** : *Site URL* = `https://maximaths.com` ; dans *Redirect URLs*, ajouter `https://maximaths.com/**`. Sans cela, les liens d'invitation renvoient vers une mauvaise adresse.
4. **Authentication › Sign In / Providers** : décocher **« Allow new users to sign up »** (les comptes se créent désormais par invitation). Garder le fournisseur **Email** activé.
5. **Fusionner la branche**, puis **Publish** dans Lovable.
6. Tester : inviter un compte de test, ouvrir le lien dans une fenêtre privée, choisir le mot de passe, compléter le profil ; puis le supprimer.

À savoir :
- Le lien d'invitation est valable 24 heures et une seule fois ; « Lien de connexion » en recrée un.
- Aucun e-mail n'est envoyé par Supabase : c'est toi qui envoies le lien (le service d'e-mail gratuit de Supabase n'écrit qu'aux membres de l'équipe du projet).
