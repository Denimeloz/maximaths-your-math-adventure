import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Camera, KeyRound, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LEVEL_IDS, LEVEL_LABELS } from '@/lib/levels';

// Mon profil (25/10/2026) : photo, identité, type de compte et classes, établissement, présentation,
// mot de passe. Après une invitation, la personne arrive ici (?bienvenue=1) pour choisir son mot de passe.

const TYPES: Record<string, string> = { enseignant: 'Enseignant', eleve: 'Élève', parent: 'Parent', autre: 'Autre' };

interface Champs {
  first_name: string;
  last_name: string;
  phone: string;
  profession: string;
  account_type: string;
  classes: string[];
  school: string;
  city: string;
  country: string;
  bio: string;
}

const Section: React.FC<{ titre: string; children: React.ReactNode; icone?: React.ElementType }> = ({ titre, children, icone: Icone = UserRound }) => (
  <section className="card-cartoon bg-card border-border p-5 space-y-4">
    <h2 className="font-display text-lg text-foreground flex items-center gap-2">
      <Icone className="w-5 h-5 text-rainbow-orange" /> {titre}
    </h2>
    {children}
  </section>
);

const Profil: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, profile, isAdmin, isLoading, refreshProfile, signOut } = useAuth();
  const [champs, setChamps] = useState<Champs | null>(null);
  const [extra, setExtra] = useState<{ jules_verne: boolean; access_until: string | null }>({ jules_verne: false, access_until: null });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [motDePasse, setMotDePasse] = useState({ nouveau: '', confirmation: '' });
  const fichier = useRef<HTMLInputElement>(null);
  const accueil = params.has('bienvenue') || params.has('mot-de-passe');

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth', { replace: true });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    // Tous les champs du profil, y compris ceux ajoutés le 25/10 (pas encore dans les types de Lovable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }: { data: Record<string, unknown> | null }) => {
      const p = data ?? {};
      const texte = (k: string) => (typeof p[k] === 'string' ? (p[k] as string) : '');
      setChamps({
        first_name: texte('first_name'), last_name: texte('last_name'), phone: texte('phone'), profession: texte('profession'),
        account_type: texte('account_type'), classes: Array.isArray(p.classes) ? (p.classes as string[]) : [],
        school: texte('school'), city: texte('city'), country: texte('country'), bio: texte('bio'),
      });
      setExtra({ jules_verne: p.jules_verne === true, access_until: (p.access_until as string) ?? null });
      setAvatar((p.avatar_url as string) ?? null);
    });
  }, [user, profile?.updated_at]);

  if (!user || !champs) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Header />
        <p className="pt-32 text-center text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  const maj = (cle: keyof Champs, valeur: string | string[]) => setChamps({ ...champs, [cle]: valeur });

  const enregistrer = async () => {
    setEnregistrement(true);
    const propre = Object.fromEntries(
      Object.entries(champs).map(([k, v]) => [k, typeof v === 'string' ? (v.trim() === '' && k !== 'first_name' && k !== 'last_name' ? null : v.trim()) : v]),
    );
    if (!propre.account_type) propre.account_type = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('profiles').update(propre).eq('user_id', user.id);
    setEnregistrement(false);
    if (error) {
      toast.error('Enregistrement impossible', { description: error.message });
      return;
    }
    toast.success('Profil enregistré');
    refreshProfile();
  };

  const changerPhoto = async (f: File) => {
    if (!f.type.startsWith('image/')) return toast.error('Choisis une image (JPG, PNG…)');
    if (f.size > 3 * 1024 * 1024) return toast.error('Image trop lourde (3 Mo au plus)');
    const extension = f.name.split('.').pop()?.toLowerCase() || 'jpg';
    const chemin = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from('avatars').upload(chemin, f, { upsert: true, contentType: f.type });
    if (error) return toast.error('Envoi de la photo impossible', { description: error.message });
    const url = supabase.storage.from('avatars').getPublicUrl(chemin).data.publicUrl;
    await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
    setAvatar(url);
    refreshProfile();
    toast.success('Photo mise à jour');
  };

  const changerMotDePasse = async () => {
    if (motDePasse.nouveau.length < 8) return toast.error('Au moins 8 caractères');
    if (motDePasse.nouveau !== motDePasse.confirmation) return toast.error('Les deux mots de passe ne sont pas identiques');
    const { error } = await supabase.auth.updateUser({ password: motDePasse.nouveau });
    if (error) return toast.error('Changement impossible', { description: error.message });
    setMotDePasse({ nouveau: '', confirmation: '' });
    toast.success('Mot de passe enregistré');
    if (accueil) navigate('/profil', { replace: true });
  };

  const nomAffiche = [champs.first_name, champs.last_name].filter(Boolean).join(' ') || user.email;

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 py-12 pt-24 max-w-3xl space-y-6">
        {accueil && (
          <div className="rounded-2xl border-2 border-rainbow-orange bg-rainbow-orange/10 p-4">
            <p className="font-display text-lg">{params.has('bienvenue') ? 'Bienvenue sur MAXIMATHS !' : 'Choisis ton nouveau mot de passe'}</p>
            <p className="text-sm font-body">Commence par choisir ton mot de passe (en bas de la page), puis complète ton profil.</p>
          </div>
        )}

        {/* En-tête du profil avec la photo */}
        <div className="card-cartoon bg-card border-border p-5 flex flex-col sm:flex-row items-center gap-5">
          <button type="button" onClick={() => fichier.current?.click()} className="relative group shrink-0" aria-label="Changer la photo de profil">
            {avatar ? (
              <img src={avatar} alt="" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <span className="w-24 h-24 rounded-full bg-rainbow-blue text-white flex items-center justify-center font-display text-3xl">
                {nomAffiche[0]?.toUpperCase()}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-rainbow-orange text-white flex items-center justify-center shadow">
              <Camera className="w-4 h-4" />
            </span>
          </button>
          <input ref={fichier} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && changerPhoto(e.target.files[0])} />
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl font-display text-foreground truncate">{nomAffiche}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              {isAdmin && <span className="px-2 py-0.5 rounded-full text-xs bg-rainbow-orange/20 text-rainbow-orange font-semibold">Administrateur</span>}
              {champs.account_type && <span className="px-2 py-0.5 rounded-full text-xs bg-rainbow-blue/10 text-rainbow-blue font-semibold">{TYPES[champs.account_type]}</span>}
              {extra.jules_verne && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-semibold">Jules Verne</span>}
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={async () => { await signOut(); navigate('/'); }}>
            <LogOut className="w-4 h-4" /> Déconnexion
          </Button>
        </div>

        <Section titre="Identité">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Prénom</Label><Input value={champs.first_name} onChange={(e) => maj('first_name', e.target.value)} /></div>
            <div><Label>Nom</Label><Input value={champs.last_name} onChange={(e) => maj('last_name', e.target.value)} /></div>
            <div><Label>Téléphone (WhatsApp)</Label><Input value={champs.phone} onChange={(e) => maj('phone', e.target.value)} placeholder="+225 …" /></div>
            <div><Label>Fonction</Label><Input value={champs.profession} onChange={(e) => maj('profession', e.target.value)} placeholder="Professeur de mathématiques, élève…" /></div>
          </div>
        </Section>

        <Section titre="Classes suivies">
          <div>
            <Label>Je suis</Label>
            <select value={champs.account_type} onChange={(e) => maj('account_type', e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1">
              <option value="">Non précisé</option>
              {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label>{champs.account_type === 'parent' ? 'Classes de mes enfants' : champs.account_type === 'enseignant' ? 'Classes où j’enseigne' : 'Ma classe'}</Label>
            <p className="text-xs text-muted-foreground mb-2">Plus tard, les notifications et les nouveautés seront filtrées selon ces classes.</p>
            <div className="flex flex-wrap gap-2">
              {LEVEL_IDS.map((id) => {
                const actif = champs.classes.includes(id);
                return (
                  <button key={id} type="button" onClick={() => maj('classes', actif ? champs.classes.filter((c) => c !== id) : [...champs.classes, id])}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${actif ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}>
                    {LEVEL_LABELS[id]}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section titre="Établissement et lieu">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3"><Label>Établissement</Label><Input value={champs.school} onChange={(e) => maj('school', e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Ville</Label><Input value={champs.city} onChange={(e) => maj('city', e.target.value)} /></div>
            <div><Label>Pays</Label><Input value={champs.country} onChange={(e) => maj('country', e.target.value)} placeholder="Côte d’Ivoire" /></div>
          </div>
          <div><Label>Présentation (facultatif)</Label><Textarea rows={3} value={champs.bio} onChange={(e) => maj('bio', e.target.value)} /></div>
          <div className="flex justify-end">
            <Button onClick={enregistrer} disabled={enregistrement} className="gap-2"><Save className="w-4 h-4" /> Enregistrer le profil</Button>
          </div>
        </Section>

        <Section titre="Accès" icone={ShieldCheck}>
          <p className="text-sm font-body">
            {extra.jules_verne ? 'Compte reconnu comme élève ou famille de Jules Verne.' : 'Compte non rattaché à Jules Verne.'}
            {extra.access_until && ` Accès ouvert jusqu’au ${new Date(extra.access_until).toLocaleDateString('fr-FR')}.`}
          </p>
          <p className="text-xs text-muted-foreground">Ces informations sont gérées par l’administration.</p>
        </Section>

        <Section titre={accueil ? 'Choisis ton mot de passe' : 'Mot de passe'} icone={KeyRound}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Nouveau mot de passe</Label><Input type="password" autoComplete="new-password" value={motDePasse.nouveau} onChange={(e) => setMotDePasse({ ...motDePasse, nouveau: e.target.value })} /></div>
            <div><Label>Confirmation</Label><Input type="password" autoComplete="new-password" value={motDePasse.confirmation} onChange={(e) => setMotDePasse({ ...motDePasse, confirmation: e.target.value })} /></div>
          </div>
          <div className="flex justify-end">
            <Button onClick={changerMotDePasse} variant={accueil ? 'default' : 'outline'} className="gap-2"><KeyRound className="w-4 h-4" /> Enregistrer le mot de passe</Button>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
};

export default Profil;
