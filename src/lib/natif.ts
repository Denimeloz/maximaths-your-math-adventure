import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Application iPhone (Capacitor) : le site compilé tourne dans l'application, à l'adresse capacitor://localhost.
// Sur le site, estNatif() vaut false et rien de ce fichier ne change le comportement.

export const SITE = 'https://maximaths.com';

export const estNatif = () => Capacitor.isNativePlatform();

// Pour une adresse à partager (QR code, lien d'inscription) : toujours celle du site, jamais capacitor://localhost
export const adresseSite = (chemin: string) => `${estNatif() ? SITE : window.location.origin}${chemin}`;

const estWeb = (adresse: string) => /^https?:\/\//i.test(adresse);

const estDocument = (adresse: string) => /\.(pdf|docx?|pptx?|ppsx?|xlsx?|png|jpe?g|gif|webp)$/i.test(new URL(adresse).pathname);

const LIBELLES_VAGUES = /^(ouvrir|télécharger|voir|lien|fichier|document|pdf)\b/i;

// Nom affiché dans « Mes documents » : le titre de la carte qui contient le lien, précisé par le texte du lien (« Corrigé »)
const nomDuDocument = (adresse: string, element: Element | null) => {
  const texte = (element?.closest('a, button')?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const precision = texte && texte.length <= 40 && !LIBELLES_VAGUES.test(texte) ? texte : '';
  let parent = element?.parentElement ?? null;
  for (let niveau = 0; parent && niveau < 6; niveau++, parent = parent.parentElement) {
    const titre = parent.querySelector('h1, h2, h3, h4, h5')?.textContent?.replace(/\s+/g, ' ').trim();
    if (titre) return precision && precision !== titre ? `${titre} · ${precision}` : titre;
  }
  if (precision) return precision;
  return decodeURIComponent(new URL(adresse).pathname.split('/').pop() ?? 'Document');
};

const ouvrirAdresse = async (adresse: string, element: Element | null) => {
  if (!estDocument(adresse)) {
    await Browser.open({ url: adresse });
    return;
  }
  const { ouvrirDocument } = await import('@/lib/documentsHorsLigne');
  await ouvrirDocument(adresse, nomDuDocument(adresse, element));
};

// Dans l'application, ni window.open, ni target="_blank", ni download ne marchent comme dans un navigateur :
// les documents s'ouvrent dans le lecteur d'iOS et restent disponibles sans connexion,
// les autres liens externes s'ouvrent dans le navigateur intégré.
export const initNatif = () => {
  if (!estNatif()) return;

  let dernierClic: Element | null = null;

  const ouvrir = window.open.bind(window);
  window.open = (url, ...reste) => {
    const adresse = url?.toString() ?? '';
    if (estWeb(adresse)) {
      void ouvrirAdresse(adresse, dernierClic);
      return null;
    }
    return ouvrir(url, ...reste);
  };

  document.addEventListener(
    'click',
    (evenement) => {
      dernierClic = evenement.target as Element | null;
      const lien = dernierClic?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!lien || !estWeb(lien.href)) return;
      evenement.preventDefault();
      void ouvrirAdresse(lien.href, lien);
    },
    true,
  );
};
