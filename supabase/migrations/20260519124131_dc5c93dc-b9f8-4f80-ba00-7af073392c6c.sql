-- Create private bucket for TimeCapsule uploads if it does not already exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'timecapsule', 'timecapsule', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'timecapsule'
);

-- Ensure policies are idempotent
DROP POLICY IF EXISTS "TimeCapsule: users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "TimeCapsule: users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "TimeCapsule: users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "TimeCapsule: users can delete own files" ON storage.objects;

CREATE POLICY "TimeCapsule: users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'timecapsule'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "TimeCapsule: users can upload own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'timecapsule'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "TimeCapsule: users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'timecapsule'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'timecapsule'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "TimeCapsule: users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'timecapsule'
  AND auth.uid()::text = (storage.foldername(name))[1]
);