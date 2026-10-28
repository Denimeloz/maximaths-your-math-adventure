# Inscription par classe : mise en service (28/10/2026)

Ce qui change :
- **Connexion des élèves sans e-mail** : pseudo `prenom.nom` (sans accent) et code de 6 chiffres. La page de connexion accepte « Pseudo ou e-mail » dans le même champ ; les adultes gardent leur e-mail et leur mot de passe. En interne, un compte élève a l'adresse technique `<pseudo>@eleves.maximaths.com`, jamais utilisée pour écrire.
- **Administration › Utilisateurs › Inscriptions par classe** : « Nouveau lien » (classe, élèves ou parents, Jules Verne, durée de 1 heure à 1 mois, nombre de places), puis **QR code** à projeter en classe (le compteur d'inscrits se met à jour tout seul), **Copier** ou **WhatsApp** pour le groupe de la classe, **Désactiver**.
- **Page `/rejoindre/<code>`** (ouverte par le QR ou le lien) : l'élève écrit son prénom et son nom, reçoit son pseudo et son code à l'écran (capture d'écran conseillée) et il est connecté aussitôt. Son compte est déjà rangé dans la classe du lien. Si le téléphone est déjà connecté à un autre compte (celui d'un parent, d'un frère), la page propose d'abord de le déconnecter.
- **« J'ai oublié mon code ou mon mot de passe »** sous le formulaire de connexion : ouvre WhatsApp avec un message déjà écrit (identifiant, prénom, nom, classe). Dans Utilisateurs, un compte élève a le bouton **Nouveau code** (au lieu de « Lien de connexion ») : un nouveau code de 6 chiffres, avec le message à envoyer.
- **Mon profil** : un élève voit son pseudo et peut changer son code (au moins 6 chiffres).

Mise en service, dans l'ordre :

1. **SQL Editor** : exécuter `supabase/migrations/20261028000000_inscription_par_classe.sql` (colonne `username` du profil, table `signup_links` réservée aux administrateurs, réservation des places en une seule opération).
2. **Déployer les fonctions** (PowerShell, dans le dossier du projet, sur la branche `claude/inscription-par-classe`) :
   ```
   npx.cmd supabase functions deploy inscription-classe --project-ref aqztamfuvtiidsevjawr --no-verify-jwt
   npx.cmd supabase functions deploy admin-users --project-ref aqztamfuvtiidsevjawr --no-verify-jwt
   ```
   Le dossier `supabase/functions/_shared/` est envoyé avec chaque fonction.
3. **Authentication › Sign In / Providers › Email** : vérifier que **Minimum password length** vaut **6** (valeur par défaut) ; sinon les codes de 6 chiffres sont refusés. « Allow new users to sign up » reste **décoché** : la fonction crée les comptes avec la clé de service, l'inscription publique reste fermée.
4. **Numéro WhatsApp des demandes « j'ai oublié »** (facultatif) : dans Lovable, ajouter la variable `VITE_WHATSAPP_ASSISTANCE` avec le numéro qui reçoit les demandes, chiffres seulement (ex. `2250102030405`). Sans elle, WhatsApp s'ouvre et l'élève choisit lui-même le contact.
5. **Fusionner la branche**, puis **Publish** dans Lovable.
6. Tester :
   - Administration › Utilisateurs › Nouveau lien (1 heure, 2 places), puis afficher le QR code.
   - Le scanner avec un téléphone en navigation privée, s'inscrire : le pseudo et le code s'affichent, puis la page Mon profil.
   - Se déconnecter, se reconnecter avec le pseudo et le code.
   - Dans Utilisateurs : le compte apparaît avec son pseudo et sa classe ; « Nouveau code », se reconnecter avec ; puis supprimer le compte de test.
   - Vérifier qu'un 3e élève est refusé (lien complet) et qu'un lien désactivé ne marche plus.

À savoir :
- Un lien sert au plus le nombre de places choisi et jusqu'à sa date limite. Pour une séance en classe, choisir **1 heure** : une photo du QR qui circule ensuite ne sert plus.
- Le pseudo est `prenom.nom` ; en cas de doublon, `prenom.nom2`, `prenom.nom3`… Il ne se change que depuis l'administration.
- Un code de 6 chiffres suffit pour un site de cours ; Supabase limite les essais de connexion répétés. Pour l'accès payant, on ajoutera la limite d'appareils par compte.
