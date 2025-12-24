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
  Lock,
  CheckCircle,
  Play,
  FileQuestion,
  Upload
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

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  order_index: number;
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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (courseId) {
      fetchCourse();
    }
  }, [courseId, user]);

  useEffect(() => {
    if (selectedChapter) {
      fetchChapterContent(selectedChapter.id);
    }
  }, [selectedChapter]);

  const fetchCourse = async () => {
    setIsLoading(true);
    
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

    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (chaptersData && chaptersData.length > 0) {
      setChapters(chaptersData);
      setSelectedChapter(chaptersData[0]);
    }

    setIsLoading(false);
  };

  const fetchChapterContent = async (chapterId: string) => {
    const [lessonsRes, exercisesRes, quizzesRes, assignmentsRes, filesRes, videosRes] = await Promise.all([
      supabase.from('lessons').select('*').eq('chapter_id', chapterId).eq('is_published', true).order('order_index'),
      supabase.from('exercises').select('*').eq('chapter_id', chapterId).eq('is_published', true).order('order_index'),
      supabase.from('quizzes').select('*').eq('chapter_id', chapterId).eq('is_published', true).order('order_index'),
      supabase.from('assignments').select('*').eq('chapter_id', chapterId).eq('is_published', true).order('order_index'),
      supabase.from('course_files').select('*').eq('chapter_id', chapterId).eq('is_published', true).order('order_index'),
      supabase.from('videos').select('*').eq('chapter_id', chapterId).eq('is_published', true).order('order_index'),
    ]);

    setLessons(lessonsRes.data || []);
    setExercises(exercisesRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setAssignments(assignmentsRes.data || []);
    setCourseFiles(filesRes.data || []);
    setVideos(videosRes.data || []);
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

  if (!user) {
    return null;
  }

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
      
      <main className="container mx-auto px-4 py-8">
        {/* Back button and course title */}
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
            <div className="flex items-start gap-6">
              {course.image_url && (
                <img 
                  src={course.image_url} 
                  alt={course.title}
                  className="w-32 h-32 object-cover rounded-xl"
                />
              )}
              <div>
                <h1 className="text-3xl font-display text-foreground mb-2">{course.title}</h1>
                {course.description && (
                  <p className="text-muted-foreground font-body">{course.description}</p>
                )}
                {course.pdf_url && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.open(course.pdf_url!, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger le PDF du cours
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chapters sidebar + content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Chapters list */}
          <div className="lg:col-span-1">
            <div className="card-sticker bg-card p-4">
              <h2 className="font-display text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-rainbow-purple" />
                Chapitres
              </h2>
              <div className="space-y-2">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedChapter?.id === chapter.id
                        ? 'bg-rainbow-purple/20 border border-rainbow-purple/50'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-sm font-body text-muted-foreground">
                      Chapitre {index + 1}
                    </span>
                    <p className="font-body text-foreground">{chapter.title}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chapter content */}
          <div className="lg:col-span-3">
            {selectedChapter ? (
              <div className="card-sticker bg-card p-6">
                <h2 className="text-2xl font-display text-foreground mb-2">
                  {selectedChapter.title}
                </h2>
                {selectedChapter.description && (
                  <p className="text-muted-foreground font-body mb-6">
                    {selectedChapter.description}
                  </p>
                )}

                <Tabs defaultValue="lessons" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 mb-6">
                    <TabsTrigger value="lessons" className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Leçons</span>
                    </TabsTrigger>
                    <TabsTrigger value="exercises" className="flex items-center gap-1">
                      <ClipboardList className="w-4 h-4" />
                      <span className="hidden sm:inline">Exercices</span>
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="flex items-center gap-1">
                      <FileQuestion className="w-4 h-4" />
                      <span className="hidden sm:inline">Quiz</span>
                    </TabsTrigger>
                    <TabsTrigger value="videos" className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      <span className="hidden sm:inline">Vidéos</span>
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Fichiers</span>
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="flex items-center gap-1">
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Devoirs</span>
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
                        {lessons.map(lesson => (
                          <div key={lesson.id} className="border border-border rounded-xl p-6">
                            <h3 className="font-display text-lg text-foreground mb-4">{lesson.title}</h3>
                            <div 
                              className="prose prose-sm max-w-none text-muted-foreground"
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
                        {exercises.map(exercise => (
                          <div key={exercise.id} className="border border-border rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-display text-lg text-foreground">{exercise.title}</h3>
                              <div className="flex items-center gap-3">
                                <span className={`text-sm font-body ${getDifficultyColor(exercise.difficulty)}`}>
                                  {getDifficultyLabel(exercise.difficulty)}
                                </span>
                                <span className="text-sm text-rainbow-purple font-semibold">
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
                          <div key={quiz.id} className="border border-border rounded-xl p-6 hover:border-rainbow-purple/50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/quiz/${quiz.id}`)}
                          >
                            <h3 className="font-display text-lg text-foreground mb-2">{quiz.title}</h3>
                            {quiz.description && (
                              <p className="text-sm text-muted-foreground mb-4">{quiz.description}</p>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              {quiz.time_limit_minutes && (
                                <span className="text-muted-foreground">
                                  ⏱️ {quiz.time_limit_minutes} min
                                </span>
                              )}
                              <span className="text-rainbow-purple font-semibold">
                                Score min: {quiz.passing_score}%
                              </span>
                            </div>
                            <Button className="w-full mt-4 btn-3d bg-primary">
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
                          <div key={file.id} className="border border-border rounded-xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-rainbow-blue/20 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-rainbow-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-body font-semibold text-foreground truncate">{file.title}</h4>
                              <p className="text-xs text-muted-foreground uppercase">{file.file_type}</p>
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
                          <div key={assignment.id} className="border border-border rounded-xl p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-display text-lg text-foreground">{assignment.title}</h3>
                                {assignment.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                                )}
                              </div>
                              <span className="text-sm text-rainbow-purple font-semibold">
                                {assignment.max_points} pts
                              </span>
                            </div>
                            
                            {assignment.due_date && (
                              <p className="text-sm text-rainbow-coral mb-4">
                                📅 Date limite: {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
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
                  Aucun chapitre disponible
                </h2>
                <p className="text-muted-foreground">
                  Les chapitres de ce cours seront bientôt disponibles.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CourseView;
