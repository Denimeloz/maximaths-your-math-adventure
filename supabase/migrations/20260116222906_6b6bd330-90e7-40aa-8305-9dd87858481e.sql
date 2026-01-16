-- Create table for class information/directives
CREATE TABLE public.class_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.class_info ENABLE ROW LEVEL SECURITY;

-- Create policies for admin management
CREATE POLICY "Admins can manage all class info" 
ON public.class_info 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for public viewing
CREATE POLICY "Anyone can view published class info" 
ON public.class_info 
FOR SELECT 
USING (is_published = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_class_info_updated_at
BEFORE UPDATE ON public.class_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();