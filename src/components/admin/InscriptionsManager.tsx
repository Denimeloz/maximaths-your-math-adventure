import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, MessageCircle, Plus, Power, QrCode, RefreshCw } from 'lucide-react';
import { LEVEL_IDS, LEVEL_LABELS, levelLabel } from '@/lib/levels';

// Inscription par classe (28/10/2026) : un lien (et son QR code) par classe, avec une date limite et un
// nombre de places. Le professeur projette le QR en classe ou poste le lien dans le groupe WhatsApp ;
// chaque élève crée son compte (pseudo + code) déjà rangé dans la bonne classe, sans e-mail.
// La table signup_links n'est lisible que par les administrateurs (règles de sécurité de Supabase).

interface LienInscription {
  id: string;
  code: string;
  label: string;
  classe: string;
  account_type: 'eleve' | 'parent';
  jules_verne: boolean;
  expires_at: string;
  max_uses: number;
  uses: number;
  active: boolean;
  created_at: string;
}

const DUREES: { label: string; heures: number }[] = [
  { label: '1 heure (en classe)', heures: 1 },
  { label: '1 jour', heures: 24 },
  { label: '1 semaine', heures: 24 * 7 },
  { label: '1 mois', heures: 24 * 30 },
];

// Sans 0/O ni 1/I/l : le code reste lisible s'il faut le recopier à la main
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const nouveauCode = () => Array.from(crypto.getRandomValues(new Uint32Array(10)), (n) => ALPHABET[n % ALPHABET.length]).join('');

const url = (code: string) => `${window.location.origin}/rejoindre/${code}`;

const etat = (l: LienInscription) => {
  if (!l.active) return { texte: 'Désactivé', classe: 'bg-muted text-muted-foreground' };
  if (new Date(l.expires_at) <= new Date()) return { texte: 'Expiré', classe: 'bg-muted text-muted-foreground' };
  if (l.uses >= l.max_uses) return { texte: 'Complet', classe: 'bg-yellow-100 text-yellow-800' };
  return { texte: 'Ouvert', classe: 'bg-green-100 text-green-700' };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as any).from('signup_links');

export const InscriptionsManager: React.FC = () => {
  const [liens, setLiens] = useState<LienInscription[]>([]);
  const [creation, setCreation] = useState<{ label: string; classe: string; account_type: 'eleve' | 'parent'; jules_verne: boolean; heures: number; max_uses: number } | null>(null);
  const [qr, setQr] = useState<LienInscription | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    const { data, error } = await table().select('*').order('created_at', { ascending: false }).limit(50);
    if (error) return toast.error('Liens d’inscription indisponibles', { description: error.message });
    setLiens(data ?? []);
    setQr((ouvert) => (ouvert ? (data ?? []).find((l: LienInscription) => l.id === ouvert.id) ?? ouvert : null));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // QR projeté en classe : le compteur d'inscrits se met à jour tout seul
  useEffect(() => {
    if (!qr) return;
    const minuterie = setInterval(charger, 5000);
    return () => clearInterval(minuterie);
  }, [qr, charger]);

  const creer = async () => {
    if (!creation) return;
    setOccupe(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await table().insert({
      code: nouveauCode(),
      label: creation.label.trim(),
      classe: creation.classe,
      account_type: creation.account_type,
      jules_verne: creation.jules_verne,
      expires_at: new Date(Date.now() + creation.heures * 3600 * 1000).toISOString(),
      max_uses: Math.max(1, Math.min(500, creation.max_uses)),
      created_by: user?.id ?? null,
    }).select().single();
    setOccupe(false);
    if (error) return toast.error('Création impossible', { description: error.message });
    setCreation(null);
    await charger();
    setQr(data);
  };

  const basculer = async (l: LienInscription) => {
    const { error } = await table().update({ active: !l.active }).eq('id', l.id);
    if (error) return toast.error('Modification impossible', { description: error.message });
    toast.success(l.active ? 'Lien désactivé' : 'Lien réactivé');
    charger();
  };

  const message = (l: LienInscription) =>
    `Inscris-toi sur MAXIMATHS (${levelLabel(l.classe)}${l.label ? `, ${l.label}` : ''}) : ouvre ce lien, écris ton prénom et ton nom, et note ton pseudo et ton code. ${url(l.code)}`;

  return (
    <section className="card-cartoon bg-card border-border p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-display text-foreground flex items-center gap-2"><QrCode className="w-5 h-5 text-rainbow-purple" /> Inscriptions par classe</h3>
          <p className="text-sm text-muted-foreground font-body">
            Un QR code à projeter en classe ou un lien à poster dans le groupe WhatsApp : chaque élève crée son compte (pseudo et code, sans e-mail), déjà rangé dans la bonne classe.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={charger} className="gap-2"><RefreshCw className="w-4 h-4" /> Actualiser</Button>
          <Button size="sm" className="gap-2" onClick={() => setCreation({ label: '', classe: '3eme', account_type: 'eleve', jules_verne: true, heures: 1, max_uses: 40 })}>
            <Plus className="w-4 h-4" /> Nouveau lien
          </Button>
        </div>
      </div>

      {liens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun lien pour l’instant.</p>
      ) : (
        <div className="space-y-2">
          {liens.map((l) => {
            const e = etat(l);
            return (
              <div key={l.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display">{levelLabel(l.classe)}{l.label ? ` · ${l.label}` : ''}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.classe}`}>{e.texte}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-rainbow-blue/10 text-rainbow-blue font-semibold">{l.account_type === 'parent' ? 'Parents' : 'Élèves'}</span>
                    {l.jules_verne && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-semibold">Jules Verne</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {l.uses} / {l.max_uses} inscrit{l.uses > 1 ? 's' : ''} · jusqu’au {new Date(l.expires_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setQr(l)}><QrCode className="w-4 h-4" /> QR code</Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => navigator.clipboard.writeText(message(l)).then(() => toast.success('Message copié'))}><Copy className="w-4 h-4" /> Copier</Button>
                  <Button variant="outline" size="sm" className="gap-1" asChild>
                    <a href={`https://wa.me/?text=${encodeURIComponent(message(l))}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => basculer(l)}><Power className="w-4 h-4" /> {l.active ? 'Désactiver' : 'Réactiver'}</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nouveau lien */}
      <Dialog open={!!creation} onOpenChange={(o) => !o && setCreation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau lien d’inscription</DialogTitle>
            <DialogDescription>Pour une séance en classe, une heure suffit : le lien ne pourra plus servir ensuite.</DialogDescription>
          </DialogHeader>
          {creation && (
            <div className="grid gap-3">
              <div><Label>Nom du groupe (facultatif)</Label><Input value={creation.label} onChange={(e) => setCreation({ ...creation, label: e.target.value })} placeholder="3e B, groupe du mercredi…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Classe</Label>
                  <select value={creation.classe} onChange={(e) => setCreation({ ...creation, classe: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {LEVEL_IDS.map((id) => <option key={id} value={id}>{LEVEL_LABELS[id]}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Comptes</Label>
                  <select value={creation.account_type} onChange={(e) => setCreation({ ...creation, account_type: e.target.value as 'eleve' | 'parent' })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="eleve">Élèves</option>
                    <option value="parent">Parents</option>
                  </select>
                </div>
                <div>
                  <Label>Valable</Label>
                  <select value={creation.heures} onChange={(e) => setCreation({ ...creation, heures: Number(e.target.value) })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {DUREES.map((d) => <option key={d.heures} value={d.heures}>{d.label}</option>)}
                  </select>
                </div>
                <div><Label>Nombre de places</Label><Input type="number" min={1} max={500} value={creation.max_uses} onChange={(e) => setCreation({ ...creation, max_uses: Number(e.target.value) || 1 })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={creation.jules_verne} onChange={(e) => setCreation({ ...creation, jules_verne: e.target.checked })} />
                Élèves ou familles de Jules Verne
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreation(null)}>Annuler</Button>
            <Button onClick={creer} disabled={occupe}>Créer et afficher le QR code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR code à projeter */}
      <Dialog open={!!qr} onOpenChange={(o) => !o && setQr(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Inscris-toi sur MAXIMATHS{qr ? ` · ${levelLabel(qr.classe)}${qr.label ? ` ${qr.label}` : ''}` : ''}
            </DialogTitle>
            <DialogDescription className="text-center">Scanne avec l’appareil photo de ton téléphone, puis écris ton prénom et ton nom.</DialogDescription>
          </DialogHeader>
          {qr && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-2xl">
                <QRCodeSVG value={url(qr.code)} size={320} level="M" />
              </div>
              <p className="font-mono text-sm break-all text-center">{url(qr.code)}</p>
              <p className="font-display text-xl">{qr.uses} / {qr.max_uses} inscrit{qr.uses > 1 ? 's' : ''}</p>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${etat(qr).classe}`}>{etat(qr).texte}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
