-- ============================================================
-- HireOS — Interview Scheduling Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Create slot status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_status') THEN
    CREATE TYPE slot_status AS ENUM ('AVAILABLE', 'HELD', 'CONFIRMED');
  END IF;
END $$;

-- 2. Create slots table
CREATE TABLE IF NOT EXISTS slots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewer_email     TEXT NOT NULL,
  start_time            TIMESTAMPTZ NOT NULL,
  end_time              TIMESTAMPTZ NOT NULL,
  status                slot_status NOT NULL DEFAULT 'AVAILABLE',
  held_by_candidate_id  UUID REFERENCES candidates(id) ON DELETE SET NULL,
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent overlapping slots for the same interviewer
  CONSTRAINT no_overlapping_slots EXCLUDE USING gist (
    interviewer_email WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);

-- 3. Enable RLS
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

-- 4. Authenticated users (admins) can read/manage all slots
CREATE POLICY "Authenticated users can manage slots"
  ON slots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Service role can manage all slots
CREATE POLICY "Service role can manage slots"
  ON slots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_slots_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW EXECUTE FUNCTION update_slots_updated_at();

-- 7. Index for quick lookup of held slots
CREATE INDEX IF NOT EXISTS idx_slots_held_by ON slots(held_by_candidate_id) WHERE status = 'HELD';
CREATE INDEX IF NOT EXISTS idx_slots_expiry ON slots(expires_at) WHERE status = 'HELD';
