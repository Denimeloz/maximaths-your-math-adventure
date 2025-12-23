import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Sparkles, Star, BookOpen, Calculator, ArrowLeft, Loader2, Mail, Lock, User, Briefcase, GraduationCap } from 'lucide-react';

const signUpSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50),
  email: z.string().email('Email invalide').max(255),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  profession: z.string().min(2, 'Veuillez indiquer votre profession').max(100),
  level: z.enum(['college', 'lycee', 'both', 'other']),
});

const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    profession: '',
    level: 'college' as const,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp, signIn, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (isSignUp) {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          first_name: formData.firstName,
          last_name: formData.lastName,
          profession: formData.profession,
          level: formData.level,
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Compte existant",
              description: "Un compte existe déjà avec cet email. Connectez-vous!",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erreur d'inscription",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Inscription réussie! 🎉",
            description: "Vérifiez votre email pour confirmer votre compte.",
          });
        }
      } else {
        const result = signInSchema.safeParse({ email: formData.email, password: formData.password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Identifiants incorrects",
              description: "Email ou mot de passe incorrect.",
              variant: "destructive",
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "Email non confirmé",
              description: "Veuillez confirmer votre email avant de vous connecter.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erreur de connexion",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Bienvenue! 🚀",
            description: "Connexion réussie.",
          });
          navigate('/');
        }
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 math-pattern opacity-30" />
      
      {/* Floating decorations */}
      <div className="absolute top-20 left-10 float">
        <Star className="w-8 h-8 text-rainbow-yellow fill-rainbow-yellow" />
      </div>
      <div className="absolute top-32 right-20 float-delayed">
        <Sparkles className="w-10 h-10 text-rainbow-pink" />
      </div>
      <div className="absolute bottom-40 left-20 float-slow">
        <Calculator className="w-12 h-12 text-rainbow-purple opacity-60" />
      </div>
      <div className="absolute bottom-20 right-10 float">
        <BookOpen className="w-10 h-10 text-rainbow-blue opacity-60" />
      </div>

      {/* Clouds */}
      <div className="cloud w-32 h-16 top-16 left-1/4 opacity-60" />
      <div className="cloud w-48 h-20 top-24 right-1/3 opacity-40" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 text-foreground hover:bg-card/50 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Button>

        <div className="max-w-md mx-auto">
          {/* Card */}
          <div className="card-sticker bg-card border-rainbow-purple/30 p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-display text-rainbow mb-2">
                MAXIMATHS
              </h1>
              <p className="text-muted-foreground font-body">
                {isSignUp ? "Créez votre compte d'aventurier" : "Connectez-vous à votre espace"}
              </p>
            </div>

            {/* Toggle buttons */}
            <div className="flex gap-2 mb-8 p-1 bg-muted rounded-2xl">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-body font-semibold transition-all ${
                  !isSignUp 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-body font-semibold transition-all ${
                  isSignUp 
                    ? 'bg-secondary text-secondary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Inscription
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="font-body font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 text-rainbow-purple" />
                        Prénom
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Marie"
                        className="rounded-xl border-2 focus:border-rainbow-purple h-12"
                      />
                      {errors.firstName && (
                        <p className="text-destructive text-sm">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="font-body font-semibold">
                        Nom
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Dupont"
                        className="rounded-xl border-2 focus:border-rainbow-purple h-12"
                      />
                      {errors.lastName && (
                        <p className="text-destructive text-sm">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession" className="font-body font-semibold flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-rainbow-orange" />
                      Profession
                    </Label>
                    <Input
                      id="profession"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      placeholder="Élève, Enseignant, Parent..."
                      className="rounded-xl border-2 focus:border-rainbow-orange h-12"
                    />
                    {errors.profession && (
                      <p className="text-destructive text-sm">{errors.profession}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level" className="font-body font-semibold flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-rainbow-blue" />
                      Niveau d'intérêt
                    </Label>
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-xl border-2 border-input bg-background focus:border-rainbow-blue focus:outline-none focus:ring-2 focus:ring-rainbow-blue/20"
                    >
                      <option value="college">Collège</option>
                      <option value="lycee">Lycée</option>
                      <option value="both">Les deux</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-body font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-rainbow-pink" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className="rounded-xl border-2 focus:border-rainbow-pink h-12"
                />
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-body font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rainbow-green" />
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="rounded-xl border-2 focus:border-rainbow-green h-12"
                />
                {errors.password && (
                  <p className="text-destructive text-sm">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-14 text-lg font-display rounded-2xl btn-3d ${
                  isSignUp 
                    ? 'bg-secondary hover:bg-secondary/90' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : isSignUp ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Créer mon compte
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground font-body">ou</span>
                </div>
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setIsLoading(true);
                  const { error } = await signInWithGoogle();
                  if (error) {
                    toast({
                      title: "Erreur Google",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                  setIsLoading(false);
                }}
                disabled={isLoading}
                className="w-full h-14 text-lg font-body rounded-2xl border-2 hover:bg-muted/50 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </Button>
            </form>

            {/* Help text */}
            <p className="text-center text-sm text-muted-foreground mt-6 font-body">
              {isSignUp ? (
                <>
                  Déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-rainbow-purple font-semibold hover:underline"
                  >
                    Connectez-vous
                  </button>
                </>
              ) : (
                <>
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-rainbow-orange font-semibold hover:underline"
                  >
                    Inscrivez-vous
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
