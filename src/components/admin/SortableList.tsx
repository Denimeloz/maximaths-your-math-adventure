import React from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

type Layout = 'vertical' | 'horizontal' | 'grid';

interface SortableListProps<T> {
  items: T[];
  /** Identifiant unique d'un élément (par défaut : son champ `id`) */
  getId?: (item: T) => string;
  /** Nom lu par les lecteurs d'écran sur la poignée : « Déplacer … » */
  getLabel: (item: T) => string;
  /** Appelé avec la liste dans son nouvel ordre, dès que l'élément est déposé */
  onReorder: (items: T[]) => void;
  /** `vertical` : liste ; `grid` : cartes ou étiquettes sur plusieurs lignes ; `horizontal` : une seule ligne */
  layout?: Layout;
  className?: string;
  itemClassName?: string | ((item: T) => string);
  /** Affiche l'élément ; `handle` est la poignée à placer où l'on veut */
  children: (item: T, handle: React.ReactNode, index: number) => React.ReactNode;
}

const STRATEGIES = {
  vertical: verticalListSortingStrategy,
  horizontal: horizontalListSortingStrategy,
  grid: rectSortingStrategy,
};

interface RowProps {
  id: string;
  label: string;
  className?: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}

const SortableRow = ({ id, label, className, children }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
      aria-label={`Déplacer « ${label} »`}
      title="Glisser pour déplacer"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${className || ''} ${isDragging ? 'relative z-10 opacity-90 shadow-xl rounded-lg' : ''}`}
    >
      {children(handle)}
    </div>
  );
};

/**
 * Liste réordonnable par glisser-déposer (souris, doigt ou clavier), utilisée dans tout l'admin.
 * Elle ne fait que donner le nouvel ordre : l'enregistrement reste à la charge de l'appelant.
 */
export function SortableList<T>({
  items,
  getId = (item: T) => (item as unknown as { id: string }).id,
  getLabel,
  onReorder,
  layout = 'vertical',
  className,
  itemClassName,
  children,
}: SortableListProps<T>) {
  // Un petit déplacement est exigé avant de « prendre » l'élément, pour ne pas gêner les clics
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map(getId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={STRATEGIES[layout]}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableRow
              key={getId(item)}
              id={getId(item)}
              label={getLabel(item)}
              className={typeof itemClassName === 'function' ? itemClassName(item) : itemClassName}
            >
              {(handle) => children(item, handle, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default SortableList;
