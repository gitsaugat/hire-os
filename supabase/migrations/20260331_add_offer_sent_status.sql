-- Add OFFER_SENT to candidate_status enum
-- First check if it exists (Supabase doesn't support IF NOT EXISTS for enum values easily without a function, so we use a safe query)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'candidate_status' AND e.enumlabel = 'OFFER_SENT') THEN
        ALTER TYPE candidate_status ADD VALUE 'OFFER_SENT';
    END IF;
END $$;
