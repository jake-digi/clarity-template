-- Restrict instance_documents storage to management users only.

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Management users can upload instance documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'instance_documents'
    AND public.is_management_user()
  );

DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
CREATE POLICY "Management users can read instance documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'instance_documents'
    AND public.is_management_user()
  );

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Management users can delete instance documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'instance_documents'
    AND public.is_management_user()
  );
