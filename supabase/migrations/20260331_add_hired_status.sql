-- Add HIRED to candidate_status enum
-- Supabase requires checking if the value exists first or using a safer approach
-- since ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block easily.

ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'HIRED';
