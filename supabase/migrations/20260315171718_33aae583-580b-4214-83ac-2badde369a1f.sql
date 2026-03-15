
CREATE TABLE public.api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id character varying NOT NULL,
  api_key_id uuid REFERENCES public.api_keys(id),
  key_prefix character varying(12),
  method character varying(10) NOT NULL,
  path text NOT NULL,
  status_code integer NOT NULL,
  request_body jsonb,
  response_body jsonb,
  response_time_ms integer,
  ip_address character varying,
  user_agent text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_request_logs_tenant ON public.api_request_logs(tenant_id);
CREATE INDEX idx_api_request_logs_created ON public.api_request_logs(created_at DESC);
CREATE INDEX idx_api_request_logs_key ON public.api_request_logs(api_key_id);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.api_request_logs
  FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());

CREATE POLICY "service_role_all" ON public.api_request_logs
  FOR ALL TO service_role
  USING (true);

GRANT ALL ON public.api_request_logs TO service_role;
GRANT SELECT ON public.api_request_logs TO authenticated;
