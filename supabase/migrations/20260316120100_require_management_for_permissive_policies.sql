-- Require management user for all policies that previously allowed any authenticated user.
-- Run after 20260316120000_management_access_rls.sql (is_management_user must exist).

-- case_actions
DROP POLICY IF EXISTS "auth_read" ON public.case_actions;
CREATE POLICY "auth_read" ON public.case_actions FOR SELECT TO authenticated
  USING (public.is_management_user());
DROP POLICY IF EXISTS "auth_insert" ON public.case_actions;
CREATE POLICY "auth_insert" ON public.case_actions FOR INSERT TO authenticated
  WITH CHECK (public.is_management_user());

-- case_comments
DROP POLICY IF EXISTS "auth_read" ON public.case_comments;
CREATE POLICY "auth_read" ON public.case_comments FOR SELECT TO authenticated
  USING (public.is_management_user());
DROP POLICY IF EXISTS "auth_insert" ON public.case_comments;
CREATE POLICY "auth_insert" ON public.case_comments FOR INSERT TO authenticated
  WITH CHECK (public.is_management_user());

-- site_features
DROP POLICY IF EXISTS "site_features_select" ON public.site_features;
CREATE POLICY "site_features_select" ON public.site_features FOR SELECT TO authenticated
  USING (public.is_management_user());
DROP POLICY IF EXISTS "site_features_insert" ON public.site_features;
CREATE POLICY "site_features_insert" ON public.site_features FOR INSERT TO authenticated
  WITH CHECK (public.is_management_user());
DROP POLICY IF EXISTS "site_features_update" ON public.site_features;
CREATE POLICY "site_features_update" ON public.site_features FOR UPDATE TO authenticated
  USING (public.is_management_user()) WITH CHECK (public.is_management_user());
DROP POLICY IF EXISTS "site_features_delete" ON public.site_features;
CREATE POLICY "site_features_delete" ON public.site_features FOR DELETE TO authenticated
  USING (public.is_management_user());

-- formal_warnings
DROP POLICY IF EXISTS "Authenticated users can read formal_warnings" ON public.formal_warnings;
CREATE POLICY "Authenticated users can read formal_warnings"
  ON public.formal_warnings FOR SELECT TO authenticated USING (public.is_management_user());
DROP POLICY IF EXISTS "Authenticated users can insert formal_warnings" ON public.formal_warnings;
CREATE POLICY "Authenticated users can insert formal_warnings"
  ON public.formal_warnings FOR INSERT TO authenticated WITH CHECK (public.is_management_user());
DROP POLICY IF EXISTS "Authenticated users can update formal_warnings" ON public.formal_warnings;
CREATE POLICY "Authenticated users can update formal_warnings"
  ON public.formal_warnings FOR UPDATE TO authenticated
  USING (public.is_management_user()) WITH CHECK (public.is_management_user());

-- announcement_read_receipts
DROP POLICY IF EXISTS "auth_read" ON public.announcement_read_receipts;
CREATE POLICY "auth_read" ON public.announcement_read_receipts FOR SELECT TO authenticated
  USING (public.is_management_user());
DROP POLICY IF EXISTS "auth_insert" ON public.announcement_read_receipts;
CREATE POLICY "auth_insert" ON public.announcement_read_receipts FOR INSERT TO authenticated
  WITH CHECK (public.is_management_user());

-- schedule_activity_groups
DROP POLICY IF EXISTS "auth_read" ON public.schedule_activity_groups;
CREATE POLICY "auth_read" ON public.schedule_activity_groups FOR SELECT TO authenticated
  USING (public.is_management_user());
DROP POLICY IF EXISTS "auth_insert" ON public.schedule_activity_groups;
CREATE POLICY "auth_insert" ON public.schedule_activity_groups FOR INSERT TO authenticated
  WITH CHECK (public.is_management_user());
DROP POLICY IF EXISTS "auth_delete" ON public.schedule_activity_groups;
CREATE POLICY "auth_delete" ON public.schedule_activity_groups FOR DELETE TO authenticated
  USING (public.is_management_user());

-- transport_passengers
DROP POLICY IF EXISTS "auth_read" ON public.transport_passengers;
CREATE POLICY "auth_read" ON public.transport_passengers FOR SELECT TO authenticated
  USING (public.is_management_user());
DROP POLICY IF EXISTS "auth_insert" ON public.transport_passengers;
CREATE POLICY "auth_insert" ON public.transport_passengers FOR INSERT TO authenticated
  WITH CHECK (public.is_management_user());
DROP POLICY IF EXISTS "auth_update" ON public.transport_passengers;
CREATE POLICY "auth_update" ON public.transport_passengers FOR UPDATE TO authenticated
  USING (public.is_management_user()) WITH CHECK (public.is_management_user());
DROP POLICY IF EXISTS "auth_delete" ON public.transport_passengers;
CREATE POLICY "auth_delete" ON public.transport_passengers FOR DELETE TO authenticated
  USING (public.is_management_user());

-- equipment_checkouts
DROP POLICY IF EXISTS "auth_read" ON public.equipment_checkouts;
CREATE POLICY "auth_read" ON public.equipment_checkouts FOR SELECT TO authenticated
  USING (public.is_management_user());
DROP POLICY IF EXISTS "auth_insert" ON public.equipment_checkouts;
CREATE POLICY "auth_insert" ON public.equipment_checkouts FOR INSERT TO authenticated
  WITH CHECK (public.is_management_user());
DROP POLICY IF EXISTS "auth_update" ON public.equipment_checkouts;
CREATE POLICY "auth_update" ON public.equipment_checkouts FOR UPDATE TO authenticated
  USING (public.is_management_user()) WITH CHECK (public.is_management_user());
DROP POLICY IF EXISTS "auth_delete" ON public.equipment_checkouts;
CREATE POLICY "auth_delete" ON public.equipment_checkouts FOR DELETE TO authenticated
  USING (public.is_management_user());
