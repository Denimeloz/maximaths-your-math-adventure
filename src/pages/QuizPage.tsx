import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle,
  Clock,
  Trophy,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  points: number;
}

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId, user]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  const fetchQuiz = async () => {
    setIsLoading(true);
    
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('is_published', true)
      .maybeSingle();

    if (quizError || !quizData) {
      toast({
        title: "Erreur",
        description: "Quiz non trouvé",
        variant: "destructive",
      });
      navigate(-1);
      return;
    }

    setQuiz(quizData);
    
    if (quizData.time_limit_minutes) {
      setTimeLeft(quizData.time_limit_minutes * 60);
    }

    const { data: questionsData } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index');

    if (questionsData) {
      const parsedQuestions = questionsData.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
      }));
      setQuestions(parsedQuestions);
      setMaxScore(parsedQuestions.reduce((sum, q) => sum + q.points, 0));
    }

    setIsLoading(false);
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;
    
    let earnedScore = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        earnedScore += q.points;
      }
    });
    
    setScore(earnedScore);
    setIsSubmitted(true);

    // Save attempt to database
    if (user && quiz) {
      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        quiz_id: quiz.id,
        answers: answers,
        score: earnedScore,
        max_score: maxScore,
        passed: (earnedScore / maxScore) * 100 >= quiz.passing_score,
        completed_at: new Date().toISOString(),
      });
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setScore(0);
    if (quiz?.time_limit_minutes) {
      setTimeLeft(quiz.time_limit_minutes * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = quiz ? percentage >= quiz.passing_score : false;

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

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

        {quiz && (
          <div className="card-sticker bg-card p-8">
            {/* Quiz header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-display text-foreground">{quiz.title}</h1>
              {timeLeft !== null && !isSubmitted && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  timeLeft < 60 ? 'bg-destructive/20 text-destructive' : 'bg-muted'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {!isSubmitted && (
              <div className="mb-8">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Question {currentIndex + 1} sur {questions.length}</span>
                  <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
              </div>
            )}

            {/* Results */}
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  passed ? 'bg-rainbow-green/20' : 'bg-destructive/20'
                }`}>
                  {passed ? (
                    <Trophy className="w-12 h-12 text-rainbow-green" />
                  ) : (
                    <XCircle className="w-12 h-12 text-destructive" />
                  )}
                </div>
                
                <h2 className="text-3xl font-display text-foreground mb-2">
                  {passed ? 'Félicitations !' : 'Dommage...'}
                </h2>
                
                <p className="text-muted-foreground mb-6">
                  {passed 
                    ? 'Tu as réussi ce quiz !' 
                    : `Score minimum requis : ${quiz.passing_score}%`
                  }
                </p>
                
                <div className="flex items-center justify-center gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-4xl font-display text-rainbow-purple">{percentage}%</p>
                    <p className="text-sm text-muted-foreground">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-display text-foreground">{score}/{maxScore}</p>
                    <p className="text-sm text-muted-foreground">Points</p>
                  </div>
                </div>

                {/* Review answers */}
                <div className="text-left space-y-4 mb-8">
                  <h3 className="font-display text-lg text-foreground">Récapitulatif</h3>
                  {questions.map((q, idx) => {
                    const userAnswer = answers[q.id];
                    const isCorrect = userAnswer === q.correct_answer;
                    
                    return (
                      <div 
                        key={q.id}
                        className={`p-4 rounded-xl border ${
                          isCorrect 
                            ? 'border-rainbow-green/50 bg-rainbow-green/10' 
                            : 'border-destructive/50 bg-destructive/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-rainbow-green flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-body text-foreground mb-2">
                              <span className="font-semibold">Q{idx + 1}:</span> {q.question}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-muted-foreground">
                                <span className="text-rainbow-green">Bonne réponse :</span> {q.options[q.correct_answer]}
                              </p>
                            )}
                            {q.explanation && (
                              <p className="text-sm text-rainbow-blue mt-2">
                                💡 {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="outline"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Réessayer
                  </Button>
                  <Button 
                    className="btn-3d bg-primary"
                    onClick={() => navigate(-1)}
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            ) : currentQuestion ? (
              /* Question display */
              <div>
                <h2 className="text-xl font-body text-foreground mb-6">
                  {currentQuestion.question}
                </h2>
                
                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(currentQuestion.id, idx)}
                      className={`w-full p-4 text-left rounded-xl border transition-all ${
                        answers[currentQuestion.id] === idx
                          ? 'border-rainbow-purple bg-rainbow-purple/20'
                          : 'border-border hover:border-rainbow-purple/50 hover:bg-muted/50'
                      }`}
                    >
                      <span className="font-body text-foreground">{option}</span>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Précédent
                  </Button>

                  {currentIndex === questions.length - 1 ? (
                    <Button
                      className="btn-3d bg-primary"
                      onClick={handleSubmit}
                      disabled={Object.keys(answers).length < questions.length}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Terminer
                    </Button>
                  ) : (
                    <Button
                      className="btn-3d bg-primary"
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                    >
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucune question dans ce quiz</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizPage;
