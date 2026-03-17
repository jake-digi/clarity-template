-- Management platform access: only users in portal_users who are active and
-- either admin or not customer-linked (staff) may access management data.
-- This migration adds a DB-level gate so orders-platform-only users cannot
-- read/write management tables even if they bypass the frontend.

-- 1) Function: true iff current auth user is a management user (in portal_users,
--    active, and either is_admin or has no customer_id).
CREATE OR REPLACE FUNCTION public.is_management_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.portal_users
    WHERE auth_id = auth.uid()
      AND (is_active IS NULL OR is_active = true)
      AND (is_admin = true OR customer_id IS NULL)
  );
$$;

COMMENT ON FUNCTION public.is_management_user() IS
  'True if the current auth user is allowed to use the management platform (portal_users row, active, admin or staff).';

-- 2) portal_users: RLS so users see only their own row unless they are management users.
ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;

-- Allow SELECT: own row (for guard check) or any row if management user (for user list).
DROP POLICY IF EXISTS "portal_users_select_own_or_management" ON public.portal_users;
CREATE POLICY "portal_users_select_own_or_management" ON public.portal_users
  FOR SELECT
  TO authenticated
  USING (
    (auth_id = auth.uid())
    OR public.is_management_user()
  );

-- No direct INSERT/UPDATE/DELETE from authenticated; use service role / edge functions only.
DROP POLICY IF EXISTS "portal_users_authenticated_insert" ON public.portal_users;
DROP POLICY IF EXISTS "portal_users_authenticated_update" ON public.portal_users;
DROP POLICY IF EXISTS "portal_users_authenticated_delete" ON public.portal_users;
-- Only create restrictive policies if we want to block all authenticated mutations.
-- Here we allow no authenticated write so that only service_role (edge functions) can mutate.
-- If no INSERT/UPDATE/DELETE policies exist for authenticated, they cannot mutate.
-- So we do nothing else; RLS is enabled and only SELECT is allowed for authenticated.
