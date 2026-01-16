import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  FileText, 
  Info,
  GripVertical,
  Upload,
  Loader2,
  X,
  Megaphone
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

type CourseLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

interface ClassInfo {
  id: string;
  level: string;
  title: string;
  content: string | null;
  file_url: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface ClassInfoManagerProps {
  selectedLevel: CourseLevel;
}

export const ClassInfoManager: React.FC<ClassInfoManagerProps> = ({ selectedLevel }) => {
  const [infos, setInfos] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInfo, setEditingInfo] = useState<ClassInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    file_url: '',
    is_published: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchInfos();
  }, [selectedLevel]);

  const fetchInfos = async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('class_info')
      .select('*')
      .eq('level', selectedLevel)
      .order('order_index', { ascending: true });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations",
        variant: "destructive",
      });
    } else {
      setInfos(data || []);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier ne doit pas dépasser 20MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `class-info/${selectedLevel}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, file_url: publicUrl }));

      toast({
        title: "Succès ✨",
        description: "Fichier téléchargé avec succès",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est requis",
        variant: "destructive",
      });
      return;
    }

    if (editingInfo) {
      const { error } = await (supabase as any)
        .from('class_info')
        .update({
          title: formData.title,
          content: formData.content || null,
          file_url: formData.file_url || null,
          is_published: formData.is_published,
        })
        .eq('id', editingInfo.id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier l'information",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Information modifiée avec succès",
        });
        resetForm();
        fetchInfos();
      }
    } else {
      const { error } = await (supabase as any)
        .from('class_info')
        .insert({
          level: selectedLevel,
          title: formData.title,
          content: formData.content || null,
          file_url: formData.file_url || null,
          is_published: formData.is_published,
          order_index: infos.length,
        });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer l'information",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Information créée avec succès",
        });
        resetForm();
        fetchInfos();
      }
    }
  };

  const handleEdit = (info: ClassInfo) => {
    setEditingInfo(info);
    setFormData({
      title: info.title,
      content: info.content || '',
      file_url: info.file_url || '',
      is_published: info.is_published,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette information ?")) return;

    const { error } = await (supabase as any)
      .from('class_info')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'information",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: "Information supprimée",
      });
      fetchInfos();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = infos.findIndex((item) => item.id === active.id);
      const newIndex = infos.findIndex((item) => item.id === over.id);
      
      const newInfos = arrayMove(infos, oldIndex, newIndex);
      setInfos(newInfos);
      
      // Update order_index in database
      for (let i = 0; i < newInfos.length; i++) {
        await (supabase as any)
          .from('class_info')
          .update({ order_index: i })
          .eq('id', newInfos[i].id);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingInfo(null);
    setFormData({
      title: '',
      content: '',
      file_url: '',
      is_published: false,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-rainbow-orange" />
          Informations pour la classe
        </h2>
        <Button 
          onClick={() => setShowForm(true)} 
          className="btn-3d bg-primary rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle information
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-rainbow-orange/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              {editingInfo ? "Modifier l'information" : "Nouvelle information"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Contrôle du 15 janvier"
                className="rounded-xl mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Détails de l'information..."
                className="rounded-xl mt-1 min-h-[150px]"
              />
            </div>

            <div>
              <Label>Pièce jointe</Label>
              <div className="mt-1 flex items-center gap-4">
                {formData.file_url ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl flex-1">
                    <FileText className="w-6 h-6 text-rainbow-blue" />
                    <div className="flex-1 min-w-0">
                      <a 
                        href={formData.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-rainbow-blue hover:underline truncate block"
                      >
                        Voir le fichier
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFormData(prev => ({ ...prev, file_url: '' }))}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 text-center">
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <span className="text-sm text-muted-foreground">Aucun fichier</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="rounded-xl"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {formData.file_url ? 'Changer' : 'Télécharger'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Max 20MB</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
              <Label htmlFor="is_published">Publier</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} className="btn-3d bg-primary rounded-xl">
                {editingInfo ? 'Enregistrer' : 'Créer'}
              </Button>
              <Button variant="outline" onClick={resetForm} className="rounded-xl">
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {infos.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground font-body">
              Aucune information pour cette classe
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={infos.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {infos.map((info) => (
                <SortableItem key={info.id} id={info.id}>
                  <Card className={`border-l-4 ${info.is_published ? 'border-l-rainbow-green' : 'border-l-muted'}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Info className="w-4 h-4 text-rainbow-orange" />
                          <h3 className="font-display text-foreground">{info.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-body ${
                            info.is_published 
                              ? 'bg-rainbow-green/20 text-rainbow-green' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {info.is_published ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                        
                        {info.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{info.content}</p>
                        )}
                        
                        {info.file_url && (
                          <a 
                            href={info.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-rainbow-blue hover:underline mt-2"
                          >
                            <FileText className="w-3 h-3" />
                            Pièce jointe
                          </a>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(info)}
                          className="rounded-full"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(info.id)}
                          className="rounded-full text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default ClassInfoManager;
