import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ArrowLeft, Loader2, Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import newLogo from "@/assets/new-logo.png";

const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
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

  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) navigate('/admin');
      else navigate('/');
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
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast({
        title: 'Connexion impossible',
        description: error.message.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect.'
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
              <span className="text-rainbow-purple font-body font-semibold text-sm">Espace administrateur</span>
            </div>
            <h1 className="text-2xl font-display text-foreground">Connexion</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              Accès réservé à l'administrateur du site.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-rainbow-pink" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@maximaths.fr"
                className="rounded-xl border-2 focus:border-rainbow-pink h-12"
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-rainbow-green" /> Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
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
              disabled={isLoading}
              className="w-full h-12 text-base font-display rounded-2xl btn-3d bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Connexion…</>
              ) : (
                <><Shield className="w-5 h-5 mr-2" />Se connecter</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
