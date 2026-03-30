-- ============================================================
-- HireOS — AI Profile Enhancement
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add new fields to candidate_ai_profiles
ALTER TABLE candidate_ai_profiles 
  ADD COLUMN IF NOT EXISTS experience_years FLOAT,
  ADD COLUMN IF NOT EXISTS strengths TEXT,
  ADD COLUMN IF NOT EXISTS risks TEXT;

-- 2. Ensure skills_found and gaps_found are named correctly for the new format
-- (They were TEXT[] in the previous step, keeping them as is but we'll map them 
-- in the code if the AI returns them differently)
