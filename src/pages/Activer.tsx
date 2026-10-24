import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { KeyRound, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Activation d'un compte invité, ou nouveau mot de passe (25/10/2026).
// Le lien envoyé par WhatsApp mène ici, et non directement à Supabase : l'aperçu automatique de
// WhatsApp ouvrait le lien à usage unique et le rendait invalide avant le clic. Le code n'est
// utilisé qu'au moment où la personne touche le bouton.

const Activer: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tokenHash = params.get('token_hash');
  const type = params.get('type') === 'recovery' ? 'recovery' : 'invite';
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const activer = async () => {
    if (!tokenHash) return;
    setOccupe(true);
    setErreur(null);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    setOccupe(false);
    if (error) {
      setErreur('Ce lien a expiré ou a déjà servi. Demande un nouveau lien à l’administrateur du site.');
      return;
    }
    navigate(type === 'invite' ? '/profil?bienvenue=1' : '/profil?mot-de-passe=1', { replace: true });
  };

  const Icone = type === 'invite' ? UserCheck : KeyRound;

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 py-12 pt-28 max-w-md">
        <div className="card-sticker bg-card border-border p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rainbow-orange/15 flex items-center justify-center mx-auto">
            <Icone className="w-7 h-7 text-rainbow-orange" />
          </div>
          <h1 className="text-2xl font-display text-foreground">
            {type === 'invite' ? 'Activer mon compte MAXIMATHS' : 'Choisir un nouveau mot de passe'}
          </h1>
          {!tokenHash ? (
            <p className="text-sm text-muted-foreground">Lien incomplet. Ouvre le lien reçu en entier, ou demande-en un nouveau.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground font-body">
                {type === 'invite'
                  ? 'Touche le bouton : ton compte sera activé et tu choisiras ton mot de passe.'
                  : 'Touche le bouton, puis choisis ton nouveau mot de passe.'}
              </p>
              <Button onClick={activer} disabled={occupe} className="w-full">
                {occupe ? 'Un instant…' : type === 'invite' ? 'Activer mon compte' : 'Continuer'}
              </Button>
              {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Déjà un mot de passe ? <Link to="/auth" className="underline">Se connecter</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Activer;
