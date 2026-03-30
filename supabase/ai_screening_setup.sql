-- ============================================================
-- HireOS — AI Screening Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add SCREENING_FAILED to candidate_status enum
-- Note: PostgreSQL doesn't allow ALTER TYPE ... ADD VALUE inside a transaction block 
-- in some versions/environments. If this fails, run it separately.
ALTER TYPE candidate_status ADD VALUE IF NOT EXISTS 'SCREENING_FAILED';

-- 2. Create candidate_ai_profiles table
CREATE TABLE IF NOT EXISTS candidate_ai_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  summary      TEXT,
  skills_found TEXT[] DEFAULT '{}',
  gaps_found   TEXT[] DEFAULT '{}',
  recommendation TEXT,
  raw_analysis JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id)
);

-- 3. Add RLS to candidate_ai_profiles
ALTER TABLE candidate_ai_profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admins) can read profiles
CREATE POLICY "Authenticated users can read AI profiles"
  ON candidate_ai_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users (admins) can insert/update AI profiles
CREATE POLICY "Authenticated users can manage AI profiles"
  ON candidate_ai_profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow service role (AI worker) to manage profiles
CREATE POLICY "Service role can manage AI profiles"
  ON candidate_ai_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
