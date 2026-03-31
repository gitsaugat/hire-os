-- 1. Create scheduling_requests linking table for HR Review
CREATE TABLE IF NOT EXISTS public.scheduling_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    requested_time TEXT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',  -- 'PENDING', 'APPROVED', 'REJECTED'
    admin_notes TEXT,
    offered_slots JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS setup for requests
ALTER TABLE public.scheduling_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduling requests" 
ON public.scheduling_requests FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public portal can insert scheduling requests" 
ON public.scheduling_requests FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Service Role can manage scheduling requests" 
ON public.scheduling_requests FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- 2. Add safe cron tracking mechanisms to prevent spamming candidates
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
