import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UsersRound, ArrowRight, FileText, Link as LinkIcon } from 'lucide-react';

interface ParentResource {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  file_url: string | null;
  resource_links: any;
}

/** Highlighted "Espace parents" banner, placed high on the homepage so families see it immediately. */
export const ParentResourcesSection: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ParentResource[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('parent_resources')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .limit(3);
      setItems(data || []);
    })();
  }, []);

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="card-sticker bg-card border-rainbow-blue/40 p-6 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-blue/15 rounded-full mb-4">
                <UsersRound className="w-5 h-5 text-rainbow-blue" />
                <span className="text-rainbow-blue font-body font-semibold text-sm">Espace familles</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display text-foreground mb-3">
                Ressources pour les <span className="text-rainbow">parents</span>
              </h2>
              <p className="text-muted-foreground font-body md:text-lg max-w-xl mb-6">
                Tous les documents, guides et liens utiles pour suivre et accompagner votre enfant, réunis au même endroit.
              </p>
              <Button
                onClick={() => navigate('/ressources-parents')}
                className="btn-3d bg-primary rounded-xl text-base px-6 py-6"
              >
                Accéder à l'espace parents
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {items.length > 0 && (
              <div className="lg:w-80 space-y-3">
                <p className="text-xs font-body uppercase tracking-wide text-muted-foreground">
                  Dernières ressources
                </p>
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate('/ressources-parents')}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    {item.file_url ? (
                      <FileText className="w-5 h-5 text-rainbow-blue mt-0.5 shrink-0" />
                    ) : (
                      <LinkIcon className="w-5 h-5 text-rainbow-purple mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-body font-semibold text-sm text-foreground truncate">{item.title}</p>
                      {item.category && (
                        <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParentResourcesSection;
