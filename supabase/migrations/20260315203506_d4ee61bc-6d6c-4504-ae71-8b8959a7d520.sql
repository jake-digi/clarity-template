
-- Schedule activities / programme blocks
CREATE TABLE public.schedule_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id character varying NOT NULL,
  instance_id character varying NOT NULL,
  title character varying NOT NULL,
  description text,
  activity_type character varying NOT NULL DEFAULT 'session',
  location character varying,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  day_date date NOT NULL,
  color character varying DEFAULT '#0284c7',
  is_published boolean NOT NULL DEFAULT false,
  created_by character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

ALTER TABLE public.schedule_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.schedule_activities FOR SELECT TO authenticated USING ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_insert" ON public.schedule_activities FOR INSERT TO authenticated WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_update" ON public.schedule_activities FOR UPDATE TO authenticated USING ((tenant_id)::text = get_my_tenant_id()) WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_delete" ON public.schedule_activities FOR DELETE TO authenticated USING ((tenant_id)::text = get_my_tenant_id());

-- Activity-to-group assignments (many-to-many)
CREATE TABLE public.schedule_activity_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid NOT NULL REFERENCES public.schedule_activities(id) ON DELETE CASCADE,
  group_id character varying NOT NULL,
  group_type character varying NOT NULL DEFAULT 'subgroup',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_activity_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read" ON public.schedule_activity_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON public.schedule_activity_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete" ON public.schedule_activity_groups FOR DELETE TO authenticated USING (true);
