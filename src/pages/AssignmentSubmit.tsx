import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string | null;
  max_points: number;
  allow_late_submission: boolean;
}

interface Submission {
  id: string;
  file_url: string | null;
  content: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
}

const AssignmentSubmit = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId, user]);

  const fetchAssignment = async () => {
    setIsLoading(true);
    
    const { data: assignmentData, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('is_published', true)
      .maybeSingle();

    if (error || !assignmentData) {
      toast({
        title: "Erreur",
        description: "Devoir non trouvé",
        variant: "destructive",
      });
      navigate(-1);
      return;
    }

    setAssignment(assignmentData);

    // Check for existing submission
    if (user) {
      const { data: submissionData } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (submissionData) {
        setExistingSubmission(submissionData);
        setContent(submissionData.content || '');
        setFileUrl(submissionData.file_url);
      }
    }

    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (max 20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier ne doit pas dépasser 20MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setFile(selectedFile);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `assignments/${user?.id}/${assignmentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(fileName);

      setFileUrl(publicUrl);

      toast({
        title: "Succès",
        description: "Fichier téléchargé",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !assignment) return;
    if (!content.trim() && !fileUrl) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter du contenu ou un fichier",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (existingSubmission && !existingSubmission.grade) {
        // Update existing submission
        const { error } = await supabase
          .from('assignment_submissions')
          .update({
            content: content || null,
            file_url: fileUrl,
            submitted_at: new Date().toISOString(),
          })
          .eq('id', existingSubmission.id);

        if (error) throw error;
      } else if (!existingSubmission) {
        // Create new submission
        const { error } = await supabase
          .from('assignment_submissions')
          .insert({
            assignment_id: assignment.id,
            user_id: user.id,
            content: content || null,
            file_url: fileUrl,
          });

        if (error) throw error;
      }

      toast({
        title: "Succès ✨",
        description: "Devoir soumis avec succès",
      });

      navigate(-1);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre le devoir",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isOverdue = assignment?.due_date 
    ? new Date(assignment.due_date) < new Date() 
    : false;

  const canSubmit = !existingSubmission?.grade && (!isOverdue || assignment?.allow_late_submission);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {assignment && (
          <div className="card-sticker bg-card p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-display text-foreground mb-2">{assignment.title}</h1>
              
              {assignment.description && (
                <p className="text-muted-foreground mb-4">{assignment.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-2 text-rainbow-purple">
                  <CheckCircle className="w-4 h-4" />
                  {assignment.max_points} points max
                </span>
                
                {assignment.due_date && (
                  <span className={`flex items-center gap-2 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                    <Clock className="w-4 h-4" />
                    Date limite: {new Date(assignment.due_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>

              {isOverdue && !assignment.allow_late_submission && (
                <div className="mt-4 p-4 bg-destructive/20 border border-destructive/50 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <p className="text-destructive text-sm">
                    La date limite est dépassée. Les soumissions tardives ne sont pas acceptées.
                  </p>
                </div>
              )}

              {isOverdue && assignment.allow_late_submission && (
                <div className="mt-4 p-4 bg-rainbow-orange/20 border border-rainbow-orange/50 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rainbow-orange" />
                  <p className="text-rainbow-orange text-sm">
                    La date limite est dépassée, mais les soumissions tardives sont acceptées.
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            {assignment.instructions && (
              <div className="mb-8">
                <h2 className="font-display text-lg text-foreground mb-3">Instructions</h2>
                <div className="bg-muted/50 p-4 rounded-xl">
                  <p className="font-body text-foreground whitespace-pre-wrap">
                    {assignment.instructions}
                  </p>
                </div>
              </div>
            )}

            {/* Graded submission */}
            {existingSubmission?.grade !== null && existingSubmission?.grade !== undefined && (
              <div className="mb-8 p-6 bg-rainbow-green/10 border border-rainbow-green/50 rounded-xl">
                <h2 className="font-display text-lg text-rainbow-green mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Devoir noté
                </h2>
                
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-display text-foreground">
                      {existingSubmission.grade}/{assignment.max_points}
                    </p>
                    <p className="text-sm text-muted-foreground">Note</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-display text-rainbow-purple">
                      {Math.round((existingSubmission.grade / assignment.max_points) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Pourcentage</p>
                  </div>
                </div>

                {existingSubmission.feedback && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Commentaire du professeur</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {existingSubmission.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submission form */}
            {canSubmit && (
              <>
                <div className="mb-6">
                  <h2 className="font-display text-lg text-foreground mb-3">Votre réponse</h2>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Écrivez votre réponse ici..."
                    rows={8}
                    className="resize-none"
                  />
                </div>

                {/* File upload */}
                <div className="mb-8">
                  <h2 className="font-display text-lg text-foreground mb-3">Fichier joint (optionnel)</h2>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  />

                  {fileUrl ? (
                    <div className="flex items-center gap-4 p-4 border border-border rounded-xl">
                      <FileText className="w-8 h-8 text-rainbow-blue" />
                      <div className="flex-1">
                        <p className="font-body text-foreground">
                          {file?.name || 'Fichier joint'}
                        </p>
                        <a 
                          href={fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-rainbow-blue hover:underline"
                        >
                          Voir le fichier
                        </a>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={removeFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full py-8 border-dashed"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Cliquez pour ajouter un fichier
                        </>
                      )}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Formats acceptés: PDF, Word, PowerPoint, Excel, images (max 20MB)
                  </p>
                </div>

                <Button
                  className="w-full btn-3d bg-primary text-lg py-6"
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!content.trim() && !fileUrl)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Soumission en cours...
                    </>
                  ) : existingSubmission ? (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Mettre à jour ma soumission
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Soumettre mon devoir
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default AssignmentSubmit;
