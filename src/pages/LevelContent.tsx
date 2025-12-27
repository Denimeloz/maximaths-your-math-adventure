import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText, 
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Star
} from 'lucide-react';

type ContentType = 'cours' | 'activites' | 'devoirs' | 'evaluations' | 'prepa-dnb';
type CourseLevel = '6eme' | '5eme' | '4eme' | '3eme' | 'seconde' | 'premiere' | 'terminale';

const levelLabels: Record<CourseLevel, string> = {
  '6eme': '6ème',
  '5eme': '5ème',
  '4eme': '4ème',
  '3eme': '3ème',
  'seconde': 'Seconde',
  'premiere': 'Première',
  'terminale': 'Terminale',
};

const levelColors: Record<CourseLevel, string> = {
  '6eme': 'rainbow-blue',
  '5eme': 'rainbow-green',
  '4eme': 'rainbow-orange',
  '3eme': 'rainbow-coral',
  'seconde': 'rainbow-pink',
  'premiere': 'rainbow-purple',
  'terminale': 'rainbow-yellow',
};

const contentConfig: Record<ContentType, { icon: React.ElementType; title: string; description: string }> = {
  activites: {
    icon: BookOpen,
    title: 'Activité de découverte',
    description: 'Exploration et découverte de nouvelles notions'
  },
  cours: {
    icon: BookOpen,
    title: 'Cours',
    description: 'Tous les chapitres et leçons'
  },
  devoirs: {
    icon: FileText,
    title: 'Devoirs de niveaux',
    description: 'Exercices et travaux à rendre'
  },
  evaluations: {
    icon: ClipboardCheck,
    title: 'Évaluations',
    description: 'Tests et examens'
  },
  'prepa-dnb': {
    icon: Star,
    title: 'Prépa DNB',
    description: 'Préparation au Diplôme National du Brevet'
  }
};

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  category: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_points: number;
  level: string | null;
  file_url: string | null;
  correction_url: string | null;
}

interface Evaluation {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  max_points: number;
  level: string | null;
  file_url: string | null;
  correction_url: string | null;
}

interface DnbContent {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  correction_url: string | null;
  category: string;
  year: number | null;
}

const LevelContent = () => {
  const { levelId, contentType } = useParams<{ levelId: string; contentType: string }>();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [dnbContent, setDnbContent] = useState<DnbContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const level = levelId as CourseLevel;
  const type = contentType as ContentType;
  const config = contentConfig[type] || contentConfig.cours;
  const Icon = config.icon;
  const color = levelColors[level] || 'rainbow-blue';

  useEffect(() => {
    if (levelId && contentType) {
      fetchContent();
    }
  }, [levelId, contentType]);

  const fetchContent = async () => {
    setIsLoading(true);
    
    if (type === 'cours' || type === 'activites') {
      // For activites, we filter by category 'activite'
      const query = supabase
        .from('courses')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (type === 'activites') {
        query.eq('category', 'activite');
      } else {
        query.neq('category', 'activite');
      }
      
      const { data } = await query;
      if (data) setCourses(data as Course[]);
    } 
    else if (type === 'devoirs') {
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setAssignments(data);
    } 
    else if (type === 'evaluations') {
      const { data } = await supabase
        .from('evaluations')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setEvaluations(data);
    }
    else if (type === 'prepa-dnb') {
      const { data } = await supabase
        .from('dnb_content')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setDnbContent(data as DnbContent[]);
    }
    
    setIsLoading(false);
  };

  const renderEmptyState = () => (
    <div className="card-sticker bg-card border-border p-12 text-center max-w-xl mx-auto">
      <Icon className={`w-20 h-20 mx-auto mb-6 text-${color} opacity-50`} />
      <h2 className="text-2xl font-display text-foreground mb-4">
        Contenu bientôt disponible !
      </h2>
      <p className="text-muted-foreground font-body mb-6">
        Les {config.title.toLowerCase()} pour ce niveau seront ajoutés prochainement.
      </p>
      <Button onClick={() => navigate('/')} className="btn-3d bg-primary rounded-xl">
        <Star className="w-4 h-4 mr-2" />
        Retour à l'accueil
      </Button>
    </div>
  );

  const renderCourses = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div 
          key={course.id}
          className={`card-sticker bg-card border-${color}/30 hover:border-${color} p-6 cursor-pointer group`}
          onClick={() => navigate(`/course/${course.id}`)}
        >
          <h3 className={`text-xl font-display text-foreground mb-2 group-hover:text-${color} transition-colors`}>
            {course.title}
          </h3>
          
          {course.description && (
            <p className="text-muted-foreground font-body text-sm mb-4 line-clamp-2">
              {course.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground font-body capitalize">
              {course.category}
            </span>
            <ArrowRight className={`w-5 h-5 text-${color} group-hover:translate-x-1 transition-transform`} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderAssignments = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assignments.map((assignment) => (
        <div 
          key={assignment.id}
          className={`card-sticker bg-card border-${color}/30 hover:border-${color} p-6 group`}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className={`w-5 h-5 text-${color}`} />
            <span className="text-xs font-body text-muted-foreground">
              {assignment.max_points} points
            </span>
          </div>
          
          <h3 className={`text-xl font-display text-foreground mb-2`}>
            {assignment.title}
          </h3>
          
          {assignment.description && (
            <p className="text-muted-foreground font-body text-sm mb-4 line-clamp-2">
              {assignment.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            {assignment.due_date && (
              <span className="text-xs text-muted-foreground font-body">
                Date limite: {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
              </span>
            )}
            {assignment.file_url && (
              <a 
                href={assignment.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Sujet
              </a>
            )}
            {assignment.correction_url && (
              <a 
                href={assignment.correction_url} 
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
      ))}
    </div>
  );

  const renderEvaluations = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {evaluations.map((evaluation) => (
        <div 
          key={evaluation.id}
          className={`card-sticker bg-card border-${color}/30 hover:border-${color} p-6 group`}
        >
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className={`w-5 h-5 text-${color}`} />
            <span className="text-xs font-body text-muted-foreground">
              {evaluation.max_points} points
              {evaluation.duration_minutes && ` • ${evaluation.duration_minutes} min`}
            </span>
          </div>
          
          <h3 className={`text-xl font-display text-foreground mb-2`}>
            {evaluation.title}
          </h3>
          
          {evaluation.description && (
            <p className="text-muted-foreground font-body text-sm line-clamp-3 mb-4">
              {evaluation.description}
            </p>
          )}

          <div className="flex gap-2 pt-4 border-t border-border">
            {evaluation.file_url && (
              <a 
                href={evaluation.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Sujet
              </a>
            )}
            {evaluation.correction_url && (
              <a 
                href={evaluation.correction_url} 
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
      ))}
    </div>
  );

  const renderDnbContent = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dnbContent.map((item) => (
        <div 
          key={item.id}
          className={`card-sticker bg-card border-${color}/30 hover:border-${color} p-6 group`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Star className={`w-5 h-5 text-${color}`} />
            <span className="text-xs font-body text-muted-foreground capitalize">
              {item.category}
              {item.year && ` • ${item.year}`}
            </span>
          </div>
          
          <h3 className={`text-xl font-display text-foreground mb-2`}>
            {item.title}
          </h3>
          
          {item.description && (
            <p className="text-muted-foreground font-body text-sm line-clamp-3 mb-4">
              {item.description}
            </p>
          )}
          
          <div className="flex gap-2 pt-4 border-t border-border">
            {item.file_url && (
              <a 
                href={item.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Sujet
              </a>
            )}
            {item.correction_url && (
              <a 
                href={item.correction_url} 
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
      ))}
    </div>
  );

  const getContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (type === 'cours' || type === 'activites') {
      return courses.length > 0 ? renderCourses() : renderEmptyState();
    } else if (type === 'devoirs') {
      return assignments.length > 0 ? renderAssignments() : renderEmptyState();
    } else if (type === 'evaluations') {
      return evaluations.length > 0 ? renderEvaluations() : renderEmptyState();
    } else if (type === 'prepa-dnb') {
      return dnbContent.length > 0 ? renderDnbContent() : renderEmptyState();
    }
    
    return renderEmptyState();
  };

  if (!level || !type) {
    return null;
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      
      <main className="container mx-auto px-4 py-12 pt-24">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${color}/20 rounded-full mb-6`}>
            <Icon className={`w-5 h-5 text-${color}`} />
            <span className={`text-${color} font-body font-semibold`}>
              {levelLabels[level]} • {config.title}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            {config.title}
            <span className="text-rainbow"> {levelLabels[level]}</span>
          </h1>
          
          <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
            {config.description} pour le niveau {levelLabels[level]}
          </p>
        </div>

        {/* Content */}
        {getContent()}
      </main>
      
      <Footer />
    </div>
  );
};

export default LevelContent;