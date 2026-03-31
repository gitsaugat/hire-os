# HireOS — AI-Powered Talent Flow OS

HireOS is an end-to-end AI-driven hiring system designed to automate and orchestrate the full candidate lifecycle — from application to onboarding.

Rather than treating hiring as a collection of disconnected tools, HireOS is built as a **decision-support system**, where AI is applied at key leverage points to reduce manual effort, improve consistency, and accelerate hiring velocity.

---

## 🧠 System Overview
Apply → AI Screening → Research → Scheduling → Interview → Evaluation → Offer → Signing → Onboarding

Each stage is state-driven and persists to Supabase, ensuring reliability, traceability, and recoverability across the pipeline.

---

## 🚀 Core Modules

### 1. AI Candidate Screening & Scoring

**What it does:**
- Parses resumes and extracts structured signals (skills, experience, education)
- Compares candidate profile against job requirements
- Generates:
  - Fit score (0–100)
  - Strengths & gaps
  - Hiring recommendation

**Why it matters:**
Eliminates manual resume screening and standardizes evaluation across candidates.

**AI Design:**
- Structured prompting with strict JSON outputs
- Multi-provider support (OpenAI, Anthropic, Gemini, Ollama)
- Model selection configurable via internal AI registry

---

### 2. Candidate Research & Enrichment

**What it does:**
- Enriches candidate profile using:
  - Resume
  - LinkedIn
  - GitHub
- Generates:
  - Candidate brief
  - Signals & red flags
  - Project summaries

**Design Decision:**
Uses AI-assisted inference with optional external data — robust even when profile data is incomplete.

---

### 3. Automated Interview Scheduling

**What it does:**
- Sends candidates dynamic scheduling links
- Generates available slots
- Prevents double-booking using validation logic

**[NEW] Handling Rescheduling Requests:** 
Candidates can request a different time directly from the scheduling portal if the generated slots don't work. This request lands in the Admin Dashboard for an Approve/Reject HR review loop.

**How Slot Generation & Holds Work (Under the Hood):**
1. **Dynamic Generation:** When a candidate opens their scheduling link, the system fetches all confirmed HR interviews and active "Holds," then generates an array of open timeslots on the fly.
2. **Optimistic Holds:** When a candidate clicks a specific timeslot, the system immediately attempts to insert a temporary "Hold" record in the database for that exact timeframe.
3. **Conflict Resolution:** Since the database enforces unique constraints on scheduled slots, if another candidate happened to click that exact same slot milliseconds earlier, the database write fails.
   - If the Hold succeeds: The interview is officially booked, calendar invites are dispatched out via SendGrid, and the Hold becomes an active Interview record.
   - If the Hold fails (Conflict): The candidate is gracefully notified that the slot was just taken, the outdated slot is removed from their view, and fresh available slots are regenerated instantly for them to try again.

**Key Design Choice:**
- Validation-on-selection instead of persistent "Slot Locking" when the page loads.  
- Prevents unused slot starvation in case multiple candidates open their emails simultaneously but abandon the scheduling page.

**Edge Cases Handled:**
- Slot conflicts (auto-regeneration)
- Candidate no-response
- Timezone inconsistencies

---

### 4. Background Follow-up Automation

**What it does:**
- A Cron job endpoint (`/api/cron/follow-up`) runs periodically to find candidates stuck in the `INTERVIEW_SCHEDULING` stage for more than 48 hours without selecting a slot.
- Automatically sends an intelligent follow-up email urging them to select a time or request a new one.
- Updates a `last_contacted_at` timestamp in the database to guarantee candidates are never spammed.

**Why it matters:**
Ensures zero candidates are "lost" in the pipeline due to simple inactivity. It automates one of the most tedious parts of HR follow-up seamlessly.

---

### 4. Interview Pipeline & AI Evaluation

**What it does:**
- Simulates or integrates interview tools (Read.ai / Fireflies)
- Processes transcripts post-interview
- Generates:
  - Evaluation summary
  - Strengths & concerns
  - Recommendation (advance / hold / reject)
  - Bias detection report

**AI Pipeline:**
1. Transcript → structured summary  
2. Summary → evaluation  
3. Transcript → bias detection  

---

### 5. Offer Management & Digital Signing

**What it does:**
- Collects structured HR inputs (salary, equity, start date)
- Generates AI-assisted offer letters
- Provides secure signing portal

**Post-Sign Features:**
- Signature capture
- Timestamp logging
- SHA256 hash generation *(simulated)*
- Immutable audit record

---

### 6. Communication System (Email + Slack)

#### Email System
- All outbound emails logged in `email_logs`
- Includes:
  - recipient
  - subject
  - preview
  - delivery status

**Design Insight:**
Instead of relying on provider dashboards, HireOS includes a built-in **communication ledger** for full visibility.

---

#### Slack Integration (Mocked)
- Triggered on offer acceptance
- Generates AI-personalized welcome message

> Slack integration is mocked in this prototype. In production, this would use the Slack API to send workspace invites and onboarding messages.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS  
- **Backend:** API Routes + Server Actions  
- **Database:** Supabase (Postgres, Storage, Auth, RLS)  
- **AI Layer:** OpenAI / Anthropic / Gemini / Ollama (configurable)  
- **Email:** SendGrid (with internal logging system)  
- **Scheduling:** Custom slot engine with conflict resolution  

---

## ⚖️ Key Design Decisions & Trade-offs

### Slot Handling Strategy
- Used validation-on-selection instead of persistent locks  
- Prevents unused slot blocking and improves system scalability  

---

### AI Usage Strategy
- AI is used only at **decision leverage points**
  - screening
  - research
  - evaluation
  - offer generation  
- Avoided unnecessary AI in deterministic flows  

---

### Mocked Integrations
To prioritize system design:
- Slack onboarding → mocked  
- Interview notetaker → simulated  

These can be replaced with:
- Slack API  
- Fireflies / Read.ai  

---

### Email Observability
- Built internal logging instead of relying on provider dashboards  
- Improves operational visibility for HR teams  

---

## ⚠️ Edge Cases Handled

- Duplicate applications per role  
- Slot conflicts during scheduling  
- Candidate drop-off during scheduling  
- AI failure fallback (retry + safe defaults)  
- Missing or invalid resume uploads  
- Interview completion without transcript  
- Offer signing without complete data  
- Automated candidate inactivity drop-off (48hr cron)
- Rescheduling race conditions and HR state tracking

---

## 🔮 Future Improvements

1. Google Calendar OAuth integration for real-time availability  
2. Server-side PDF generation for signed offers (Puppeteer)  
3. Real-time UI updates using Supabase Realtime  
4. Analytics dashboard (time-to-hire, funnel metrics)  
5. AI-powered voice interview agent  

---

## 🧠 Key Insight

HireOS is designed as a **workflow orchestration system**, not just a feature set.

The goal is not to “add AI everywhere,” but to:

> apply AI where it reduces decision friction and operational overhead in hiring.