-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for course files
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for course-files bucket
CREATE POLICY "Course files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-files');

CREATE POLICY "Admins can upload course files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update course files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete course files"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'admin'));