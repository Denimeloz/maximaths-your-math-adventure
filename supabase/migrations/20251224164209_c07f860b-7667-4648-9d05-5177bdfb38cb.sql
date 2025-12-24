-- Create evaluations table
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  max_points INTEGER NOT NULL DEFAULT 100,
  duration_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluation_submissions table
CREATE TABLE public.evaluation_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  file_url TEXT,
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID
);

-- Enable RLS
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_submissions ENABLE ROW LEVEL SECURITY;

-- Evaluations policies
CREATE POLICY "Admins can manage all evaluations"
  ON public.evaluations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view published evaluations"
  ON public.evaluations FOR SELECT
  USING (is_published = true);

-- Evaluation submissions policies
CREATE POLICY "Admins can manage all evaluation submissions"
  ON public.evaluation_submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own evaluation submissions"
  ON public.evaluation_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evaluation submissions"
  ON public.evaluation_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ungraded submissions"
  ON public.evaluation_submissions FOR UPDATE
  USING (auth.uid() = user_id AND graded_at IS NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();