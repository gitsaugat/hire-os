-- Add onboarding statuses to the candidate_status enum
ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'ONBOARDING';
ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'ONBOARDING_DONE';
