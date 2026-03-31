-- Migration script to add AI Notetaker fields to interviews

-- Add the necessary columns for the live interview room and AI analysis
ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS summary JSONB,
ADD COLUMN IF NOT EXISTS notes TEXT[],
ADD COLUMN IF NOT EXISTS recommendation TEXT CHECK (recommendation IN ('advance', 'reject', 'hold')),
ADD COLUMN IF NOT EXISTS bias_flags JSONB;

-- In candidates table, add screening_summary if missing
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS screening_summary TEXT;

-- Update the status check text on interviews constraint if it existed, but we just use TEXT for status
-- Usually status goes from 'CONFIRMED' -> 'IN_PROGRESS' -> 'COMPLETED'
