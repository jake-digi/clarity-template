-- Require management user for all tenant-scoped policies.
-- Orders-platform users must not see any tenant data even if get_my_tenant_id() were to return a value.

-- sites
DROP POLICY IF EXISTS "tenant_read" ON public.sites;
CREATE POLICY "tenant_read" ON public.sites FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.sites;
CREATE POLICY "tenant_insert" ON public.sites FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_update" ON public.sites;
CREATE POLICY "tenant_update" ON public.sites FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_delete" ON public.sites;
CREATE POLICY "tenant_delete" ON public.sites FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());

-- behavior_cases
DROP POLICY IF EXISTS "tenant_read" ON public.behavior_cases;
CREATE POLICY "tenant_read" ON public.behavior_cases FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.behavior_cases;
CREATE POLICY "tenant_insert" ON public.behavior_cases FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_update" ON public.behavior_cases;
CREATE POLICY "tenant_update" ON public.behavior_cases FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_delete" ON public.behavior_cases;
CREATE POLICY "tenant_delete" ON public.behavior_cases FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());

-- announcements
DROP POLICY IF EXISTS "tenant_read" ON public.announcements;
CREATE POLICY "tenant_read" ON public.announcements FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.announcements;
CREATE POLICY "tenant_insert" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_update" ON public.announcements;
CREATE POLICY "tenant_update" ON public.announcements FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_delete" ON public.announcements;
CREATE POLICY "tenant_delete" ON public.announcements FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());

-- instance_documents
DROP POLICY IF EXISTS "tenant_read" ON public.instance_documents;
CREATE POLICY "tenant_read" ON public.instance_documents FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.instance_documents;
CREATE POLICY "tenant_insert" ON public.instance_documents FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_update" ON public.instance_documents;
CREATE POLICY "tenant_update" ON public.instance_documents FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_delete" ON public.instance_documents;
CREATE POLICY "tenant_delete" ON public.instance_documents FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());

-- api_keys
DROP POLICY IF EXISTS "tenant_read" ON public.api_keys;
CREATE POLICY "tenant_read" ON public.api_keys FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.api_keys;
CREATE POLICY "tenant_insert" ON public.api_keys FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_update" ON public.api_keys;
CREATE POLICY "tenant_update" ON public.api_keys FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());

-- api_request_logs
DROP POLICY IF EXISTS "tenant_read" ON public.api_request_logs;
CREATE POLICY "tenant_read" ON public.api_request_logs FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());

-- rbac_audit_logs (uses tenant_id = get_my_tenant_id() without ::text)
DROP POLICY IF EXISTS "tenant_read" ON public.rbac_audit_logs;
CREATE POLICY "tenant_read" ON public.rbac_audit_logs FOR SELECT TO authenticated
  USING ((tenant_id = get_my_tenant_id()) AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.rbac_audit_logs;
CREATE POLICY "tenant_insert" ON public.rbac_audit_logs FOR INSERT TO authenticated
  WITH CHECK ((tenant_id = get_my_tenant_id()) AND public.is_management_user());

-- transport_vehicles
DROP POLICY IF EXISTS "tenant_read" ON public.transport_vehicles;
CREATE POLICY "tenant_read" ON public.transport_vehicles FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.transport_vehicles;
CREATE POLICY "tenant_insert" ON public.transport_vehicles FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_update" ON public.transport_vehicles;
CREATE POLICY "tenant_update" ON public.transport_vehicles FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_delete" ON public.transport_vehicles;
CREATE POLICY "tenant_delete" ON public.transport_vehicles FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());

-- transport_legs
DROP POLICY IF EXISTS "tenant_read" ON public.transport_legs;
CREATE POLICY "tenant_read" ON public.transport_legs FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.transport_legs;
CREATE POLICY "tenant_insert" ON public.transport_legs FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_update" ON public.transport_legs;
CREATE POLICY "tenant_update" ON public.transport_legs FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_delete" ON public.transport_legs;
CREATE POLICY "tenant_delete" ON public.transport_legs FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());

-- equipment_items
DROP POLICY IF EXISTS "tenant_read" ON public.equipment_items;
CREATE POLICY "tenant_read" ON public.equipment_items FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.equipment_items;
CREATE POLICY "tenant_insert" ON public.equipment_items FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_update" ON public.equipment_items;
CREATE POLICY "tenant_update" ON public.equipment_items FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_delete" ON public.equipment_items;
CREATE POLICY "tenant_delete" ON public.equipment_items FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());

-- schedule_activities
DROP POLICY IF EXISTS "tenant_read" ON public.schedule_activities;
CREATE POLICY "tenant_read" ON public.schedule_activities FOR SELECT TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_insert" ON public.schedule_activities;
CREATE POLICY "tenant_insert" ON public.schedule_activities FOR INSERT TO authenticated
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_update" ON public.schedule_activities;
CREATE POLICY "tenant_update" ON public.schedule_activities FOR UPDATE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user())
  WITH CHECK ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
DROP POLICY IF EXISTS "tenant_delete" ON public.schedule_activities;
CREATE POLICY "tenant_delete" ON public.schedule_activities FOR DELETE TO authenticated
  USING ((tenant_id)::text = get_my_tenant_id() AND public.is_management_user());
