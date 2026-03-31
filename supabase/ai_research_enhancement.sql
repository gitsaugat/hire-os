-- ============================================================
-- HireOS — AI Research Profiles Enhancement
-- Add new fields for deeper intelligence analysis
-- ============================================================

ALTER TABLE candidate_research_profiles 
ADD COLUMN IF NOT EXISTS company_analysis TEXT,
ADD COLUMN IF NOT EXISTS thought_leadership TEXT;
