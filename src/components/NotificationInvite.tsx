import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { enablePush, getPushState, onPushChange, type PushState } from '@/lib/push';

// Invitation claire à activer les notifications (24/10/2026) : la cloche seule ne suffit pas à
// comprendre à quoi elle sert. La fenêtre du navigateur (« Autoriser les notifications ? ») ne
// s'ouvre qu'après un « Oui » ici : demandée sans prévenir, elle est souvent refusée ou bloquée.
// Le site reste entièrement accessible sans notifications.

const CLE = 'maximaths-invitation-notifications-fermee';
const PAUSE_JOURS = 7;
const DELAI_MS = 4000;

const fermeeRecemment = () => {
  try {
    const le = Number(localStorage.getItem(CLE));
    return le > 0 && Date.now() - le < PAUSE_JOURS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const NotificationInvite = () => {
  const { pathname } = useLocation();
  const [etat, setEtat] = useState<PushState | null>(null);
  const [visible, setVisible] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [fermee, setFermee] = useState(fermeeRecemment);

  useEffect(() => {
    getPushState().then(setEtat).catch(() => setEtat('unsupported'));
    const minuterie = window.setTimeout(() => setVisible(true), DELAI_MS);
    const arreter = onPushChange(setEtat);
    return () => {
      window.clearTimeout(minuterie);
      arreter();
    };
  }, []);

  // Pas sur l'administration ni la connexion ; seulement si l'activation est possible et pas encore faite
  const pageAdmin = pathname.startsWith('/admin') || pathname.startsWith('/auth');
  if (!visible || fermee || pageAdmin || etat !== 'off') return null;

  const plusTard = () => {
    try {
      localStorage.setItem(CLE, String(Date.now()));
    } catch {
      // navigation privée : on ferme seulement pour cette visite
    }
    setFermee(true);
  };

  const activer = async () => {
    setOccupe(true);
    try {
      const resultat = await enablePush();
      if (resultat === 'on') {
        toast.success('C’est fait : tu seras prévenu à chaque nouveau document', {
          description: 'Tu peux les couper à tout moment avec la cloche en haut de la page.',
        });
      } else if (resultat === 'denied') {
        toast.info('Les notifications ont été refusées', {
          description: 'Pour changer d’avis : icône à gauche de l’adresse du site, puis « Notifications » › Autoriser.',
          duration: 10000,
        });
      } else {
        plusTard();
      }
    } catch {
      toast.error('Impossible d’activer les notifications pour le moment');
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Activer les notifications"
      className="fixed z-50 inset-x-3 top-20 sm:inset-x-auto sm:right-4 sm:top-auto sm:bottom-4 sm:w-96 rounded-2xl border border-border bg-background/95 backdrop-blur shadow-xl p-4 animate-in fade-in slide-in-from-top-2 sm:slide-in-from-bottom-2"
    >
      <button type="button" onClick={plusTard} aria-label="Fermer" className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted">
        <X className="w-4 h-4" />
      </button>
      <div className="flex gap-3">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-rainbow-orange/15 flex items-center justify-center">
          <Bell className="w-6 h-6 text-rainbow-orange" />
        </div>
        <div className="flex-1 pr-4">
          <p className="font-display text-base text-foreground leading-tight">Être prévenu des nouveaux documents ?</p>
          <p className="text-sm font-body text-muted-foreground mt-1 leading-snug">
            Une notification à chaque nouveau cours, exercice ou devoir publié. Tu pourras les couper à tout moment avec la cloche
            <Bell className="inline w-3.5 h-3.5 mx-1 -mt-0.5" />
            en haut de la page.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={plusTard} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted">
          Plus tard
        </button>
        <button
          type="button"
          onClick={activer}
          disabled={occupe}
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          Oui, me prévenir
        </button>
      </div>
    </div>
  );
};

export default NotificationInvite;
