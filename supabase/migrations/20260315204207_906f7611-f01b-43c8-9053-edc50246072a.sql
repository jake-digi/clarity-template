
-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id character varying NOT NULL,
  instance_id character varying,
  title text NOT NULL,
  content text NOT NULL,
  priority character varying NOT NULL DEFAULT 'normal',
  created_by character varying,
  created_by_name character varying,
  published_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_pinned boolean DEFAULT false,
  target_groups text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.announcements FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_insert" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_update" ON public.announcements FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_delete" ON public.announcements FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());

-- Read receipts
CREATE TABLE public.announcement_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id character varying NOT NULL,
  user_name character varying,
  read_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcement_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read" ON public.announcement_read_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON public.announcement_read_receipts FOR INSERT TO authenticated WITH CHECK (true);

-- Instance documents table
CREATE TABLE public.instance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id character varying NOT NULL,
  instance_id character varying NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  file_type character varying,
  category character varying NOT NULL DEFAULT 'general',
  description text,
  uploaded_by character varying,
  uploaded_by_name character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

ALTER TABLE public.instance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.instance_documents FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_insert" ON public.instance_documents FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_update" ON public.instance_documents FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_delete" ON public.instance_documents FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());

-- Storage bucket for instance documents
INSERT INTO storage.buckets (id, name, public) VALUES ('instance_documents', 'instance_documents', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'instance_documents');

CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'instance_documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'instance_documents');
