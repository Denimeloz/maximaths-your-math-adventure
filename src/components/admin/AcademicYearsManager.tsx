import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, CalendarRange, GraduationCap, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAcademicYears } from '@/contexts/AcademicYearContext';

const ALL_LEVELS = [
  { id: '6eme', label: '6ème' },
  { id: '5eme', label: '5ème' },
  { id: '4eme', label: '4ème' },
  { id: '3eme', label: '3ème' },
  { id: 'seconde', label: 'Seconde' },
  { id: 'premiere', label: 'Première' },
  { id: 'terminale', label: 'Terminale' },
];

const levelLabel = (id: string) => ALL_LEVELS.find(l => l.id === id)?.label || id;

export const AcademicYearsManager: React.FC = () => {
  const { years, classes, refresh } = useAcademicYears();
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [isCreating, setIsCreating] = useState(false);
  const [newLevels, setNewLevels] = useState<Record<string, string>>({});

  const createYear = async () => {
    const label = `${startYear}-${startYear + 1}`;
    if (years.find(y => y.label === label)) {
      toast.error(`L'année ${label} existe déjà.`);
      return;
    }
    setIsCreating(true);
    const { error } = await supabase.from('academic_years' as any).insert({
      label, start_year: startYear, end_year: startYear + 1, is_active: false,
      display_order: years.length,
    });
    setIsCreating(false);
    if (error) toast.error(error.message);
    else { toast.success(`Année ${label} créée.`); refresh(); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    if (!current) {
      // Deactivate all others
      await supabase.from('academic_years' as any).update({ is_active: false }).neq('id', id);
    }
    await supabase.from('academic_years' as any).update({ is_active: !current }).eq('id', id);
    refresh();
  };

  const deleteYear = async (id: string, label: string) => {
    if (!confirm(`Supprimer l'année ${label} et ses classes ? Les contenus existants seront détachés.`)) return;
    const { error } = await supabase.from('academic_years' as any).delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Année supprimée.'); refresh(); }
  };

  const addClass = async (yearId: string) => {
    const lvl = newLevels[yearId];
    if (!lvl) { toast.error('Choisissez un niveau.'); return; }
    const exists = classes.find(c => c.academic_year_id === yearId && c.class_level === lvl);
    if (exists) { toast.error('Cette classe est déjà ouverte pour cette année.'); return; }
    const order = classes.filter(c => c.academic_year_id === yearId).length;
    const { error } = await supabase.from('year_classes' as any).insert({
      academic_year_id: yearId, class_level: lvl, display_order: order,
    });
    if (error) toast.error(error.message);
    else { setNewLevels(p => ({ ...p, [yearId]: '' })); refresh(); }
  };

  const removeClass = async (classId: string, label: string) => {
    if (!confirm(`Retirer ${label} de cette année ? Les contenus existants ne sont pas supprimés mais ne seront plus accessibles via cette classe.`)) return;
    const { error } = await supabase.from('year_classes' as any).delete().eq('id', classId);
    if (error) toast.error(error.message);
    else refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
          <CalendarRange className="w-6 h-6 text-rainbow-purple" />
          Années scolaires
        </h2>
        <p className="text-muted-foreground font-body mt-1">
          Créez une nouvelle année scolaire, puis ajoutez les classes ouvertes pour cette année.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Nouvelle année</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Année de début</Label>
            <Input
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value || '0', 10))}
              className="w-32"
            />
          </div>
          <div className="text-sm text-muted-foreground pb-2">
            → Sera enregistrée comme <strong>{startYear}-{startYear + 1}</strong>
          </div>
          <Button onClick={createYear} disabled={isCreating} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Créer
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {years.map(y => {
          const yClasses = classes.filter(c => c.academic_year_id === y.id);
          const availableLevels = ALL_LEVELS.filter(l => !yClasses.find(c => c.class_level === l.id));
          return (
            <Card key={y.id} className={y.is_active ? 'border-rainbow-purple/50' : ''}>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-3">
                  <CalendarRange className="w-5 h-5 text-rainbow-purple" />
                  {y.label}
                  {y.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rainbow-purple/15 text-rainbow-purple font-body inline-flex items-center gap-1">
                      <Star className="w-3 h-3" /> Année active
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={y.is_active} onCheckedChange={() => toggleActive(y.id, y.is_active)} />
                    <Label className="text-sm">Active</Label>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteYear(y.id, y.label)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {yClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Aucune classe ouverte pour cette année.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {yClasses.map(c => (
                      <span key={c.id} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {levelLabel(c.class_level)}
                        <button onClick={() => removeClass(c.id, levelLabel(c.class_level))} aria-label="Retirer">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {availableLevels.length > 0 && (
                  <div className="flex gap-2">
                    <Select value={newLevels[y.id] || ''} onValueChange={(v) => setNewLevels(p => ({ ...p, [y.id]: v }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Ajouter une classe" /></SelectTrigger>
                      <SelectContent>
                        {availableLevels.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => addClass(y.id)} variant="outline" className="rounded-xl">
                      <Plus className="w-4 h-4 mr-1" /> Ajouter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AcademicYearsManager;
