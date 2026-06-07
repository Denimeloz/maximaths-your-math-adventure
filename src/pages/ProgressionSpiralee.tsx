import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Spline, FileText, Link as LinkIcon, Video, Dumbbell, Download, Search } from 'lucide-react';

type Level = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

const LEVELS: { id: Level | 'all'; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: '6eme', label: '6ème' },
  { id: '5eme', label: '5ème' },
  { id: '4eme', label: '4ème' },
  { id: '3eme', label: '3ème' },
  { id: 'seconde', label: 'Seconde' },
  { id: 'premiere', label: 'Première' },
  { id: 'terminale', label: 'Terminale' },
];

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  fiche: { label: 'Fiche', icon: FileText, color: 'text-rainbow-blue' },
  lien: { label: 'Lien', icon: LinkIcon, color: 'text-rainbow-purple' },
  exercice: { label: 'Exercice', icon: Dumbbell, color: 'text-rainbow-orange' },
  video: { label: 'Vidéo', icon: Video, color: 'text-rainbow-coral' },
  ressource: { label: 'Ressource', icon: Download, color: 'text-rainbow-green' },
};

interface Resource {
  id: string;
  level: Level;
  resource_type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  external_url: string | null;
}

const ProgressionSpiralee: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLevel = (searchParams.get('niveau') as Level | null) || 'all';
  const [activeLevel, setActiveLevel] = useState<Level | 'all'>(initialLevel);
  const [items, setItems] = useState<Resource[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('spiral_resources')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (activeLevel !== 'all') list = list.filter(i => i.level === activeLevel);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, activeLevel, query]);

  const handleLevelChange = (lvl: Level | 'all') => {
    setActiveLevel(lvl);
    if (lvl === 'all') setSearchParams({});
    else setSearchParams({ niveau: lvl });
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      <main className="container mx-auto px-4 py-12 pt-24">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-purple/20 rounded-full mb-6">
            <Spline className="w-5 h-5 text-rainbow-purple" />
            <span className="text-rainbow-purple font-body font-semibold">Du collège au lycée</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            Progression <span className="text-rainbow-purple">Spiralée</span>
          </h1>
          <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
            Retrouve les fiches, exercices, vidéos et ressources essentielles à travailler tout au long de l'année selon ta classe.
          </p>
        </div>

        {/* Filters */}
        <div className="max-w-5xl mx-auto mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une ressource..."
              className="pl-10 rounded-xl"
            />
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {LEVELS.map(l => (
              <Button
                key={l.id}
                size="sm"
                variant={activeLevel === l.id ? 'default' : 'outline'}
                onClick={() => handleLevelChange(l.id)}
                className="rounded-xl"
              >
                {l.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-sticker bg-card border-border p-12 text-center max-w-xl mx-auto">
            <Spline className="w-20 h-20 mx-auto mb-6 text-rainbow-purple opacity-50" />
            <h2 className="text-2xl font-display text-foreground mb-4">Aucune ressource</h2>
            <p className="text-muted-foreground font-body">
              Aucune ressource disponible pour cette recherche.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filtered.map(item => {
              const meta = TYPE_META[item.resource_type] || TYPE_META.fiche;
              const Icon = meta.icon;
              const levelLabel = LEVELS.find(l => l.id === item.level)?.label || item.level;
              return (
                <div key={item.id}
                  className="card-sticker bg-card border-rainbow-purple/30 hover:border-rainbow-purple p-6 group flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-body font-semibold ${meta.color}`}>
                      <Icon className="w-4 h-4" /> {meta.label}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-rainbow-purple/10 text-rainbow-purple font-body">
                      {levelLabel}
                    </span>
                  </div>
                  <h3 className="text-xl font-display text-foreground mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-muted-foreground font-body text-sm mb-4 flex-1">{item.description}</p>
                  )}
                  <div className="mt-auto flex flex-col gap-2">
                    {item.file_url && (
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer" download
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-body font-semibold hover:bg-primary/90 transition-colors">
                        <Download className="w-4 h-4" /> Télécharger
                      </a>
                    )}
                    {item.external_url && (
                      <a href={item.external_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-body font-semibold hover:bg-secondary/80 transition-colors">
                        <LinkIcon className="w-4 h-4" /> Ouvrir le lien
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProgressionSpiralee;
