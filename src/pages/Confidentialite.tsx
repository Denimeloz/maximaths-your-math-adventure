import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Règles de confidentialité (28/10/2026) : page demandée par Google pour « Se connecter avec Google »,
// et utile aux familles. Elle décrit ce que le site enregistre réellement (profils, comptes élèves,
// notifications, statistiques de visite) ; la mettre à jour à chaque nouvelle donnée enregistrée.

const MISE_A_JOUR = '28 octobre 2026';
const CONTACT = 'maximathsclasse@gmail.com';

const Bloc: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
  <section className="space-y-2">
    <h2 className="text-xl font-display text-foreground">{titre}</h2>
    <div className="space-y-2 font-body text-foreground/90 leading-relaxed">{children}</div>
  </section>
);

const Confidentialite: React.FC = () => (
  <div className="min-h-screen bg-hero-gradient">
    <Header />
    <main className="container mx-auto px-4 py-12 pt-24 max-w-3xl">
      <div className="card-cartoon bg-card border-border p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-display text-foreground">Règles de confidentialité</h1>
          <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : {MISE_A_JOUR}</p>
        </div>

        <p className="font-body">
          MAXIMATHS (maximaths.com) est un site de cours et de ressources de mathématiques pour le collège et le lycée.
          Cette page explique quelles informations le site enregistre, pourquoi, et comment les faire modifier ou supprimer.
          Nous ne vendons aucune donnée et le site n’affiche pas de publicité.
        </p>

        <Bloc titre="Sans compte">
          <p>On peut consulter les cours et les documents publics sans créer de compte. Dans ce cas, le site n’enregistre aucune information personnelle.</p>
          <p>Nous suivons le nombre de visites grâce aux statistiques de notre hébergeur (Cloudflare), sous forme de totaux : elles ne servent pas à identifier les visiteurs.</p>
        </Bloc>

        <Bloc titre="Avec un compte">
          <p>Un compte est créé par l’administration du site, sur invitation ou avec le lien d’inscription d’une classe. Selon le cas, il contient :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>le prénom, le nom et, pour un élève, un pseudo (prenom.nom) et un code secret ;</li>
            <li>pour un adulte, une adresse e-mail et un mot de passe ;</li>
            <li>le type de compte (élève, parent, enseignant), la ou les classes suivies, l’établissement, la ville et le pays ;</li>
            <li>facultativement : une photo de profil, un numéro de téléphone, une courte présentation ;</li>
            <li>la date de création du compte et de la dernière connexion.</li>
          </ul>
          <p>Les mots de passe et les codes sont enregistrés sous une forme chiffrée : personne, pas même l’administration, ne peut les lire.</p>
        </Bloc>

        <Bloc titre="Connexion avec Google">
          <p>
            Si vous reliez votre compte Google à votre compte MAXIMATHS, Google nous transmet uniquement votre nom, votre adresse e-mail
            et votre photo de profil Google, pour vous reconnaître à la connexion. Nous n’avons accès ni à vos e-mails, ni à vos fichiers,
            ni à vos contacts. Vous pouvez délier Google à tout moment depuis la page Mon profil.
          </p>
        </Bloc>

        <Bloc titre="Notifications">
          <p>
            Si vous acceptez les notifications, le site enregistre l’adresse technique de votre navigateur pour vous prévenir des nouveaux
            documents. Vous pouvez les désactiver à tout moment dans les réglages de votre navigateur ou de votre téléphone.
          </p>
        </Bloc>

        <Bloc titre="À quoi servent ces informations">
          <ul className="list-disc pl-6 space-y-1">
            <li>vous connecter et vous montrer les ressources de votre classe ;</li>
            <li>permettre à l’enseignant de reconnaître ses élèves et de gérer les accès ;</li>
            <li>vous prévenir des nouveaux documents, si vous l’avez accepté.</li>
          </ul>
          <p>Elles ne sont ni vendues, ni louées, ni utilisées pour de la publicité.</p>
        </Bloc>

        <Bloc titre="Où elles sont conservées">
          <p>
            Les comptes et les fichiers sont hébergés par Supabase, le site par Cloudflare : ce sont nos prestataires techniques, qui ne
            peuvent pas utiliser ces données pour leur propre compte. Seuls les administrateurs de MAXIMATHS voient les informations des comptes.
          </p>
          <p>Les informations d’un compte sont conservées tant que le compte existe, et effacées quand il est supprimé.</p>
        </Bloc>

        <Bloc titre="Élèves mineurs">
          <p>
            La plupart des élèves sont mineurs. Leurs parents peuvent à tout moment demander à voir, corriger ou supprimer les informations
            du compte de leur enfant, en écrivant à l’adresse ci-dessous.
          </p>
        </Bloc>

        <Bloc titre="Vos droits">
          <p>
            Vous pouvez modifier la plupart de vos informations vous-même dans Mon profil. Pour obtenir une copie de vos données, les faire
            corriger ou supprimer votre compte, écrivez à <a href={`mailto:${CONTACT}`} className="underline underline-offset-4">{CONTACT}</a> :
            nous répondons dans un délai d’un mois. Ces droits sont prévus notamment par la loi ivoirienne n° 2013-450 relative à la
            protection des données à caractère personnel.
          </p>
        </Bloc>

        <Bloc titre="Contact">
          <p>Pour toute question sur cette page : <a href={`mailto:${CONTACT}`} className="underline underline-offset-4">{CONTACT}</a>.</p>
        </Bloc>
      </div>
    </main>
    <Footer />
  </div>
);

export default Confidentialite;
