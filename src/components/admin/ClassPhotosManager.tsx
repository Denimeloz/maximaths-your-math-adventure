import React, { useState, useEffect } from 'react';
import { notifyNewClassPhotos, notifyContentUpdate } from '@/hooks/useNotifyUsers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Save, X, Upload, Eye, EyeOff, Image, Loader2 } from 'lucide-react';

type CourseLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface ImageFile {
  url: string;
  name: string;
}

interface ClassPhoto {
  id: string;
  title: string;
  description: string | null;
  level: string;
  image_urls: ImageFile[] | null;
  is_published: boolean;
  order_index: number;
}

interface ClassPhotosManagerProps {
  selectedLevel: CourseLevel;
}

export const ClassPhotosManager: React.FC<ClassPhotosManagerProps> = ({ selectedLevel }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<ClassPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_urls: [] as ImageFile[],
    is_published: false,
  });

  useEffect(() => {
    fetchItems();
  }, [selectedLevel]);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('class_photos')
      .select('*')
      .eq('level', selectedLevel)
      .order('order_index', { ascending: true });

    if (data) setItems(data);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    setIsLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: ImageFile[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `class-photos/${selectedLevel}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(fileName, file);

      if (uploadError) {
        toast({ title: 'Erreur upload', description: uploadError.message, variant: 'destructive' });
        continue;
      }

      const { data: urlData } = supabase.storage.from('course-files').getPublicUrl(fileName);
      newImages.push({ url: urlData.publicUrl, name: file.name });
    }

    setFormData(prev => ({
      ...prev,
      image_urls: [...prev.image_urls, ...newImages],
    }));
    setIsUploading(false);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Erreur', description: 'Le titre est requis', variant: 'destructive' });
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description || null,
      level: selectedLevel,
      image_urls: formData.image_urls,
      is_published: formData.is_published,
      order_index: items.length,
    };

    if (editingId) {
      const { error } = await (supabase as any)
        .from('class_photos')
        .update(payload)
        .eq('id', editingId);
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Modifié avec succès' });
      if (formData.is_published) {
        notifyContentUpdate(selectedLevel, 'Photos de classe', formData.title);
      }
    } else {
      const { error } = await (supabase as any)
        .from('class_photos')
        .insert(payload);
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Ajouté avec succès' });
      if (formData.is_published) {
        notifyNewClassPhotos(selectedLevel, formData.title);
      }
    }

    resetForm();
    fetchItems();
  };

  const handleEdit = (item: ClassPhoto) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      image_urls: Array.isArray(item.image_urls) ? item.image_urls : [],
      is_published: item.is_published,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet élément ?')) return;
    const { error } = await (supabase as any).from('class_photos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Supprimé' });
    fetchItems();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await (supabase as any).from('class_photos').update({ is_published: !current }).eq('id', id);
    fetchItems();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: '', description: '', image_urls: [], is_published: false });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-foreground">
          Classe en activité ({items.length})
        </h3>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-6 space-y-4">
          <h4 className="font-display text-foreground">
            {editingId ? 'Modifier' : 'Nouveau'} album photo
          </h4>

          <div>
            <Label>Titre *</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Séance du 15 mars - Géométrie"
              className="rounded-lg"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de l'activité..."
              className="rounded-lg"
            />
          </div>

          <div>
            <Label>Photos / Images</Label>
            <div className="mt-2">
              <label className="flex items-center gap-2 px-4 py-3 bg-card border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isUploading ? 'Upload en cours...' : 'Cliquer pour ajouter des photos (JPEG, PNG...)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {formData.image_urls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formData.image_urls.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-border">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs text-muted-foreground truncate px-1 py-0.5">{img.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_published}
              onCheckedChange={v => setFormData(prev => ({ ...prev, is_published: v }))}
            />
            <Label>Publier immédiatement</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="gap-2 rounded-xl">
              <Save className="w-4 h-4" />
              {editingId ? 'Modifier' : 'Enregistrer'}
            </Button>
            <Button variant="outline" onClick={resetForm} className="gap-2 rounded-xl">
              <X className="w-4 h-4" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p>Aucune photo d'activité pour ce niveau.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-display text-foreground">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePublish(item.id, item.is_published)}
                    title={item.is_published ? 'Dépublier' : 'Publier'}
                  >
                    {item.is_published ? <Eye className="w-4 h-4 text-rainbow-green" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {item.image_urls.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={img.name}
                      className="w-full h-20 object-cover rounded-lg border border-border"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
