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

  const { signUp, signIn, user } = useAuth();
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
