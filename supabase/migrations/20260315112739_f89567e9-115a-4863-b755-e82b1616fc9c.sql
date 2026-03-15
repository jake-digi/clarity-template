
-- Behavior cases table
CREATE TABLE public.behavior_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id character varying NOT NULL REFERENCES public.tenants(id),
  instance_id character varying NOT NULL REFERENCES public.instances(id),
  participant_id character varying NOT NULL REFERENCES public.participants(id),
  category character varying NOT NULL DEFAULT 'Other',
  severity_level character varying NOT NULL DEFAULT 'low',
  status character varying NOT NULL DEFAULT 'pending',
  overview text,
  location character varying DEFAULT '',
  privacy_level character varying NOT NULL DEFAULT 'normal',
  raised_by character varying REFERENCES public.users(id),
  assigned_to_id character varying REFERENCES public.users(id),
  assigned_to_name character varying,
  involves_staff_member boolean DEFAULT false,
  is_sensitive_safeguarding boolean DEFAULT false,
  requires_immediate_action boolean DEFAULT false,
  parent_notification_sent boolean DEFAULT false,
  parent_notification_date timestamp with time zone,
  associated_strike_id character varying,
  involved_staff text[] DEFAULT '{}',
  witnesses text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.behavior_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.behavior_cases FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_insert" ON public.behavior_cases FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_update" ON public.behavior_cases FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_delete" ON public.behavior_cases FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());

-- Case actions table
CREATE TABLE public.case_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.behavior_cases(id) ON DELETE CASCADE,
  instance_id character varying NOT NULL REFERENCES public.instances(id),
  participant_id character varying REFERENCES public.participants(id),
  action_type character varying NOT NULL DEFAULT 'statusChange',
  case_type character varying NOT NULL DEFAULT 'behavior',
  description text,
  old_status character varying,
  new_status character varying,
  outcome text,
  performed_by character varying REFERENCES public.users(id),
  performed_by_name character varying,
  metadata jsonb DEFAULT '{}',
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.case_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read" ON public.case_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON public.case_actions FOR INSERT TO authenticated WITH CHECK (true);

-- Case comments table
CREATE TABLE public.case_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.behavior_cases(id) ON DELETE CASCADE,
  author_id character varying NOT NULL REFERENCES public.users(id),
  author_name character varying NOT NULL,
  content text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read" ON public.case_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON public.case_comments FOR INSERT TO authenticated WITH CHECK (true);
