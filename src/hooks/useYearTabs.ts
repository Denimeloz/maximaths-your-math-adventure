import { useMemo, useState } from 'react';
import { useAcademicYears, type AcademicYear } from '@/contexts/AcademicYearContext';

interface WithYear {
  academic_year_id?: string | null;
}

/**
 * Répartit des contenus par année scolaire pour les sections de l'accueil.
 * L'année en cours est affichée par défaut ; les années précédentes qui ont
 * du contenu restent accessibles par un sélecteur.
 */
export function useYearTabs<T extends WithYear>(items: T[]) {
  const { years, activeYear } = useAcademicYears();
  const [selected, setSelected] = useState<string | null>(null);

  // Années qui ont au moins un contenu : année en cours d'abord, puis de la plus récente à la plus ancienne
  const yearsWithItems: AcademicYear[] = useMemo(
    () =>
      years
        .filter(y => items.some(item => item.academic_year_id === y.id))
        .sort((a, b) => {
          if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
          return b.start_year - a.start_year;
        }),
    [years, items],
  );

  const currentYearId =
    (selected && yearsWithItems.some(y => y.id === selected) ? selected : null) ??
    (yearsWithItems.find(y => y.id === activeYear?.id) ?? yearsWithItems[0])?.id ??
    null;

  // Les contenus sans année sont montrés avec chaque année
  const visible = useMemo(
    () => (currentYearId ? items.filter(item => !item.academic_year_id || item.academic_year_id === currentYearId) : items),
    [items, currentYearId],
  );

  return { yearsWithItems, currentYearId, setYear: setSelected, visible };
}
