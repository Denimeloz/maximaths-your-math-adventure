# Application iPhone (App Store)

Branche `claude/application-ios`. L'application est construite avec Capacitor : le site compilé (`dist`) est embarqué dans un projet iOS (`ios/`), avec le même code React et le même Supabase. Identifiant : `com.maximaths.app`.

Les documents et les comptes restent en ligne : ils sont à jour sans nouvelle version. Une modification des écrans demande en revanche une nouvelle version soumise à Apple.

## Ce qui est fait

- Projet iOS généré, icône et écran de démarrage provisoires à partir de l'icône de 512 px
- `src/lib/natif.ts` : détection de l'application, ouverture des liens et des documents dans le navigateur intégré d'iOS
- Documents (PDF, Word, PowerPoint, Excel, images) : lecteur d'iOS au lieu d'un cadre dans la page
- Hors connexion : chaque document ouvert reste sur le téléphone et se rouvre sans réseau, page `/mes-documents`, bandeau quand il n'y a pas de réseau (`src/lib/documentsHorsLigne.ts`)
- `codemagic.yaml` : compilation sans Mac, une vérification sans compte Apple et un envoi sur TestFlight
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

1. Compilation : créer un compte sur codemagic.io, y relier le dépôt, lancer « iPhone, vérification sans compte Apple » et corriger ce qui bloque
2. Compte Apple Developer : 99 $ par an, à payer une fois la vérification réussie
3. Notifications natives : clé APNs du compte Apple, enregistrement des téléphones, envoi depuis Supabase
4. Icône de 1024 px nette, sans transparence
5. Clé App Store Connect dans Codemagic, puis « iPhone, envoi sur TestFlight »
6. Essais sur un vrai iPhone avec TestFlight
7. App Store Connect : fiche, captures d'iPhone, confidentialité, compte de démonstration pour l'examinateur

## Mettre à jour le projet iOS

```
npm run build
npx cap sync ios
```

Toute nouvelle dépendance doit aussi aller dans `bun.lock` (`npx bun install --lockfile-only`) : le déploiement Cloudflare installe avec bun.

## À vérifier sur un vrai iPhone

Rien n'a encore été compilé ni lancé sur iOS, et `codemagic.yaml` n'a jamais tourné. À contrôler : connexion et session gardée, ouverture d'un PDF, d'un Word et d'un PowerPoint, réouverture en mode avion, lancement en mode avion, nom affiché dans « Mes documents », vidéos, automatismes Canva, liens WhatsApp et e-mail, inscription par QR code.
