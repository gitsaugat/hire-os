-- Update candidates table to support token-based scheduling
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS scheduling_token UUID DEFAULT gen_random_uuid();

-- Create an index for fast lookups by token
CREATE INDEX IF NOT EXISTS idx_candidates_scheduling_token ON candidates(scheduling_token);
