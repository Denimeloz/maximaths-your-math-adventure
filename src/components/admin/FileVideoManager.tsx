import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import PDFViewer from '@/components/PDFViewer';
import { Plus, Trash2, Eye, EyeOff, Edit, Save, X, Upload, FileText, Video, Loader2, File } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CourseFile {
  id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number | null;
  is_published: boolean;
  order_index: number;
}

interface VideoItem {
  id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  video_url: string;
  duration_seconds: number | null;
  is_published: boolean;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
}

interface FileVideoManagerProps {
  courses: Course[];
}

export const FileVideoManager: React.FC<FileVideoManagerProps> = ({ courses }) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'files' | 'videos'>('files');
  
  // File form
  const [showFileForm, setShowFileForm] = useState(false);
  const [editingFile, setEditingFile] = useState<CourseFile | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileForm, setFileForm] = useState({
    course_id: '',
    title: '',
    description: '',
    file_url: '',
    file_type: '',
    file_size: 0,
  });

  // Video form
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [videoForm, setVideoForm] = useState({
    course_id: '',
    title: '',
    description: '',
    video_url: '',
    duration_seconds: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [filesRes, videosRes] = await Promise.all([
      supabase.from('course_files').select('*').order('order_index'),
      supabase.from('videos').select('*').order('order_index'),
    ]);
    if (filesRes.data) setFiles(filesRes.data);
    if (videosRes.data) setVideos(videosRes.data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Le fichier ne doit pas dépasser 50MB", variant: "destructive" });
      return;
    }

    setIsUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `files/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('course-files').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('course-files').getPublicUrl(fileName);
      
      setFileForm(prev => ({ 
        ...prev, 
        file_url: publicUrl,
        file_type: fileExt.toUpperCase(),
        file_size: file.size,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));
      toast({ title: "Succès", description: "Fichier téléchargé" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de télécharger le fichier", variant: "destructive" });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSaveFile = async () => {
    if (!fileForm.title.trim() || !fileForm.course_id || !fileForm.file_url) {
      toast({ title: "Erreur", description: "Cours, titre et fichier requis", variant: "destructive" });
      return;
    }

    if (editingFile) {
      const { error } = await supabase
        .from('course_files')
        .update({
          title: fileForm.title,
          description: fileForm.description || null,
          file_url: fileForm.file_url,
          file_type: fileForm.file_type,
          file_size: fileForm.file_size,
        })
        .eq('id', editingFile.id);

      if (!error) {
        toast({ title: "Succès", description: "Fichier modifié" });
        fetchData();
        resetFileForm();
      }
    } else {
      const filesForCourse = files.filter(f => f.course_id === fileForm.course_id);
      const { error } = await supabase
        .from('course_files')
        .insert({
          course_id: fileForm.course_id,
          title: fileForm.title,
          description: fileForm.description || null,
          file_url: fileForm.file_url,
          file_type: fileForm.file_type,
          file_size: fileForm.file_size,
          order_index: filesForCourse.length,
        });

      if (!error) {
        toast({ title: "Succès", description: "Fichier ajouté" });
        fetchData();
        resetFileForm();
      }
    }
  };

  const handleSaveVideo = async () => {
    if (!videoForm.title.trim() || !videoForm.course_id || !videoForm.video_url) {
      toast({ title: "Erreur", description: "Cours, titre et URL requis", variant: "destructive" });
      return;
    }

    if (editingVideo) {
      const { error } = await supabase
        .from('videos')
        .update({
          title: videoForm.title,
          description: videoForm.description || null,
          video_url: videoForm.video_url,
          duration_seconds: videoForm.duration_seconds || null,
        })
        .eq('id', editingVideo.id);

      if (!error) {
        toast({ title: "Succès", description: "Vidéo modifiée" });
        fetchData();
        resetVideoForm();
      }
    } else {
      const videosForCourse = videos.filter(v => v.course_id === videoForm.course_id);
      const { error } = await supabase
        .from('videos')
        .insert({
          course_id: videoForm.course_id,
          title: videoForm.title,
          description: videoForm.description || null,
          video_url: videoForm.video_url,
          duration_seconds: videoForm.duration_seconds || null,
          order_index: videosForCourse.length,
        });

      if (!error) {
        toast({ title: "Succès", description: "Vidéo ajoutée" });
        fetchData();
        resetVideoForm();
      }
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm("Supprimer ce fichier ?")) return;
    await supabase.from('course_files').delete().eq('id', id);
    fetchData();
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Supprimer cette vidéo ?")) return;
    await supabase.from('videos').delete().eq('id', id);
    fetchData();
  };

  const handleToggleFilePublish = async (file: CourseFile) => {
    await supabase.from('course_files').update({ is_published: !file.is_published }).eq('id', file.id);
    fetchData();
  };

  const handleToggleVideoPublish = async (video: VideoItem) => {
    await supabase.from('videos').update({ is_published: !video.is_published }).eq('id', video.id);
    fetchData();
  };

  const handleEditFile = (file: CourseFile) => {
    setEditingFile(file);
    setFileForm({
      course_id: file.course_id || '',
      title: file.title,
      description: file.description || '',
      file_url: file.file_url,
      file_type: file.file_type,
      file_size: file.file_size || 0,
    });
    setShowFileForm(true);
  };

  const handleEditVideo = (video: VideoItem) => {
    setEditingVideo(video);
    setVideoForm({
      course_id: video.course_id || '',
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      duration_seconds: video.duration_seconds || 0,
    });
    setShowVideoForm(true);
  };

  const resetFileForm = () => {
    setShowFileForm(false);
    setEditingFile(null);
    setFileForm({ course_id: '', title: '', description: '', file_url: '', file_type: '', file_size: 0 });
  };

  const resetVideoForm = () => {
    setShowVideoForm(false);
    setEditingVideo(null);
    setVideoForm({ course_id: '', title: '', description: '', video_url: '', duration_seconds: 0 });
  };

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return 'Non assigné';
    return courses.find(c => c.id === courseId)?.title || 'Inconnu';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredFiles = selectedCourse ? files.filter(f => f.course_id === selectedCourse) : files;
  const filteredVideos = selectedCourse ? videos.filter(v => v.course_id === selectedCourse) : videos;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Fichiers & Vidéos</h2>
      </div>

      <div>
        <label className="text-sm font-body text-muted-foreground mb-1 block">Filtrer par cours</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="p-2 rounded-xl border border-input bg-background"
        >
          <option value="">Tous les cours</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'files' | 'videos')}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="files" className="rounded-xl">
            <FileText className="w-4 h-4 mr-2" />
            Fichiers ({filteredFiles.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="rounded-xl">
            <Video className="w-4 h-4 mr-2" />
            Vidéos ({filteredVideos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-4 space-y-4">
          <Button onClick={() => setShowFileForm(true)} className="btn-3d bg-primary rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau fichier
          </Button>

          {showFileForm && (
            <div className="card-sticker bg-card border-rainbow-blue/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display text-foreground">
                  {editingFile ? 'Modifier le fichier' : 'Nouveau fichier'}
                </h3>
                <Button variant="ghost" size="icon" onClick={resetFileForm}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">Cours *</label>
                  <select
                    value={fileForm.course_id}
                    onChange={(e) => setFileForm(prev => ({ ...prev, course_id: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-input bg-background"
                    disabled={!!editingFile}
                  >
                    <option value="">Sélectionner un cours</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">Fichier *</label>
                  <div className="flex items-center gap-4">
                    {fileForm.file_url ? (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl flex-1">
                        <File className="w-6 h-6 text-rainbow-blue" />
                        <div className="flex-1">
                          <a href={fileForm.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-rainbow-blue hover:underline">
                            Voir le fichier
                          </a>
                          <p className="text-xs text-muted-foreground">{fileForm.file_type} • {formatFileSize(fileForm.file_size)}</p>
                        </div>
                        <button onClick={() => setFileForm(prev => ({ ...prev, file_url: '', file_type: '', file_size: 0 }))}>
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile} className="rounded-xl">
                          {isUploadingFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          {isUploadingFile ? 'Upload...' : 'Télécharger'}
                        </Button>
                      </>
                    )}
                  </div>
                  {/* PDF Preview */}
                  {fileForm.file_url && fileForm.file_type?.toLowerCase() === 'pdf' && (
                    <div className="mt-3">
                      <PDFViewer url={fileForm.file_url} title="Aperçu du fichier" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">Titre *</label>
                  <Input
                    value={fileForm.title}
                    onChange={(e) => setFileForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre du fichier"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">Description</label>
                  <Textarea
                    value={fileForm.description}
                    onChange={(e) => setFileForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    className="rounded-xl"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveFile} className="btn-3d bg-primary rounded-xl">
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button onClick={resetFileForm} variant="outline" className="rounded-xl">
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredFiles.map(file => (
              <div key={file.id} className="card-cartoon bg-card border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-rainbow-blue/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-rainbow-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-foreground truncate">{file.title}</p>
                      <p className="text-sm text-muted-foreground">{getCourseName(file.course_id)}</p>
                      <p className="text-xs text-muted-foreground">{file.file_type} • {formatFileSize(file.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleFilePublish(file)} className="rounded-xl">
                      {file.is_published ? <Eye className="w-4 h-4 text-rainbow-green" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditFile(file)} className="rounded-xl">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id)} className="rounded-xl text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredFiles.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Aucun fichier</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="mt-4 space-y-4">
          <Button onClick={() => setShowVideoForm(true)} className="btn-3d bg-primary rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle vidéo
          </Button>

          {showVideoForm && (
            <div className="card-sticker bg-card border-rainbow-purple/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display text-foreground">
                  {editingVideo ? 'Modifier la vidéo' : 'Nouvelle vidéo'}
                </h3>
                <Button variant="ghost" size="icon" onClick={resetVideoForm}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">Cours *</label>
                  <select
                    value={videoForm.course_id}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, course_id: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-input bg-background"
                    disabled={!!editingVideo}
                  >
                    <option value="">Sélectionner un cours</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">Titre *</label>
                  <Input
                    value={videoForm.title}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de la vidéo"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">URL de la vidéo * (YouTube, Vimeo, etc.)</label>
                  <Input
                    value={videoForm.video_url}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">Description</label>
                  <Textarea
                    value={videoForm.description}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    className="rounded-xl"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1 block">Durée (secondes)</label>
                  <Input
                    type="number"
                    min={0}
                    value={videoForm.duration_seconds}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
                    placeholder="300"
                    className="rounded-xl"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveVideo} className="btn-3d bg-primary rounded-xl">
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button onClick={resetVideoForm} variant="outline" className="rounded-xl">
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredVideos.map(video => (
              <div key={video.id} className="card-cartoon bg-card border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-rainbow-purple/20 flex items-center justify-center">
                      <Video className="w-5 h-5 text-rainbow-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-foreground truncate">{video.title}</p>
                      <p className="text-sm text-muted-foreground">{getCourseName(video.course_id)}</p>
                      {video.duration_seconds && (
                        <p className="text-xs text-muted-foreground">{formatDuration(video.duration_seconds)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleVideoPublish(video)} className="rounded-xl">
                      {video.is_published ? <Eye className="w-4 h-4 text-rainbow-green" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditVideo(video)} className="rounded-xl">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteVideo(video.id)} className="rounded-xl text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredVideos.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Aucune vidéo</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
