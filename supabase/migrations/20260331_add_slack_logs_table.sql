-- Create slack_logs table for observability of system Slack communications
CREATE TABLE public.slack_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
    channel TEXT NOT NULL,
    message_preview TEXT,
    status TEXT NOT NULL, -- 'SENT', 'FAILED'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.slack_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see logs
CREATE POLICY "Admins can view slack logs" 
ON public.slack_logs FOR SELECT 
TO authenticated 
USING (true);

-- Service role can insert logs
CREATE POLICY "Service role can insert slack logs" 
ON public.slack_logs FOR INSERT 
TO service_role 
WITH CHECK (true);
