-- Add advanced features to offers table
ALTER TABLE offers ADD COLUMN IF NOT EXISTS ai_insights JSONB;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS signing_token UUID DEFAULT gen_random_uuid();
ALTER TABLE offers ADD COLUMN IF NOT EXISTS signature_data JSONB;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create unique index on signing_token for safe lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_signing_token ON offers(signing_token);
