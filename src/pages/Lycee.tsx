import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  GraduationCap, 
  Star, 
  ArrowRight,
  Lock,
  Sparkles
} from 'lucide-react';

type CourseLevel = 'seconde' | 'premiere' | 'terminale';

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  category: string;
  is_published: boolean;
}

const Lycee = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel | 'all'>('all');

  const levels: { id: CourseLevel | 'all'; label: string; color: string }[] = [
    { id: 'all', label: 'Tous', color: 'bg-rainbow-purple' },
    { id: 'seconde', label: 'Seconde', color: 'bg-rainbow-pink' },
    { id: 'premiere', label: 'Première', color: 'bg-rainbow-orange' },
    { id: 'terminale', label: 'Terminale', color: 'bg-rainbow-coral' },
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .in('level', ['seconde', 'premiere', 'terminale'])
      .eq('is_published', true)
      .order('level', { ascending: true })
      .order('order_index', { ascending: true });

    if (!error && data) {
      setCourses(data as Course[]);
    }
    setIsLoading(false);
  };

  const filteredCourses = selectedLevel === 'all' 
    ? courses 
    : courses.filter(c => c.level === selectedLevel);

  const getLevelColor = (level: CourseLevel) => {
    const colors: Record<CourseLevel, string> = {
      'seconde': 'border-rainbow-pink/30 hover:border-rainbow-pink',
      'premiere': 'border-rainbow-orange/30 hover:border-rainbow-orange',
      'terminale': 'border-rainbow-coral/30 hover:border-rainbow-coral',
    };
    return colors[level];
  };

  const getLevelLabel = (level: CourseLevel) => {
    const labels: Record<CourseLevel, string> = {
      'seconde': 'Seconde',
      'premiere': 'Première',
      'terminale': 'Terminale',
    };
    return labels[level];
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-purple/20 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-rainbow-purple" />
            <span className="text-rainbow-purple font-body font-semibold">Niveau Lycée</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            Cours de Mathématiques
            <span className="text-rainbow"> Lycée</span>
          </h1>
          
          <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
            De la Seconde à la Terminale, prépare-toi pour le bac avec nos cours complets !
          </p>
        </div>

        {/* Level Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {levels.map((level) => (
            <Button
              key={level.id}
              variant={selectedLevel === level.id ? 'default' : 'outline'}
              onClick={() => setSelectedLevel(level.id)}
              className={`rounded-full px-6 ${
                selectedLevel === level.id ? level.color : ''
              }`}
            >
              {level.label}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCourses.length === 0 ? (
          /* Empty State */
          <div className="card-sticker bg-card border-rainbow-purple/30 p-12 text-center max-w-xl mx-auto">
            <BookOpen className="w-20 h-20 mx-auto mb-6 text-rainbow-purple opacity-50" />
            <h2 className="text-2xl font-display text-foreground mb-4">
              Cours bientôt disponibles !
            </h2>
            <p className="text-muted-foreground font-body mb-6">
              Nos équipes travaillent dur pour créer des cours de qualité. Reviens bientôt !
            </p>
            <Button onClick={() => navigate('/')} className="btn-3d bg-primary rounded-xl">
              <Star className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        ) : (
          /* Courses Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                className={`card-sticker bg-card ${getLevelColor(course.level)} p-6 cursor-pointer group`}
                onClick={() => {
                  if (user) {
                    navigate('/dashboard');
                  } else {
                    navigate('/auth');
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 bg-muted rounded-full text-xs font-body text-muted-foreground">
                    {getLevelLabel(course.level)}
                  </span>
                  {!user && <Lock className="w-5 h-5 text-muted-foreground" />}
                </div>
                
                <h3 className="text-xl font-display text-foreground mb-2 group-hover:text-rainbow-purple transition-colors">
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
                  <ArrowRight className="w-5 h-5 text-rainbow-purple group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {!user && courses.length > 0 && (
          <div className="mt-16 text-center">
            <div className="card-sticker bg-gradient-to-r from-rainbow-purple/10 to-rainbow-pink/10 border-rainbow-purple/30 p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-display text-foreground mb-4">
                Prêt pour le Bac ?
              </h2>
              <p className="text-muted-foreground font-body mb-6">
                Crée ton compte gratuit et commence à réviser dès maintenant !
              </p>
              <Button onClick={() => navigate('/auth')} className="btn-3d bg-primary rounded-xl text-lg px-8 py-6">
                Créer mon compte
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Lycee;