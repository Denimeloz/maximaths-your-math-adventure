import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Zap, Search } from 'lucide-react';

const LEVELS = [
  { id: '6eme', label: '6ème' }, { id: '5eme', label: '5ème' },
  { id: '4eme', label: '4ème' }, { id: '3eme', label: '3ème' },
  { id: 'seconde', label: 'Seconde' }, { id: 'premiere', label: 'Première' },
  { id: 'terminale', label: 'Terminale' },
];

interface Item {
  id: string; title: string; chapter: string | null; level: string;
  canva_embed_url: string; thumbnail_url: string | null; description: string | null; created_at: string;
}

const Automatismes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [items, setItems] = useState<Item[]>([]);
  const [activeLevel, setActiveLevel] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Item | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('automatisms').select('*').order('created_at', { ascending: false });
      setItems(data || []);
      if (id) setDetail((data || []).find((d: Item) => d.id === id) || null);
    })();
  }, [id]);

  if (detail) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <Button variant="outline" onClick={() => { setDetail(null); navigate('/automatismes'); }} className="mb-4 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-3xl font-display mb-2 flex items-center gap-2">
            <Zap className="w-7 h-7 text-rainbow-yellow" /> {detail.title}
          </h1>
          <p className="text-muted-foreground mb-4">
            {LEVELS.find(l => l.id === detail.level)?.label}{detail.chapter && ` • ${detail.chapter}`}
          </p>
          {detail.description && <p className="mb-4">{detail.description}</p>}
          <div className="w-full aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden border-2 border-rainbow-yellow/30 shadow-xl">
            <iframe src={detail.canva_embed_url} className="w-full h-full" allowFullScreen allow="fullscreen" loading="lazy" title={detail.title} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const filtered = items.filter(i =>
    (activeLevel === 'all' || i.level === activeLevel) &&
    (search === '' || i.title.toLowerCase().includes(search.toLowerCase()) || (i.chapter || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display mb-2 flex items-center justify-center gap-2">
            <Zap className="w-8 h-8 text-rainbow-yellow" /> Automatismes
          </h1>
          <p className="text-muted-foreground">Fiches d'entraînement quotidien — 5 questions + correction</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6 items-center justify-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10 rounded-xl" />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button size="sm" variant={activeLevel === 'all' ? 'default' : 'outline'} onClick={() => setActiveLevel('all')} className="rounded-xl">Tous</Button>
            {LEVELS.map(l => (
              <Button key={l.id} size="sm" variant={activeLevel === l.id ? 'default' : 'outline'} onClick={() => setActiveLevel(l.id)} className="rounded-xl">{l.label}</Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aucune fiche disponible.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <Card key={item.id} onClick={() => navigate(`/automatismes/${item.id}`)} className="cursor-pointer hover:scale-[1.02] transition-transform border-2 hover:border-rainbow-yellow overflow-hidden">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-rainbow-yellow/20 to-rainbow-orange/20 flex items-center justify-center">
                    <Zap className="w-12 h-12 text-rainbow-yellow" />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-display text-lg mb-1 line-clamp-1">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-rainbow-blue/20 text-rainbow-blue font-semibold">{LEVELS.find(l => l.id === item.level)?.label}</span>
                    {item.chapter && <span className="text-muted-foreground">{item.chapter}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(item.created_at).toLocaleDateString('fr-FR')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Automatismes;
