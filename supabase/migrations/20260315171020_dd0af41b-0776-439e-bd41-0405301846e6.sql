
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id character varying NOT NULL,
  user_id character varying NOT NULL,
  key_hash text NOT NULL,
  key_prefix character varying(12) NOT NULL,
  name character varying NOT NULL,
  scopes text[] NOT NULL DEFAULT '{read}',
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by character varying
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Tenant-scoped read
CREATE POLICY "tenant_read" ON public.api_keys
  FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());

-- Tenant-scoped insert
CREATE POLICY "tenant_insert" ON public.api_keys
  FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());

-- Tenant-scoped update (for revoking, updating last_used_at)
CREATE POLICY "tenant_update" ON public.api_keys
  FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());

-- Service role full access (for edge function using service role key)
CREATE POLICY "service_role_all" ON public.api_keys
  FOR ALL TO service_role
  USING (true);
