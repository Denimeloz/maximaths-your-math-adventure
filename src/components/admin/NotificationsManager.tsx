import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Bell, CheckCircle2, Monitor, RefreshCw, Send, Smartphone, XCircle } from 'lucide-react';

// Écran de contrôle des notifications (24/10/2026) : appareils abonnés, essais, file d'attente
// et journal des envois, pour savoir tout de suite si un appareil reçoit bien les messages.

interface Abonnement {
  endpoint: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
}

interface Envoi {
  id: number;
  sent_at: string;
  kind: string;
  title: string;
  body: string | null;
  devices: number;
  delivered: number;
  failed: number;
  details: { resultats?: { appareil: string; ok: boolean; code?: number; detail?: string }[] } | null;
}

interface EnAttente {
  id: number;
  title: string;
  level: string | null;
  created_at: string;
}

const appareil = (ua: string | null) => {
  const u = ua ?? '';
  const systeme = /android/i.test(u) ? 'Android' : /iphone|ipad/i.test(u) ? 'iPhone' : /windows/i.test(u) ? 'Windows' : /mac os/i.test(u) ? 'Mac' : 'Autre';
  const navigateur = /edg\//i.test(u) ? 'Edge' : /firefox/i.test(u) ? 'Firefox' : /samsungbrowser/i.test(u) ? 'Samsung Internet' : /chrome/i.test(u) ? 'Chrome' : /safari/i.test(u) ? 'Safari' : '?';
  return { systeme, libelle: `${systeme} · ${navigateur}` };
};

const date = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

const NATURES: Record<string, string> = { test: 'Test', document: 'Document', resume: 'Résumé' };

export const NotificationsManager: React.FC = () => {
  const [abonnes, setAbonnes] = useState<Abonnement[]>([]);
  const [envois, setEnvois] = useState<Envoi[]>([]);
  const [file, setFile] = useState<EnAttente[]>([]);
  const [cetAppareil, setCetAppareil] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [ouvert, setOuvert] = useState<number | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    // Tables et fonction du 24/10, pas encore dans les types générés par Lovable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const [a, e, f] = await Promise.all([
      db.from('push_subscriptions').select('endpoint, user_agent, created_at, last_seen_at').order('last_seen_at', { ascending: false }),
      db.from('push_send_log').select('*').order('sent_at', { ascending: false }).limit(20),
      db.from('pending_notifications').select('id, title, level, created_at').is('sent_at', null).order('created_at'),
    ]);
    setAbonnes(a.data ?? []);
    setEnvois(e.data ?? []);
    setFile(f.data ?? []);
    if (e.error) toast.error('Journal des envois introuvable : la migration du 24/10 est-elle exécutée ?');
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setCetAppareil(sub?.endpoint ?? null);
    } catch {
      setCetAppareil(null);
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const appeler = async (corps: Record<string, unknown>, succes: string) => {
    setOccupe(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notifications', { body: corps });
      if (error) throw error;
      if (data?.erreur) throw new Error(data.erreur);
      const detail = data?.mode === 'test'
        ? `${data.reussis} appareil(s) sur ${data.appareils} ont accepté le message.`
        : data?.raison ?? `${data?.envoye ?? 0} document(s) envoyé(s).`;
      toast.success(succes, { description: detail });
    } catch (e) {
      toast.error('Échec de l’envoi', { description: (e as Error).message });
    } finally {
      setOccupe(false);
      // Le journal est écrit par la fonction : on relit après un court instant
      window.setTimeout(charger, 800);
    }
  };

  const parSysteme = abonnes.reduce<Record<string, number>>((acc, a) => {
    const s = appareil(a.user_agent).systeme;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const estAbonne = !!cetAppareil && abonnes.some((a) => a.endpoint === cetAppareil);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground font-body">
          Chaque publication part tout de suite : une notification par document, un résumé au-delà de 5 en 2 minutes.
        </p>
        <Button variant="outline" size="sm" onClick={charger} disabled={chargement} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${chargement ? 'animate-spin' : ''}`} /> Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Bell className="w-5 h-5" /> Essais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-body">
            Cet appareil :{' '}
            {estAbonne ? (
              <span className="text-green-600 font-semibold">abonné aux notifications</span>
            ) : (
              <span className="text-orange-600 font-semibold">pas abonné (touche la cloche de l’en-tête du site pour l’abonner)</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => appeler({ test: true }, 'Test envoyé à tous les appareils')} disabled={occupe} className="gap-2">
              <Send className="w-4 h-4" /> Tester sur tous les appareils
            </Button>
            <Button variant="outline" onClick={() => appeler({ test: true, endpoint: cetAppareil }, 'Test envoyé à cet appareil')} disabled={occupe || !estAbonne} className="gap-2">
              <Smartphone className="w-4 h-4" /> Tester sur cet appareil
            </Button>
            <Button variant="outline" onClick={() => appeler({}, 'File traitée')} disabled={occupe || file.length === 0} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Envoyer la file maintenant ({file.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Monitor className="w-5 h-5" /> Appareils abonnés : {abonnes.length}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(parSysteme).map(([s, n]) => (
              <span key={s} className="px-3 py-1 rounded-full bg-muted text-sm font-semibold">{s} : {n}</span>
            ))}
            {abonnes.length === 0 && <span className="text-sm text-muted-foreground">Aucun appareil abonné pour l’instant.</span>}
          </div>
          <ul className="divide-y text-sm">
            {abonnes.map((a) => (
              <li key={a.endpoint} className="py-2 flex flex-wrap justify-between gap-2">
                <span className="font-medium">
                  {appareil(a.user_agent).libelle}
                  {a.endpoint === cetAppareil && <span className="ml-2 text-rainbow-purple">(cet appareil)</span>}
                </span>
                <span className="text-muted-foreground">abonné le {date(a.created_at)} · vu le {date(a.last_seen_at)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {file.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">En attente d’envoi : {file.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {file.map((n) => (
                <li key={n.id} className="py-2 flex justify-between gap-2">
                  <span>{n.title}</span>
                  <span className="text-muted-foreground">publié le {date(n.created_at)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Derniers envois</CardTitle>
        </CardHeader>
        <CardContent>
          {envois.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun envoi enregistré.</p>
          ) : (
            <ul className="divide-y text-sm">
              {envois.map((e) => (
                <li key={e.id} className="py-2">
                  <button type="button" className="w-full text-left flex flex-wrap items-center justify-between gap-2" onClick={() => setOuvert(ouvert === e.id ? null : e.id)}>
                    <span className="flex items-center gap-2">
                      {e.failed === 0 && e.devices > 0 ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-orange-600" />}
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-semibold">{NATURES[e.kind] ?? e.kind}</span>
                      <span className="font-medium">{e.body || e.title}</span>
                    </span>
                    <span className="text-muted-foreground">{date(e.sent_at)} · {e.delivered}/{e.devices} reçus par le service</span>
                  </button>
                  {ouvert === e.id && (
                    <ul className="mt-2 ml-6 space-y-1 text-xs">
                      {(e.details?.resultats ?? []).map((r, i) => (
                        <li key={i} className={r.ok ? 'text-green-700' : 'text-orange-700'}>
                          {r.appareil} : {r.ok ? `accepté (${r.code})` : `échec ${r.code ?? ''} ${r.detail ?? ''}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            « Reçus par le service » veut dire que Google (Chrome, Android) ou Microsoft a accepté le message. S’il est accepté mais n’apparaît
            pas sur l’appareil, le blocage vient de l’appareil (notifications du navigateur, économie de batterie).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
