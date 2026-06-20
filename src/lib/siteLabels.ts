import { supabase } from '@/integrations/supabase/client';

export type LabelMap = Record<string, string>;

export async function fetchSiteLabels(academicYearId?: string | null): Promise<LabelMap> {
  try {
    if (academicYearId) {
      const { data } = await supabase.from('site_labels').select('key,label').eq('academic_year_id', academicYearId);
      if (data && data.length) {
        const map: LabelMap = {};
        data.forEach((r: any) => { map[r.key] = r.label; });
        return map;
      }
    }

    // fallback to global labels (academic_year_id IS NULL)
    const { data: defaults } = await supabase.from('site_labels').select('key,label').is('academic_year_id', null);
    const map: LabelMap = {};
    (defaults || []).forEach((r: any) => { map[r.key] = r.label; });
    return map;
  } catch (e) {
    console.error('fetchSiteLabels error', e);
    return {};
  }
}
