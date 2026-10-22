import { isIos, isStandalone } from '@/lib/push';

// Lien de l'application sur le Play Store : à renseigner dans .env le jour où elle est publiée.
// Les téléphones Android sont alors envoyés vers le Play Store au lieu de l'installation par Chrome.
export const PLAY_STORE_URL = (import.meta.env.VITE_PLAY_STORE_URL as string | undefined) || '';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMode = 'play-store' | 'prompt' | 'ios' | 'none';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// À lancer au démarrage : Chrome propose l'installation très tôt, parfois avant l'affichage de la page
export const listenForInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (event) => {
    // On garde la proposition pour notre bouton au lieu de la petite barre de Chrome
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
};

export const subscribeInstall = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const isAndroid = () => /android/i.test(navigator.userAgent);

export const getInstallMode = (): InstallMode => {
  if (isStandalone()) return 'none';
  if (PLAY_STORE_URL && isAndroid()) return 'play-store';
  if (deferredPrompt) return 'prompt';
  if (isIos()) return 'ios';
  return 'none';
};

export const promptInstall = async () => {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === 'accepted';
};
