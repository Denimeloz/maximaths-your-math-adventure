# Notifications push : mise en service

> Branche `claude/notifications-push` (21/10/2026). Le code est prêt ; ces étapes se font avec le compte Google secondaire, propriétaire du projet Supabase `aqztamfuvtiidsevjawr`.

## Ce que fait la fonctionnalité

- Une **cloche** apparaît dans l'en-tête (ordinateur et téléphone). Un clic, le navigateur demande l'autorisation, et l'appareil est abonné. Pas besoin de compte.
- Dès qu'un contenu est **publié** (création déjà publiée, ou passage de brouillon à publié) dans l'une des 22 tables de documents, il entre dans une file d'attente (`pending_notifications`).
- **Depuis le 24/10/2026** (voir la section « Notifications fluides » en bas) : la fonction `send-push-notifications` est appelée **dès la publication** et envoie **une notification par document**. Au-delà de 5 documents en 2 minutes, les suivants partent en un seul résumé après 1 minute de calme.
- Un clic sur la notification ouvre le site.
- **iPhone** : les notifications ne marchent que si le site a été ajouté à l'écran d'accueil (iOS 16.4 ou plus). La cloche l'explique à l'élève.
- Plus tard, la colonne `level` des abonnements permettra de n'envoyer à chaque élève que ce qui concerne sa classe.

## Fichiers ajoutés

| Fichier | Rôle |
|---|---|
| `supabase/migrations/20261021200000_notifications_push.sql` | Tables `push_subscriptions` et `pending_notifications`, fonctions `subscribe_push` et `unsubscribe_push`, déclencheurs sur les tables de documents |
| `supabase/functions/send-push-notifications/index.ts` | L'envoi (bibliothèque `web-push`), le regroupement, le nettoyage des appareils désabonnés |
| `public/sw.js` | Le service worker : affiche la notification et ouvre le site au clic. Il ne met rien en cache |
| `src/lib/push.ts`, `src/components/NotificationButton.tsx` | L'abonnement côté site et la cloche |
| `.env` | `VITE_VAPID_PUBLIC_KEY` (clé publique, elle peut être visible) |

## Étapes

### 1. Créer les tables (Supabase, 2 min)
Tableau de bord Supabase → **SQL Editor** → coller tout le fichier `supabase/migrations/20261021200000_notifications_push.sql` → **Run**. (Ou `npx supabase db push` depuis le dépôt, connecté au compte secondaire.)

### 2. Ranger les clés (Supabase, 2 min)
Ce n'est **pas** dans Settings → API Keys. Les secrets des fonctions sont dans la rubrique **Edge Functions** de la barre de gauche, onglet **Secrets**. Lien direct :
https://supabase.com/dashboard/project/aqztamfuvtiidsevjawr/functions/secrets

Ajouter quatre secrets (bouton **Add new secret**, nom à gauche, valeur à droite, puis **Save**) :
- `VAPID_PUBLIC_KEY` : la même valeur que `VITE_VAPID_PUBLIC_KEY` dans `.env`
- `VAPID_PRIVATE_KEY` : dans `secrets/.env` du dépôt Jarvis (`MAXIMATHS_VAPID_PRIVATE_KEY`). **Ne jamais la mettre dans ce dépôt.**
- `CRON_SECRET` : dans `secrets/.env` du dépôt Jarvis (`MAXIMATHS_CRON_SECRET`). C'est le mot de passe de la tâche planifiée.
- `VAPID_SUBJECT` : `mailto:maximathsclass@gmail.com`

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont déjà fournis par Supabase à toutes les fonctions : ne pas les ajouter.

### 3. Déployer la fonction d'envoi (5 min)
Depuis le dossier du dépôt :
```bash
npx supabase login            # avec le compte secondaire
npx supabase functions deploy send-push-notifications --project-ref aqztamfuvtiidsevjawr
```
Le fichier `supabase/config.toml` désactive la vérification JWT pour cette fonction : le projet utilise les nouvelles clés (`sb_secret_…`), qui ne sont pas des JWT. La fonction se protège elle-même avec `CRON_SECRET`.
(Autre possibilité : Edge Functions → Deploy a new function → coller `index.ts`, puis dans les détails de la fonction, **désactiver « Verify JWT »**.)

### 4. Lancer l'envoi toutes les 5 minutes (Supabase, 3 min)
**Integrations → Cron** → activer → **Create job** :
- Nom : `envoyer-notifications` ; planning : `*/5 * * * *`
- Type : **HTTP Request**, méthode **POST**
- URL : `https://aqztamfuvtiidsevjawr.supabase.co/functions/v1/send-push-notifications`
- En-tête (Header) : nom `x-cron-secret`, valeur : la même que le secret `CRON_SECRET`
- Corps : `{}`

### 5. Mettre le site à jour
Sur GitHub, fusionner la branche `claude/notifications-push` dans `main` (pull request). Lovable récupère le code ; dans Lovable, **Publish → Update** pour mettre maximaths.com à jour.

### 6. Tester
1. Sur un téléphone Android (Chrome) : ouvrir maximaths.com, toucher la cloche, **Autoriser**.
2. Sur iPhone : Safari → Partager → **Sur l'écran d'accueil**, ouvrir MAXIMATHS depuis l'icône, toucher la cloche.
3. Depuis l'administration, publier un document d'essai. La notification arrive dans les 5 à 10 minutes.
4. En cas de souci : Table Editor → `push_subscriptions` (l'appareil est-il inscrit ?), `pending_notifications` (`sent_at` rempli ?), et Edge Functions → Logs.

## À savoir
- Les 22 tables surveillées sont listées en bas de la migration : en retirer une suffit à ne plus l'annoncer.
- Coût : nul sur l'offre gratuite de Supabase (500 000 appels de fonction par mois ; ici, environ 9 000).
- La publication sur le Play Store (application Android qui ouvre le site) se fera ensuite avec PWABuilder ; elle demandera un fichier `/.well-known/assetlinks.json`.


## Notifications fluides (24/10/2026)

Ce qui change :
- **Envoi immédiat** : le déclencheur `send_push_now` appelle la fonction dès qu'un document est publié (extension `pg_net`). La tâche planifiée reste en secours.
- **Une notification par document**, qui s'empile avec les autres au lieu de remplacer la précédente ; résumé au-delà de 5 documents en 2 minutes.
- **La notification reste affichée** sur ordinateur jusqu'à ce qu'on la ferme (`requireInteraction`). Un clic ouvre la page **« Quoi de neuf »**.
- **Page `/nouveautes`** (bouton étincelles avec pastille dans l'en-tête) : tout ce qui a été publié ces 7 derniers jours, groupé par jour, même sans notifications.
- **Administration › Notifications** : appareils abonnés (Windows, Android…), essai sur tous les appareils ou sur l'appareil en main, file d'attente, journal des envois avec le résultat pour chaque appareil.

Mise en service, dans l'ordre :

1. **SQL Editor** : exécuter `supabase/migrations/20261024200000_notifications_fluides.sql`.
2. **SQL Editor**, une seule fois : ranger le mot de passe de la fonction dans le coffre de Supabase (remplacer par la valeur de `CRON_SECRET`, celle de `MAXIMATHS_CRON_SECRET` dans `secrets/.env` de Jarvis ; ne pas l'écrire ailleurs) :
   ```sql
   select vault.create_secret('VALEUR_DE_CRON_SECRET', 'maximaths_cron_secret');
   ```
3. **Déployer la fonction** (PowerShell, dans le dossier du projet) :
   ```
   npx.cmd supabase functions deploy send-push-notifications --project-ref aqztamfuvtiidsevjawr
   ```
4. **Integrations › Cron** : passer la tâche `envoyer-notifications` à **chaque minute** (`* * * * *`). Elle ne sert plus qu'en secours et pour les résumés.
5. **Fusionner la branche** `claude/notifications-fluides`, puis **Publish** dans Lovable.
6. **Cloudflare** (conseillé) : *Règles › Cache Rules* : pour le chemin `/sw.js`, « Contourner le cache », sinon les appareils peuvent garder l'ancien service worker jusqu'à 4 heures.
7. **Tester** : Administration › Notifications › « Tester sur tous les appareils », puis publier un vrai document.
