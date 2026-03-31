-- 1. Table for confirmed interview bookings
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  interviewer_email TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table for temporary TTL-based holds (48h default)
CREATE TABLE IF NOT EXISTS temporary_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  interviewer_email TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table for Google Calendar Busy Blocks cache (24h default)
CREATE TABLE IF NOT EXISTS calendar_cache (
  interviewer_email TEXT PRIMARY KEY,
  busy_blocks JSONB NOT NULL,
  last_fetched_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer ON interviews(interviewer_email);
CREATE INDEX IF NOT EXISTS idx_interviews_time ON interviews(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_holds_expires ON temporary_holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_holds_candidate ON temporary_holds(candidate_id);

-- Optional: Drop the old slots table if it exists and is no longer needed
-- DROP TABLE IF EXISTS slots;
