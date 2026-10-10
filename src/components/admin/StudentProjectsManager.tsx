import React, { useEffect, useState } from 'react';
import { ExternalLink, Eye, EyeOff, Link as LinkIcon, Pencil, Plus, Presentation, Save, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAcademicYears, useCurrentAcademicYearId } from '@/contexts/AcademicYearContext';
import { levelLabel } from '@/lib/levels';
import { usesNewArchitecture } from '@/lib/levelMenus';
import {
  MEDIA_KIND_LABELS, PROJECT_LEVELS, PROJECT_TYPE, mediaKind, projectsPath, toStudentProject,
  type ProjectDetails, type ProjectLevel, type ProjectMedia, type StudentProject,
} from '@/lib/studentProjects';
import { MEDIA_KIND_ICONS } from '@/components/ProjectMediaView';
import { saveOrder } from './MoveButtons';
import { SortableList } from './SortableList';

// Au-delà, l'envoi a de grandes chances d'être refusé par le stockage : mieux vaut un lien
const MAX_FILE_MB = 50;

const emptyForm = { title: '', authors: '', description: '', consent: false, is_published: false, media: [] as ProjectMedia[] };

const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

/** Admin : dépôt des projets des élèves (vidéos, audios, diaporamas ou liens) pour la 3ème et la Seconde. */
export const StudentProjectsManager: React.FC = () => {
  const { toast } = useToast();
  const academicYearId = useCurrentAcademicYearId();
  const { classes, years } = useAcademicYears();
  const selectedYear = years.find(y => y.id === academicYearId);
  const [level, setLevel] = useState<ProjectLevel>('seconde');
  const [items, setItems] = useState<StudentProject[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState({ url: '', label: '' });

  // Seules la 3ème et la Seconde ont des projets, et seulement si la classe est ouverte cette année
  const availableLevels = PROJECT_LEVELS.filter(id => classes.some(c => c.academic_year_id === academicYearId && c.class_level === id));

  useEffect(() => {
    if (availableLevels.length && !availableLevels.includes(level)) setLevel(availableLevels[availableLevels.length - 1]);
  }, [academicYearId, availableLevels.join(',')]);

  const fetchItems = async () => {
    if (!academicYearId) { setItems([]); return; }
    const { data, error } = await (supabase as any).from('spiral_resources')
      .select('*')
      .eq('resource_type', PROJECT_TYPE)
      .eq('level', level)
      .eq('academic_year_id', academicYearId)
      .order('order_index', { ascending: true });
    if (error) toast({ title: 'Impossible de charger les projets', description: error.message, variant: 'destructive' });
    setItems((data || []).map(toStudentProject));
  };

  useEffect(() => { fetchItems(); }, [level, academicYearId]);

  const resetForm = () => { setEditingId(null); setForm(emptyForm); setLink({ url: '', label: '' }); };

  const startEdit = (project: StudentProject) => {
    setEditingId(project.id);
    setForm({
      title: project.title, authors: project.authors, description: project.description || '',
      consent: project.consent, is_published: project.is_published, media: project.media,
    });
    setLink({ url: '', label: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addMedia = (media: ProjectMedia) => setForm(f => ({ ...f, media: [...f.media, media] }));

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast({
          title: `« ${file.name} » est trop lourd (${Math.round(file.size / 1024 / 1024)} Mo)`,
          description: `Au-delà de ${MAX_FILE_MB} Mo, mets la vidéo sur YouTube (en « non répertoriée ») ou sur Google Drive, puis colle son lien ci-dessous.`,
          variant: 'destructive',
        });
        continue;
      }
      setUploading(file.name);
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `projets-eleves/${level}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('course-files').upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (error) {
        toast({
          title: `« ${file.name} » n'a pas pu être envoyé`,
          description: `${error.message}. Si le fichier est lourd, dépose-le sur YouTube ou Google Drive et colle son lien.`,
          variant: 'destructive',
        });
        continue;
      }
      const { data } = supabase.storage.from('course-files').getPublicUrl(path);
      addMedia({ url: data.publicUrl, fileName: file.name, label: MEDIA_KIND_LABELS[mediaKind({ url: data.publicUrl, fileName: file.name })] });
    }
    setUploading(null);
  };

  const addLink = () => {
    const raw = link.url.trim();
    if (!raw) return;
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try { new URL(url); } catch {
      toast({ title: "Ce lien n'est pas valide", description: 'Colle l\'adresse complète, par exemple https://youtu.be/…', variant: 'destructive' });
      return;
    }
    addMedia({ url, label: link.label.trim() || MEDIA_KIND_LABELS[mediaKind({ url })] });
    setLink({ url: '', label: '' });
  };

  const save = async () => {
    if (!form.title.trim()) { toast({ title: 'Indique la notion expliquée', variant: 'destructive' }); return; }
    if (!academicYearId) return;
    if (form.media.length === 0) { toast({ title: 'Ajoute au moins un fichier ou un lien', variant: 'destructive' }); return; }
    const details: ProjectDetails = { authors: form.authors.trim(), consent: form.consent, media: form.media };
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      resource_links: details,
      // Jamais publié sans l'accord des parents
      is_published: form.consent && form.is_published,
    };
    setSaving(true);
    const { error } = editingId
      ? await (supabase as any).from('spiral_resources').update(payload).eq('id', editingId)
      : await (supabase as any).from('spiral_resources').insert({
          ...payload, resource_type: PROJECT_TYPE, level, academic_year_id: academicYearId, order_index: items.length,
        });
    setSaving(false);
    if (error) { toast({ title: "Le projet n'a pas pu être enregistré", description: error.message, variant: 'destructive' }); return; }
    toast({ title: editingId ? 'Projet modifié' : 'Projet ajouté', description: payload.is_published ? 'Il est visible sur le site.' : "Il reste masqué tant qu'il n'est pas publié." });
    resetForm();
    fetchItems();
  };

  const togglePublish = async (project: StudentProject) => {
    if (!project.is_published && !project.consent) {
      toast({ title: "Accord des parents manquant", description: "Ouvre le projet avec le crayon et coche l'accord des parents avant de le publier.", variant: 'destructive' });
      return;
    }
    const { error } = await (supabase as any).from('spiral_resources').update({ is_published: !project.is_published }).eq('id', project.id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    fetchItems();
  };

  const remove = async (project: StudentProject) => {
    if (!confirm(`Supprimer le projet « ${project.title} » ?`)) return;
    const { error } = await (supabase as any).from('spiral_resources').delete().eq('id', project.id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    if (editingId === project.id) resetForm();
    fetchItems();
  };

  // Glisser-déposer : affichage immédiat, puis enregistrement des positions modifiées
  const reorder = async (ordered: StudentProject[]) => {
    setItems(ordered.map((item, position) => ({ ...item, order_index: position })));
    const error = await saveOrder('spiral_resources', ordered, 'order_index');
    if (error) {
      toast({ title: "L'ordre n'a pas pu être enregistré", description: error.message, variant: 'destructive' });
      fetchItems();
    }
  };

  // La page publique ne propose que les années 2026-2027 et suivantes
  if (selectedYear && !usesNewArchitecture(selectedYear.start_year)) {
    return (
      <Card className="p-6">
        <h2 className="font-display text-xl flex items-center gap-2"><Presentation className="w-5 h-5 text-primary" />Projets des élèves</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Les projets des élèves commencent en 2026-2027. Choisis une classe de cette année dans le menu, puis reviens ici.
        </p>
      </Card>
    );
  }

  if (availableLevels.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="font-display text-xl flex items-center gap-2"><Presentation className="w-5 h-5 text-primary" />Projets des élèves</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Les projets concernent la 3ème et la Seconde. Ouvre l'une de ces classes pour cette année dans « Nouvelle année ».
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl flex items-center gap-2"><Presentation className="w-5 h-5 text-primary" />Projets des élèves</h2>
          <a href={projectsPath(level, academicYearId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4">
            <ExternalLink className="w-4 h-4" />Voir la page publique
          </a>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Vidéos, audios et diaporamas dans lesquels les élèves expliquent une notion du cours.
        </p>
        <div className="mt-3">
          <Select value={level} onValueChange={v => { setLevel(v as ProjectLevel); resetForm(); }}>
            <SelectTrigger className="w-60" aria-label="Classe"><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableLevels.map(id => <SelectItem key={id} value={id}>{levelLabel(id)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-4 space-y-4 bg-muted/30">
        <h3 className="font-display">{editingId ? 'Modifier le projet' : `Nouveau projet — ${levelLabel(level)}`}</h3>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="projet-titre">Notion expliquée *</Label>
            <Input id="projet-titre" placeholder="Les ensembles de nombres et les intervalles" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="projet-auteurs">Réalisé par</Label>
            <Input id="projet-auteurs" placeholder="Prénoms des élèves" value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))} />
            <p className="text-xs text-muted-foreground">Le site est public : le prénom suffit.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="projet-description">Description (optionnel)</Label>
          <Textarea id="projet-description" placeholder="Un mot sur le projet, la séance, ce qu'il faut regarder…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Fichiers et liens *</p>

          <SortableList
            items={form.media}
            getId={media => media.url}
            getLabel={media => media.label || media.fileName || 'média'}
            onReorder={ordered => setForm(f => ({ ...f, media: ordered }))}
            className="space-y-2"
            itemClassName="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2"
          >
            {(media, handle, index) => {
              const kind = mediaKind(media);
              const Icon = MEDIA_KIND_ICONS[kind];
              return (
                <>
                  {handle}
                  <Icon className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
                  <Input
                    value={media.label}
                    onChange={e => setForm(f => ({ ...f, media: f.media.map((m, i) => (i === index ? { ...m, label: e.target.value } : m)) }))}
                    placeholder={MEDIA_KIND_LABELS[kind]}
                    aria-label="Nom affiché"
                    className="h-9 min-w-0 flex-[1_1_10rem]"
                  />
                  <a href={media.url} target="_blank" rel="noreferrer" className="min-w-0 max-w-full truncate text-xs text-muted-foreground underline flex-[1_1_8rem]">
                    {media.fileName || hostOf(media.url)}
                  </a>
                  <Button type="button" variant="ghost" size="icon" className="ml-auto shrink-0" title="Retirer" aria-label={`Retirer ${media.label || media.fileName || 'ce média'}`}
                    onClick={() => setForm(f => ({ ...f, media: f.media.filter((_, i) => i !== index) }))}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </>
              );
            }}
          </SortableList>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-3 py-3 text-sm hover:border-primary">
            <Upload className="w-4 h-4 shrink-0" />
            {uploading ? `Envoi de « ${uploading} »…` : 'Déposer des fichiers : vidéo, audio, PowerPoint, PDF, image'}
            <input
              type="file"
              multiple
              className="hidden"
              disabled={!!uploading}
              accept="video/*,audio/*,image/*,.pdf,.ppt,.pptx,.pps,.ppsx,.doc,.docx,.opus,.ogg,.m4a"
              onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; if (files.length) uploadFiles(files); }}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <LinkIcon className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input
              value={link.url}
              onChange={e => setLink(l => ({ ...l, url: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
              placeholder="Ou coller un lien : YouTube, Google Drive, Canva…"
              aria-label="Lien"
              className="min-w-0 flex-[2_1_14rem]"
            />
            <Input
              value={link.label}
              onChange={e => setLink(l => ({ ...l, label: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
              placeholder="Nom affiché (optionnel)"
              aria-label="Nom affiché du lien"
              className="min-w-0 flex-[1_1_10rem]"
            />
            <Button type="button" variant="outline" onClick={addLink} disabled={!link.url.trim()}>
              <Plus className="w-4 h-4 mr-1" />Ajouter le lien
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Vidéo lourde (plus de {MAX_FILE_MB} Mo) : mets-la sur YouTube en « non répertoriée » ou sur Google Drive (partage « toute personne disposant du lien »), puis colle le lien ici. Elle s'affichera directement dans la page.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-3">
          <div className="flex items-start gap-2">
            <Checkbox id="projet-accord" checked={form.consent} className="mt-0.5"
              onCheckedChange={v => setForm(f => ({ ...f, consent: v === true, is_published: v === true ? f.is_published : false }))} />
            <Label htmlFor="projet-accord" className="leading-snug">
              Les parents ont autorisé la diffusion de ce projet
              <span className="block text-xs font-normal text-muted-foreground">Sans cet accord, le projet est enregistré mais reste masqué.</span>
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="projet-publie" checked={form.consent && form.is_published} disabled={!form.consent}
              onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
            <Label htmlFor="projet-publie">Publier sur le site</Label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving || !!uploading}>
            {editingId ? <Save className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {editingId ? 'Enregistrer' : 'Ajouter le projet'}
          </Button>
          {(editingId || form.title || form.media.length > 0) && (
            <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-1" />Annuler</Button>
          )}
        </div>
      </Card>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun projet en {levelLabel(level)} pour cette année.</p>
      ) : (
        <SortableList
          items={items}
          getLabel={project => project.title}
          onReorder={reorder}
          className="space-y-3"
          itemClassName={project => `flex flex-wrap items-start gap-2 rounded-xl border bg-card p-3 ${project.is_published ? 'border-border' : 'border-dashed border-border'}`}
        >
          {(project, handle) => (
            <>
              {handle}
              <div className="min-w-0 flex-[1_1_14rem]">
                <h4 className="font-display">{project.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {project.authors ? `Par ${project.authors}` : 'Auteur non précisé'}
                  {' · '}
                  {project.is_published ? 'Publié' : project.consent ? 'Masqué' : 'Masqué — accord des parents à confirmer'}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {project.media.map((media, index) => {
                    const kind = mediaKind(media);
                    const Icon = MEDIA_KIND_ICONS[kind];
                    return (
                      <li key={`${media.url}-${index}`}>
                        <a href={media.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-muted/70">
                          <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />{media.label || MEDIA_KIND_LABELS[kind]}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => togglePublish(project)}
                  title={project.is_published ? 'Publié — cliquer pour masquer' : 'Masqué — cliquer pour publier'}
                  aria-label={project.is_published ? `Masquer ${project.title}` : `Publier ${project.title}`}>
                  {project.is_published ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => startEdit(project)} title="Modifier" aria-label={`Modifier ${project.title}`}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(project)} title="Supprimer" aria-label={`Supprimer ${project.title}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </>
          )}
        </SortableList>
      )}
    </div>
  );
};

export default StudentProjectsManager;
