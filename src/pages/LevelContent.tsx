import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Star,
  Lightbulb,
  Dumbbell,
  Target,
  Megaphone,
  Camera,
  Video,
  Gamepad2,
  ExternalLink
} from 'lucide-react';

type ContentType = 'cours' | 'activites' | 'infos' | 'exercices-entrainement' | 'tests-entrainement' | 'devoirs' | 'evaluations' | 'prepa-dnb' | 'classe-activite' | 'jeux-genially';
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
  infos: {
    icon: Megaphone,
    title: 'Informations pour la classe',
    description: 'Directives et informations importantes'
  },
  activites: {
    icon: Lightbulb,
    title: 'Activité de découverte',
    description: 'Exploration et découverte de nouvelles notions'
  },
  cours: {
    icon: BookOpen,
    title: 'Cours',
    description: 'Tous les chapitres et leçons'
  },
  'exercices-entrainement': {
    icon: Dumbbell,
    title: "Exercices d'entraînement",
    description: 'Exercices pour pratiquer et renforcer vos compétences'
  },
  'tests-entrainement': {
    icon: Target,
    title: "Tests (Évaluations formatives)",
    description: 'Tests pour évaluer vos connaissances'
  },
  devoirs: {
    icon: FileText,
    title: 'Devoirs de niveaux',
    description: 'Exercices et travaux pratiques'
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
  },
  'classe-activite': {
    icon: Camera,
    title: 'Classe en activité',
    description: 'Photos et moments de classe en action'
  },
  'jeux-genially': {
    icon: Gamepad2,
    title: 'Jeux et Genially',
    description: 'Jeux éducatifs et présentations interactives'
  }
};

interface LinkItem {
  title: string;
  url: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  category: string;
  video_links?: LinkItem[] | null;
  game_links?: LinkItem[] | null;
}

interface Activity {
  id: string;
  title: string;
  description: string | null;
  level: string;
  file_url: string | null;
  correction_url: string | null;
}

interface FileAttachment {
  url: string;
  name: string;
}

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
}

interface ClassInfo {
  id: string;
  title: string;
  content: string | null;
  level: string;
  file_url: string | null;
  file_urls: FileAttachment[] | null;
}

interface Activity {
  id: string;
  title: string;
  description: string | null;
  level: string;
  file_url: string | null;
  correction_url: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  file_url: string | null;
  correction_url: string | null;
}

interface Evaluation {
  id: string;
  title: string;
  description: string | null;
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

interface TrainingExercise {
  id: string;
  title: string;
  description: string | null;
  level: string;
  file_url: string | null;
  correction_url: string | null;
}

interface TrainingTest {
  id: string;
  title: string;
  description: string | null;
  level: string;
  file_url: string | null;
  correction_url: string | null;
}

interface GamesGeniallyItem {
  id: string;
  title: string;
  description: string | null;
  level: string;
  file_url: string | null;
  links: { title: string; url: string }[] | null;
}

const LevelContent = () => {
  const { levelId, contentType } = useParams<{ levelId: string; contentType: string }>();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [classInfos, setClassInfos] = useState<ClassInfo[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [dnbContent, setDnbContent] = useState<DnbContent[]>([]);
  const [trainingExercises, setTrainingExercises] = useState<TrainingExercise[]>([]);
  const [trainingTests, setTrainingTests] = useState<TrainingTest[]>([]);
  const [classPhotos, setClassPhotos] = useState<ClassPhoto[]>([]);
  const [gamesGenially, setGamesGenially] = useState<GamesGeniallyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const level = levelId as CourseLevel;
  const type = contentType as ContentType;
  const config = { ...(contentConfig[type] || contentConfig.cours) };
  if (type === 'tests-entrainement' && level === '3eme') {
    config.title = 'Tests ou Mini DNB';
  }
  const Icon = config.icon;
  const color = levelColors[level] || 'rainbow-blue';

  useEffect(() => {
    if (contentType === 'ressources-dnb') {
      navigate('/ressources-dnb', { replace: true });
      return;
    }
    if (levelId && contentType) {
      fetchContent();
    }
  }, [levelId, contentType, navigate]);

  const fetchContent = async () => {
    setIsLoading(true);
    
    if (type === 'cours') {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .neq('category', 'activite')
        .order('order_index', { ascending: true });
      
      if (data) setCourses(data as unknown as Course[]);
    }
    else if (type === 'activites') {
      // Activities from dedicated table
      const { data } = await (supabase as any)
        .from('activities')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setActivities(data as Activity[]);
    }
    else if (type === 'infos') {
      // Class information
      const { data } = await (supabase as any)
        .from('class_info')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setClassInfos(data as ClassInfo[]);
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
    else if (type === 'exercices-entrainement') {
      const { data } = await supabase
        .from('training_exercises')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setTrainingExercises(data as TrainingExercise[]);
    }
    else if (type === 'tests-entrainement') {
      const { data } = await supabase
        .from('training_tests')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setTrainingTests(data as TrainingTest[]);
    }
    else if (type === 'prepa-dnb') {
      const { data } = await supabase
        .from('dnb_content')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setDnbContent(data as DnbContent[]);
    }
    else if (type === 'classe-activite') {
      const { data } = await (supabase as any)
        .from('class_photos')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setClassPhotos(data as ClassPhoto[]);
    }
    else if (type === 'jeux-genially') {
      const { data } = await (supabase as any)
        .from('games_genially')
        .select('*')
        .eq('level', level)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (data) setGamesGenially(data as GamesGeniallyItem[]);
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

          {/* Video & Game links */}
          {(() => {
            const videoLinks: LinkItem[] = Array.isArray((course as any).video_links) ? (course as any).video_links : [];
            const gameLinks: LinkItem[] = Array.isArray((course as any).game_links) ? (course as any).game_links : [];
            if (videoLinks.length === 0 && gameLinks.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-2 mb-4">
                {videoLinks.map((link, idx) => (
                  <a
                    key={`v-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rainbow-coral/10 text-rainbow-coral hover:bg-rainbow-coral/20 transition-colors`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    {link.title || 'Vidéo'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
                {gameLinks.map((link, idx) => (
                  <a
                    key={`g-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rainbow-green/10 text-rainbow-green hover:bg-rainbow-green/20 transition-colors`}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    {link.title || 'Jeu'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            );
          })()}
          
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

  const renderActivities = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activities.map((activity) => (
        <div 
          key={activity.id}
          className={`card-sticker bg-card border-${color}/30 hover:border-${color} p-6 group`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className={`w-5 h-5 text-${color}`} />
            <span className="text-xs font-body text-muted-foreground">
              Activité de découverte
            </span>
          </div>
          
          <h3 className={`text-xl font-display text-foreground mb-2`}>
            {activity.title}
          </h3>
          
          {activity.description && (
            <p className="text-muted-foreground font-body text-sm mb-4 line-clamp-2">
              {activity.description}
            </p>
          )}
          
          <div className="flex gap-3 pt-4 border-t border-border">
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
      ))}
    </div>
  );

  const renderClassInfos = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classInfos.map((info) => (
        <div 
          key={info.id}
          className={`card-sticker bg-card border-${color}/30 hover:border-${color} p-6 group`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className={`w-5 h-5 text-${color}`} />
            <span className="text-xs font-body text-muted-foreground">
              Information importante
            </span>
          </div>
          
          <h3 className={`text-xl font-display text-foreground mb-2`}>
            {info.title}
          </h3>
          
          {info.content && (
            <p className="text-muted-foreground font-body text-sm mb-4 whitespace-pre-wrap">
              {info.content}
            </p>
          )}
          
          {((info.file_urls && info.file_urls.length > 0) || info.file_url) && (
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Pièces jointes :</p>
              {info.file_urls && info.file_urls.map((file, idx) => (
                <a 
                  key={idx}
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  {file.name}
                </a>
              ))}
              {!info.file_urls?.length && info.file_url && (
                <a 
                  href={info.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  Pièce jointe
                </a>
              )}
            </div>
          )}
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
              Devoir de niveau
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

  const renderTrainingExercises = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trainingExercises.map((exercise) => (
        <div 
          key={exercise.id}
          className={`card-sticker bg-card border-${color}/30 hover:border-${color} p-6 group`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className={`w-5 h-5 text-${color}`} />
            <span className="text-xs font-body text-muted-foreground">
              Exercice d'entraînement
            </span>
          </div>
          
          <h3 className={`text-xl font-display text-foreground mb-2`}>
            {exercise.title}
          </h3>
          
          {exercise.description && (
            <p className="text-muted-foreground font-body text-sm mb-4 line-clamp-2">
              {exercise.description}
            </p>
          )}
          
          <div className="flex gap-3 pt-4 border-t border-border">
            {exercise.file_url && (
              <a 
                href={exercise.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Sujet
              </a>
            )}
            {exercise.correction_url && (
              <a 
                href={exercise.correction_url} 
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

  const renderTrainingTests = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trainingTests.map((test) => (
        <div 
          key={test.id}
          className={`card-sticker bg-card border-${color}/30 hover:border-${color} p-6 group`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className={`w-5 h-5 text-${color}`} />
            <span className="text-xs font-body text-muted-foreground">
              Test d'entraînement
            </span>
          </div>
          
          <h3 className={`text-xl font-display text-foreground mb-2`}>
            {test.title}
          </h3>
          
          {test.description && (
            <p className="text-muted-foreground font-body text-sm mb-4 line-clamp-2">
              {test.description}
            </p>
          )}
          
          <div className="flex gap-3 pt-4 border-t border-border">
            {test.file_url && (
              <a 
                href={test.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Sujet
              </a>
            )}
            {test.correction_url && (
              <a 
                href={test.correction_url} 
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
              Évaluation
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

  const renderClassPhotos = () => (
    <div className="space-y-8">
      {classPhotos.map((album) => (
        <div key={album.id} className={`card-sticker bg-card border-${color}/30 p-6`}>
          <div className="flex items-center gap-2 mb-3">
            <Camera className={`w-5 h-5 text-${color}`} />
            <span className="text-xs font-body text-muted-foreground">Classe en activité</span>
          </div>
          
          <h3 className="text-xl font-display text-foreground mb-2">{album.title}</h3>
          
          {album.description && (
            <p className="text-muted-foreground font-body text-sm mb-4">{album.description}</p>
          )}
          
          {Array.isArray(album.image_urls) && album.image_urls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {album.image_urls.map((img, idx) => (
                <a
                  key={idx}
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors group"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderGamesGenially = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gamesGenially.map((item) => (
        <div 
          key={item.id}
          className={`card-sticker bg-card border-${color}/30 hover:border-${color} p-6 group`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Gamepad2 className={`w-5 h-5 text-${color}`} />
            <span className="text-xs font-body text-muted-foreground">
              Jeux et Genially
            </span>
          </div>
          
          <h3 className="text-xl font-display text-foreground mb-2">
            {item.title}
          </h3>
          
          {item.description && (
            <p className="text-muted-foreground font-body text-sm mb-4 line-clamp-2">
              {item.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            {item.file_url && (
              <a 
                href={item.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Fichier
              </a>
            )}
            {Array.isArray(item.links) && item.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rainbow-green/10 text-rainbow-green hover:bg-rainbow-green/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {link.title || 'Lien'}
              </a>
            ))}
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

    if (type === 'cours') {
      return courses.length > 0 ? renderCourses() : renderEmptyState();
    } else if (type === 'infos') {
      return classInfos.length > 0 ? renderClassInfos() : renderEmptyState();
    } else if (type === 'activites') {
      return activities.length > 0 ? renderActivities() : renderEmptyState();
    } else if (type === 'exercices-entrainement') {
      return trainingExercises.length > 0 ? renderTrainingExercises() : renderEmptyState();
    } else if (type === 'tests-entrainement') {
      return trainingTests.length > 0 ? renderTrainingTests() : renderEmptyState();
    } else if (type === 'devoirs') {
      return assignments.length > 0 ? renderAssignments() : renderEmptyState();
    } else if (type === 'evaluations') {
      return evaluations.length > 0 ? renderEvaluations() : renderEmptyState();
    } else if (type === 'prepa-dnb') {
      return dnbContent.length > 0 ? renderDnbContent() : renderEmptyState();
    } else if (type === 'classe-activite') {
      return classPhotos.length > 0 ? renderClassPhotos() : renderEmptyState();
    } else if (type === 'jeux-genially') {
      return gamesGenially.length > 0 ? renderGamesGenially() : renderEmptyState();
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