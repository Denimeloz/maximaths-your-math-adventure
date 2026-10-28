import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ArrowLeft, Loader2, User, Lock, Shield, Eye, EyeOff, MessageCircle } from 'lucide-react';
import newLogo from "@/assets/new-logo.png";
import { adresseDeConnexion, lienOubli } from '@/lib/eleves';
import { connexionGoogle, erreurRetourGoogle } from '@/lib/google';
import GoogleLogo from '@/components/GoogleLogo';

// Un élève se connecte avec son pseudo (prenom.nom) et son code de 6 chiffres ; un adulte avec son e-mail
// et son mot de passe (28/10/2026). Le même champ accepte les deux.
const signInSchema = z.object({
  email: z.string().trim().min(3, 'Écris ton pseudo ou ton e-mail')
    .refine((v) => (v.includes('@') ? z.string().email().safeParse(v).success : /^[a-z0-9.]+$/i.test(v)), 'Pseudo ou e-mail invalide'),
  password: z.string().min(1, 'Code ou mot de passe requis'),
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Retour de Google avec une erreur (compte Google relié à aucun compte, connexion annulée…)
  useEffect(() => {
    const erreur = erreurRetourGoogle();
    if (erreur) toast({ title: 'Connexion avec Google', description: erreur, variant: 'destructive' });
  }, [toast]);

  const avecGoogle = async () => {
    const { error } = await connexionGoogle();
    if (error) toast({ title: 'Connexion avec Google impossible', description: error.message, variant: 'destructive' });
  };

  useEffect(() => {
    // On attend de savoir si le compte est admin avant de rediriger (authLoading reste vrai jusque-là)
    if (!authLoading && user) {
      // Un administrateur va à l'administration, les autres comptes à leur profil
      navigate(isAdmin ? '/admin' : '/profil', { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const f: Record<string, string> = {};
      parsed.error.errors.forEach(err => { if (err.path[0]) f[err.path[0] as string] = err.message; });
      setErrors(f);
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(adresseDeConnexion(email), password);
    setIsLoading(false);
    if (error) {
      toast({
        title: 'Connexion impossible',
        description: error.message.includes('Invalid login credentials')
          ? 'Identifiant ou code incorrect. Un pseudo s’écrit prenom.nom, sans accent.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Bienvenue', description: 'Connexion réussie.' });
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 text-foreground hover:bg-card/50 rounded-full">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Button>

        <div className="card-sticker bg-card border-rainbow-purple/30 p-8">
          <div className="text-center mb-8">
            <img src={newLogo} alt="MAXIMATHS" className="w-16 h-16 mx-auto mb-4 object-contain" />
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-purple/20 rounded-full mb-4">
              <Shield className="w-4 h-4 text-rainbow-purple" />
              <span className="text-rainbow-purple font-body font-semibold text-sm">Espace membres</span>
            </div>
            <h1 className="text-2xl font-display text-foreground">Connexion</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              Élève : ton pseudo (prenom.nom) et ton code. Adulte : ton e-mail et ton mot de passe.
              Pas encore de compte ? Utilise le lien ou le QR code donné par ton professeur.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-rainbow-pink" /> Pseudo ou e-mail
              </Label>
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="awa.kone"
                className="rounded-xl border-2 focus:border-rainbow-pink h-12"
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-rainbow-green" /> Code ou mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border-2 focus:border-rainbow-green h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading || (authLoading && !!user)}
              className="w-full h-12 text-base font-display rounded-2xl btn-3d bg-primary hover:bg-primary/90"
            >
              {isLoading || (authLoading && !!user) ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Connexion…</>
              ) : (
                <><Shield className="w-5 h-5 mr-2" />Se connecter</>
              )}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" onClick={avecGoogle} className="w-full h-12 rounded-2xl gap-3 font-body font-semibold">
            <GoogleLogo /> Se connecter avec Google
          </Button>
          <p className="mt-2 text-xs text-center text-muted-foreground font-body">Si tu as relié ton compte Google dans Mon profil.</p>

          {/* Pas d'e-mail de récupération : la demande part sur WhatsApp, l'administration envoie un nouveau code */}
          <a
            href={lienOubli(email)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="w-4 h-4" /> J’ai oublié mon code ou mon mot de passe
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
