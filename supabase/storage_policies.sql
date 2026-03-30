-- ============================================================
-- HireOS — Supabase Storage: Resumes Bucket Policies
-- Run this in Supabase SQL Editor
--
-- BEFORE running this:
-- 1. Go to Supabase Dashboard → Storage → New Bucket
-- 2. Name: resumes
-- 3. Visibility: PRIVATE (uncheck "Public bucket")
-- ============================================================

-- Allow authenticated users (admins) to upload resumes.
-- Uploads go to: resumes/{candidate_id}/resume{.pdf|.docx}
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');

-- Allow authenticated users to read/download resumes.
-- (Signed URLs are generated server-side — this just allows the signing call.)
CREATE POLICY "Authenticated users can read resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes');

-- Allow the service role to upload resumes on behalf of applicants.
-- This is needed because the apply action runs with the anon key
-- but uploads to a private bucket.
-- If your apply action runs server-side (server action), you may need
-- the service role key. See note below.
CREATE POLICY "Service role can upload resumes"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'resumes');

-- ============================================================
-- NOTE: Using the anon key for uploads
-- ============================================================
-- The apply form uses a Server Action, which runs with the key
-- configured in supabase.js (currently the publishable/anon key).
-- If uploads fail with "permission denied", add this permissive
-- policy to allow anonymous uploads:
--
-- CREATE POLICY "Anyone can upload resumes"
--   ON storage.objects FOR INSERT
--   TO anon
--   WITH CHECK (bucket_id = 'resumes');
--
-- For production, use the Supabase Service Role key in server
-- actions (stored in a non-NEXT_PUBLIC_ env var) so uploads
-- bypass RLS entirely without opening the bucket to everyone.
-- ============================================================
-- Add SUPABASE_SERVICE_ROLE_KEY to .env.local (NOT prefixed NEXT_PUBLIC_)
-- then update src/lib/supabase.js to use it for storage uploads:
--
-- const storageClient = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)
-- export { storageClient }
-- ============================================================
