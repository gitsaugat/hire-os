-- ============================================================
-- HireOS — AI Settings Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create ai_settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT NOT NULL CHECK (provider IN ('openai', 'claude', 'gemini')) DEFAULT 'openai',
  model_name   TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Seed default setting (only if empty)
INSERT INTO ai_settings (provider, model_name)
SELECT 'openai', 'gpt-4o'
WHERE NOT EXISTS (SELECT 1 FROM ai_settings);

-- 3. Add RLS to ai_settings
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admins) can read settings
CREATE POLICY "Authenticated users can read AI settings"
  ON ai_settings FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users (admins) can update settings
CREATE POLICY "Authenticated users can update AI settings"
  ON ai_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users (admins) can insert settings
CREATE POLICY "Authenticated users can insert AI settings"
  ON ai_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role to read settings
CREATE POLICY "Service role can read AI settings"
  ON ai_settings FOR SELECT
  TO service_role
  USING (true);
