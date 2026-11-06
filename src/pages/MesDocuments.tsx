import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  listerDocuments,
  retirerDocument,
  rouvrirDocument,
  tailleDocument,
  type DocumentGarde,
} from '@/lib/documentsHorsLigne';
import { estNatif } from '@/lib/natif';

// Application iPhone : les documents déjà ouverts, disponibles sans connexion.

const enMo = (octets: number) => `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;

const MesDocuments: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentGarde[]>([]);
  const [tailles, setTailles] = useState<Record<string, number>>({});
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!estNatif()) return;
    let actif = true;
    (async () => {
      const liste = await listerDocuments();
      const valeurs = await Promise.all(liste.map(async (d) => [d.url, await tailleDocument(d)] as const));
      if (!actif) return;
      setDocuments(liste);
      setTailles(Object.fromEntries(valeurs));
      setChargement(false);
    })();
    return () => {
      actif = false;
    };
  }, []);

  if (!estNatif()) return <Navigate to="/" replace />;

  const retirer = async (document: DocumentGarde) => {
    await retirerDocument(document);
    setDocuments((liste) => liste.filter((d) => d.url !== document.url));
    toast.success('Document retiré de ce téléphone');
  };

  const total = documents.reduce((somme, d) => somme + (tailles[d.url] ?? 0), 0);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 py-12 pt-24 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>

        <h1 className="text-3xl font-display text-foreground mb-2">Mes documents</h1>
        <p className="font-body text-muted-foreground mb-8">
          Chaque document que tu ouvres reste sur ce téléphone : tu peux le relire sans connexion.
          {documents.length > 0 && ` Espace utilisé : ${enMo(total)}.`}
        </p>

        {!chargement && documents.length === 0 && (
          <p className="card-cartoon bg-card border-border p-6 text-center font-body">
            Aucun document pour l’instant. Ouvre un cours ou une fiche : il apparaîtra ici.
          </p>
        )}

        <ul className="space-y-3">
          {documents.map((document) => (
            <li key={document.url} className="card-cartoon bg-card border-border p-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => rouvrirDocument(document)}
                className="flex-1 min-w-0 min-h-11 flex items-center gap-3 text-left rounded-xl"
              >
                <FileText className="w-5 h-5 shrink-0 text-rainbow-blue" />
                <span className="min-w-0">
                  <span className="block font-body font-semibold truncate">{document.nom}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(document.date).toLocaleDateString('fr-FR')} · {enMo(tailles[document.url] ?? 0)}
                  </span>
                </span>
              </button>
              <Button variant="ghost" size="icon" onClick={() => retirer(document)} aria-label={`Retirer ${document.nom} de ce téléphone`}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
};

export default MesDocuments;
