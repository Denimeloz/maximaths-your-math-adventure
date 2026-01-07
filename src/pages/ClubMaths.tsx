import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Star,
  FileText,
  BookOpen,
  Puzzle,
  Lightbulb,
  Trophy
} from 'lucide-react';

interface ClubActivity {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  order_index: number;
  is_published: boolean;
}

interface ClubSubject {
  id: string;
  activity_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  correction_url: string | null;
  order_index: number;
  is_published: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  puzzle: Puzzle,
  book: BookOpen,
  lightbulb: Lightbulb,
  trophy: Trophy,
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Puzzle;
};

const ClubMaths = () => {
  const { activitySlug } = useParams<{ activitySlug?: string }>();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ClubActivity[]>([]);
  const [subjects, setSubjects] = useState<ClubSubject[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ClubActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (activitySlug && activities.length > 0) {
      const activity = activities.find(a => 
        a.title.toLowerCase().replace(/\s+/g, '-') === activitySlug ||
        a.id === activitySlug
      );
      if (activity) {
        setSelectedActivity(activity);
        fetchSubjects(activity.id);
      }
    } else {
      setSelectedActivity(null);
      setSubjects([]);
    }
  }, [activitySlug, activities]);

  const fetchActivities = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('club_activities')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true });
    
    if (data) setActivities(data);
    setIsLoading(false);
  };

  const fetchSubjects = async (activityId: string) => {
    const { data } = await supabase
      .from('club_subjects')
      .select('*')
      .eq('activity_id', activityId)
      .eq('is_published', true)
      .order('order_index', { ascending: true });
    
    if (data) setSubjects(data);
  };

  const handleActivityClick = (activity: ClubActivity) => {
    const slug = activity.title.toLowerCase().replace(/\s+/g, '-');
    navigate(`/club-maths/${slug}`);
  };

  const renderActivitiesList = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activities.map((activity) => {
        const Icon = getIconComponent(activity.icon);
        return (
          <div 
            key={activity.id}
            className="card-sticker bg-card border-rainbow-pink/30 hover:border-rainbow-pink p-6 cursor-pointer group"
            onClick={() => handleActivityClick(activity)}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-display text-foreground group-hover:text-rainbow-pink transition-colors">
                {activity.title}
              </h3>
            </div>
            
            {activity.description && (
              <p className="text-muted-foreground font-body text-sm line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderSubjects = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject) => (
        <div 
          key={subject.id}
          className="card-sticker bg-card border-rainbow-pink/30 hover:border-rainbow-pink p-6 group"
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-rainbow-pink" />
            <span className="text-xs font-body text-muted-foreground">
              {selectedActivity?.title}
            </span>
          </div>
          
          <h3 className="text-xl font-display text-foreground mb-2">
            {subject.title}
          </h3>
          
          {subject.description && (
            <p className="text-muted-foreground font-body text-sm mb-4 line-clamp-2">
              {subject.description}
            </p>
          )}
          
          <div className="flex gap-3 pt-4 border-t border-border">
            {subject.file_url && (
              <a 
                href={subject.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-rainbow-blue hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Sujet
              </a>
            )}
            {subject.correction_url && (
              <a 
                href={subject.correction_url} 
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

  const renderEmptyState = () => (
    <div className="card-sticker bg-card border-border p-12 text-center max-w-xl mx-auto">
      <Puzzle className="w-20 h-20 mx-auto mb-6 text-rainbow-pink opacity-50" />
      <h2 className="text-2xl font-display text-foreground mb-4">
        {selectedActivity ? 'Aucun sujet disponible' : 'Aucune activité disponible'}
      </h2>
      <p className="text-muted-foreground font-body mb-6">
        {selectedActivity 
          ? 'Les sujets pour cette activité seront ajoutés prochainement.'
          : 'Les activités du club seront bientôt disponibles.'}
      </p>
      <Button onClick={() => navigate('/')} className="btn-3d bg-primary rounded-xl">
        <Star className="w-4 h-4 mr-2" />
        Retour à l'accueil
      </Button>
    </div>
  );

  const hasContent = selectedActivity ? subjects.length > 0 : activities.length > 0;

  return (
    <div className="min-h-screen bg-sky-cloud">
      <Header />
      
      <main className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => selectedActivity ? navigate('/club-maths') : navigate('/')}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {selectedActivity ? 'Retour aux activités' : 'Retour à l\'accueil'}
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center shadow-lg">
              {selectedActivity ? (
                React.createElement(getIconComponent(selectedActivity.icon), { className: "w-8 h-8 text-white" })
              ) : (
                <Puzzle className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display text-foreground">
                {selectedActivity?.title || 'Club de maths Jules Verne'}
              </h1>
              <p className="text-muted-foreground font-body">
                {selectedActivity?.description || 'Énigmes, défis et projets mathématiques'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-rainbow-pink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hasContent ? (
          selectedActivity ? renderSubjects() : renderActivitiesList()
        ) : (
          renderEmptyState()
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ClubMaths;
