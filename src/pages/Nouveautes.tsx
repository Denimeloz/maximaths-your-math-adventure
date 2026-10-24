import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NotificationButton from '@/components/NotificationButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, ChevronRight, Sparkles } from 'lucide-react';
import {
  chargerNouveautes,
  classe,
  estNouvelle,
  JOURS_NOUVEAUTES,
  lien,
  marquerCommeVues,
  type Nouveaute,
  quand,
  rubrique,
} from '@/lib/nouveautes';

// Regroupe les nouveautés par jour : « Aujourd'hui », « Hier », puis la date
const jour = (date: string) => {
  const d = new Date(date);
  const aujourdhui = new Date();
  const hier = new Date();
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === aujourdhui.toDateString()) return 'Aujourd’hui';
  if (d.toDateString() === hier.toDateString()) return 'Hier';
  const texte = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
};

// « Quoi de neuf » : tout ce qui a été publié ces 7 derniers jours, même sans notifications
const Nouveautes: React.FC = () => {
  const navigate = useNavigate();
  const [liste, setListe] = useState<Nouveaute[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [vu, setVu] = useState(0);

  useEffect(() => {
    setVu(marquerCommeVues());
    chargerNouveautes()
      .then(setListe)
      .catch(() => setErreur(true))
      .finally(() => setChargement(false));
  }, []);

  const parJour = liste.reduce<{ jour: string; elements: Nouveaute[] }[]>((groupes, n) => {
    const j = jour(n.created_at);
    const groupe = groupes.find((g) => g.jour === j);
    if (groupe) groupe.elements.push(n);
    else groupes.push({ jour: j, elements: [n] });
    return groupes;
  }, []);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 py-12 pt-24 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-pink/20 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-rainbow-pink" />
            <span className="text-rainbow-pink font-body font-semibold">Quoi de neuf ?</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            Les <span className="text-rainbow">nouveautés</span>
          </h1>
          <p className="text-muted-foreground font-body">
            Tous les documents publiés ces {JOURS_NOUVEAUTES} derniers jours, du plus récent au plus ancien.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-card border p-4 mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-rainbow-blue shrink-0" />
            <p className="text-sm font-body">Pour être prévenu à chaque nouveau document, active les notifications avec la cloche.</p>
          </div>
          <NotificationButton className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-muted hover:bg-rainbow-blue/20 transition-colors disabled:opacity-50" />
        </div>

        {chargement ? (
          <p className="text-center text-muted-foreground">Chargement…</p>
        ) : erreur ? (
          <p className="text-center text-muted-foreground">Impossible de charger les nouveautés pour le moment.</p>
        ) : liste.length === 0 ? (
          <p className="text-center text-muted-foreground">Rien de nouveau ces {JOURS_NOUVEAUTES} derniers jours.</p>
        ) : (
          <div className="space-y-8">
            {parJour.map((groupe) => (
              <section key={groupe.jour}>
                <h2 className="font-display text-lg text-foreground mb-3">{groupe.jour}</h2>
                <ul className="space-y-2">
                  {groupe.elements.map((n) => {
                    const nouvelle = estNouvelle(n, vu);
                    const niveau = classe(n);
                    return (
                      <li key={n.id}>
                        <Link
                          to={lien(n)}
                          className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-rainbow-blue/10 ${nouvelle ? 'bg-rainbow-pink/10 border-rainbow-pink/40' : 'bg-card'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-body mb-1">
                              <span className="px-2 py-0.5 rounded-full bg-rainbow-blue/15 text-rainbow-blue font-semibold">{rubrique(n)}</span>
                              {niveau && <span className="px-2 py-0.5 rounded-full bg-rainbow-purple/15 text-rainbow-purple font-semibold">{niveau}</span>}
                              {nouvelle && <span className="px-2 py-0.5 rounded-full bg-rainbow-pink text-white font-semibold">Nouveau</span>}
                              <span className="text-muted-foreground">{quand(n.created_at)}</span>
                            </div>
                            <p className="font-body font-semibold text-foreground truncate">{n.title}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Nouveautes;
