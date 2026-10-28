import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Connexion avec Google (28/10/2026) : un raccourci de connexion, pas un moyen de s'inscrire.
// L'inscription publique reste fermée dans Supabase : on crée d'abord son compte (QR code de la classe ou
// invitation), puis on y relie son compte Google depuis Mon profil. Un compte Google inconnu est refusé
// par Supabase (« signup disabled ») et la page de connexion l'explique.
// Un adulte dont le compte MAXIMATHS a la même adresse Gmail est relié automatiquement par Supabase.

const retour = (chemin: string) => `${window.location.origin}${chemin}`;

export const connexionGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: retour('/auth') } });

export const lierGoogle = () =>
  supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: retour('/profil?google=1') } });

export const identiteGoogle = (user: User | null) => user?.identities?.find((i) => i.provider === 'google') ?? null;

export const adresseGoogle = (user: User | null) => {
  const donnees = identiteGoogle(user)?.identity_data as { email?: string } | undefined;
  return donnees?.email ?? null;
};

export const delierGoogle = async (user: User) => {
  const identite = identiteGoogle(user);
  if (!identite) return { error: null };
  return supabase.auth.unlinkIdentity(identite);
};

/** Erreur renvoyée par Supabase dans l'adresse au retour de Google ; l'adresse est nettoyée ensuite */
export const erreurRetourGoogle = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  new URLSearchParams(window.location.hash.replace(/^#/, '')).forEach((v, k) => params.set(k, v));
  const code = params.get('error_code') ?? params.get('error');
  if (!code) return null;
  const description = (params.get('error_description') ?? '').toLowerCase();
  window.history.replaceState(null, '', window.location.pathname);
  if (code === 'signup_disabled' || description.includes('signups not allowed') || description.includes('signup')) {
    return 'Aucun compte MAXIMATHS n’est relié à ce compte Google. Crée d’abord ton compte avec le QR code de ta classe, puis relie Google depuis Mon profil.';
  }
  if (code === 'identity_already_exists' || description.includes('already linked')) {
    return 'Ce compte Google est déjà relié à un autre compte MAXIMATHS.';
  }
  if (code === 'access_denied') return 'Connexion avec Google annulée.';
  return params.get('error_description') ?? 'Connexion avec Google impossible.';
};
