
-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavior_cases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_comments TO authenticated;
GRANT SELECT ON public.behavior_cases TO anon;
GRANT SELECT ON public.case_actions TO anon;
GRANT SELECT ON public.case_comments TO anon;
