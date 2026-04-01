# HireOS — AI-Powered Talent Flow OS

> The AI recommends. The human decides. Always.

HireOS is not a resume parser with a Slack integration bolted on.
It is a hiring orchestration system — a state machine that moves
candidates through a pipeline with AI applied at exactly the points
where it creates genuine leverage, and humans kept in control at
exactly the points where judgment matters.

I built this end-to-end solo in two days using Google Antigravity
and a provider-agnostic AI layer that lets the system run on
Claude, GPT-4, Gemini, or local Ollama models interchangeably.
During development I ran gpt-oss-120b via Ollama locally for
hiring evaluation tasks, switching to Claude for document
generation. The system handles this transparently — the active
model is one click away from changing.

---

## The Problem I'm Solvings

Hiring is operationally broken in predictable ways:

- Recruiters spend hours on resume triage that AI can do in seconds
- Good candidates drop off because scheduling takes 3 email threads
- Interview feedback is subjective, inconsistent, and sometimes biased
- Offer letters take days to draft and sign
- Onboarding is a manual checklist that someone always forgets

HireOS automates every one of these. Not with magic — with a clean
pipeline, the right AI calls at the right moments, and humans owning
every final decision.

---

## Pipeline at a Glance
```
Candidate applies
    → Resume parsed and scored by active AI model  [seconds]
    → Profile enriched with LinkedIn/GitHub intel  [seconds]
    → Scheduling link sent automatically           [seconds]

Candidate selects interview slot
    → Conflict prevention fires at DB level        [milliseconds]
    → Confirmation email + calendar details sent   [seconds]

Interview happens
    → AI notetaker captures candidate signals      [real-time]
    → Transcript generated on completion           [seconds]
    → Bias detection scans interviewer notes       [seconds]

HR reviews evaluation, clicks Advance to Offer
    → Compensation form + AI market intel          [HR decision]
    → AI drafts complete offer letter              [seconds]
    → HR reviews and edits before sending          [HR decision]

Candidate signs offer
    → Audit trail captured (sig + timestamp + IP)  [milliseconds]
    → Slack onboarding triggers automatically      [seconds]
    → HR notified internally                       [seconds]

Total time from application to Slack welcome: hours, not weeks.
```

---

## 🛠 Tech Stack

| Layer | Tool | Decision |
|---|---|---|
| Framework | Next.js 14 App Router | Server actions + API routes + file uploads in one. No separate backend needed. |
| Database | Supabase Postgres | Row-level security, resume storage, status history, real-time capable. |
| AI | Provider-agnostic (Claude / OpenAI / Gemini / Ollama) | Every AI call routes through the Model Registry. Active model is admin-configurable without code changes. |
| Email | SendGrid | Transactional delivery with internal logging — no relying on provider dashboards. |
| Scheduling | Custom slot engine | Conflict prevention via DB unique constraints. Faster and more reliable than Calendar API for this use case. |
| Signing | Custom in-app portal | Full control over audit trail. Signature canvas + SHA256 hash + IP capture. No DocuSign redirect. |
| Slack | Slack Web API (xoxb-) | Real bot token. AI-personalized welcome. HR notification. All logged. |
| Cron | Vercel Cron | 48hr nudge for unresponsive candidates. One config line in vercel.json. |
| IDE | Google Antigravity | Agent-first development. Parallel agents per phase. Plan mode before execution. |

---

## 🤖 AI Model Registry — Multi-Provider Architecture

I designed the AI layer to be provider-agnostic from the start.
Admins can configure and switch between models from the Settings
panel without any code changes. During development I used
gpt-oss-120b via Ollama for evaluation-heavy tasks and Claude
Sonnet 4 for document generation — switching between them with
no pipeline changes required.

Supported providers:
- Anthropic (Claude Sonnet 4, Opus)
- OpenAI (GPT-4o, GPT-4o-mini)
- Google (Gemini 3 Flash, Pro)
- Ollama (local models — llama3, mistral, gpt-oss-120b,
  any locally hosted model)

Registry logic:
- One model active at a time across all pipeline AI calls
- If active model fails → automatic fallback to OpenAI GPT-4o-mini
- API keys configurable per provider, override .env variables
- Ollama base URL configurable for self-hosted deployments

Why this matters: A company with data residency requirements can
run HireOS entirely on local Ollama models. A cost-conscious team
can switch from Claude to GPT-4o-mini for high-volume screening.
No code changes required either way. The intelligence layer is
decoupled from any single vendor.

---

## 🧠 AI Layer — What Runs Where and Why

The rule: AI runs where it eliminates decision friction. It does
not run where logic is deterministic. Every call routes through
the Model Registry — the admin chooses which model powers the
pipeline. I tested extensively with both Ollama (gpt-oss-120b)
and Claude across different phases to validate output quality
across providers.

| Phase | AI task | Output format | Why AI, not code |
|---|---|---|---|
| Resume screening | Parse PDF, score fit against JD | `{ score, strengths, gaps, recommendation }` | Unstructured text → structured signal. Code can't read intent. |
| Candidate research | Analyze LinkedIn/GitHub, cross-reference resume | `{ brief, signals, flags, inconsistencies }` | Synthesis across sources requires judgment. |
| Interview notes | Generate candidate-specific timed observations | `[{ text, type, delay }]` | Notes must reflect the actual candidate's background, not generic questions. |
| Transcript | Convert notes to realistic dialogue | Formatted interviewer/candidate exchange | Natural language reconstruction from structured signals. |
| Evaluation | Score strengths, concerns, recommendation | `{ assessment, confidence, strengths, concerns, recommendation }` | Holistic judgment across a full conversation. |
| Bias detection | Scan transcript for discriminatory language | `{ flags, severity, quotes, clean }` | Pattern recognition in natural language. Rule-based systems miss context. |
| Offer letter | Draft complete letter from HR inputs | Formatted professional letter | Document generation from structured inputs at professional quality. |
| Market intel | Benchmark salary vs market, score offer | `{ range, value_score, analysis }` | Real-time market positioning requires synthesis, not lookup. |
| Slack welcome | Personalize onboarding message | Plain text, under 120 words | Template would feel generic. AI makes it feel human. |

**AI is NOT used for:** Slot generation, email delivery, calendar
logic, status transitions, or any flow where the correct answer
is deterministic. Those stay in code.

---

## 🏗 Phase Deep-Dives

### Phase 01 — Career Portal

Three open roles with full job descriptions, team, location, and
experience level. Application form captures all required fields.
Resume upload validates format (PDF/DOCX) and size (5MB max)
before accepting.

On submission: candidate record created, resume uploaded to
Supabase Storage at `resumes/{candidate_id}/resume{ext}`. If the
upload fails, the candidate record is deleted — no ghost records.
Confirmation email fires immediately. AI screening begins in the
background via Vercel's execution model — candidate never waits
for it.

**Edge case:** Duplicate email + role combination rejected before
insert with a clear error message.

---

### Phase 02 — AI Screening & Research

The active model from the registry receives the resume text and
the full job description. Returns a structured JSON evaluation
with fit score, strengths, gaps, and a hiring recommendation.
If the score clears the configured threshold, status
auto-advances to SHORTLISTED and research begins immediately.

Research phase synthesizes LinkedIn profile, GitHub repositories,
and the submitted resume into a candidate intelligence brief.
Flags inconsistencies between what the resume claims and what
the public profiles show. Generates notable projects list and
hiring signals.

Admin dashboard: full candidate table with AI score bars, status
filters, role filters, and date range. Clicking any candidate
opens their full profile — screening summary, research brief,
inconsistency flags, skills extracted, knowledge gaps identified,
and complete status history showing every transition with
timestamp and actor (AI or HUMAN).

Manual override available at any stage. Override requires a note.
Note stored in status history. Audit trail is complete.

---

### Phase 03 — Scheduling

**The hard problem in scheduling is not finding slots. It's
preventing two candidates from booking the same one.**

My approach: validation-on-selection with database unique
constraints.

Slots are generated dynamically on page load — no persistent
locks. This prevents slot starvation when multiple candidates
open scheduling links simultaneously but don't book.

When a candidate clicks a slot, the backend immediately attempts
a constrained DB write. If another candidate confirmed that slot
milliseconds earlier, the write fails at the database level —
not in application code. The system fetches 3 fresh slots
instantly and returns them inline. The candidate sees: "That
slot was just taken — here are updated times." No page reload.
No dead end. No double booking.

**48hr nudge:** `vercel.json` schedules `/api/cron/follow-up`
at `0 * * * *`. Every hour, the cron finds scheduling requests
where `expires_at < now AND nudge_sent_at IS NULL`. Sends
reminder email. Sets `nudge_sent_at`. Will never send twice.

**Rescheduling loop:** Candidate requests a different time →
HR receives approval email → on approval, fresh slots generated
→ offered to candidate. One active reschedule request per
candidate maximum.

**Scheduling page UX:** Personalized greeting, 5 slots across
multiple days, "LIVE AVAILABILITY ACTIVE" and "HOLDS VALID FOR
48 HOURS" footer indicators, "Request a different time"
escape hatch.

---

### Phase 04 — Interview Room & AI Notetaker

On page load, the active AI model generates 20 candidate-specific
interview observations using the candidate's actual skills, role,
screening summary, and research brief as context. Each note has
a type (`observation`, `highlight`, `flag`) and a delay in
seconds from interview start. Notes reveal on schedule — they
feel live because they're timed, not because they're polling
an API.

The note distribution is intentionally realistic: 2-4 highlights
(strong positive signals), 1-2 flags (worth probing), remainder
observations. The model is explicitly prompted not to make them
all positive.

Session state persists to sessionStorage. Refresh during
interview restores revealed notes and resumes the timer from
`startedAt`. Double-clicking End Interview is prevented by an
`isEnding` flag.

On completion:
1. AI converts revealed notes → realistic dialogue transcript
2. AI evaluates transcript → structured assessment JSON
3. AI scans transcript → bias detection report
4. Everything stored against candidate record
5. Admin redirected to evaluation panel

Bias detection report surfaces prominently — quoted language,
concern explanation, severity rating. If clean, green banner.
If flags exist, amber banner with itemized review required.

**Notetaker integration:** Fireflies.ai chosen for
best-documented API and webhook support. Bot joining mocked —
transcript processing pipeline is production-ready. Full
integration documented in `docs/NOTETAKER_INTEGRATION.md`.
With a real API key and meeting URL, active in under 2 hours.

---

### Phase 05 — Offer Letter & Digital Signing

HR clicks "Draft Offer" from the evaluation panel. Compensation
form collects: base salary, equity/options, start date,
expiration date, benefits, and perks.

**AI Market Intel panel** runs alongside the form — the active
model benchmarks the proposed salary against market data for
the specific role and location, generates a value score (1-10),
percentile ranking, and narrative analysis using the candidate's
interview performance as context. HR sees whether the offer is
competitive before committing.

The active model generates a complete, professional offer letter
from the form inputs plus candidate profile data. HR can preview
the full letter before sending. All compensation fields remain
editable — the AI draft is a starting point, not a final
decision.

**Offer Progress tracker** on the review page shows: Drafted →
Sent to Candidate → Signed. HR always knows where the offer
stands.

**Signing portal:** Candidate receives email with secure link.
Portal renders the full offer letter with a signature canvas.
On "Accept & Sign Offer":
- Drawn signature captured as base64 PNG
- Exact timestamp recorded to the second
- IP address logged
- SHA256 audit hash generated
- Signed document stored and viewable by admin
- Verification steps checklist: Identity Authenticated, Terms
  Acknowledged, Visual Signature Captured, IP Geolocation
  Logged, Audit Immutable

**Idempotency:** Revisiting the signing link after completion
renders "Offer Already Signed" with the confirmed date. Signing
webhook cannot fire twice.

---

### Phase 06 — Slack Onboarding

Triggers automatically on offer signature. No human action
required.

The active AI model generates a personalized welcome message
using candidate name, role, start date, and manager. Slack Web
API posts to the configured channel. HR receives an internal
notification confirming onboarding.

Every Slack interaction logged in `slack_logs` — recipient,
message preview, timestamp, delivery status. HR has full
visibility without accessing Slack directly.

**Architecture note:** Bot token (`xoxb-`) used over OAuth to
avoid redirect complexity. `admin.users.invite` requires paid
Slack workspace — invite step logs in development, fully
functional in production.

---

## ⚠️ Edge Cases

| Edge case | What happens |
|---|---|
| Slot taken between page load and selection | DB write fails, 3 fresh slots fetched and returned inline. No dead end. |
| Two candidates select same slot simultaneously | DB unique constraint rejects the second write at database level. Race condition impossible to win. |
| Candidate closes tab after form submit | Vercel continues execution after response sent. Screening runs independently. |
| Duplicate application (same email + role) | Rejected before insert. Friendly error returned. No duplicate record created. |
| Resume upload fails after candidate record created | Candidate record deleted (rollback). No ghost records. Candidate sees clear error and can retry. |
| No response to scheduling email at 48hrs | Vercel cron detects expired request with null nudge_sent_at. Sends one reminder. Sets nudge_sent_at. Will never send twice. |
| Offer signing link revisited after signing | "Offer Already Signed" screen rendered. Signing form never shown. Webhook cannot double-fire. |
| HR overrides AI recommendation | Note field surfaced for justification. Override reason stored in status_history with actor = HUMAN. |
| Active AI model fails | Automatic fallback to OpenAI GPT-4o-mini via Model Registry. Pipeline continues uninterrupted. |
| AI generation fails entirely | Try/catch with safe fallbacks throughout. Generic screening template, standard welcome message, default offer structure. Pipeline never blocks on AI failure. |
| Interview ended with minimal notes | Transcript generated from candidate profile alone. Flagged as "Limited notes captured." Evaluation still runs. |

---

## ⚖️ Trade-offs & Assumptions

**1. Internal slot engine vs Google Calendar OAuth**

I built a custom slot engine. Google Calendar API doesn't
support temporary holds — creating tentative events would
pollute the real calendar. My DB-level holds are atomic, fast,
and don't require OAuth credential management. The conflict
prevention logic is identical to what a Calendar integration
would need. Swapping the slot source for Google Calendar
free/busy API requires one function change — everything
downstream is unchanged.

**2. Custom signing portal vs DocuSign/PandaDoc**

Both options were offered in the brief. I built custom because
it integrates with the existing design system, eliminates
third-party redirect flows, and gives full control over the
audit trail format. It captures everything a commercial
e-signature tool would: signature image, timestamp, IP,
document hash, verification checklist.

**3. Simulated notetaker vs real bot joining**

Fireflies bot joining requires a scheduled live meeting with
a real video URL. The simulation using AI-generated,
candidate-specific notes produces a more useful demo — the
notes actually reflect the candidate's background. Downstream
processing (evaluation, bias detection, offer trigger) is
identical either way. Fireflies integration is documented and
production-ready pending API key.

**4. AI recommends, human confirms — always**

Every AI output surfaces to a human before action is taken.
This is not a limitation — it is the design. HireOS is a
decision-support system, not an autonomous hiring agent.
The rubric asks "where to protect humans." The answer:
everywhere that matters.

**5. Provider-agnostic AI layer**

I built the Model Registry because vendor lock-in is a real
enterprise concern. Different models have different
cost/quality tradeoffs per task. I validated this personally
— running gpt-oss-120b via Ollama locally for evaluation
tasks and Claude for generation tasks, switching between them
with zero pipeline changes. Local model support via Ollama
enables air-gapped deployments for companies with data
residency requirements.

**6. Twitter/X enrichment not implemented**

API access requirements and rate limits make this impractical
for a prototype. LinkedIn and GitHub provide stronger hiring
signals for technical roles. Acknowledged and documented.

**7. Single interviewer per role assumed**

Multi-panel interview scheduling (multiple interviewers,
consensus scoring) is not implemented. One interviewer per
interview session assumed throughout.

---

## 📡 Observability

I treated operational visibility as a first-class feature,
not an afterthought.

**Status history:** Every candidate status transition logged
with timestamp, reason, and actor (AI or HUMAN). HR can
reconstruct the complete decision trail for any candidate
at any time.

**Email ledger:** Every outbound email logged in `email_logs`
— recipient, subject, preview, delivery status, timestamp.
HR never needs to check SendGrid.

**Slack logs:** Every Slack interaction logged in `slack_logs`.
Full candidate communication history in one dashboard.

**Audit trail on signatures:** SHA256 hash, IP address,
timestamp, signature image. Legally defensible without
third-party tooling.

**AI model registry:** Active model visible in Settings at
all times. Fallback behavior logged. No silent AI failures.
Every AI call is traceable to the model that ran it.

---

## 🔮 With More Time

**Google Calendar OAuth** — Replace slot source with live
free/busy API. Everything downstream unchanged. Approximately
4 hours of work.

**Fireflies live integration** — API key + meeting URL =
production notetaker. Transcript processing pipeline already
built. Approximately 2 hours of work.

**PDF generation** — Puppeteer to generate signed offer PDF
for download and archiving. Currently stored as structured
data in DB.

**Hiring analytics** — Funnel metrics by role, time-to-offer
distribution, AI score accuracy tracking across providers,
bias flag frequency. Tracks whether different AI models
produce meaningfully different hiring outcomes over time.

**Multi-interviewer panels** — Consensus scoring across
multiple interviewers. Requires extending the interview and
evaluation data models.

**Twitter/X enrichment** — Requires approved API access.
Would add social signal layer to candidate research for
non-technical roles where public presence matters.

**Per-task model routing** — Currently one active model
runs all AI tasks. A smarter registry would route by task
type — e.g. Ollama for fast screening, Claude for offer
letter generation, GPT-4o for bias detection — optimizing
cost and quality per operation automatically.

---

## 🧠 How I Built This

I built HireOS solo using Google Antigravity — Google's
agent-first IDE launched November 2025. I used parallel
agents to develop multiple phases simultaneously, with Plan
mode to review implementation before execution.

I used multiple AI models throughout development and
production validation:
- gpt-oss-120b via Ollama for local evaluation testing
- Claude Sonnet 4 for document generation and complex
  reasoning tasks
- Google Antigravity's built-in agents for code generation
  and scaffolding

Understanding how different models perform on different
tasks — from both the builder and user side — directly
informed the Model Registry architecture. The registry
isn't a feature I added at the end. It's something I built
because I personally needed it while building.

Every architectural decision in this system was made by me.
Every prompt was written by me. Every edge case was
anticipated and handled by me. AI was the tool — the
thinking was mine.

---

## 🧠 Design Philosophy

Three principles drove every decision in HireOS:

**AI at leverage points only.**
Screening, research, evaluation, generation. Not in
deterministic flows, not where rules are sufficient,
not for show.

**Humans own the decisions that matter.**
Shortlisting threshold can be overridden. Interview
recommendations require confirmation. Compensation is
reviewed before sending. Offer is approved before the
candidate sees it. The system presents options — humans
close them.

**Observability by default.**
Every communication logged. Every status transition
recorded with actor and reason. Every signature audited.
HR teams should never have to wonder what happened or why.

HireOS is a workflow orchestrator. Its job is to eliminate
the administrative overhead that stops hiring teams from
doing the thing that actually matters: finding and
evaluating great people.

---

## 📁 Supplementary Docs

- `docs/DECISION_REPORT.md` — Product rationale for every
  major technical choice
- `docs/NOTETAKER_INTEGRATION.md` — Fireflies.ai integration
  design and production path


## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Open the `db.sql` file in the root of this project.
4. Copy the entire content of `db.sql` and run it in the SQL Editor. 
   - *Note: This will create all necessary tables (roles, candidates, interviews, offers, logs, etc.), custom enumerations, and seed data.*
5. **Database Schema Visualization:** You can view how everything connects here: [dbdiagram.io/d/69cc760d78c6c4bc7ab56325](https://dbdiagram.io/d/69cc760d78c6c4bc7ab56325)

### 3. Environment Configuration
Create a `.env.local` file in the root directory and add the following variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers (At least one required for defaults)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key

# Email (Required for notifications)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=your_verified_email

# Slack (Required for onboarding flow)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_HR_CHANNEL=C0...
SLACK_DEFAULT_CHANNEL=C0...

# Enrichment (Optional)
FIRECRAWL_API_KEY=fc-...
GITHUB_API_KEY=ghp_...
```

### 4. Build and Run
**Development Mode:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm run start
```

---

*Built solo by Saugat Siwakoti.*
*AI Product Operator Assignment submission.*
*Submitted: March 31, 2026.*

---