import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Loader2, LogOut, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { levelLabel } from '@/lib/levels';
import { identifiantAffiche } from '@/lib/eleves';
import newLogo from '@/assets/new-logo.png';

// Inscription par classe (28/10/2026) : l'élève scanne le QR code projeté en classe (ou ouvre le lien posté
// dans le groupe WhatsApp), écrit son prénom et son nom, et reçoit aussitôt son pseudo et son code.
// Le compte est déjà rangé dans la bonne classe ; tout est vérifié par la fonction inscription-classe.

interface Lien { label: string; classe: string; account_type: 'eleve' | 'parent' }
interface Acces { pseudo: string; code: string }

const appeler = async (corps: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('inscription-classe', { body: corps });
  if (error) {
    const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(detail?.erreur ?? 'Connexion au serveur impossible. Vérifie ta connexion internet.');
  }
  if (data?.erreur) throw new Error(data.erreur);
  return data;
};

const Carte: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
    <div className="w-full max-w-md card-sticker bg-card border-rainbow-purple/30 p-8 space-y-5">
      <img src={newLogo} alt="MAXIMATHS" className="w-16 h-16 mx-auto object-contain" />
      {children}
    </div>
  </div>
);

const Rejoindre: React.FC = () => {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth();
  const [lien, setLien] = useState<Lien | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [acces, setAcces] = useState<Acces | null>(null);

  useEffect(() => {
    appeler({ action: 'info', code }).then(setLien).catch((e: Error) => setErreur(e.message));
  }, [code]);

  const inscrire = async (e: React.FormEvent) => {
    e.preventDefault();
    setOccupe(true);
    try {
      const data = await appeler({ action: 'join', code, first_name: prenom, last_name: nom });
      setAcces({ pseudo: data.pseudo, code: data.code });
      await signIn(data.email, data.code);
    } catch (err) {
      toast.error('Inscription impossible', { description: (err as Error).message });
    } finally {
      setOccupe(false);
    }
  };

  if (acces) {
    return (
      <Carte>
        <h1 className="text-2xl font-display text-center">Bienvenue, {prenom} !</h1>
        <p className="text-sm font-body text-center">
          Voici ton accès à MAXIMATHS. <strong>Fais une capture d’écran</strong> ou recopie-le dans ton cahier : tu en auras besoin pour te reconnecter.
        </p>
        <div className="rounded-2xl border-2 border-rainbow-orange bg-rainbow-orange/10 p-5 text-center space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ton pseudo</p>
            <p className="text-2xl font-display break-all">{acces.pseudo}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ton code</p>
            <p className="text-4xl font-display tracking-[0.3em]">{acces.code}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => navigator.clipboard.writeText(`MAXIMATHS : pseudo ${acces.pseudo}, code ${acces.code}`).then(() => toast.success('Copié'))}
        >
          <Copy className="w-4 h-4" /> Copier mon pseudo et mon code
        </Button>
        <Button className="w-full" onClick={() => navigate('/profil?eleve=1', { replace: true })}>J’ai noté, j’entre dans MAXIMATHS</Button>
      </Carte>
    );
  }

  if (erreur) {
    return (
      <Carte>
        <h1 className="text-xl font-display text-center">Lien d’inscription</h1>
        <p className="text-sm font-body text-center">{erreur}</p>
        <Button asChild variant="outline" className="w-full"><Link to="/auth">J’ai déjà un compte : me connecter</Link></Button>
      </Carte>
    );
  }

  if (!lien) {
    return (
      <Carte>
        <p className="text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Vérification du lien…</p>
      </Carte>
    );
  }

  // Téléphone déjà connecté (par exemple celui d'un parent ou d'un frère) : on propose de se déconnecter d'abord
  if (user) {
    return (
      <Carte>
        <h1 className="text-xl font-display text-center">Ce téléphone est déjà connecté</h1>
        <p className="text-sm font-body text-center">
          Le compte <strong>{identifiantAffiche(user.email)}</strong> est ouvert. Pour créer ton propre compte, déconnecte-le d’abord.
        </p>
        <Button className="w-full gap-2" onClick={() => signOut()}><LogOut className="w-4 h-4" /> Déconnecter ce compte</Button>
        <Button asChild variant="outline" className="w-full"><Link to="/">Retour à l’accueil</Link></Button>
      </Carte>
    );
  }

  return (
    <Carte>
      <div className="text-center">
        <h1 className="text-2xl font-display">Rejoindre MAXIMATHS</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          {lien.account_type === 'parent' ? 'Compte parent' : 'Compte élève'} · {levelLabel(lien.classe)}{lien.label ? ` · ${lien.label}` : ''}
        </p>
      </div>
      <form onSubmit={inscrire} className="space-y-4">
        <div><Label htmlFor="prenom">Ton prénom</Label><Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} autoComplete="given-name" required /></div>
        <div><Label htmlFor="nom">Ton nom</Label><Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="family-name" required /></div>
        <p className="text-xs text-muted-foreground font-body">Écris ton vrai prénom et ton vrai nom : ton professeur doit pouvoir te reconnaître.</p>
        <Button type="submit" disabled={occupe || !prenom.trim() || !nom.trim()} className="w-full gap-2">
          {occupe ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Créer mon compte
        </Button>
      </form>
      <p className="text-center text-sm"><Link to="/auth" className="text-muted-foreground hover:text-foreground">J’ai déjà un compte</Link></p>
    </Carte>
  );
};

export default Rejoindre;
