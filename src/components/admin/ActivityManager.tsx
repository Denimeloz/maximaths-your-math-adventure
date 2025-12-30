import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, FileText, BookOpen, Lightbulb, Upload, Loader2, X, BookCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  level: string;
  file_url: string | null;
  correction_url: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}
const levels = [
  { id: '6eme', label: '6ème' },
  { id: '5eme', label: '5ème' },
  { id: '4eme', label: '4ème' },
  { id: '3eme', label: '3ème' },
  { id: 'seconde', label: 'Seconde' },
  { id: 'premiere', label: 'Première' },
  { id: 'terminale', label: 'Terminale' },
];

interface ActivityManagerProps {
  selectedLevel?: string;
}

const ActivityManager: React.FC<ActivityManagerProps> = ({ selectedLevel }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingCorrection, setIsUploadingCorrection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const correctionInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: selectedLevel || '6eme',
    file_url: '',
    correction_url: '',
    is_published: false,
    order_index: 0,
  });

  useEffect(() => {
    fetchActivities();
  }, [selectedLevel]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('training_exercises' as any)
        .select('*')
        .order('order_index', { ascending: true });
      
      // We'll use training_exercises as a proxy for activities with a different category
      // Actually, let's query from activities table using 'any' cast
      const { data, error } = await (supabase as any)
        .from('activities')
        .select('*')
        .order('order_index', { ascending: true })
        .eq('level', selectedLevel || '6eme');
      
      if (error) {
        toast.error('Erreur lors du chargement des activités');
        console.error(error);
      } else {
        setActivities((data || []) as Activity[]);
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 20MB");
      return;
    }

    setIsUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `activities/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('course-files').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, file_url: publicUrl }));
      toast.success("Fichier téléchargé");
    } catch (error) {
      toast.error("Impossible de télécharger le fichier");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleCorrectionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 20MB");
      return;
    }

    setIsUploadingCorrection(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `corrections/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('course-files').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, correction_url: publicUrl }));
      toast.success("Corrigé téléchargé");
    } catch (error) {
      toast.error("Impossible de télécharger le corrigé");
    } finally {
      setIsUploadingCorrection(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      level: selectedLevel || '6eme',
      file_url: '',
      correction_url: '',
      is_published: false,
      order_index: activities.length,
    });
    setEditingActivity(null);
    setShowForm(false);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description || '',
      level: activity.level,
      file_url: activity.file_url || '',
      correction_url: activity.correction_url || '',
      is_published: activity.is_published,
      order_index: activity.order_index,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const activityData = {
      title: formData.title,
      description: formData.description || null,
      level: formData.level,
      file_url: formData.file_url || null,
      correction_url: formData.correction_url || null,
      is_published: formData.is_published,
      order_index: formData.order_index,
    };

    if (editingActivity) {
      const { error } = await (supabase as any)
        .from('activities')
        .update(activityData)
        .eq('id', editingActivity.id);
      
      if (error) {
        toast.error('Erreur lors de la mise à jour');
        console.error(error);
      } else {
        toast.success('Activité mise à jour');
        fetchActivities();
        resetForm();
      }
    } else {
      const { error } = await (supabase as any)
        .from('activities')
        .insert(activityData);
      
      if (error) {
        toast.error('Erreur lors de la création');
        console.error(error);
      } else {
        toast.success('Activité créée');
        fetchActivities();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) return;
    
    const { error } = await (supabase as any)
      .from('activities')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    } else {
      toast.success('Activité supprimée');
      fetchActivities();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display text-foreground">
          Activités de découverte
          {selectedLevel && ` - ${levels.find(l => l.id === selectedLevel)?.label}`}
        </h2>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle activité
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingActivity ? 'Modifier l\'activité' : 'Nouvelle activité'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Fichier (sujet)</Label>
                <div className="flex items-center gap-4">
                  {formData.file_url ? (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl flex-1">
                      <FileText className="w-6 h-6 text-rainbow-blue" />
                      <a href={formData.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-rainbow-blue hover:underline truncate">
                        Voir le fichier
                      </a>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, file_url: '' }))} className="ml-auto">
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile} className="rounded-xl">
                        {isUploadingFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {isUploadingFile ? 'Upload...' : 'Ajouter un fichier'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Correction Upload */}
              <div className="space-y-2">
                <Label>Corrigé</Label>
                <div className="flex items-center gap-4">
                  {formData.correction_url ? (
                    <div className="flex items-center gap-3 p-3 bg-rainbow-green/10 rounded-xl flex-1">
                      <BookCheck className="w-6 h-6 text-rainbow-green" />
                      <a href={formData.correction_url} target="_blank" rel="noopener noreferrer" className="text-sm text-rainbow-green hover:underline truncate">
                        Voir le corrigé
                      </a>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, correction_url: '' }))} className="ml-auto">
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input type="file" ref={correctionInputRef} onChange={handleCorrectionUpload} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" />
                      <Button type="button" variant="outline" onClick={() => correctionInputRef.current?.click()} disabled={isUploadingCorrection} className="rounded-xl border-rainbow-green/50 text-rainbow-green hover:bg-rainbow-green/10">
                        {isUploadingCorrection ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookCheck className="w-4 h-4 mr-2" />}
                        {isUploadingCorrection ? 'Upload...' : 'Ajouter le corrigé'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Publié</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="order_index">Ordre</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingActivity ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {activities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              Aucune activité de découverte pour ce niveau
            </CardContent>
          </Card>
        ) : (
          activities.map((activity) => (
            <Card key={activity.id} className={!activity.is_published ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Lightbulb className="w-5 h-5 text-rainbow-orange" />
                    <div>
                      <h3 className="font-semibold">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {levels.find(l => l.id === activity.level)?.label}
                        {!activity.is_published && ' • Non publié'}
                      </p>
                      <div className="flex gap-4 mt-1">
                        {activity.file_url && (
                          <a 
                            href={activity.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Sujet
                          </a>
                        )}
                        {activity.correction_url && (
                          <a 
                            href={activity.correction_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-rainbow-green hover:underline flex items-center gap-1"
                          >
                            <BookOpen className="w-4 h-4" />
                            Corrigé
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(activity)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(activity.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityManager;