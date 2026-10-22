import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { getInstallMode, PLAY_STORE_URL, promptInstall, subscribeInstall, type InstallMode } from '@/lib/install';

const BANNER_KEY = 'maximaths-bandeau-installation-ferme';
const BANNER_PAUSE_DAYS = 14;

const useInstallMode = () => {
  const [mode, setMode] = useState<InstallMode>(() => getInstallMode());
  useEffect(() => subscribeInstall(() => setMode(getInstallMode())), []);
  return mode;
};

const install = async (mode: InstallMode) => {
  if (mode === 'play-store') {
    window.open(PLAY_STORE_URL, '_blank', 'noopener');
    return;
  }
  if (mode === 'prompt') {
    if (await promptInstall()) toast.success('MAXIMATHS est installé sur ton appareil');
    return;
  }
  if (mode === 'ios') {
    toast.info('Pour installer MAXIMATHS sur iPhone', {
      description: 'Dans Safari : touche le bouton Partager (carré avec une flèche), puis « Sur l’écran d’accueil ».',
      duration: 10000,
    });
  }
};

interface InstallAppButtonProps {
  className?: string;
  iconClassName?: string;
}

// Bouton de l'en-tête : visible seulement quand l'installation est possible sur cet appareil
export const InstallAppButton = ({ className, iconClassName = 'w-5 h-5' }: InstallAppButtonProps) => {
  const mode = useInstallMode();
  if (mode === 'none') return null;
  const label = mode === 'play-store' ? 'Télécharger l’application sur le Play Store' : 'Installer l’application MAXIMATHS';
  return (
    <button type="button" onClick={() => install(mode)} aria-label={label} title={label} className={className}>
      <Download className={iconClassName} />
    </button>
  );
};

const bannerDismissed = () => {
  try {
    const closedAt = Number(localStorage.getItem(BANNER_KEY));
    return closedAt > 0 && Date.now() - closedAt < BANNER_PAUSE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

// Bandeau en bas de l'écran, sur téléphone : il revient 14 jours après avoir été fermé
export const InstallAppBanner = () => {
  const mode = useInstallMode();
  const [hidden, setHidden] = useState(bannerDismissed);

  if (mode === 'none' || hidden) return null;

  const close = () => {
    try {
      localStorage.setItem(BANNER_KEY, String(Date.now()));
    } catch {
      // stockage indisponible (navigation privée) : on ferme seulement pour cette visite
    }
    setHidden(true);
  };

  return (
    <div className="lg:hidden fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border bg-background/95 backdrop-blur shadow-lg p-3 flex items-center gap-3">
      <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
      <p className="text-sm font-body flex-1 leading-snug">
        <span className="font-semibold block">Installe MAXIMATHS</span>
        Accès direct depuis ton écran d’accueil et notifications des nouveaux documents.
      </p>
      <button
        type="button"
        onClick={() => install(mode)}
        className="shrink-0 rounded-full bg-primary text-primary-foreground text-sm font-semibold px-4 py-2"
      >
        {mode === 'play-store' ? 'Play Store' : 'Installer'}
      </button>
      <button type="button" onClick={close} aria-label="Fermer" className="shrink-0 p-1 rounded-full hover:bg-muted">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
