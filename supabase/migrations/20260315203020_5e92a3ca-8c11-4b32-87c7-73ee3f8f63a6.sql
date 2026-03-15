
-- Transport vehicles (coaches, buses, minibuses)
CREATE TABLE public.transport_vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id character varying NOT NULL,
  instance_id character varying NOT NULL,
  name character varying NOT NULL,
  vehicle_type character varying NOT NULL DEFAULT 'coach',
  registration character varying,
  capacity integer,
  driver_name character varying,
  driver_phone character varying,
  operator character varying,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.transport_vehicles FOR SELECT TO authenticated USING ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_insert" ON public.transport_vehicles FOR INSERT TO authenticated WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_update" ON public.transport_vehicles FOR UPDATE TO authenticated USING ((tenant_id)::text = get_my_tenant_id()) WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_delete" ON public.transport_vehicles FOR DELETE TO authenticated USING ((tenant_id)::text = get_my_tenant_id());

-- Transport legs (journeys with pickup/dropoff points)
CREATE TABLE public.transport_legs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id character varying NOT NULL,
  instance_id character varying NOT NULL,
  vehicle_id uuid REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  leg_type character varying NOT NULL DEFAULT 'outbound',
  departure_location character varying NOT NULL,
  arrival_location character varying NOT NULL,
  departure_time timestamp with time zone,
  arrival_time timestamp with time zone,
  status character varying NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_legs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.transport_legs FOR SELECT TO authenticated USING ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_insert" ON public.transport_legs FOR INSERT TO authenticated WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_update" ON public.transport_legs FOR UPDATE TO authenticated USING ((tenant_id)::text = get_my_tenant_id()) WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_delete" ON public.transport_legs FOR DELETE TO authenticated USING ((tenant_id)::text = get_my_tenant_id());

-- Transport passenger manifest
CREATE TABLE public.transport_passengers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  leg_id uuid NOT NULL REFERENCES public.transport_legs(id) ON DELETE CASCADE,
  participant_id character varying NOT NULL,
  checked_in boolean NOT NULL DEFAULT false,
  checked_in_at timestamp with time zone,
  checked_in_by character varying,
  pickup_point character varying,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read" ON public.transport_passengers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON public.transport_passengers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON public.transport_passengers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON public.transport_passengers FOR DELETE TO authenticated USING (true);

-- Equipment inventory
CREATE TABLE public.equipment_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id character varying NOT NULL,
  instance_id character varying,
  name character varying NOT NULL,
  category character varying NOT NULL DEFAULT 'general',
  serial_number character varying,
  total_quantity integer NOT NULL DEFAULT 1,
  available_quantity integer NOT NULL DEFAULT 1,
  condition character varying NOT NULL DEFAULT 'good',
  location character varying,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON public.equipment_items FOR SELECT TO authenticated USING ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_insert" ON public.equipment_items FOR INSERT TO authenticated WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_update" ON public.equipment_items FOR UPDATE TO authenticated USING ((tenant_id)::text = get_my_tenant_id()) WITH CHECK ((tenant_id)::text = get_my_tenant_id());
CREATE POLICY "tenant_delete" ON public.equipment_items FOR DELETE TO authenticated USING ((tenant_id)::text = get_my_tenant_id());

-- Equipment checkouts
CREATE TABLE public.equipment_checkouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id uuid NOT NULL REFERENCES public.equipment_items(id) ON DELETE CASCADE,
  instance_id character varying NOT NULL,
  checked_out_to character varying NOT NULL,
  checked_out_to_type character varying NOT NULL DEFAULT 'group',
  quantity integer NOT NULL DEFAULT 1,
  checked_out_by character varying,
  checked_out_by_name character varying,
  checked_out_at timestamp with time zone NOT NULL DEFAULT now(),
  expected_return_at timestamp with time zone,
  returned_at timestamp with time zone,
  returned_by character varying,
  return_condition character varying,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read" ON public.equipment_checkouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON public.equipment_checkouts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON public.equipment_checkouts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON public.equipment_checkouts FOR DELETE TO authenticated USING (true);
