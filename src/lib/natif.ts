import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Application iPhone (Capacitor) : le site compilé tourne dans l'application, à l'adresse capacitor://localhost.
// Sur le site, estNatif() vaut false et rien de ce fichier ne change le comportement.

export const SITE = 'https://maximaths.com';

export const estNatif = () => Capacitor.isNativePlatform();

// Pour une adresse à partager (QR code, lien d'inscription) : toujours celle du site, jamais capacitor://localhost
export const adresseSite = (chemin: string) => `${estNatif() ? SITE : window.location.origin}${chemin}`;

const estWeb = (adresse: string) => /^https?:\/\//i.test(adresse);

// Dans l'application, ni window.open, ni target="_blank", ni download ne marchent comme dans un navigateur :
// les documents et les liens externes s'ouvrent dans le navigateur intégré d'iOS (lecture des PDF, partage, enregistrement).
export const initNatif = () => {
  if (!estNatif()) return;

  const ouvrir = window.open.bind(window);
  window.open = (url, ...reste) => {
    const adresse = url?.toString() ?? '';
    if (estWeb(adresse)) {
      void Browser.open({ url: adresse });
      return null;
    }
    return ouvrir(url, ...reste);
  };

  document.addEventListener(
    'click',
    (evenement) => {
      const lien = (evenement.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!lien || !estWeb(lien.href)) return;
      evenement.preventDefault();
      void Browser.open({ url: lien.href });
    },
    true,
  );
};
