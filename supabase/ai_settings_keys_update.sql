-- Migration: Add API key columns to ai_settings
-- This allows storing provider credentials in the database for dynamic switching.

ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT,
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- COMMENT ON COLUMN public.ai_settings.openai_api_key IS 'Secret API key for OpenAI (sk-...)';
-- COMMENT ON COLUMN public.ai_settings.anthropic_api_key IS 'Secret API key for Anthropic (sk-ant-...)';
-- COMMENT ON COLUMN public.ai_settings.gemini_api_key IS 'Secret API key for Google Gemini';

-- Security: Ensure only authenticated admins can read/write this table.
-- (Assuming RLS is already set up from previous scripts)
