-- Migration: Remove chapter dependency - content now links directly to courses

-- Add course_id column to lessons
ALTER TABLE public.lessons 
ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add course_id column to exercises
ALTER TABLE public.exercises 
ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add course_id column to quizzes
ALTER TABLE public.quizzes 
ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add course_id column to assignments
ALTER TABLE public.assignments 
ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add course_id column to evaluations
ALTER TABLE public.evaluations 
ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add course_id column to videos
ALTER TABLE public.videos 
ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add course_id column to course_files
ALTER TABLE public.course_files 
ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Make chapter_id optional on all tables
ALTER TABLE public.lessons ALTER COLUMN chapter_id DROP NOT NULL;
ALTER TABLE public.exercises ALTER COLUMN chapter_id DROP NOT NULL;
ALTER TABLE public.quizzes ALTER COLUMN chapter_id DROP NOT NULL;
ALTER TABLE public.assignments ALTER COLUMN chapter_id DROP NOT NULL;
ALTER TABLE public.evaluations ALTER COLUMN chapter_id DROP NOT NULL;
ALTER TABLE public.videos ALTER COLUMN chapter_id DROP NOT NULL;
ALTER TABLE public.course_files ALTER COLUMN chapter_id DROP NOT NULL;

-- Update existing data: populate course_id from chapter's course_id
UPDATE public.lessons l 
SET course_id = c.course_id 
FROM public.chapters c 
WHERE l.chapter_id = c.id AND l.course_id IS NULL;

UPDATE public.exercises e 
SET course_id = c.course_id 
FROM public.chapters c 
WHERE e.chapter_id = c.id AND e.course_id IS NULL;

UPDATE public.quizzes q 
SET course_id = c.course_id 
FROM public.chapters c 
WHERE q.chapter_id = c.id AND q.course_id IS NULL;

UPDATE public.assignments a 
SET course_id = c.course_id 
FROM public.chapters c 
WHERE a.chapter_id = c.id AND a.course_id IS NULL;

UPDATE public.evaluations ev 
SET course_id = c.course_id 
FROM public.chapters c 
WHERE ev.chapter_id = c.id AND ev.course_id IS NULL;

UPDATE public.videos v 
SET course_id = c.course_id 
FROM public.chapters c 
WHERE v.chapter_id = c.id AND v.course_id IS NULL;

UPDATE public.course_files cf 
SET course_id = c.course_id 
FROM public.chapters c 
WHERE cf.chapter_id = c.id AND cf.course_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_exercises_course_id ON public.exercises(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_course_id ON public.evaluations(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON public.videos(course_id);
CREATE INDEX IF NOT EXISTS idx_course_files_course_id ON public.course_files(course_id);