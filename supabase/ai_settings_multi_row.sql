-- Migration: Multi-Row AI Model Registry
-- This refactors ai_settings to support multiple models per provider.

-- 1. Drop the old table if it exists (or we can alter it, but for a clean break, dropping is easier if data is minimal)
DROP TABLE IF EXISTS public.ai_settings;

-- 2. Create the new structure
CREATE TABLE public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'claude', 'gemini')),
    model_name TEXT NOT NULL,
    api_key TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(provider, model_name)
);

-- 3. Add a constraint to ensures only one row can be active at a time
-- We use a partial unique index for this
CREATE UNIQUE INDEX one_active_model_idx ON public.ai_settings (is_active) WHERE (is_active = true);

-- 4. Insert some initial defaults (optional)
INSERT INTO public.ai_settings (provider, model_name, is_active)
VALUES ('openai', 'gpt-4o-mini', true);

-- Enable RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Admin only)
CREATE POLICY "Admins can do everything on ai_settings"
ON public.ai_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
