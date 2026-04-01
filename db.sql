-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.ai_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    provider text NOT NULL CHECK (
        provider = ANY (
            ARRAY ['openai'::text, 'claude'::text, 'gemini'::text, 'ollama'::text]
        )
    ),
    model_name text NOT NULL,
    api_key text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    base_url text DEFAULT 'http://localhost:11434'::text,
    CONSTRAINT ai_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.calendar_cache (
    interviewer_email text NOT NULL,
    busy_blocks jsonb NOT NULL,
    last_fetched_at timestamp with time zone DEFAULT now(),
    CONSTRAINT calendar_cache_pkey PRIMARY KEY (interviewer_email)
);
CREATE TABLE public.candidate_ai_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    candidate_id uuid NOT NULL UNIQUE,
    summary text,
    skills_found ARRAY DEFAULT '{}'::text [],
    gaps_found ARRAY DEFAULT '{}'::text [],
    recommendation text,
    raw_analysis jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    experience_years double precision,
    strengths text,
    risks text,
    CONSTRAINT candidate_ai_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT candidate_ai_profiles_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.candidate_research_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    candidate_id uuid NOT NULL UNIQUE,
    linkedin_summary text,
    github_summary text,
    notable_projects ARRAY DEFAULT '{}'::text [],
    signals ARRAY DEFAULT '{}'::text [],
    inconsistencies ARRAY DEFAULT '{}'::text [],
    candidate_brief text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    company_analysis text,
    thought_leadership text,
    CONSTRAINT candidate_research_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT candidate_research_profiles_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.candidates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    linkedin_url text,
    github_url text,
    resume_url text,
    role_id uuid NOT NULL,
    status USER - DEFINED NOT NULL DEFAULT 'APPLIED'::candidate_status,
    ai_score double precision,
    ai_confidence double precision,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    scheduling_token uuid DEFAULT gen_random_uuid(),
    screening_summary text,
    last_contacted_at timestamp with time zone,
    CONSTRAINT candidates_pkey PRIMARY KEY (id),
    CONSTRAINT candidates_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.email_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    candidate_id uuid,
    recipient text NOT NULL,
    subject text NOT NULL,
    body_preview text,
    status text NOT NULL,
    error_message text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    body_html text,
    CONSTRAINT email_logs_pkey PRIMARY KEY (id),
    CONSTRAINT email_logs_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.interviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    candidate_id uuid NOT NULL,
    interviewer_email text NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'CONFIRMED'::text,
    created_at timestamp with time zone DEFAULT now(),
    transcript text,
    summary jsonb,
    notes ARRAY,
    recommendation text CHECK (
        recommendation = ANY (
            ARRAY ['advance'::text, 'reject'::text, 'hold'::text]
        )
    ),
    bias_flags jsonb,
    CONSTRAINT interviews_pkey PRIMARY KEY (id),
    CONSTRAINT interviews_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.offers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    candidate_id uuid NOT NULL,
    salary numeric NOT NULL,
    equity text,
    start_date date NOT NULL,
    expiration_date date NOT NULL,
    status text NOT NULL DEFAULT 'PENDING_REVIEW'::text CHECK (
        status = ANY (
            ARRAY ['PENDING_REVIEW'::text, 'SENT'::text, 'ACCEPTED'::text, 'DECLINED'::text]
        )
    ),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ai_insights jsonb,
    signing_token uuid DEFAULT gen_random_uuid(),
    signature_data jsonb,
    signed_at timestamp with time zone,
    ip_address text,
    sent_at timestamp with time zone,
    CONSTRAINT offers_pkey PRIMARY KEY (id),
    CONSTRAINT offers_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    team text NOT NULL,
    location text NOT NULL,
    level text NOT NULL,
    jd_text text NOT NULL,
    status USER - DEFINED NOT NULL DEFAULT 'OPEN'::role_status,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scheduling_requests (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    candidate_id uuid NOT NULL,
    requested_time text,
    reason text,
    status text NOT NULL DEFAULT 'PENDING'::text,
    admin_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    offered_slots jsonb,
    CONSTRAINT scheduling_requests_pkey PRIMARY KEY (id),
    CONSTRAINT scheduling_requests_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.slack_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    candidate_id uuid,
    channel text NOT NULL,
    message_preview text,
    status text NOT NULL,
    error_message text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT slack_logs_pkey PRIMARY KEY (id),
    CONSTRAINT slack_logs_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.slots (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    interviewer_email text NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    status USER - DEFINED NOT NULL DEFAULT 'AVAILABLE'::slot_status,
    held_by_candidate_id uuid,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT slots_pkey PRIMARY KEY (id),
    CONSTRAINT slots_held_by_candidate_id_fkey FOREIGN KEY (held_by_candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.status_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    candidate_id uuid NOT NULL,
    from_status USER - DEFINED,
    to_status USER - DEFINED NOT NULL,
    changed_by USER - DEFINED NOT NULL DEFAULT 'HUMAN'::changed_by_type,
    reason text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT status_history_pkey PRIMARY KEY (id),
    CONSTRAINT status_history_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.temporary_holds (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    candidate_id uuid NOT NULL,
    interviewer_email text NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT temporary_holds_pkey PRIMARY KEY (id),
    CONSTRAINT temporary_holds_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'viewer'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);