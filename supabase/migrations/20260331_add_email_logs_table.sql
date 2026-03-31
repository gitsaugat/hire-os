-- Create email_logs table for tracking outbound system communications
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_preview TEXT,
    status TEXT NOT NULL, -- 'SENT', 'FAILED'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (Read-only for Admins/Service Role)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (HR admins) to view email logs
CREATE POLICY "Admins can view email logs" 
ON public.email_logs FOR SELECT 
TO authenticated 
USING (true);

-- Allow service role to insert email logs
CREATE POLICY "Service role can insert email logs" 
ON public.email_logs FOR INSERT 
TO service_role 
WITH CHECK (true);
