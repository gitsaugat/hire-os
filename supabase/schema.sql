-- ============================================================
-- HireOS Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================
-- 1. Candidate status enum
CREATE TYPE candidate_status AS ENUM (
  'APPLIED',
  'SCREENING',
  'SCREENED',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULING',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'OFFER_PENDING',
  'OFFER_SENT',
  'OFFER_SIGNED',
  'ONBOARDED',
  'REJECTED'
);
-- 2. Role status enum
CREATE TYPE role_status AS ENUM ('OPEN', 'CLOSED');
-- 3. Changed-by enum for audit trail
CREATE TYPE changed_by_type AS ENUM ('AI', 'HUMAN');
-- ============================================================
-- Tables
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  team TEXT NOT NULL,
  location TEXT NOT NULL,
  level TEXT NOT NULL,
  jd_text TEXT NOT NULL,
  status role_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_url TEXT,
  github_url TEXT,
  resume_url TEXT,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  status candidate_status NOT NULL DEFAULT 'APPLIED',
  ai_score FLOAT,
  ai_confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, role_id)
);
CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  from_status candidate_status,
  to_status candidate_status NOT NULL,
  changed_by changed_by_type NOT NULL DEFAULT 'HUMAN',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_candidates_role_id ON candidates(role_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_status_history_candidate ON status_history(candidate_id);
-- ============================================================
-- Seed Data (3 sample roles)
-- ============================================================
INSERT INTO roles (title, team, location, level, jd_text, status)
VALUES (
    'Senior Frontend Engineer',
    'Product',
    'Remote (US)',
    'Senior',
    'We are looking for a Senior Frontend Engineer to join our Product team. You will own the end-to-end frontend experience for our flagship SaaS product, working closely with designers and backend engineers. You should have deep expertise in React, TypeScript, and modern CSS. Experience with Next.js and design systems is a strong plus.',
    'OPEN'
  ),
  (
    'Backend Engineer – Data Platform',
    'Data',
    'San Francisco, CA',
    'Mid',
    'Join our Data Platform team as a Backend Engineer. You will design and maintain high-throughput data pipelines, REST APIs, and storage systems. We use Python (FastAPI), PostgreSQL, and Kafka. You are comfortable working in a distributed systems environment and care deeply about reliability and observability.',
    'OPEN'
  ),
  (
    'Product Manager – Growth',
    'Growth',
    'New York, NY',
    'Senior',
    'We are hiring a Senior Product Manager to lead our Growth team. You will drive acquisition, activation, and retention strategies, partnering with engineering, design, and marketing. You have a track record of shipping high-impact features in a B2B SaaS context and are deeply analytical.',
    'OPEN'
  );