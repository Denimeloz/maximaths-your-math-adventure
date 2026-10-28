import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, Hash, KeyRound, MessageCircle, Pencil, RefreshCw, Shield, ShieldOff, Trash2, UserPlus } from 'lucide-react';
import { LEVEL_IDS, LEVEL_LABELS } from '@/lib/levels';
import { estCompteEleve, identifiantAffiche } from '@/lib/eleves';
import { InscriptionsManager } from '@/components/admin/InscriptionsManager';

// Gestion des comptes (25/10/2026) : liste avec dernière connexion, invitation par lien, rôles,
// modification des profils et suppression des comptes qui ne sont pas administrateurs.
// Tout passe par la fonction admin-users (droits vérifiés côté serveur).

const TYPES_COMPTE: Record<string, string> = { enseignant: 'Enseignant', eleve: 'Élève', parent: 'Parent', autre: 'Autre' };

interface Profil {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  account_type: string | null;
  classes: string[] | null;
  jules_verne: boolean | null;
  admin_note: string | null;
}

interface Compte {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  admin: boolean;
  moi: boolean;
  profil: Profil | null;
}

interface Formulaire {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_type: string;
  classes: string[];
  jules_verne: boolean;
  admin_note: string;
  admin: boolean;
}

const VIDE: Formulaire = { first_name: '', last_name: '', email: '', phone: '', account_type: '', classes: [], jules_verne: false, admin_note: '', admin: false };

const appeler = async (corps: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('admin-users', { body: corps });
  if (error) {
    // Le message utile est dans le corps de la réponse
    const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(detail?.erreur ?? error.message);
  }
  if (data?.erreur) throw new Error(data.erreur);
  return data;
};

const nom = (c: Compte) => [c.profil?.first_name, c.profil?.last_name].filter((x) => x && x.trim()).join(' ');
const date = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null);
const dateHeure = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ChoixClasses: React.FC<{ valeur: string[]; onChange: (v: string[]) => void }> = ({ valeur, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {LEVEL_IDS.map((id) => {
      const actif = valeur.includes(id);
      return (
        <button
          key={id}
          type="button"
          onClick={() => onChange(actif ? valeur.filter((c) => c !== id) : [...valeur, id])}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${actif ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}
        >
          {LEVEL_LABELS[id]}
        </button>
      );
    })}
  </div>
);

const SelectType: React.FC<{ valeur: string; onChange: (v: string) => void }> = ({ valeur, onChange }) => (
  <select value={valeur} onChange={(e) => onChange(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
    <option value="">Non précisé</option>
    {Object.entries(TYPES_COMPTE).map(([v, l]) => (
      <option key={v} value={v}>{l}</option>
    ))}
  </select>
);

export const UsersManager: React.FC = () => {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [invitation, setInvitation] = useState<Formulaire | null>(null);
  const [edition, setEdition] = useState<{ compte: Compte; form: Formulaire } | null>(null);
  const [suppression, setSuppression] = useState<{ compte: Compte; saisie: string } | null>(null);
  const [lien, setLien] = useState<{ pour: string; url: string; bienvenue: boolean } | null>(null);
  // Compte élève (pseudo, sans e-mail) : nouveau code de 6 chiffres à lui envoyer (28/10/2026)
  const [codeEleve, setCodeEleve] = useState<{ pour: string; pseudo: string; code: string } | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const data = await appeler({ action: 'list' });
      setComptes(data.comptes ?? []);
    } catch (e) {
      toast.error('Impossible de charger les comptes', { description: (e as Error).message });
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const action = async (corps: Record<string, unknown>, succes: string) => {
    setOccupe(true);
    try {
      const data = await appeler(corps);
      toast.success(succes);
      await charger();
      return data;
    } catch (e) {
      toast.error('Action impossible', { description: (e as Error).message });
      return null;
    } finally {
      setOccupe(false);
    }
  };

  const inviter = async () => {
    if (!invitation) return;
    const data = await action({ action: 'invite', ...invitation }, 'Compte créé');
    if (data?.lien) {
      setLien({ pour: [invitation.first_name, invitation.last_name].join(' ').trim() || invitation.email, url: data.lien, bienvenue: true });
      setInvitation(null);
    }
  };

  const nouveauLien = async (c: Compte) => {
    const data = await action({ action: 'link', userId: c.id }, 'Lien créé');
    if (data?.lien) setLien({ pour: nom(c) || c.email, url: data.lien, bienvenue: !c.email_confirmed_at });
  };

  const nouveauCode = async (c: Compte) => {
    const data = await action({ action: 'reset_code', userId: c.id }, 'Nouveau code créé');
    if (data?.code) setCodeEleve({ pour: nom(c) || identifiantAffiche(c.email), pseudo: identifiantAffiche(c.email), code: data.code });
  };

  const messageCode = codeEleve
    ? `Bonjour ${codeEleve.pour}, voici ton accès MAXIMATHS (maximaths.com, « Connexion ») : pseudo ${codeEleve.pseudo}, nouveau code ${codeEleve.code}. Garde-le pour toi.`
    : '';

  const enregistrer = async () => {
    if (!edition) return;
    const { form, compte } = edition;
    const ok = await action(
      {
        action: 'update', userId: compte.id, first_name: form.first_name, last_name: form.last_name, phone: form.phone,
        account_type: form.account_type || null, classes: form.classes, jules_verne: form.jules_verne, admin_note: form.admin_note,
      },
      'Profil mis à jour',
    );
    if (ok) setEdition(null);
  };

  const supprimer = async () => {
    if (!suppression) return;
    const ok = await action({ action: 'delete', userId: suppression.compte.id }, 'Compte supprimé');
    if (ok) setSuppression(null);
  };

  const message = lien
    ? lien.bienvenue
      ? `Bonjour ${lien.pour}, voici ton accès à MAXIMATHS. Ouvre ce lien pour choisir ton mot de passe : ${lien.url}`
      : `Bonjour ${lien.pour}, voici un lien pour choisir un nouveau mot de passe sur MAXIMATHS : ${lien.url}`
    : '';

  const admins = comptes.filter((c) => c.admin).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display text-foreground">Utilisateurs</h2>
          <p className="text-sm text-muted-foreground font-body">
            {comptes.length} compte{comptes.length > 1 ? 's' : ''}, dont {admins} administrateur{admins > 1 ? 's' : ''}. Les inscriptions publiques sont fermées : les comptes se créent ici, par invitation, ou par les liens d’inscription par classe.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={charger} disabled={chargement} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${chargement ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
          <Button onClick={() => setInvitation({ ...VIDE })} className="gap-2">
            <UserPlus className="w-4 h-4" /> Inviter un compte
          </Button>
        </div>
      </div>

      <InscriptionsManager />

      {chargement && comptes.length === 0 ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : (
        <div className="space-y-3">
          {comptes.map((c) => {
            const n = nom(c);
            const type = c.profil?.account_type ? TYPES_COMPTE[c.profil.account_type] : null;
            const eleve = estCompteEleve(c.email);
            return (
              <div key={c.id} className="card-cartoon bg-card border-border p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {c.profil?.avatar_url ? (
                    <img src={c.profil.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-rainbow-blue text-white flex items-center justify-center font-display text-lg shrink-0">
                      {(n || c.email)[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-foreground">{n || <span className="italic text-muted-foreground">Nom non renseigné</span>}</h3>
                      {c.moi && <span className="text-xs text-rainbow-purple font-semibold">(toi)</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.admin ? 'bg-rainbow-orange/20 text-rainbow-orange' : 'bg-muted text-muted-foreground'}`}>
                        {c.admin ? 'Administrateur' : 'Utilisateur'}
                      </span>
                      {type && <span className="px-2 py-0.5 rounded-full text-xs bg-rainbow-blue/10 text-rainbow-blue font-semibold">{type}</span>}
                      {c.profil?.jules_verne && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-semibold">Jules Verne</span>}
                      {!c.email_confirmed_at && <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 font-semibold">Invitation en attente</span>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{eleve ? `Pseudo : ${identifiantAffiche(c.email)}` : c.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Créé le {date(c.created_at)} · {c.last_sign_in_at ? `dernière connexion le ${dateHeure(c.last_sign_in_at)}` : 'jamais connecté'}
                      {(c.profil?.classes ?? []).length > 0 && ` · ${(c.profil?.classes ?? []).map((x) => LEVEL_LABELS[x as keyof typeof LEVEL_LABELS] ?? x).join(', ')}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() =>
                      setEdition({
                        compte: c,
                        form: {
                          ...VIDE,
                          first_name: c.profil?.first_name ?? '',
                          last_name: c.profil?.last_name ?? '',
                          email: c.email,
                          phone: c.profil?.phone ?? '',
                          account_type: c.profil?.account_type ?? '',
                          classes: c.profil?.classes ?? [],
                          jules_verne: !!c.profil?.jules_verne,
                          admin_note: c.profil?.admin_note ?? '',
                        },
                      })
                    }
                  >
                    <Pencil className="w-4 h-4" /> Modifier
                  </Button>
                  {eleve ? (
                    <Button variant="outline" size="sm" className="gap-1" disabled={occupe} onClick={() => nouveauCode(c)}>
                      <Hash className="w-4 h-4" /> Nouveau code
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1" disabled={occupe} onClick={() => nouveauLien(c)}>
                      <KeyRound className="w-4 h-4" /> Lien de connexion
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={occupe || (c.admin && c.moi)}
                    title={c.admin && c.moi ? 'Tu ne peux pas te retirer toi-même les droits' : undefined}
                    onClick={() => action({ action: 'set_admin', userId: c.id, admin: !c.admin }, c.admin ? 'Droits retirés' : 'Droits d’administrateur donnés')}
                  >
                    {c.admin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    {c.admin ? 'Retirer admin' : 'Rendre admin'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    disabled={occupe || c.admin || c.moi}
                    title={c.admin ? 'Un administrateur ne se supprime pas : retire d’abord ses droits' : undefined}
                    onClick={() => setSuppression({ compte: c, saisie: '' })}
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inviter un compte */}
      <Dialog open={!!invitation} onOpenChange={(o) => !o && setInvitation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inviter un compte</DialogTitle>
            <DialogDescription>Le compte est créé tout de suite ; tu obtiens un lien à envoyer (WhatsApp ou e-mail) pour que la personne choisisse son mot de passe.</DialogDescription>
          </DialogHeader>
          {invitation && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prénom</Label><Input value={invitation.first_name} onChange={(e) => setInvitation({ ...invitation, first_name: e.target.value })} /></div>
                <div><Label>Nom</Label><Input value={invitation.last_name} onChange={(e) => setInvitation({ ...invitation, last_name: e.target.value })} /></div>
              </div>
              <div><Label>E-mail</Label><Input type="email" value={invitation.email} onChange={(e) => setInvitation({ ...invitation, email: e.target.value })} /></div>
              <div><Label>Type de compte</Label><SelectType valeur={invitation.account_type} onChange={(v) => setInvitation({ ...invitation, account_type: v })} /></div>
              <div><Label>Classes</Label><ChoixClasses valeur={invitation.classes} onChange={(v) => setInvitation({ ...invitation, classes: v })} /></div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={invitation.admin} onChange={(e) => setInvitation({ ...invitation, admin: e.target.checked })} />
                Administrateur (peut publier et gérer le site)
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvitation(null)}>Annuler</Button>
            <Button onClick={inviter} disabled={occupe || !invitation?.email}>Créer et obtenir le lien</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lien à envoyer */}
      <Dialog open={!!lien} onOpenChange={(o) => !o && setLien(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lien pour {lien?.pour}</DialogTitle>
            <DialogDescription>Valable 24 heures et une seule fois. Envoie-le uniquement à la personne concernée : il ouvre son compte.</DialogDescription>
          </DialogHeader>
          <p className="text-xs break-all rounded-lg bg-muted p-3 font-mono">{lien?.url}</p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigator.clipboard.writeText(message).then(() => toast.success('Message copié'))}>
              <Copy className="w-4 h-4" /> Copier le message
            </Button>
            <Button className="gap-2" asChild>
              <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" /> Envoyer par WhatsApp
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nouveau code d'un compte élève */}
      <Dialog open={!!codeEleve} onOpenChange={(o) => !o && setCodeEleve(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau code pour {codeEleve?.pour}</DialogTitle>
            <DialogDescription>L’ancien code ne marche plus. Envoie celui-ci uniquement à l’élève (ou à son parent).</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-sm">Pseudo : <strong>{codeEleve?.pseudo}</strong></p>
            <p className="text-3xl font-display tracking-[0.3em] mt-1">{codeEleve?.code}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigator.clipboard.writeText(messageCode).then(() => toast.success('Message copié'))}>
              <Copy className="w-4 h-4" /> Copier le message
            </Button>
            <Button className="gap-2" asChild>
              <a href={`https://wa.me/?text=${encodeURIComponent(messageCode)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" /> Envoyer par WhatsApp
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modifier un profil */}
      <Dialog open={!!edition} onOpenChange={(o) => !o && setEdition(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>{identifiantAffiche(edition?.compte.email)}</DialogDescription>
          </DialogHeader>
          {edition && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prénom</Label><Input value={edition.form.first_name} onChange={(e) => setEdition({ ...edition, form: { ...edition.form, first_name: e.target.value } })} /></div>
                <div><Label>Nom</Label><Input value={edition.form.last_name} onChange={(e) => setEdition({ ...edition, form: { ...edition.form, last_name: e.target.value } })} /></div>
              </div>
              <div><Label>Téléphone</Label><Input value={edition.form.phone} onChange={(e) => setEdition({ ...edition, form: { ...edition.form, phone: e.target.value } })} /></div>
              <div><Label>Type de compte</Label><SelectType valeur={edition.form.account_type} onChange={(v) => setEdition({ ...edition, form: { ...edition.form, account_type: v } })} /></div>
              <div><Label>Classes</Label><ChoixClasses valeur={edition.form.classes} onChange={(v) => setEdition({ ...edition, form: { ...edition.form, classes: v } })} /></div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={edition.form.jules_verne} onChange={(e) => setEdition({ ...edition, form: { ...edition.form, jules_verne: e.target.checked } })} />
                Élève ou famille de Jules Verne (vérifié par l’administration)
              </label>
              <div><Label>Note interne (visible des seuls administrateurs)</Label><Input value={edition.form.admin_note} onChange={(e) => setEdition({ ...edition, form: { ...edition.form, admin_note: e.target.value } })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdition(null)}>Annuler</Button>
            <Button onClick={enregistrer} disabled={occupe}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supprimer un compte */}
      <Dialog open={!!suppression} onOpenChange={(o) => !o && setSuppression(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce compte ?</DialogTitle>
            <DialogDescription>
              Le compte et son profil sont effacés définitivement. Pour confirmer, tape {estCompteEleve(suppression?.compte.email) ? 'le pseudo' : 'l’adresse'} : <strong>{identifiantAffiche(suppression?.compte.email)}</strong>
            </DialogDescription>
          </DialogHeader>
          <Input value={suppression?.saisie ?? ''} onChange={(e) => suppression && setSuppression({ ...suppression, saisie: e.target.value })} placeholder={identifiantAffiche(suppression?.compte.email)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuppression(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={supprimer}
              disabled={occupe || suppression?.saisie.trim().toLowerCase() !== identifiantAffiche(suppression?.compte.email).toLowerCase()}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
