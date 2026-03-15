
CREATE TABLE public.rbac_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  entity_name text,
  target_user_id text,
  target_user_name text,
  performed_by text,
  performed_by_name text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rbac_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.rbac_audit_logs
  FOR SELECT TO authenticated
  USING ((tenant_id = get_my_tenant_id()));

CREATE POLICY "tenant_insert" ON public.rbac_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK ((tenant_id = get_my_tenant_id()));

CREATE INDEX idx_rbac_audit_logs_tenant ON public.rbac_audit_logs (tenant_id);
CREATE INDEX idx_rbac_audit_logs_created ON public.rbac_audit_logs (created_at DESC);
