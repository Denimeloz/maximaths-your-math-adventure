// Comptes élèves sans e-mail (28/10/2026) : pseudo prenom.nom et code de 6 chiffres.
// Le compte Supabase porte une adresse technique <pseudo>@eleves.maximaths.com, jamais utilisée pour écrire :
// la page de connexion la reconstitue à partir du pseudo.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.89.0";

export const DOMAINE_ELEVES = "eleves.maximaths.com";

export const adresseTechnique = (pseudo: string) => `${pseudo}@${DOMAINE_ELEVES}`;

// « Aïcha N'Guessan » → « aicha.nguessan »
const morceau = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);

/** Premier pseudo libre : aicha.kone, puis aicha.kone2, aicha.kone3… */
export const pseudoLibre = async (admin: SupabaseClient, prenom: string, nom: string) => {
  const base = [morceau(prenom), morceau(nom)].filter(Boolean).join(".") || "eleve";
  const { data } = await admin.from("profiles").select("username").like("username", `${base}%`);
  const pris = new Set((data ?? []).map((p) => p.username));
  if (!pris.has(base)) return base;
  for (let n = 2; ; n++) if (!pris.has(`${base}${n}`)) return `${base}${n}`;
};

/** Code de 6 chiffres tiré au hasard (pas de 000000 ni de 123456) */
export const nouveauCode = () => {
  const faibles = new Set(["000000", "111111", "123456", "654321", "121212"]);
  for (;;) {
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
    const code = String(n).padStart(6, "0");
    if (!faibles.has(code)) return code;
  }
};

/** Prénom ou nom acceptable : lettres, espaces, tirets, apostrophes, 1 à 40 caractères */
export const nomValide = (texte: string) => /^[\p{L}][\p{L}' -]{0,39}$/u.test(texte);
