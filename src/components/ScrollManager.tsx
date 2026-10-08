import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Remet la page en haut à chaque changement d'adresse, ou fait défiler
 * jusqu'à l'ancre quand l'adresse en contient une (ex. `/#classes`).
 */
const ScrollManager = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // La section visée peut n'apparaître qu'une fois la page chargée : on réessaie brièvement
    const tick = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: 'start' });
      } else if (tries++ < 20) {
        timer = setTimeout(tick, 100);
      }
    };
    tick();
    return () => { if (timer) clearTimeout(timer); };
  }, [pathname, hash]);

  return null;
};

export default ScrollManager;
