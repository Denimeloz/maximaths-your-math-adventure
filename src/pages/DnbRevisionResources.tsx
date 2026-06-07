import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GraduationCap, Download, FileText, Star, Link as LinkIcon } from 'lucide-react';

interface ResourceLink { title: string; url: string }

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  resource_links: ResourceLink[] | null;
}

const DnbRevisionResources: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('dnb_revision_resources')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 py-12 pt-24">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-coral/20 rounded-full mb-6">
            <GraduationCap className="w-5 h-5 text-rainbow-coral" />
            <span className="text-rainbow-coral font-body font-semibold">Spécial 3ème • Brevet</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            Ressources pour la <span className="text-rainbow">révision au DNB</span>
          </h1>
          <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
            Téléchargez les fiches, annales et supports pour réviser sereinement le Diplôme National du Brevet.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="card-sticker bg-card border-border p-12 text-center max-w-xl mx-auto">
            <GraduationCap className="w-20 h-20 mx-auto mb-6 text-rainbow-coral opacity-50" />
            <h2 className="text-2xl font-display text-foreground mb-4">Bientôt disponible !</h2>
            <p className="text-muted-foreground font-body mb-6">
              Les ressources de révision pour le DNB seront ajoutées prochainement.
            </p>
            <Button onClick={() => navigate('/')} className="btn-3d bg-primary rounded-xl">
              <Star className="w-4 h-4 mr-2" /> Retour à l'accueil
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id}
                className="card-sticker bg-card border-rainbow-coral/30 hover:border-rainbow-coral p-6 group flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-rainbow-coral" />
                  <span className="text-xs font-body text-muted-foreground">Révision DNB</span>
                </div>
                <h3 className="text-xl font-display text-foreground mb-2">{item.title}</h3>
                {item.description && (
                  <p className="text-muted-foreground font-body text-sm mb-4 flex-1">{item.description}</p>
                )}
                {item.file_url ? (
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" download
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rainbow-coral text-white font-body font-semibold hover:bg-rainbow-coral/90 transition-colors shadow-btn hover:shadow-btn-hover">
                    <Download className="w-4 h-4" /> Télécharger
                  </a>
                ) : null}
                {Array.isArray(item.resource_links) && item.resource_links.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {item.resource_links.map((link, idx) => (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-rainbow-purple hover:underline">
                        <LinkIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{link.title || link.url}</span>
                      </a>
                    ))}
                  </div>
                )}
                {!item.file_url && (!Array.isArray(item.resource_links) || item.resource_links.length === 0) && (
                  <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm">
                    <FileText className="w-4 h-4" /> Aucune ressource
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DnbRevisionResources;
