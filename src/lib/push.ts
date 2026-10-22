import { supabase } from '@/integrations/supabase/client';

// Clé publique VAPID (elle peut être publique : la clé privée reste dans les secrets de Supabase)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushState = 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on';

export const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!VAPID_PUBLIC_KEY;

// Enregistre le service worker (hors aperçu Lovable, qui affiche le site dans un cadre)
export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator) || window.self !== window.top) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
};

const toUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const getPushState = async (): Promise<PushState> => {
  // Sur iPhone, les notifications ne marchent qu'une fois le site ajouté à l'écran d'accueil
  if (isIos() && !isStandalone()) return 'ios-install';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? 'on' : 'off';
};

export const enablePush = async (level?: string | null): Promise<PushState> => {
  if (!pushSupported()) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';

  const registration = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(VAPID_PUBLIC_KEY!),
    }));

  const json = subscription.toJSON();
  const { error } = await supabase.rpc('subscribe_push', {
    p_endpoint: subscription.endpoint,
    p_p256dh: json.keys?.p256dh ?? '',
    p_auth: json.keys?.auth ?? '',
    p_level: level ?? null,
    p_user_agent: navigator.userAgent,
  });
  if (error) {
    await subscription.unsubscribe();
    throw error;
  }
  return 'on';
};

export const disablePush = async (): Promise<PushState> => {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await supabase.rpc('unsubscribe_push', { p_endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  }
  return 'off';
};
