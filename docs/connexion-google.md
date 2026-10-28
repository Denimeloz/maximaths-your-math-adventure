# Connexion avec Google : mise en service (28/10/2026)

À faire **après** l'inscription par classe (`docs/inscription-par-classe.md`, PR n° 17).

Ce qui change :
- **Page de connexion** : bouton **« Se connecter avec Google »** sous le formulaire.
- **Mon profil** : section **« Connexion avec Google »** : « Lier mon compte Google » (ou « Délier »). Un élève est prévenu de n'utiliser que son propre compte Google, jamais celui d'un parent.
- **Utilisateurs** (administration) : badge **Google** sur les comptes reliés.

Le principe : Google est un **raccourci de connexion, pas un moyen de s'inscrire**. L'inscription publique reste fermée ; on crée d'abord son compte (QR code de la classe ou invitation), puis on relie Google dans Mon profil. Un compte Google relié à aucun compte est refusé avec un message clair. Un adulte dont le compte MAXIMATHS utilise la même adresse Gmail est relié automatiquement à sa première connexion avec Google.

## 1. Créer l'identifiant OAuth dans Google Cloud (une seule fois, environ 15 minutes)

Utiliser le compte Google de Maximaths (**maximathsclasse@gmail.com**), pas un compte personnel. Les intitulés de la console changent parfois ; les menus ci-dessous sont ceux de « Google Auth Platform ».

1. Ouvrir https://console.cloud.google.com et se connecter avec maximathsclasse@gmail.com. Accepter les conditions si c'est la première fois.
2. **Créer un projet** : en haut, cliquer sur le sélecteur de projet › **Nouveau projet** › nom `Maximaths` › **Créer**, puis le sélectionner.
3. Menu ☰ › **APIs et services** › **Écran de consentement OAuth** (ou **Google Auth Platform**) › **Commencer** :
   - **Informations sur l'application** : nom `MAXIMATHS`, adresse e-mail d'assistance `maximathsclasse@gmail.com`.
   - **Audience** : **Externe**.
   - **Coordonnées** : `maximathsclasse@gmail.com`.
   - Accepter le règlement, **Créer**.
4. **Image de marque** (Branding) :
   - Page d'accueil : `https://maximaths.com`.
   - **Règles de confidentialité** : `https://maximaths.com/confidentialite` (page ajoutée par cette PR, en ligne après la publication). Les **conditions d'utilisation** sont facultatives.
   - **Domaines autorisés** : ajouter `maximaths.com` et `aqztamfuvtiidsevjawr.supabase.co` (Google refuse `supabase.co` seul, qui est partagé par tous les projets Supabase).
   - Ne pas ajouter de logo pour l'instant : un logo déclenche une vérification de Google qui peut prendre plusieurs jours. On pourra l'ajouter plus tard.
   - Enregistrer.
5. **Accès aux données** (Data access) : rien à ajouter. Les autorisations de base (e-mail, profil, openid) suffisent et ne demandent pas de vérification.
6. **Audience** : cliquer sur **Publier l'application** (passer de « Test » à « En production »). Sinon, seules les adresses ajoutées comme testeurs pourraient se connecter.
7. **Clients** › **Créer un client** :
   - Type d'application : **Application Web**. Nom : `MAXIMATHS (Supabase)`.
   - **Origines JavaScript autorisées** : `https://maximaths.com`.
   - **URI de redirection autorisés** : `https://aqztamfuvtiidsevjawr.supabase.co/auth/v1/callback` (c'est l'adresse de Supabase, pas celle du site).
   - **Créer**. Google affiche l'**ID client** et le **Code secret du client** : les copier tout de suite (bouton de téléchargement JSON possible).
8. Ranger l'ID et le secret dans le gestionnaire de mots de passe (et, côté Jarvis, dans `secrets/.env` : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`). Ne jamais les coller dans le code ni sur WhatsApp.

## 2. Brancher Google dans Supabase

1. **Authentication › Sign In / Providers › Google** : activer, coller l'**ID client** et le **Code secret du client**, **Save**. Vérifier que l'adresse « Callback URL » affichée est bien `https://aqztamfuvtiidsevjawr.supabase.co/auth/v1/callback`.
2. **Authentication › Sign In / Providers** (réglages généraux) :
   - **Allow manual linking** : **activer** (sinon « Lier mon compte Google » est refusé).
   - **Allow new users to sign up** : **laisser décoché**.
3. **Authentication › URL Configuration** : *Redirect URLs* contient déjà `https://maximaths.com/**` (25/10). Pour tester sur l'aperçu Cloudflare, ajouter aussi `https://*.maximathsclasse.pages.dev/**`.

## 3. Déployer et publier

1. Déployer la fonction (badge Google dans Utilisateurs), sur la branche `claude/connexion-google` :
   ```
   npx.cmd supabase functions deploy admin-users --project-ref aqztamfuvtiidsevjawr --no-verify-jwt
   ```
2. Fusionner la branche, puis **Publish** dans Lovable.

## 4. Tester

1. Se connecter avec un compte élève de test (pseudo et code), aller dans Mon profil › **Lier mon compte Google**, choisir un compte Google de test : retour sur le profil avec « Compte Google relié ».
2. Se déconnecter, puis **Se connecter avec Google** : on arrive sur le profil, sans pseudo ni code.
3. Se déconnecter, essayer **Se connecter avec Google** avec un autre compte Google, jamais relié : message « Aucun compte MAXIMATHS n'est relié à ce compte Google ».
4. Dans Utilisateurs : le compte de test porte le badge **Google**. Le supprimer ensuite.

À savoir :
- L'écran de Google affiche « Continuer vers aqztamfuvtiidsevjawr.supabase.co ». Pour afficher « maximaths.com » à la place, il faudrait un domaine personnalisé dans Supabase (option payante) : pas nécessaire pour l'instant.
- Un compte élève relié à Google garde son pseudo et son code : les deux façons de se connecter marchent.
