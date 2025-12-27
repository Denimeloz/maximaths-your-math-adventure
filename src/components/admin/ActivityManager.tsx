import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, FileText, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Activity = Tables<'activities'>;

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
    let query = supabase
      .from('activities')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (selectedLevel) {
      query = query.eq('level', selectedLevel);
    }
    
    const { data, error } = await query;
    
    if (error) {
      toast.error('Erreur lors du chargement des activités');
      console.error(error);
    } else {
      setActivities(data || []);
    }
    setIsLoading(false);
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
      const { error } = await supabase
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
      const { error } = await supabase
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
    
    const { error } = await supabase
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="level">Niveau *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file_url">URL du fichier (sujet)</Label>
                  <Input
                    id="file_url"
                    type="url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="correction_url">URL du corrigé</Label>
                  <Input
                    id="correction_url"
                    type="url"
                    value={formData.correction_url}
                    onChange={(e) => setFormData({ ...formData, correction_url: e.target.value })}
                    placeholder="https://..."
                  />
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
