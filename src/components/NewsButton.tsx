import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { chargerNouveautes, nombreNonVues, surNouveautesVues } from '@/lib/nouveautes';

interface NewsButtonProps {
  className?: string;
  iconClassName?: string;
}

// Bouton « Quoi de neuf » de l'en-tête, avec une pastille du nombre de documents pas encore vus
const NewsButton = ({ className, iconClassName = 'w-5 h-5' }: NewsButtonProps) => {
  const [nonVues, setNonVues] = useState(0);

  useEffect(() => {
    let actif = true;
    const compter = () =>
      chargerNouveautes()
        .then((liste) => actif && setNonVues(nombreNonVues(liste)))
        .catch(() => undefined);
    compter();
    // Mise à jour quand on revient sur l'onglet, et toutes les 2 minutes
    const intervalle = window.setInterval(compter, 2 * 60 * 1000);
    const auRetour = () => document.visibilityState === 'visible' && compter();
    document.addEventListener('visibilitychange', auRetour);
    const arreter = surNouveautesVues(() => setNonVues(0));
    return () => {
      actif = false;
      window.clearInterval(intervalle);
      document.removeEventListener('visibilitychange', auRetour);
      arreter();
    };
  }, []);

  const label = nonVues > 0 ? `Quoi de neuf : ${nonVues} nouveauté${nonVues > 1 ? 's' : ''}` : 'Quoi de neuf';

  return (
    <Link to="/nouveautes" aria-label={label} title={label} className={`relative ${className ?? ''}`}>
      <Sparkles className={iconClassName} />
      {nonVues > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-rainbow-pink text-white text-[0.7rem] font-bold leading-[1.15rem] text-center">
          {nonVues > 9 ? '9+' : nonVues}
        </span>
      )}
    </Link>
  );
};

export default NewsButton;
