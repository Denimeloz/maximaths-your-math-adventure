# Application iPhone (App Store)

Branche `claude/application-ios`. L'application est construite avec Capacitor : le site compilé (`dist`) est embarqué dans un projet iOS (`ios/`), avec le même code React et le même Supabase. Identifiant : `com.maximaths.app`.

Les documents et les comptes restent en ligne : ils sont à jour sans nouvelle version. Une modification des écrans demande en revanche une nouvelle version soumise à Apple.

## Ce qui est fait

- Projet iOS généré, icône et écran de démarrage provisoires à partir de l'icône de 512 px
- `src/lib/natif.ts` : détection de l'application, ouverture des liens et des documents dans le navigateur intégré d'iOS
- PDF : lecteur d'iOS au lieu d'un cadre dans la page
- Masqués dans l'application : installation, notifications web, connexion Google (Apple exigerait une autre option de connexion)
- Les liens d'inscription et les QR codes pointent toujours vers `maximaths.com`
- Suppression de son compte depuis Mon profil, sur le site et dans l'application (fonction `supprimer-mon-compte`)

## Avant de fusionner sur `main`

La section « Supprimer mon compte » apparaît sur le site dès la fusion. Il faut donc déployer la fonction d'abord :

```
npx.cmd supabase functions deploy supprimer-mon-compte --no-verify-jwt
```

Puis tester avec un compte de test : suppression, retour à l'accueil, reconnexion refusée.

## Ce qui reste avant de soumettre à Apple

1. Documents disponibles hors connexion (fonction d'application demandée par la règle 4.2)
2. Notifications natives : clé APNs du compte Apple, enregistrement des téléphones, envoi depuis Supabase
3. Icône de 1024 px nette, sans transparence
4. Compilation avec Codemagic (`codemagic.yaml` à écrire), certificat et profil de signature
5. Compte Apple Developer : 99 $ par an, à payer quand l'application est prête à tester
6. Essais sur un vrai iPhone avec TestFlight
7. App Store Connect : fiche, captures d'iPhone, confidentialité, compte de démonstration pour l'examinateur

## Mettre à jour le projet iOS

```
npm run build
npx cap sync ios
```

Toute nouvelle dépendance doit aussi aller dans `bun.lock` (`npx bun install --lockfile-only`) : le déploiement Cloudflare installe avec bun.

## À vérifier sur un vrai iPhone

Rien n'a encore été compilé ni lancé sur iOS. À contrôler : connexion et session gardée, ouverture d'un PDF, d'un Word et d'un PowerPoint, vidéos, automatismes Canva, liens WhatsApp et e-mail, inscription par QR code.
