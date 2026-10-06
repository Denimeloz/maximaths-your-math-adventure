import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

export const move = async (table: string, list: { id: string }[], index: number, dir: -1 | 1, refresh: () => void) => {
  const target = index + dir;
  if (target < 0 || target >= list.length) return;
  const reordered = [...list];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await Promise.all(reordered.map((item, i) => (supabase as any).from(table).update({ display_order: i }).eq('id', item.id)));
  refresh();
};

export const MoveButtons: React.FC<{ index: number; total: number; onMove: (d: -1 | 1) => void; horizontal?: boolean }> = ({ index, total, onMove, horizontal }) => {
  const Prev = horizontal ? ChevronLeft : ChevronUp;
  const Next = horizontal ? ChevronRight : ChevronDown;
  return (
    <div className="flex items-center">
      <Button variant="ghost" size="icon" className="h-7 w-7" title="Monter" disabled={index === 0} onClick={() => onMove(-1)}><Prev className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" title="Descendre" disabled={index === total - 1} onClick={() => onMove(1)}><Next className="w-4 h-4" /></Button>
    </div>
  );
};

export const PublishToggle: React.FC<{ table: string; id: string; published?: boolean | null; onDone: () => void }> = ({ table, id, published, onDone }) => {
  const isPub = published !== false;
  return (
    <button type="button" title={isPub ? 'Publié — cliquer pour masquer' : 'Masqué — cliquer pour publier'}
      className="p-1.5 rounded hover:bg-muted"
      onClick={async () => { await (supabase as any).from(table).update({ is_published: !isPub }).eq('id', id); onDone(); }}>
      {isPub ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
};
