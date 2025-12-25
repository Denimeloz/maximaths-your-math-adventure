import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, FileText, ClipboardList, X, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  type: 'course' | 'lesson' | 'exercise';
  courseId?: string;
  level?: string;
}

interface GlobalSearchProps {
  onClose?: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const searchTerm = `%${query.trim()}%`;

      const [coursesRes, lessonsRes, exercisesRes] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, level')
          .eq('is_published', true)
          .ilike('title', searchTerm)
          .limit(5),
        supabase
          .from('lessons')
          .select('id, title, course_id')
          .eq('is_published', true)
          .ilike('title', searchTerm)
          .limit(5),
        supabase
          .from('exercises')
          .select('id, title, course_id')
          .eq('is_published', true)
          .ilike('title', searchTerm)
          .limit(5),
      ]);

      const allResults: SearchResult[] = [
        ...(coursesRes.data || []).map(c => ({
          id: c.id,
          title: c.title,
          type: 'course' as const,
          level: c.level,
        })),
        ...(lessonsRes.data || []).map(l => ({
          id: l.id,
          title: l.title,
          type: 'lesson' as const,
          courseId: l.course_id,
        })),
        ...(exercisesRes.data || []).map(e => ({
          id: e.id,
          title: e.title,
          type: 'exercise' as const,
          courseId: e.course_id,
        })),
      ];

      setResults(allResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'course') {
      navigate(`/course/${result.id}`);
    } else if (result.courseId) {
      navigate(`/course/${result.courseId}`);
    }
    setIsOpen(false);
    setQuery('');
    onClose?.();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4 text-rainbow-purple" />;
      case 'lesson': return <FileText className="w-4 h-4 text-rainbow-blue" />;
      case 'exercise': return <ClipboardList className="w-4 h-4 text-rainbow-green" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course': return 'Cours';
      case 'lesson': return 'Leçon';
      case 'exercise': return 'Exercice';
      default: return type;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher cours, leçons, exercices..."
          className="pl-10 pr-10 rounded-xl bg-background/50 border-border"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Aucun résultat pour "{query}"
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {getIcon(result.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-foreground truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground">{getTypeLabel(result.type)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
