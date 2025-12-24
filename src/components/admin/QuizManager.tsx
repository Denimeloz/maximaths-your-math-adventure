import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff, Save, X, HelpCircle, Upload, FileText, Loader2 } from 'lucide-react';

interface Quiz {
  id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  is_published: boolean;
  order_index: number;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  points: number;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
}

interface QuizManagerProps {
  courses: Course[];
}

export const QuizManager: React.FC<QuizManagerProps> = ({ courses }) => {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const [quizForm, setQuizForm] = useState({
    course_id: '',
    title: '',
    description: '',
    passing_score: 60,
    time_limit_minutes: 30,
  });

  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: '',
    points: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [quizzesRes, questionsRes] = await Promise.all([
      supabase.from('quizzes').select('*').order('order_index'),
      supabase.from('quiz_questions').select('*').order('order_index'),
    ]);
    if (quizzesRes.data) setQuizzes(quizzesRes.data);
    if (questionsRes.data) {
      setQuestions(questionsRes.data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options as string[] : []
      })));
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim() || !quizForm.course_id) {
      toast({ title: "Erreur", description: "Titre et cours requis", variant: "destructive" });
      return;
    }

    if (editingQuiz) {
      const { error } = await supabase
        .from('quizzes')
        .update({
          title: quizForm.title,
          description: quizForm.description || null,
          passing_score: quizForm.passing_score,
          time_limit_minutes: quizForm.time_limit_minutes || null,
        })
        .eq('id', editingQuiz.id);

      if (!error) {
        toast({ title: "Succès", description: "Quiz modifié" });
        fetchData();
        resetQuizForm();
      }
    } else {
      const quizzesForCourse = quizzes.filter(q => q.course_id === quizForm.course_id);
      const { error } = await supabase
        .from('quizzes')
        .insert({
          course_id: quizForm.course_id,
          title: quizForm.title,
          description: quizForm.description || null,
          passing_score: quizForm.passing_score,
          time_limit_minutes: quizForm.time_limit_minutes || null,
          order_index: quizzesForCourse.length,
        });

      if (!error) {
        toast({ title: "Succès", description: "Quiz créé" });
        fetchData();
        resetQuizForm();
      }
    }
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim() || !selectedQuizId) {
      toast({ title: "Erreur", description: "Question requise", variant: "destructive" });
      return;
    }

    const validOptions = questionForm.options.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast({ title: "Erreur", description: "Minimum 2 options", variant: "destructive" });
      return;
    }

    const questionsForQuiz = questions.filter(q => q.quiz_id === selectedQuizId);
    const { error } = await supabase
      .from('quiz_questions')
      .insert({
        quiz_id: selectedQuizId,
        question: questionForm.question,
        options: validOptions,
        correct_answer: questionForm.correct_answer,
        explanation: questionForm.explanation || null,
        points: questionForm.points,
        order_index: questionsForQuiz.length,
      });

    if (!error) {
      toast({ title: "Succès", description: "Question ajoutée" });
      fetchData();
      resetQuestionForm();
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Supprimer ce quiz et toutes ses questions ?")) return;
    await supabase.from('quizzes').delete().eq('id', id);
    toast({ title: "Supprimé" });
    fetchData();
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    await supabase.from('quiz_questions').delete().eq('id', id);
    toast({ title: "Supprimé" });
    fetchData();
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    await supabase.from('quizzes').update({ is_published: !quiz.is_published }).eq('id', quiz.id);
    fetchData();
  };

  const resetQuizForm = () => {
    setShowQuizForm(false);
    setEditingQuiz(null);
    setQuizForm({ course_id: '', title: '', description: '', passing_score: 60, time_limit_minutes: 30 });
  };

  const resetQuestionForm = () => {
    setShowQuestionForm(false);
    setQuestionForm({ question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '', points: 1 });
  };

  const filteredQuizzes = selectedCourse
    ? quizzes.filter(q => q.course_id === selectedCourse)
    : quizzes;

  const getQuestionsForQuiz = (quizId: string) => questions.filter(q => q.quiz_id === quizId);

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return 'Non assigné';
    return courses.find(c => c.id === courseId)?.title || 'Inconnu';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground">Gestion des Quiz</h2>
        <Button onClick={() => setShowQuizForm(true)} className="btn-3d bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau quiz
        </Button>
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

      {showQuizForm && (
        <div className="card-sticker bg-card border-rainbow-green/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display text-foreground">
              {editingQuiz ? 'Modifier le quiz' : 'Nouveau quiz'}
            </h3>
            <Button variant="ghost" size="icon" onClick={resetQuizForm}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Cours *</label>
              <select
                value={quizForm.course_id}
                onChange={(e) => setQuizForm(prev => ({ ...prev, course_id: e.target.value }))}
                className="w-full p-2 rounded-xl border border-input bg-background"
                disabled={!!editingQuiz}
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
                value={quizForm.title}
                onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du quiz"
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={quizForm.description}
                onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="rounded-xl"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body text-muted-foreground mb-1 block">Score de réussite (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={quizForm.passing_score}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 60 }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-body text-muted-foreground mb-1 block">Durée (min)</label>
                <Input
                  type="number"
                  min={1}
                  value={quizForm.time_limit_minutes}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) || 30 }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveQuiz} className="btn-3d bg-primary rounded-xl">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button onClick={resetQuizForm} variant="outline" className="rounded-xl">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {showQuestionForm && selectedQuizId && (
        <div className="card-sticker bg-card border-rainbow-blue/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display text-foreground">Ajouter une question</h3>
            <Button variant="ghost" size="icon" onClick={resetQuestionForm}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Question *</label>
              <Textarea
                value={questionForm.question}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Votre question"
                className="rounded-xl"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Options de réponse *</label>
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    name="correct_answer"
                    checked={questionForm.correct_answer === index}
                    onChange={() => setQuestionForm(prev => ({ ...prev, correct_answer: index }))}
                    className="w-4 h-4"
                  />
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[index] = e.target.value;
                      setQuestionForm(prev => ({ ...prev, options: newOptions }));
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="rounded-xl flex-1"
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Sélectionnez la bonne réponse</p>
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Explication</label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explication de la réponse"
                className="rounded-xl"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Points</label>
              <Input
                type="number"
                min={1}
                value={questionForm.points}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                className="rounded-xl w-24"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveQuestion} className="btn-3d bg-primary rounded-xl">
                <Save className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
              <Button onClick={resetQuestionForm} variant="outline" className="rounded-xl">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredQuizzes.map(quiz => (
          <div key={quiz.id} className="card-cartoon bg-card border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-display text-foreground">{quiz.title}</p>
                <p className="text-sm text-muted-foreground">{getCourseName(quiz.course_id)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedQuizId(quiz.id);
                    setShowQuestionForm(true);
                  }}
                  className="rounded-xl"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Question
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(quiz)} className="rounded-xl">
                  {quiz.is_published ? <Eye className="w-4 h-4 text-rainbow-green" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteQuiz(quiz.id)} className="rounded-xl text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {getQuestionsForQuiz(quiz.id).map((q, idx) => (
                <div key={q.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-rainbow-blue" />
                    <span className="text-sm">{idx + 1}. {q.question.substring(0, 50)}...</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)} className="h-8 w-8 text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {getQuestionsForQuiz(quiz.id).length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-2">Aucune question</p>
              )}
            </div>
          </div>
        ))}
        {filteredQuizzes.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Aucun quiz</p>
        )}
      </div>
    </div>
  );
};