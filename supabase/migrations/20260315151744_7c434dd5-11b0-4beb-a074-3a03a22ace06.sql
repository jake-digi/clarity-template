
-- Create sites table for reusable physical locations
CREATE TABLE public.sites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id character varying NOT NULL REFERENCES public.tenants(id),
  name character varying NOT NULL,
  location character varying,
  address text,
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  deleted_at timestamp without time zone
);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.sites FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_insert" ON public.sites FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_update" ON public.sites FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_delete" ON public.sites FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id());

-- Add site_id (uuid) to instances
ALTER TABLE public.instances ADD COLUMN site_id uuid REFERENCES public.sites(id);

-- Add site_id (uuid) to blocks, make instance_id nullable for site templates
ALTER TABLE public.blocks ADD COLUMN site_id uuid REFERENCES public.sites(id);
ALTER TABLE public.blocks ALTER COLUMN instance_id DROP NOT NULL;

-- Add site_id (uuid) to rooms, make instance_id nullable for site templates
ALTER TABLE public.rooms ADD COLUMN site_id uuid REFERENCES public.sites(id);
ALTER TABLE public.rooms ALTER COLUMN instance_id DROP NOT NULL;
