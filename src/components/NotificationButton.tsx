import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { disablePush, enablePush, getPushState, type PushState } from '@/lib/push';

interface NotificationButtonProps {
  className?: string;
  iconClassName?: string;
}

// Cloche de l'en-tête : active ou coupe les notifications des nouveaux documents
const NotificationButton = ({ className, iconClassName = 'w-5 h-5' }: NotificationButtonProps) => {
  const [state, setState] = useState<PushState>('off');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState().then(setState).catch(() => setState('unsupported'));
  }, []);

  if (state === 'unsupported') return null;

  const handleClick = async () => {
    if (state === 'ios-install') {
      toast.info('Sur iPhone, ajoute d’abord MAXIMATHS à l’écran d’accueil', {
        description: 'Dans Safari : bouton Partager, puis « Sur l’écran d’accueil ». Ouvre ensuite le site depuis l’icône et touche la cloche.',
        duration: 10000,
      });
      return;
    }
    if (state === 'denied') {
      toast.info('Les notifications sont bloquées pour ce site', {
        description: 'Autorise-les dans les réglages du navigateur (icône à gauche de l’adresse), puis réessaie.',
      });
      return;
    }
    setBusy(true);
    try {
      if (state === 'on') {
        setState(await disablePush());
        toast.success('Notifications désactivées');
      } else {
        const next = await enablePush();
        setState(next);
        if (next === 'on') toast.success('C’est fait : tu seras prévenu à chaque nouveau document');
      }
    } catch {
      toast.error('Impossible d’activer les notifications pour le moment');
    } finally {
      setBusy(false);
    }
  };

  const label = state === 'on' ? 'Désactiver les notifications' : 'Être prévenu des nouveaux documents';
  const Icon = state === 'on' ? BellRing : state === 'denied' ? BellOff : Bell;

  return (
    <button type="button" onClick={handleClick} disabled={busy} aria-label={label} title={label} className={className}>
      <Icon className={iconClassName} />
    </button>
  );
};

export default NotificationButton;
