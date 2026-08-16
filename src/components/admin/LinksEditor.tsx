import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Link as LinkIcon } from 'lucide-react';

export interface ResourceLink { title: string; url: string }

interface Props {
  value: ResourceLink[];
  onChange: (links: ResourceLink[]) => void;
  label?: string;
}

/** Reusable editor for a list of external links (title + url). */
export const LinksEditor: React.FC<Props> = ({ value, onChange, label = 'Liens externes (site, Padlet, vidéo...)' }) => {
  const links = Array.isArray(value) ? value : [];

  const update = (idx: number, patch: Partial<ResourceLink>) => {
    const next = links.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    onChange(next);
  };

  return (
    <div>
      <Label className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> {label}</Label>
      <div className="mt-2 space-y-2">
        {links.map((link, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={link.title || ''}
              onChange={(e) => update(idx, { title: e.target.value })}
              placeholder="Titre du lien"
              className="rounded-xl flex-1"
            />
            <Input
              value={link.url || ''}
              onChange={(e) => update(idx, { url: e.target.value })}
              placeholder="https://..."
              className="rounded-xl flex-1"
            />
            <Button type="button" variant="ghost" size="icon"
              onClick={() => onChange(links.filter((_, i) => i !== idx))}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="rounded-xl"
          onClick={() => onChange([...links, { title: '', url: '' }])}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter un lien
        </Button>
      </div>
    </div>
  );
};

export default LinksEditor;
