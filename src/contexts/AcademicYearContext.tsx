import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AcademicYear {
  id: string;
  label: string;
  start_year: number;
  end_year: number;
  is_active: boolean;
  display_order: number;
}

export interface YearClass {
  id: string;
  academic_year_id: string;
  class_level: string;
  display_order: number;
}

interface Ctx {
  years: AcademicYear[];
  classes: YearClass[];
  loading: boolean;
  refresh: () => Promise<void>;
  selectedYearId: string | null;
  setSelectedYearId: (id: string | null) => void;
  activeYear: AcademicYear | null;
}

const AcademicYearContext = createContext<Ctx | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<YearClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: y }, { data: c }] = await Promise.all([
      supabase.from('academic_years' as any).select('*').order('display_order', { ascending: true }),
      supabase.from('year_classes' as any).select('*').order('display_order', { ascending: true }),
    ]);
    setYears((y || []) as any);
    setClasses((c || []) as any);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const activeYear = years.find(y => y.is_active) || years[0] || null;

  // Default selection to active year
  useEffect(() => {
    if (!selectedYearId && activeYear) setSelectedYearId(activeYear.id);
  }, [activeYear, selectedYearId]);

  return (
    <AcademicYearContext.Provider value={{ years, classes, loading, refresh, selectedYearId, setSelectedYearId, activeYear }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYears = () => {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) throw new Error('useAcademicYears must be used within AcademicYearProvider');
  return ctx;
};

/** Hook used by admin managers to know the currently selected academic year. */
export const useCurrentAcademicYearId = (): string | null => {
  const ctx = useContext(AcademicYearContext);
  return ctx?.selectedYearId ?? null;
};
