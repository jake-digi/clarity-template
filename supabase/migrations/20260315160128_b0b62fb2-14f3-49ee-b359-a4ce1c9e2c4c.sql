CREATE TABLE public.site_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id varchar NOT NULL,
  name text NOT NULL,
  feature_type text NOT NULL DEFAULT 'other',
  description text,
  icon text,
  color text,
  geo_position jsonb,
  geo_polygon jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.site_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_features_select" ON public.site_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "site_features_insert" ON public.site_features FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "site_features_update" ON public.site_features FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "site_features_delete" ON public.site_features FOR DELETE TO authenticated USING (true);