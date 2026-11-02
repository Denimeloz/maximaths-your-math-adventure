// Comptes élèves sans e-mail (28/10/2026) : l'élève se connecte avec son pseudo (prenom.nom) et un code
// de 6 chiffres. Le compte Supabase porte une adresse technique <pseudo>@eleves.maximaths.com, que la page
// de connexion reconstitue. Même domaine que supabase/functions/_shared/eleves.ts.

export const DOMAINE_ELEVES = 'eleves.maximaths.com';

/** Numéro WhatsApp qui reçoit les demandes « j'ai oublié mon code » (ex. 2250102030405, sans + ni espaces).
 *  Par défaut, le numéro de l'assistance MAXIMATHS (07 13 77 73 04, Côte d'Ivoire, choisi le 02/11/2026). */
const WHATSAPP_ASSISTANCE = ((import.meta.env.VITE_WHATSAPP_ASSISTANCE as string | undefined) || '2250713777304').replace(/\D/g, '');

/** Adresse qui reçoit les demandes par e-mail (02/11/2026) */
export const EMAIL_ASSISTANCE = 'maximathsclasse@gmail.com';

/** « awa.kone » ou une adresse e-mail → adresse de connexion Supabase */
export const adresseDeConnexion = (identifiant: string) => {
  const id = identifiant.trim().toLowerCase();
  return id.includes('@') ? id : `${id}@${DOMAINE_ELEVES}`;
};

export const estCompteEleve = (email: string | null | undefined) => !!email && email.endsWith(`@${DOMAINE_ELEVES}`);

/** Ce qu'on affiche à la place de l'adresse : le pseudo pour un compte élève, l'e-mail sinon */
export const identifiantAffiche = (email: string | null | undefined) =>
  estCompteEleve(email) ? email!.slice(0, -(DOMAINE_ELEVES.length + 1)) : email ?? '';

const texteOubli = (identifiant: string) => {
  const qui = identifiant.trim() ? ` Mon identifiant : ${identifiant.trim()}.` : '';
  return `Bonjour, j'ai oublié mon code (ou mot de passe) MAXIMATHS.${qui} Mon prénom, mon nom et ma classe : `;
};

/** Lien WhatsApp « j'ai oublié mon code », avec un message déjà écrit */
export const lienOubli = (identifiant: string) => {
  const texte = texteOubli(identifiant);
  return WHATSAPP_ASSISTANCE
    ? `https://wa.me/${WHATSAPP_ASSISTANCE}?text=${encodeURIComponent(texte)}`
    : `https://wa.me/?text=${encodeURIComponent(texte)}`;
};

/** Même demande par e-mail (pour qui n'a pas WhatsApp) : ouvre la messagerie avec le message déjà écrit */
export const lienOubliMail = (identifiant: string) =>
  `mailto:${EMAIL_ASSISTANCE}?subject=${encodeURIComponent('MAXIMATHS : code oublié')}&body=${encodeURIComponent(texteOubli(identifiant))}`;
