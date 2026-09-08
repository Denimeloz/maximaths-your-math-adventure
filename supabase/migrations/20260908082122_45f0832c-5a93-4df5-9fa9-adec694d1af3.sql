GRANT SELECT ON public.site_labels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_labels TO authenticated;
GRANT ALL ON public.site_labels TO service_role;
ALTER TABLE public.site_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY sitelabels_public_read ON public.site_labels FOR SELECT USING (true);
CREATE POLICY sitelabels_admin_all ON public.site_labels FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));