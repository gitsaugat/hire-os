-- ============================================================
-- Update AI Settings for Ollama Support
-- ============================================================

-- 1. Add base_url and api_key columns if they don't exist
ALTER TABLE ai_settings ADD COLUMN IF NOT EXISTS base_url TEXT DEFAULT 'http://localhost:11434';
ALTER TABLE ai_settings ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE ai_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- 2. Update the provider check constraint
-- First, drop the old constraint by name (usually auto-generated, we'll try to find it or just override)
ALTER TABLE ai_settings DROP CONSTRAINT IF EXISTS ai_settings_provider_check;
ALTER TABLE ai_settings ADD CONSTRAINT ai_settings_provider_check 
  CHECK (provider IN ('openai', 'claude', 'gemini', 'ollama'));

-- 3. Seed Ollama (inactive by default)
INSERT INTO ai_settings (provider, model_name, base_url, is_active)
VALUES ('ollama', 'llama3', 'http://localhost:11434', false)
ON CONFLICT DO NOTHING;

-- 4. Ensure at least one setting is active (if none are)
UPDATE ai_settings SET is_active = true 
WHERE id = (SELECT id FROM ai_settings LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM ai_settings WHERE is_active = true);
