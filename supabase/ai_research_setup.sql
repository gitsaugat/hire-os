-- ============================================================
-- HireOS — AI Research Profiles Setup
-- Run this in Supabase SQL Editor after ai_screening_setup.sql
-- ============================================================

-- 1. Create candidate_research_profiles table
CREATE TABLE IF NOT EXISTS candidate_research_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  linkedin_summary    TEXT,
  github_summary      TEXT,
  notable_projects    TEXT[] DEFAULT '{}',
  signals             TEXT[] DEFAULT '{}',
  inconsistencies     TEXT[] DEFAULT '{}',
  candidate_brief     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id)
);

-- 2. Enable RLS
ALTER TABLE candidate_research_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Authenticated users (admins) can read research profiles
CREATE POLICY "Authenticated users can read research profiles"
  ON candidate_research_profiles FOR SELECT
  TO authenticated
  USING (true);

-- 4. Service role (AI worker) can manage profiles
CREATE POLICY "Service role can manage research profiles"
  ON candidate_research_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_research_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_research_profiles_updated_at
  BEFORE UPDATE ON candidate_research_profiles
  FOR EACH ROW EXECUTE FUNCTION update_research_profiles_updated_at();
