import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  FileText, 
  Video, 
  ClipboardList, 
  Download,
  ArrowLeft,
  CheckCircle,
  Play,
  FileQuestion,
  Upload,
  Clock,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  category: string;
  image_url: string | null;
  pdf_url: string | null;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  order_index: number;
}

interface Exercise {
  id: string;
  title: string;
  question: string;
  answer: string;
  explanation: string | null;
  difficulty: number;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string | null;
  max_points: number;
}

interface CourseFile {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
}

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_seconds: number | null;
}

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('lessons');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (courseId) {
      fetchCourseAndContent();
    }
  }, [courseId, user]);

  const fetchCourseAndContent = async () => {
    setIsLoading(true);
    
    // Fetch course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_published', true)
      .maybeSingle();

    if (courseError || !courseData) {
      toast({
        title: "Erreur",
        description: "Cours non trouvé",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    setCourse(courseData);

    // Fetch all content directly by course_id
    const [lessonsRes, exercisesRes, quizzesRes, assignmentsRes, filesRes, videosRes] = await Promise.all([
      supabase.from('lessons').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index'),
      supabase.from('exercises').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index'),
      supabase.from('quizzes').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index'),
      supabase.from('assignments').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index'),
      supabase.from('course_files').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index'),
      supabase.from('videos').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index'),
    ]);

    setLessons(lessonsRes.data || []);
    setExercises(exercisesRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setAssignments(assignmentsRes.data || []);
    setCourseFiles(filesRes.data || []);
    setVideos(videosRes.data || []);

    setIsLoading(false);
  };

  const toggleAnswer = (exerciseId: string) => {
    setShowAnswer(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['Facile', 'Moyen', 'Difficile'];
    return labels[difficulty - 1] || 'Moyen';
  };

  const getDifficultyColor = (difficulty: number) => {
    const colors = ['text-rainbow-green', 'text-rainbow-orange', 'text-rainbow-coral'];
    return colors[difficulty - 1] || 'text-rainbow-orange';
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      '6eme': '6ème',
      '5eme': '5ème',
      '4eme': '4ème',
      '3eme': '3ème',
      'seconde': 'Seconde',
      'premiere': 'Première',
      'terminale': 'Terminale',
    };
    return labels[level] || level;
  };

  const getContentCounts = () => ({
    lessons: lessons.length,
    exercises: exercises.length,
    quizzes: quizzes.length,
    videos: videos.length,
    files: courseFiles.length,
    assignments: assignments.length,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const counts = getContentCounts();
  const hasContent = Object.values(counts).some(c => c > 0);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back button and course header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          {course && (
            <div className="card-sticker bg-card p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {course.image_url && (
                  <img 
                    src={course.image_url} 
                    alt={course.title}
                    className="w-full md:w-48 h-48 object-cover rounded-xl"
                  />
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {getLevelLabel(course.level)}
                    </span>
                    <span className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground capitalize">
                      {course.category}
                    </span>
                  </div>
                  <h1 className="text-3xl font-display text-foreground mb-3">{course.title}</h1>
                  {course.description && (
                    <p className="text-muted-foreground font-body mb-4">{course.description}</p>
                  )}
                  
                  {/* Content stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    {counts.lessons > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" /> {counts.lessons} leçon(s)
                      </span>
                    )}
                    {counts.exercises > 0 && (
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-4 h-4" /> {counts.exercises} exercice(s)
                      </span>
                    )}
                    {counts.quizzes > 0 && (
                      <span className="flex items-center gap-1">
                        <FileQuestion className="w-4 h-4" /> {counts.quizzes} quiz
                      </span>
                    )}
                    {counts.videos > 0 && (
                      <span className="flex items-center gap-1">
                        <Video className="w-4 h-4" /> {counts.videos} vidéo(s)
                      </span>
                    )}
                  </div>

                  {course.pdf_url && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(course.pdf_url!, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le PDF du cours
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Course content */}
        {hasContent ? (
          <div className="card-sticker bg-card p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6 h-auto">
                <TabsTrigger value="lessons" className="flex items-center gap-1 py-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Leçons</span>
                  {counts.lessons > 0 && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 rounded-full">{counts.lessons}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="exercises" className="flex items-center gap-1 py-2">
                  <ClipboardList className="w-4 h-4" />
                  <span className="hidden sm:inline">Exercices</span>
                  {counts.exercises > 0 && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 rounded-full">{counts.exercises}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="flex items-center gap-1 py-2">
                  <FileQuestion className="w-4 h-4" />
                  <span className="hidden sm:inline">Quiz</span>
                  {counts.quizzes > 0 && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 rounded-full">{counts.quizzes}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex items-center gap-1 py-2">
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Vidéos</span>
                  {counts.videos > 0 && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 rounded-full">{counts.videos}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-1 py-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Fichiers</span>
                  {counts.files > 0 && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 rounded-full">{counts.files}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="assignments" className="flex items-center gap-1 py-2">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Devoirs</span>
                  {counts.assignments > 0 && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 rounded-full">{counts.assignments}</span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Lessons Tab */}
              <TabsContent value="lessons">
                {lessons.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Aucune leçon disponible</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {lessons.map((lesson, index) => (
                      <div key={lesson.id} className="border border-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </span>
                          <h3 className="font-display text-lg text-foreground">{lesson.title}</h3>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none text-muted-foreground font-body"
                          dangerouslySetInnerHTML={{ __html: lesson.content }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Exercises Tab */}
              <TabsContent value="exercises">
                {exercises.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Aucun exercice disponible</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {exercises.map((exercise, index) => (
                      <div key={exercise.id} className="border border-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-rainbow-green/10 text-rainbow-green flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </span>
                            <h3 className="font-display text-lg text-foreground">{exercise.title}</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-body ${getDifficultyColor(exercise.difficulty)}`}>
                              {getDifficultyLabel(exercise.difficulty)}
                            </span>
                            <span className="text-sm text-rainbow-purple font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {exercise.points} pts
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg mb-4">
                          <p className="font-body text-foreground whitespace-pre-wrap">{exercise.question}</p>
                        </div>
                        
                        <Button 
                          variant="outline"
                          onClick={() => toggleAnswer(exercise.id)}
                          className="mb-4"
                        >
                          {showAnswer[exercise.id] ? 'Masquer' : 'Voir'} le corrigé
                        </Button>
                        
                        {showAnswer[exercise.id] && (
                          <div className="space-y-4 animate-fade-in">
                            <div className="bg-rainbow-green/10 border border-rainbow-green/30 p-4 rounded-lg">
                              <h4 className="font-semibold text-rainbow-green mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Réponse
                              </h4>
                              <p className="font-body text-foreground whitespace-pre-wrap">{exercise.answer}</p>
                            </div>
                            
                            {exercise.explanation && (
                              <div className="bg-rainbow-blue/10 border border-rainbow-blue/30 p-4 rounded-lg">
                                <h4 className="font-semibold text-rainbow-blue mb-2">Explication</h4>
                                <p className="font-body text-foreground whitespace-pre-wrap">{exercise.explanation}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Quizzes Tab */}
              <TabsContent value="quizzes">
                {quizzes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileQuestion className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Aucun quiz disponible</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {quizzes.map(quiz => (
                      <div 
                        key={quiz.id} 
                        className="border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                      >
                        <h3 className="font-display text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                          {quiz.title}
                        </h3>
                        {quiz.description && (
                          <p className="text-sm text-muted-foreground mb-4">{quiz.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm mb-4">
                          {quiz.time_limit_minutes && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-4 h-4" /> {quiz.time_limit_minutes} min
                            </span>
                          )}
                          <span className="text-rainbow-purple font-semibold">
                            Score min: {quiz.passing_score}%
                          </span>
                        </div>
                        <Button className="w-full btn-3d bg-primary">
                          <Play className="w-4 h-4 mr-2" />
                          Commencer le quiz
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="videos">
                {videos.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Aucune vidéo disponible</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {videos.map(video => (
                      <div key={video.id} className="border border-border rounded-xl overflow-hidden">
                        <div className="aspect-video bg-muted">
                          <iframe
                            src={video.video_url}
                            className="w-full h-full"
                            allowFullScreen
                            title={video.title}
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-display text-lg text-foreground">{video.title}</h3>
                          {video.description && (
                            <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
                          )}
                          {video.duration_seconds && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                              <Clock className="w-3 h-3" />
                              {Math.floor(video.duration_seconds / 60)} min {video.duration_seconds % 60} sec
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Files Tab */}
              <TabsContent value="files">
                {courseFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Download className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Aucun fichier disponible</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {courseFiles.map(file => (
                      <div key={file.id} className="border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                        <div className="w-12 h-12 bg-rainbow-blue/20 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-rainbow-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-body font-semibold text-foreground truncate">{file.title}</h4>
                          {file.description && (
                            <p className="text-xs text-muted-foreground truncate">{file.description}</p>
                          )}
                          <span className="text-xs text-muted-foreground uppercase">{file.file_type}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(file.file_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments">
                {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Aucun devoir disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map(assignment => (
                      <div key={assignment.id} className="border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-display text-lg text-foreground">{assignment.title}</h3>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                            )}
                          </div>
                          <span className="text-sm text-rainbow-purple font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {assignment.max_points} pts
                          </span>
                        </div>
                        
                        {assignment.due_date && (
                          <p className="text-sm text-rainbow-coral mb-4 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Date limite: {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        
                        {assignment.instructions && (
                          <div className="bg-muted/50 p-4 rounded-lg mb-4">
                            <p className="text-sm font-body text-foreground whitespace-pre-wrap">
                              {assignment.instructions}
                            </p>
                          </div>
                        )}
                        
                        <Button 
                          className="btn-3d bg-primary"
                          onClick={() => navigate(`/assignment/${assignment.id}`)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Rendre le devoir
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="card-sticker bg-card p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-display text-foreground mb-2">
              Contenu bientôt disponible
            </h2>
            <p className="text-muted-foreground">
              Le contenu de ce cours sera bientôt ajouté. Revenez plus tard !
            </p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default CourseView;
