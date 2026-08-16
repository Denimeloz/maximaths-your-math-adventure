import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import ResourceLinks, { ResourceLink } from '@/components/ResourceLinks';
import { ArrowLeft, Users, Download, FileText, Home } from 'lucide-react';

interface ParentResource {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  file_url: string | null;
  file_name: string | null;
  resource_links: ResourceLink[] | null;
}

const ParentResources: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ParentResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('parent_resources')
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-blue/20 rounded-full mb-6">
            <Users className="w-5 h-5 text-rainbow-blue" />
            <span className="text-rainbow-blue font-body font-semibold">Espace familles</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            Ressources pour les <span className="text-rainbow">parents</span>
          </h1>
          <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
            Documents, guides et liens utiles pour accompagner votre enfant tout au long de l'année.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="card-sticker bg-card border-border p-12 text-center max-w-xl mx-auto">
            <Users className="w-20 h-20 mx-auto mb-6 text-rainbow-blue opacity-50" />
            <h2 className="text-2xl font-display text-foreground mb-4">Bientôt disponible !</h2>
            <p className="text-muted-foreground font-body mb-6">
              Les ressources destinées aux parents seront ajoutées prochainement.
            </p>
            <Button onClick={() => navigate('/')} className="btn-3d bg-primary rounded-xl">
              <Home className="w-4 h-4 mr-2" /> Retour à l'accueil
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id}
                className="card-sticker bg-card border-rainbow-blue/30 hover:border-rainbow-blue p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-rainbow-blue" />
                  <span className="text-xs font-body text-muted-foreground capitalize">{item.category || 'Général'}</span>
                </div>
                <h2 className="text-xl font-display text-foreground mb-2">{item.title}</h2>
                {item.description && (
                  <p className="text-muted-foreground font-body text-sm mb-4 flex-1">{item.description}</p>
                )}
                {item.file_url && (
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" download
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rainbow-blue text-white font-body font-semibold hover:opacity-90 transition-opacity shadow-btn hover:shadow-btn-hover">
                    <Download className="w-4 h-4" /> {item.file_name ? 'Télécharger' : 'Télécharger'}
                  </a>
                )}
                <ResourceLinks links={item.resource_links} className="mt-3 pt-3 border-t border-border" />
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

export default ParentResources;
