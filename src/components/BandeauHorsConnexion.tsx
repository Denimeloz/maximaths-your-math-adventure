import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { estNatif } from '@/lib/natif';

// Application iPhone sans réseau : on l'annonce clairement et on mène aux documents déjà gardés sur le téléphone.
const BandeauHorsConnexion = () => {
  const [enLigne, setEnLigne] = useState(() => navigator.onLine);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!estNatif()) return;
    const maj = () => setEnLigne(navigator.onLine);
    window.addEventListener('online', maj);
    window.addEventListener('offline', maj);
    // Lancée sans réseau, l'application ouvre directement les documents disponibles
    if (!navigator.onLine && window.location.pathname === '/') navigate('/mes-documents', { replace: true });
    return () => {
      window.removeEventListener('online', maj);
      window.removeEventListener('offline', maj);
    };
  }, [navigate]);

  if (!estNatif() || enLigne) return null;

  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-50 rounded-2xl bg-foreground text-background shadow-lg p-3 flex items-center gap-3 text-sm font-body">
      <WifiOff className="w-5 h-5 shrink-0" />
      <span className="flex-1">Pas de connexion. Tes documents déjà ouverts restent disponibles.</span>
      {pathname !== '/mes-documents' && (
        <Link to="/mes-documents" className="shrink-0 min-h-11 inline-flex items-center font-semibold underline underline-offset-4">
          Mes documents
        </Link>
      )}
    </div>
  );
};

export default BandeauHorsConnexion;
