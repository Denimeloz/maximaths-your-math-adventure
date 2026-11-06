import { Browser } from '@capacitor/browser';
import { FileTransfer } from '@capacitor/file-transfer';
import { FileViewer } from '@capacitor/file-viewer';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { toast } from 'sonner';

// Application iPhone : chaque document ouvert est gardé sur le téléphone et se rouvre sans connexion.
// Dossier sans sauvegarde iCloud : Apple refuse qu'un contenu retéléchargeable occupe la sauvegarde de l'utilisateur.
// On garde le nom du fichier et non son chemin complet, car iOS change ce chemin à chaque mise à jour de l'application.

const CLE = 'documents-hors-connexion';
const DOSSIER = Directory.LibraryNoCloud;

export interface DocumentGarde {
  url: string;
  nom: string;
  fichier: string;
  date: string;
}

export const listerDocuments = async (): Promise<DocumentGarde[]> => {
  const { value } = await Preferences.get({ key: CLE });
  if (!value) return [];
  try {
    return JSON.parse(value) as DocumentGarde[];
  } catch {
    return [];
  }
};

const enregistrer = (documents: DocumentGarde[]) => Preferences.set({ key: CLE, value: JSON.stringify(documents) });

// Nom de fichier stable pour une même adresse
const nomDeFichier = (url: string) => {
  let empreinte = 2166136261;
  for (let i = 0; i < url.length; i++) empreinte = Math.imul(empreinte ^ url.charCodeAt(i), 16777619);
  const extension = new URL(url).pathname.split('.').pop()?.toLowerCase() ?? 'pdf';
  return `document-${(empreinte >>> 0).toString(16)}-${url.length}.${extension}`;
};

const afficher = async (fichier: string) => {
  try {
    const { uri } = await Filesystem.getUri({ directory: DOSSIER, path: fichier });
    await FileViewer.openDocumentFromLocalPath({ path: decodeURI(uri.replace(/^file:\/\//, '')) });
    return true;
  } catch {
    return false;
  }
};

export const rouvrirDocument = async (document: DocumentGarde) => {
  if (!(await afficher(document.fichier))) await ouvrirDocument(document.url, document.nom);
};

let enCours: string | null = null;

export const ouvrirDocument = async (url: string, nom: string) => {
  if (enCours === url) return;
  enCours = url;
  try {
    const documents = await listerDocuments();
    const garde = documents.find((d) => d.url === url);
    if (garde && (await afficher(garde.fichier))) return;

    if (!navigator.onLine) {
      toast.error('Pas de connexion', { description: 'Ce document n’a pas encore été ouvert sur ce téléphone.' });
      return;
    }

    const attente = toast.loading('Ouverture du document…');
    try {
      const fichier = nomDeFichier(url);
      const { uri } = await Filesystem.getUri({ directory: DOSSIER, path: fichier });
      await FileTransfer.downloadFile({ url, path: uri });
      const nouveau: DocumentGarde = { url, nom, fichier, date: new Date().toISOString() };
      await enregistrer([nouveau, ...documents.filter((d) => d.url !== url)]);
      toast.dismiss(attente);
      if (!(await afficher(fichier))) await Browser.open({ url });
    } catch {
      toast.dismiss(attente);
      await Browser.open({ url });
    }
  } finally {
    enCours = null;
  }
};

export const retirerDocument = async (document: DocumentGarde) => {
  await Filesystem.deleteFile({ directory: DOSSIER, path: document.fichier }).catch(() => undefined);
  await enregistrer((await listerDocuments()).filter((d) => d.url !== document.url));
};

export const tailleDocument = async (document: DocumentGarde) => {
  try {
    const { size } = await Filesystem.stat({ directory: DOSSIER, path: document.fichier });
    return size;
  } catch {
    return 0;
  }
};
