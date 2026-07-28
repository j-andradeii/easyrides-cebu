# EasyRideCebu — Inquiry Funnel & CRM Implementation Plan

> **Goal:** Replace the current "submit the inquiry to a Google Spreadsheet" flow with a
> proper **PostgreSQL-backed funnel + CRM**, inspired by how **GoHighLevel (GHL)** works —
> including an **admin login**, an **admin portal listing every inquiry**, and a
> **per-inquiry workflow view** where each lead moves through the funnel and automations fire.

- **Status:** ✅ **Implemented** (Phases 0–6) — 2026-07-28
- **Owner:** Joseph
- **Stack today:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, PrimeReact, react-hook-form + zod, zustand
- **Adds:** PostgreSQL + Drizzle ORM, JWT admin auth (jose + bcryptjs), Vercel Cron for automations

> 📘 **Using the portal day to day?** See
> **[ADMIN_PORTAL_GUIDE.md](./ADMIN_PORTAL_GUIDE.md)** — how to read the funnel
> stage bar, move a lead between stages, and drive the W1–W5 automations. This
> document covers the design; that one covers the operating.

### Running it locally

```bash
docker compose up -d          # app on :3000, Postgres on host port 5433
npm run db:migrate            # apply migrations
npm run db:seed               # pipeline + 7 stages + W1–W5
npm run create-admin -- --email you@example.com --name "Your Name" --role owner
# then sign in at http://localhost:3000/admin/login
```

> **Local Postgres port:** the container maps **5433**, not 5432 — this machine
> runs a native `postgresql-x64-17` service that already owns 5432 and would
> silently shadow the container.

**Deviations from the design below, and why:**
- **Sessions** are a single 8-hour JWT that slides on `/api/auth/me` rather than a
  15-minute access token plus a refresh token. A staff portal wants a working
  day; the refresh dance added moving parts without adding safety.
- **Emails** are stored lower-cased in a `text` column instead of `CITEXT`, so the
  schema stays portable across Postgres hosts with no extension required.
- **The share hub** lives at `/thanks/[code]` (the customer's referral code)
  rather than `/thanks/[token]` — the code is the value they hand out anyway.
- **W5 assigns rewards, it does not pay them.** An owner approves each payout in
  `/admin/referrals`; that is the last §7A.3 guardrail.
- `opportunities` gained a `stage_changed_at` column to power the idle-lead drip
  and the speed-to-lead metric.

---

## Table of Contents

1. [What Is a Funnel System? (plain English)](#1-what-is-a-funnel-system-plain-english)
2. [Where We Are Today](#2-where-we-are-today-current-state)
3. [The GoHighLevel Model & How We Map It](#3-the-gohighlevel-model--how-we-map-it)
4. [Target Architecture](#4-target-architecture)
5. [Database Schema (PostgreSQL)](#5-database-schema-postgresql)
6. [The Funnel: Pipeline Stages](#6-the-funnel-pipeline-stages)
7. [The 4 Core Workflows](#7-the-4-core-workflows)
    - [7A. Reviews, Feedback & Referrals](#7a-reviews-feedback-and-referrals)
8. [Lead Capture: Migrating From Sheets → Postgres](#8-lead-capture-migrating-from-sheets--postgres)
9. [Admin Authentication & Login](#9-admin-authentication--login)
10. [The Admin Portal (Inquiry List → Per-Inquiry Workflow)](#10-the-admin-portal-inquiry-list--per-inquiry-workflow)
11. [API Reference](#11-api-reference)
12. [The Automation Runner (Vercel Cron)](#12-the-automation-runner-vercel-cron)
13. [Dependencies & Environment Variables](#13-dependencies--environment-variables)
14. [Implementation Roadmap (Phased)](#14-implementation-roadmap-phased)
15. [Security, Anti-Spam & Rate Limiting](#15-security-anti-spam--rate-limiting)
16. [Funnel Reporting & Analytics](#16-funnel-reporting--analytics)
17. [File-by-File Change Map](#17-file-by-file-change-map)
18. [Appendix: Reference Code Snippets](#18-appendix-reference-code-snippets)

---

## 1. What Is a Funnel System? (plain English)

A **funnel** is the journey a stranger takes from *"I saw your website"* to *"I paid and took the tour"* — and, ideally, *"I booked again and told my friends."*

It's called a *funnel* because it's **wide at the top and narrow at the bottom**: many people show interest, fewer ask for a quote, fewer still book, and only some become repeat customers. At every step you lose some people. A **funnel system** is the software that:

1. **Captures** everyone who enters the top (an inquiry from your website form).
2. **Tracks** where each person is in the journey (a *stage*).
3. **Automates** the follow-ups so nobody falls through the cracks (a *workflow*).
4. **Measures** how many people move from one stage to the next (*conversion*), so you know where you're losing business.

### The EasyRideCebu funnel, visualized

```mermaid
flowchart TD
    A["🌐 Visitor lands on easyridecebu site"] --> B["📝 Submits an inquiry<br/>(Hero form / Contact form / Tour page)"]
    B --> C["🆕 New Lead<br/>captured in DB"]
    C --> D["📞 Contacted<br/>we reached out"]
    D --> E["💬 Quote Sent<br/>price + availability given"]
    E --> F["🤝 Negotiation / Follow-up"]
    F --> G["✅ Booked (Won)<br/>customer confirmed + deposit"]
    G --> H["🚗 Completed<br/>trip finished"]
    H --> I["⭐ Review + 🔁 Repeat/Referral"]
    F -.no response.-> X["❌ Lost<br/>(with reason)"]
    E -.went cold.-> X
    D -.no answer.-> X
```

**Today, without a funnel system:** an inquiry lands in a Google Sheet, and whether anyone follows up depends on someone remembering to check the sheet. There is no record of *what stage* a lead is in, no automatic follow-up, and no way to measure conversion.

**With this funnel system:** every inquiry becomes a tracked **opportunity** that moves through named stages, automations chase the lead for you (instant reply, follow-up reminders, review requests), and you get a dashboard showing exactly where money is being won or lost.

### Why it matters for a Cebu rides/tours business
- **Speed-to-lead:** Tourists message 3–4 operators at once. The first to reply usually wins. Automated instant replies + "call back in 15 min" tasks win more bookings.
- **No leaks:** WhatsApp/Messenger/website inquiries all land in one place with a status.
- **Repeat & referral:** Post-trip review requests and re-engagement offers turn one trip into many.

---

## 2. Where We Are Today (Current State)

Your site already has **three lead-capture forms**, and all of them already route through a **single service function**, which makes migration surprisingly cheap.

| Source `source` value | Component | File |
|---|---|---|
| `hero-quick-form` | Hero "Quick quote" form | `src/components/landing/HeroSection.tsx` |
| `contact-form` | Full contact section | `src/components/landing/ContactSection.tsx` |
| `tour-inquiry` | Per-tour "Book This Tour" form | `src/components/tours/TourInquiryForm.tsx` |

### Current data flow

```mermaid
sequenceDiagram
    participant Form as Any of the 3 forms
    participant Svc as queryService.submitQuery()
    participant API as POST /api/submit-booking
    participant Sheet as appendToGoogleSheet()
    Form->>Svc: submitQuery({ ...data, source })
    Svc->>API: apiClient.post('/api/submit-booking', data)
    API->>API: bookingSubmissionSchema.safeParse(body)
    API->>Sheet: append row (or console.log if unconfigured)
    Sheet-->>API: { success }
    API-->>Svc: { message: "We will contact you shortly." }
    Svc->>Svc: emit ApiEvent(SUBMIT_QUERY, COMPLETED)
```

**Key files in the current flow:**
- `src/services/query.service.ts` — `submitQuery()` posts to `/api/submit-booking` and emits an `ApiEvent`.
- `src/app/api/submit-booking/route.ts` — validates with `bookingSubmissionSchema`, then calls `appendToGoogleSheet()` (Google Sheets API, or `console.log` when env vars are missing).
- `src/models/booking.schema.ts` — `bookingSubmissionSchema` (the payload contract).
- `src/services/api-client.ts` — fetch wrapper with token refresh; builds URLs from `config.app.url`.
- `src/stores/event.store.ts` + `src/models/api-event.ts` — the `ApiEvent` pub/sub used by forms for toasts.

**Auth scaffolding that already exists (currently stubs we will complete):**
- `src/middleware.ts` — already guards `/dashboard`, `/profile`, `/settings` by checking the `auth-token` cookie; redirects auth routes when logged in.
- `src/stores/user.store.ts` — zustand persisted user/token store.
- `src/guards/AuthGuard.tsx` — client-side guard.
- `src/models/validation-schemas.ts` — **already contains `loginSchema`** we will reuse.
- `src/app/dashboard/page.tsx` and `src/app/auth-module/*` — placeholder pages we will build into the portal.

> **This is the big win:** because all three forms already funnel through `queryService.submitQuery()` → `/api/submit-booking`, we can swap the *backend* of that one endpoint from Sheets to Postgres and **the three forms need zero changes** (aside from an optional field or two).

---

## 3. The GoHighLevel Model & How We Map It

GoHighLevel is a CRM + marketing-automation platform. Its core objects are worth copying because they're a proven mental model for exactly this problem. Here's the GHL vocabulary and how we implement each concept natively in your Next.js + Postgres app.

| GoHighLevel concept | What it means | EasyRideCebu implementation |
|---|---|---|
| **Contact** | A person (lead/customer) with phone, email, tags | `contacts` table (deduped by phone/email) |
| **Opportunity** | A potential deal living inside a Pipeline, with a value & status | `opportunities` table |
| **Pipeline** | A named funnel made of ordered stages | `pipelines` + `pipeline_stages` tables (one default "Sales Pipeline") |
| **Stage** | A step in the pipeline ("New Lead", "Quote Sent"…) | `pipeline_stages` rows |
| **Opportunity Status** | Open / Won / Lost / Abandoned | `opportunities.status` enum |
| **Workflow / Automation** | Trigger → wait/if-else → actions | `workflows` + `workflow_enrollments` + the Cron runner |
| **Trigger** | Event that enrolls a contact into a workflow | `trigger_type` on `workflows` (e.g. `inquiry.created`, `stage.changed`) |
| **Action** | Send email/SMS, wait, add tag, create task, notify | Step handlers in the automation runner |
| **Conversations / Inbox** | Unified message history per contact | `activities` timeline (Phase 2 can add live 2-way messaging) |
| **Task** | A to-do assigned to a staff member | `tasks` table |
| **Tags & Custom Fields** | Labels/metadata on contacts | `contacts.tags text[]` + `raw_payload jsonb` |
| **Smart Lists / Filters** | Saved filtered views of contacts/opps | Query params on the inquiries list endpoint |
| **User / Team member** | Staff who own opportunities | `admin_users` table |
| **Calendar / Appointment** | Booked time slot | `opportunities.expected_close_date` now; dedicated `appointments` table later (Phase 4) |

**What we deliberately do NOT rebuild (buy vs. build):** GHL's telephony, native SMS/email sending infra, and drag-and-drop visual workflow builder are huge. We replicate the *data model and the 4 highest-value automations*, and send messages via cheap building blocks (WhatsApp deep links + an email/SMS provider). The visual builder is replaced by **4 code-defined workflows** you can toggle on/off.

---

## 4. Target Architecture

```mermaid
flowchart LR
    subgraph Public["Public site (unchanged UX)"]
      H["Hero form"] --> QS
      C["Contact form"] --> QS
      T["Tour form"] --> QS
      QS["queryService.submitQuery()"]
    end

    QS -->|POST /api/inquiries| API["Inquiry Intake Route"]
    API --> DB[("PostgreSQL<br/>Neon / Vercel Postgres")]
    API -->|enroll| WF["Workflow engine"]

    subgraph Admin["Admin Portal (/admin, JWT-protected)"]
      L["/admin/login"] -->|POST /api/auth/login| AUTH["Auth routes"]
      LIST["/admin/inquiries (list)"] -->|GET /api/admin/inquiries| ADMINAPI
      DET["/admin/inquiries/[id]<br/>(per-inquiry workflow)"] -->|GET/PATCH| ADMINAPI["Admin API"]
    end

    AUTH --> DB
    ADMINAPI --> DB

    CRON["Vercel Cron<br/>every 5 min"] -->|POST /api/cron/workflows| WF
    WF --> DB
    WF --> MSG["Messaging<br/>(email / SMS / WhatsApp links)"]

    classDef db fill:#1f6f54,color:#fff;
    class DB db;
```

**Runtime notes (important for Vercel):**
- **Route handlers** (`/api/**`) run on the **Node.js runtime** (`export const runtime = 'nodejs'`) because we use `bcryptjs` and the Postgres driver.
- **Middleware** runs on the **Edge runtime**, so it verifies JWTs with **`jose`** (edge-safe) — never bcrypt.
- **DB access is server-only.** The browser never talks to Postgres directly; it only calls our API routes.

---

## 5. Database Schema (PostgreSQL)

### Entity relationships

```mermaid
erDiagram
    admin_users ||--o{ opportunities : "owns"
    admin_users ||--o{ tasks : "assigned"
    contacts ||--o{ inquiries : "submits"
    contacts ||--o{ opportunities : "has"
    contacts ||--o{ activities : "on"
    pipelines ||--o{ pipeline_stages : "has"
    pipelines ||--o{ opportunities : "in"
    pipeline_stages ||--o{ opportunities : "at"
    opportunities ||--o{ inquiries : "groups"
    opportunities ||--o{ activities : "timeline"
    opportunities ||--o{ tasks : "todos"
    opportunities ||--o{ workflow_enrollments : "enrolled"
    workflows ||--o{ workflow_enrollments : "runs"
```

### Design decisions
- **`contacts` vs `inquiries` vs `opportunities`** (mirrors GHL): a **contact** is the person; an **inquiry** is one immutable form submission; an **opportunity** is the mutable deal that moves through the funnel. A returning customer = one contact, many inquiries, many opportunities.
- **Dedup rule:** on intake, find an existing contact by normalized `phone` (E.164) or `email`; otherwise create one.
- **`raw_payload jsonb`** on `inquiries` preserves the exact form submission forever (future-proof against form changes).
- **Stages as rows, not an enum:** lets you reorder/rename stages later without a migration (GHL-style).

### DDL (core tables)

```sql
-- === Admin users (portal login) ===
CREATE TYPE admin_role AS ENUM ('owner', 'admin', 'agent');

CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          admin_role NOT NULL DEFAULT 'agent',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Contacts (people) ===
CREATE TABLE contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      TEXT,
  email          CITEXT,
  phone          TEXT,                 -- normalized E.164, e.g. +639178046988
  country_code   TEXT DEFAULT '+63',
  tags           TEXT[] NOT NULL DEFAULT '{}',
  lifetime_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  first_source   TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX contacts_phone_uidx ON contacts (phone) WHERE phone IS NOT NULL;
CREATE INDEX contacts_email_idx ON contacts (email);

-- === Pipelines & stages (the funnel definition) ===
CREATE TABLE pipelines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,          -- 'new_lead', 'contacted', ...
  name        TEXT NOT NULL,          -- 'New Lead'
  sort_order  INT  NOT NULL,
  probability INT  NOT NULL DEFAULT 0,-- 0..100, for weighted forecast
  is_won      BOOLEAN NOT NULL DEFAULT false,
  is_lost     BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (pipeline_id, key)
);

-- === Opportunities (deals moving through the funnel) ===
CREATE TYPE opp_status AS ENUM ('open', 'won', 'lost', 'abandoned');

CREATE TABLE opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  pipeline_id         UUID NOT NULL REFERENCES pipelines(id),
  stage_id            UUID NOT NULL REFERENCES pipeline_stages(id),
  owner_id            UUID REFERENCES admin_users(id),
  title               TEXT NOT NULL,       -- "Van tour — Juan dela Cruz"
  status              opp_status NOT NULL DEFAULT 'open',
  service_type        TEXT,                -- car-rental | airport-transfer | tour | custom
  vehicle_type        TEXT,                -- sedan | suv | van
  monetary_value      NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'PHP',
  preferred_date      DATE,
  source              TEXT,                -- hero-quick-form | contact-form | tour-inquiry
  lost_reason         TEXT,
  expected_close_date DATE,
  won_at              TIMESTAMPTZ,
  lost_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX opportunities_stage_idx  ON opportunities (stage_id);
CREATE INDEX opportunities_status_idx ON opportunities (status);
CREATE INDEX opportunities_owner_idx  ON opportunities (owner_id);

-- === Inquiries (immutable form submissions) ===
CREATE TABLE inquiries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id     UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  source         TEXT NOT NULL,        -- hero-quick-form | contact-form | tour-inquiry
  service_type   TEXT,
  vehicle_type   TEXT,
  preferred_date DATE,
  add_driver     BOOLEAN NOT NULL DEFAULT false,
  message        TEXT,
  tour_title     TEXT,
  raw_payload    JSONB NOT NULL,       -- exact posted body
  utm            JSONB,                -- {source, medium, campaign}
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX inquiries_created_idx ON inquiries (created_at DESC);
CREATE INDEX inquiries_source_idx  ON inquiries (source);

-- === Activities (the per-inquiry timeline) ===
CREATE TYPE activity_type AS ENUM
  ('note','stage_change','message_out','message_in','call','email',
   'task_created','task_completed','workflow','system');

CREATE TABLE activities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id     UUID REFERENCES contacts(id) ON DELETE CASCADE,
  admin_user_id  UUID REFERENCES admin_users(id), -- NULL = system/automation
  type           activity_type NOT NULL,
  channel        TEXT,                 -- whatsapp | email | sms | phone | facebook | system
  subject        TEXT,
  body           TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activities_opp_idx ON activities (opportunity_id, created_at DESC);

-- === Tasks (follow-up to-dos) ===
CREATE TYPE task_status AS ENUM ('open','done','cancelled');

CREATE TABLE tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id     UUID REFERENCES contacts(id) ON DELETE CASCADE,
  assigned_to    UUID REFERENCES admin_users(id),
  title          TEXT NOT NULL,
  due_at         TIMESTAMPTZ,
  status         task_status NOT NULL DEFAULT 'open',
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tasks_due_idx ON tasks (assigned_to, status, due_at);

-- === Workflows (automation definitions) ===
CREATE TABLE workflows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT UNIQUE NOT NULL,   -- 'w1_intake', 'w2_followup', ...
  name         TEXT NOT NULL,
  description  TEXT,
  trigger_type TEXT NOT NULL,          -- inquiry.created | stage.changed | schedule
  is_active    BOOLEAN NOT NULL DEFAULT true,
  definition   JSONB NOT NULL,         -- ordered steps (see §7)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Workflow enrollments (a lead's progress through a workflow) ===
CREATE TYPE enrollment_status AS ENUM ('active','completed','exited','failed');

CREATE TABLE workflow_enrollments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id    UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id     UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status         enrollment_status NOT NULL DEFAULT 'active',
  current_step   INT NOT NULL DEFAULT 0,
  next_run_at    TIMESTAMPTZ,          -- when the runner should process the next step
  context        JSONB NOT NULL DEFAULT '{}',
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ
);
CREATE INDEX enrollments_due_idx ON workflow_enrollments (status, next_run_at);
```

### Seed data (run once)

```sql
-- Default pipeline + the 7 funnel stages
INSERT INTO pipelines (id, name, is_default) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sales Pipeline', true);

INSERT INTO pipeline_stages (pipeline_id, key, name, sort_order, probability, is_won, is_lost) VALUES
  ('00000000-0000-0000-0000-000000000001','new_lead','New Lead',1,10,false,false),
  ('00000000-0000-0000-0000-000000000001','contacted','Contacted',2,25,false,false),
  ('00000000-0000-0000-0000-000000000001','quote_sent','Quote Sent',3,50,false,false),
  ('00000000-0000-0000-0000-000000000001','negotiation','Negotiation / Follow-up',4,70,false,false),
  ('00000000-0000-0000-0000-000000000001','booked','Booked (Won)',5,100,true,false),
  ('00000000-0000-0000-0000-000000000001','completed','Completed',6,100,true,false),
  ('00000000-0000-0000-0000-000000000001','lost','Lost',7,0,false,true);
```

> **ORM choice:** we'll define the same schema in **Drizzle ORM** (`src/db/schema.ts`) so queries are fully typed and migrations are generated with `drizzle-kit`. See [Appendix](#18-appendix-reference-code-snippets) for the Drizzle version of two tables; the rest follow identically. `CITEXT` and `gen_random_uuid()` require `CREATE EXTENSION IF NOT EXISTS citext;` and `pgcrypto` (both preinstalled on Neon/Vercel Postgres).

---

## 6. The Funnel: Pipeline Stages

These 7 stages are the "workflow" a user sees when they click into an inquiry — the path a lead travels. Every opportunity sits in exactly one stage at a time.

| # | Stage (`key`) | Meaning | Entered by | Typical automation |
|---|---|---|---|---|
| 1 | **New Lead** (`new_lead`) | Just submitted a form | Intake (automatic) | W1 fires: instant reply + admin task |
| 2 | **Contacted** (`contacted`) | You've reached out | Agent, or W2 when customer replies | W2 exits |
| 3 | **Quote Sent** (`quote_sent`) | Price + availability given | Agent | W3 fires: quote follow-ups |
| 4 | **Negotiation / Follow-up** (`negotiation`) | Discussing details/date | Agent | Reminder tasks |
| 5 | **Booked (Won)** (`booked`) | Confirmed + deposit | Agent | W4 fires: fulfillment + reminders |
| 6 | **Completed** (`completed`) | Trip finished | Agent, or W4 after trip date | W4: review + referral |
| 7 | **Lost** (`lost`) | Didn't convert (reason recorded) | Agent, or W2/W3 timeout | All workflows exit |

**Conversion is measured between adjacent stages** (e.g. New Lead → Contacted rate, Quote Sent → Booked rate). See [§16](#16-funnel-reporting--analytics).

---

## 7. The 4 Core Workflows

These are the four **GHL-style automations** you asked for. Each has a **trigger**, ordered **steps** (with waits + if/else branches), and **exit conditions**. Definitions are stored in `workflows.definition` (JSONB) and executed by the [Cron runner](#12-the-automation-runner-vercel-cron). You can toggle any of them off via `workflows.is_active`.

### Overview

| # | Workflow | Trigger | Purpose | GHL analogy |
|---|---|---|---|---|
| **W1** | Instant Lead Capture & Response | `inquiry.created` | Never miss a lead; reply in seconds | "Form submitted" workflow |
| **W2** | Speed-to-Lead Follow-Up (no-response drip) | opportunity idle in `new_lead`/`contacted` | Chase leads that go quiet | "No-show / nurture" drip |
| **W3** | Quote → Booking Conversion | stage → `quote_sent` | Turn quotes into paid bookings | "Pipeline stage changed" workflow |
| **W4** | Fulfillment, Review & Re-Engagement | stage → `booked` / trip date | Deliver, get reviews, win repeats | "Post-purchase" workflow |

---

### W1 — Instant Lead Capture & Response

**Trigger:** a new inquiry is created (any of the 3 forms).

```mermaid
flowchart TD
    T["Trigger: inquiry.created"] --> S1["Upsert Contact (dedupe by phone/email)"]
    S1 --> S2["Create Opportunity @ New Lead"]
    S2 --> S3["Auto-reply to customer<br/>(email + WhatsApp-ready message)"]
    S3 --> S4["Notify admin (email/push)"]
    S4 --> S5["Create task: 'Call back within 15 min'"]
    S5 --> S6["Tag by source + service type"]
    S6 --> E["Enroll into W2 (follow-up), then complete W1"]
```

**Why:** Speed-to-lead is the single biggest lever for a tours business. This makes the customer feel handled instantly and puts a countdown task in front of your team.

**Definition (illustrative JSON):**
```json
{
  "trigger": "inquiry.created",
  "steps": [
    { "type": "upsert_contact" },
    { "type": "create_opportunity", "stage": "new_lead" },
    { "type": "send_message", "channel": "email", "template": "instant_ack" },
    { "type": "notify_admin", "template": "new_lead_alert" },
    { "type": "create_task", "title": "Call back within 15 min", "due_in_minutes": 15 },
    { "type": "add_tags", "tags": ["source:{{source}}", "service:{{service_type}}"] },
    { "type": "enroll", "workflow": "w2_followup" }
  ]
}
```

---

### W2 — Speed-to-Lead Follow-Up (No-Response Drip)

**Trigger:** opportunity sits in `new_lead` or `contacted` without a reply.
**Exit conditions:** customer replies • stage advances to `quote_sent`+ • marked `lost`.

```mermaid
flowchart TD
    T["Enrolled from W1"] --> W15["Wait 1 hour"]
    W15 --> C1{"Contacted yet?"}
    C1 -- yes --> EX["Exit workflow"]
    C1 -- no --> M1["Follow-up msg #1 + remind agent"]
    M1 --> W24["Wait 24 hours"]
    W24 --> C2{"Replied?"}
    C2 -- yes --> EX
    C2 -- no --> M2["Follow-up msg #2"]
    M2 --> W72["Wait 72 hours"]
    W72 --> C3{"Replied?"}
    C3 -- yes --> EX
    C3 -- no --> M3["Final msg #3 → move to Lost (no response)"]
```

**Why:** Most inquiries that "disappear" were simply never followed up a second and third time. This runs the persistence for you and cleanly marks dead leads `lost` (with a reason) so your funnel stays honest.

---

### W3 — Quote → Booking Conversion

**Trigger:** an agent moves the opportunity to `quote_sent`.
**Exit conditions:** stage → `booked` • marked `lost`.

```mermaid
flowchart TD
    T["Trigger: stage → quote_sent"] --> S1["Send quote summary (email + WhatsApp text)"]
    S1 --> W1d["Wait 1 day"]
    W1d --> C1{"Booked?"}
    C1 -- yes --> WON["Move to Booked → request deposit → confirmation → start W4"]
    C1 -- no --> R1["Reminder + gentle nudge, move to Negotiation"]
    R1 --> W2d["Wait 2 days"]
    W2d --> C2{"Booked?"}
    C2 -- yes --> WON
    C2 -- no --> LOST["Move to Lost (went cold) + ask for reason"]
```

**Why:** Quotes are where money is made or lost. Automated, well-timed nudges after a quote materially lift close rates without your team remembering to chase.

---

### W4 — Fulfillment, Review & Re-Engagement

**Trigger:** stage → `booked` (and the approaching `preferred_date`).
**Exit:** loops for repeat customers; can re-enter on a new opportunity.

```mermaid
flowchart TD
    T["Trigger: stage → booked"] --> S1["Confirmation + itinerary + assign driver task"]
    S1 --> D1["Day before trip: reminder to customer + driver"]
    D1 --> TRIP["Trip date passes → move to Completed"]
    TRIP --> R1["Wait 3 hrs → request Google/FB review"]
    R1 --> R2["Wait 3 days → thank-you + referral offer"]
    R2 --> R3["Wait 30 & 90 days → re-engagement / repeat offer"]
    R3 --> LTV["Update contact lifetime_value"]
```

**Why:** The cheapest booking is the next one from a happy past customer. This closes the loop — reviews build trust for new leads, referrals and re-engagement create repeat revenue. See **[§7A](#7a-reviews-feedback-and-referrals)** for the full reviews + feedback + referral design (schema, customer pages, reward ideas, and an optional W5 payout workflow).

---

## 7A. Reviews, Feedback and Referrals

> **(The retention & virality layer — extends W4.)** Reviews feed the **top** of the funnel (public trust → cheaper leads), private feedback protects service quality, and referrals are the **lowest-cost lead source you have**. For a Cebu rides/tours business — where trust and word-of-mouth drive bookings — this is often the highest-ROI part of the whole system.

### 7A.1 The loop

```mermaid
flowchart TD
    T["Trip Completed (W4)"] --> F["Ask for feedback (NPS / star)<br/>/review/[token]"]
    F --> Q{"Happy?<br/>rating >= 4 / NPS >= 9"}
    Q -- yes / Promoter --> R1["Invite to leave a PUBLIC review<br/>(Google / Facebook)"]
    R1 --> R2["Invite to REFER a friend<br/>share unique link /r/[code]"]
    R2 --> SHARE["1-tap share: WhatsApp / Messenger / copy link"]
    SHARE --> FRIEND["Friend opens /r/[code] → warm landing<br/>(₱300 off · 'referred by Juan')"]
    FRIEND --> BOOK["Friend submits inquiry → books"]
    BOOK --> REWARD["Reward BOTH (W5) → notify"]
    Q -- no / Detractor --> P["Private recovery: apologize,<br/>alert admin, fix it"]
```

### 7A.2 Reviews & feedback — how to collect them

**Principle — ask at the peak-end moment.** People rate an experience by its emotional *peak* and its *ending*. The end of a great Cebu trip is that peak, so W4 asks ~3 hours after the trip date, while the memory is warm.

**One-tap page (`/review/[token]`):** a tokenized link (no login) sent by W4 with a 1–5 star or 0–10 NPS control + optional comment. Because the token pre-authenticates the customer, leaving feedback is a single tap.

**Route promoters → public, detractors → private (the compliant way):**
- **Promoters (4–5★):** show prominent **"Leave a Google review"** and **"Review us on Facebook"** deep-link buttons.
- **Detractors (≤3★):** capture a private comment and create a high-priority **task + admin alert** so you can personally recover the customer before they post publicly.
- ⚠️ **Compliance note:** Google's policy prohibits **"review gating"** (soliciting reviews *only* from happy customers / hiding the option from unhappy ones). Stay compliant by inviting **everyone** to review publicly, while *additionally* routing unhappy customers to private recovery — never *block* anyone from the public link.

**Best public review targets for you:** **Google Business Profile** (biggest impact on local search + Maps), your **Facebook Page**, and **TripAdvisor / Klook** if you list there.

**Where approved reviews surface on-site:** feed them back into your existing `src/components/landing/Testimonials.tsx` and `src/components/landing/TrustBar.tsx` — so fresh social proof continuously lifts new-lead conversion.

### 7A.3 Referrals — the recommendation (best way to encourage)

**My ranked recommendation for *this* business:**

| Rank | Channel | Why it wins for Cebu transport | Effort |
|---|---|---|---|
| 🥇 **1** | **Partner / B2B referral program** — hotels, Airbnb & pension hosts, hostel front desks, dive shops, wedding/event & tour planners — paid a **per-booking commission** | These partners meet *new* tourists needing transport **every single day**. It's a recurring, high-volume, warm channel — one good hotel can outproduce hundreds of one-off customer referrals. | Medium |
| 🥈 **2** | **Double-sided customer referral** ("give ₱300, get ₱500") at the **peak-end** moment, shared via **WhatsApp / Messenger** with a unique link | Tourists travel in groups and live in Cebu-travel Facebook groups; a warm personal rec converts far better than an ad. | Low |
| 🥉 **3** | **Reviews** (Google especially) | Not a referral per se, but the cheapest top-of-funnel trust builder — and it compounds forever. | Low |

**The 7 rules that make referrals actually convert:**
1. **Double-sided incentive** — reward the friend *and* the referrer. This single change typically multiplies referral rates.
2. **Ask at the peak** — only after a happy signal (4–5★). Never spam neutral/unhappy customers with a referral ask.
3. **Make it one tap** — a **pre-written WhatsApp/Messenger message** containing their unique link. Zero typing.
4. **Unique, trackable code/link per customer** (`/r/ABC123`) — attribution and rewards become automatic and abuse-proof.
5. **A reward that's valuable *and* relevant** — for a rides business, *more/again transport* beats a random gift card.
6. **Pay on conversion only** — the reward unlocks when the referred friend **completes a paid booking**, not on click. Protects your margin.
7. **Warm the landing** — `/r/[code]` greets the friend by the referrer's name and pre-applies the discount, so they feel personally introduced, not marketed to.

**Reward ideas (Cebu-specific — pick one to start):**

| Who | Options | Notes |
|---|---|---|
| **Referrer** | ₱500 **GCash** · or ₱500 **off next booking** · or **1 free airport transfer** · or **1 free "add-driver" day** · or entry to a **monthly draw** | GCash suits locals / returning expats. For one-and-done foreign tourists, give a **transferable discount code** (they can gift it in their travel group), a small **Wise/PayPal** payout, or the draw. |
| **Referee (friend)** | ₱300 **off first booking** · or **free vehicle upgrade** · or **free add-driver day** | Keep it instant and visible on the `/r/[code]` landing page. |

**Anti-abuse guardrails:** reward only when the referee's opportunity reaches `booked`/`completed`; **block self-referral** (same phone/device/email); **cap** rewards per referrer per month; require **admin approval** before payout (surfaced in `/admin/referrals`).

### 7A.4 Data model (additions)

```sql
-- Extend contacts
ALTER TABLE contacts
  ADD COLUMN referral_code TEXT UNIQUE,                 -- e.g. 'JUAN-7QK2'
  ADD COLUMN referred_by_contact_id UUID REFERENCES contacts(id);

-- Referrals (one row per referred friend)
CREATE TYPE referral_status AS ENUM
  ('pending','clicked','signed_up','booked','rewarded','void');

CREATE TABLE referrals (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_contact_id    UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  referee_contact_id     UUID REFERENCES contacts(id),      -- set when friend submits
  referee_opportunity_id UUID REFERENCES opportunities(id),
  code                   TEXT NOT NULL,                     -- the /r/[code] used
  channel                TEXT,                              -- whatsapp | messenger | copy | qr
  status                 referral_status NOT NULL DEFAULT 'pending',
  referrer_reward        TEXT,                              -- 'gcash_500' | 'discount_500' ...
  referee_reward         TEXT,                              -- 'discount_300' ...
  reward_paid_at         TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at           TIMESTAMPTZ
);
CREATE INDEX referrals_referrer_idx ON referrals (referrer_contact_id);
CREATE INDEX referrals_status_idx   ON referrals (status);

-- Reviews / feedback
CREATE TABLE reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id     UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  rating         INT,            -- 1..5 (star); nullable if NPS-only
  nps            INT,            -- 0..10 (optional)
  comment        TEXT,
  is_promoter    BOOLEAN,        -- computed at submit
  left_public    BOOLEAN NOT NULL DEFAULT false,  -- clicked out to Google/FB
  public_channel TEXT,           -- google | facebook | tripadvisor
  is_published   BOOLEAN NOT NULL DEFAULT false,  -- admin approved → show on site
  token          TEXT UNIQUE,    -- the /review/[token] value
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> A **B2B partner** is just a `contact` tagged `partner` (add a small `partners` table with a `commission_rate` if you want tiers). Their `referral_code` is what a hotel/host hands out; payouts appear in `/admin/referrals` as a monthly commission run.

### 7A.5 Customer-facing pages

| Route | Who sees it | What it does |
|---|---|---|
| `/review/[token]` | Past customer (from W4 link) | 1-tap NPS/star + comment; promoters → Google/FB buttons; detractors → private recovery |
| `/r/[code]` | The referred **friend** | Warm landing: "Juan recommends EasyRideCebu — here's ₱300 off." Pre-fills the inquiry form with the code |
| `/thanks/[token]` (share hub) | The **referrer** | Shows their unique link + **one-tap WhatsApp / Messenger share** (pre-written text) + reward status |

Because `/r/[code]` funnels into the **same** `/api/inquiries` intake, referred friends flow through the exact same funnel — just tagged with `referral_code` so W5 can reward on conversion.

### 7A.6 API additions

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/reviews` | Submit rating/NPS/comment (token-gated, public) |
| GET | `/api/r/[code]` | Resolve code → referrer name + reward; log a `clicked` |
| POST | `/api/referrals/share` | Log which channel the referrer shared to |
| GET | `/api/admin/reviews` | Moderate / publish reviews (portal) |
| GET | `/api/admin/referrals` | Referral list + reward payout actions (portal) |

### 7A.7 Workflow — extend W4 + optional **W5 "Referral Reward"**

**W4 gains two steps** after "move to Completed":
1. **Review request** → link to `/review/[token]`.
2. **Referral invite** (only if promoter) → their `/thanks/[token]` share hub with the unique link + pre-written WhatsApp text.

**Optional W5 — Referral Reward** (a clean 5th automation layered on top of your 4):

```mermaid
flowchart TD
    T["Trigger: referral.converted<br/>(referee opportunity → booked)"] --> V{"Passes guardrails?<br/>not self-referral · under cap"}
    V -- no --> VOID["Mark referral 'void' + flag for admin"]
    V -- yes --> ISSUE["Issue referrer reward + mark referee discount used"]
    ISSUE --> NOTE["Notify BOTH (WhatsApp / email)"]
    NOTE --> LTV["referral.status = 'rewarded'; bump referrer lifetime_value"]
```

> You asked for **4 core workflows** (W1–W4) and those remain the backbone. **W5 is an optional add-on** purely for the referral payout — if you'd rather keep it to four, fold the reward step into W4's tail instead of a separate workflow.

### 7A.8 Admin portal additions

- **`/admin/reviews`** — moderation queue: read NPS/comments, **approve → publish** to the landing `Testimonials`, reply, and watch the **NPS/rating trend**.
- **`/admin/referrals`** — every referral with status, **reward payout** buttons (approve / mark paid), **anti-abuse flags**, and a **top-referrer leaderboard** (perfect for spotting partner hotels worth formalizing).
- **On the per-inquiry detail (§10.3):** a "**Referred by [Name]**" badge, the contact's **own referral code**, referrals they've made, and any review they left.

### 7A.9 Extra metrics (virality & satisfaction)

Add to `/api/admin/metrics`:
- **NPS** and **average rating**; **review-request → review-left** conversion.
- **Referral rate** — % of completed trips that generate ≥1 referral.
- **Referral → booking** conversion; **revenue from referred bookings**.
- **K-factor (viral coefficient)** = invites sent per customer × their conversion rate. `K > 1` = self-sustaining growth.
- **CAC saved** — a referred booking costs you a reward instead of ad spend.

---

## 8. Lead Capture: Migrating From Sheets → Postgres

The elegant part: **the three forms don't change.** We swap the endpoint's implementation.

### Step 8.1 — New intake endpoint
Create `src/app/api/inquiries/route.ts` (the Postgres version of the current Sheets route). It:
1. Validates the body with an **extended** `bookingSubmissionSchema` (add optional `tourTitle`, `countryCode`, `utm`).
2. Runs the intake transaction: **upsert contact → insert inquiry → create opportunity @ `new_lead`**.
3. **Enrolls the opportunity into W1** (`inquiry.created`).
4. Returns the same success shape the forms already expect.

> Keep it backward-compatible: either (a) point the service at the new route, or (b) leave `/api/submit-booking` as a thin alias that calls the same intake function. Recommended: **(a)**, one-line change.

### Step 8.2 — One-line service change
`src/services/query.service.ts` currently posts to `/api/submit-booking`. Change to `/api/inquiries`:

```diff
- await apiClient.post('/api/submit-booking', data)
+ await apiClient.post('/api/inquiries', data)
```

That's the **only** change needed in the public site — all three forms (`HeroSection`, `ContactSection`, `TourInquiryForm`) already go through this service. Their toasts and `ApiEvent` flow keep working unchanged.

### Step 8.3 — Retire the Sheets code
Once verified, delete `appendToGoogleSheet()` and the `googleapis` dependency (or keep a feature-flagged "mirror to Sheets" for a transition period). Optionally run the [migration script](#18-appendix-reference-code-snippets) to import historical rows from the old spreadsheet into `contacts` + `inquiries`.

```mermaid
flowchart LR
    subgraph Before
      F1["3 forms"] --> S1["submitQuery → /api/submit-booking"] --> Sheet["Google Sheet"]
    end
    subgraph After
      F2["3 forms (unchanged)"] --> S2["submitQuery → /api/inquiries"] --> DB[("Postgres")]
      S2 --> W1["W1 automation"]
    end
```

---

## 9. Admin Authentication & Login

We complete the auth scaffolding that already exists (`middleware.ts`, `user.store.ts`, `AuthGuard.tsx`, `loginSchema`).

### 9.1 Approach
- **Password hashing:** `bcryptjs` (pure JS → works on serverless Node runtime).
- **Sessions:** short-lived **JWT** (access) signed with `jose`, stored in an **httpOnly, Secure, SameSite=Lax cookie** named `auth-token` (the cookie name the middleware already reads). Optional refresh token cookie mirrors the existing `api-client` refresh flow.
- **Edge middleware** verifies the JWT signature with `jose` (no DB, no bcrypt) and gates `/admin/**`.
- **No public signup.** Admins are seeded via a script/CLI (`npm run create-admin`). Optionally an `owner` can invite `agent`s later.

### 9.2 Auth flow

```mermaid
sequenceDiagram
    participant U as Admin (browser)
    participant P as /admin/login page
    participant API as POST /api/auth/login
    participant DB as Postgres (admin_users)
    U->>P: enter email + password (loginSchema)
    P->>API: apiClient.post('/api/auth/login', creds)
    API->>DB: SELECT by email
    DB-->>API: user + password_hash
    API->>API: bcrypt.compare(password, hash)
    API->>API: sign JWT (jose), set httpOnly cookie 'auth-token'
    API-->>P: { user } (no token in body)
    P->>P: userStore.setUser(user)
    P->>U: redirect → /admin
    Note over U,API: Middleware verifies 'auth-token' on every /admin/** request
```

### 9.3 Endpoints
- `POST /api/auth/login` — verify creds, set cookie, return `{ user }`.
- `POST /api/auth/logout` — clear cookie.
- `GET /api/auth/me` — return current admin from cookie (portal bootstrap).

### 9.4 Middleware update
`src/middleware.ts` today guards `/dashboard`. Update it to guard the portal and verify the JWT:

```diff
- const protectedRoutes = ['/dashboard', '/profile', '/settings'];
- const authRoutes = ['/login', '/register'];
+ const protectedRoutes = ['/admin'];
+ const authRoutes = ['/admin/login'];
```
…and replace the "cookie exists" check with `await jwtVerify(token, secret)` (wrap in try/catch; redirect to `/admin/login?redirect=…` on failure). Keep the existing matcher.

### 9.5 Login page
Build `src/app/admin/login/page.tsx` reusing your existing form primitives and the **already-defined `loginSchema`** from `src/models/validation-schemas.ts`:
- `FormProvider` + `react-hook-form` + `zodResolver(loginSchema)`
- `FormInput` for email/password, PrimeReact `Button`
- On success: `useUserStore.setUser(...)` then `router.push('/admin')`
- Reuse the `ApiEvent` toast pattern (add `ApiEventType.AUTHENTICATION`, which already exists in the enum) or a local toast.

---

## 10. The Admin Portal (Inquiry List → Per-Inquiry Workflow)

Portal lives under `/admin/**` (JWT-protected). Built with your existing PrimeReact + Tailwind stack.

### 10.1 Routes

| Route | File | Purpose |
|---|---|---|
| `/admin/login` | `src/app/admin/login/page.tsx` | Login (public) |
| `/admin` | `src/app/admin/page.tsx` | Dashboard: funnel counts, today's tasks |
| `/admin/inquiries` | `src/app/admin/inquiries/page.tsx` | **List of all inquiries** (table) |
| `/admin/inquiries/[id]` | `src/app/admin/inquiries/[id]/page.tsx` | **Per-inquiry workflow view** |
| `/admin/pipeline` | `src/app/admin/pipeline/page.tsx` | Kanban board (optional, Phase 3) |
| `/admin/layout.tsx` | shared shell | Sidebar nav + auth bootstrap (`/api/auth/me`) |

### 10.2 Inquiries list (`/admin/inquiries`)
A PrimeReact `DataTable` with server-side pagination, search, and filters (source, stage, owner, date range). **Clicking a row → `/admin/inquiries/[id]`.**

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  Inquiries                                   [ Search 🔍 ]  [ Source ▾ ] [ Stage ▾ ]│
├──────────┬───────────────┬───────────────┬────────────┬────────────┬────────────┤
│ Date     │ Name          │ Service       │ Stage      │ Source     │ Owner      │
├──────────┼───────────────┼───────────────┼────────────┼────────────┼────────────┤
│ Jul 28   │ Juan dela Cruz│ Tour (Van)    │ 🟡 New Lead│ tour-inquiry│ Unassigned │  ← click
│ Jul 28   │ Maria Santos  │ Airport (SUV) │ 🔵 Quote   │ hero-form   │ Joseph     │
│ Jul 27   │ John Smith    │ Car rental    │ 🟢 Booked  │ contact-form│ Joseph     │
└──────────┴───────────────┴───────────────┴────────────┴────────────┴────────────┘
                                                   ◀ 1 2 3 … ▶   Rows: [25 ▾]
```

Backed by `GET /api/admin/inquiries?query=&source=&stage=&owner=&page=&pageSize=`.

### 10.3 Per-inquiry workflow view (`/admin/inquiries/[id]`)
**This is the "click an inquiry → see its workflow" screen.** It shows where the lead is in the funnel, which automations are running, the full history, and quick actions.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Back      Juan dela Cruz · Van Tour             [ Won ] [ Lost ] [ ⋯ ]      │
├──────────────────────────────────────────────────────────────────────────────┤
│  FUNNEL STAGE  (click a stage to advance the lead)                            │
│  ●───────●───────◍───────○───────○───────○───────○                            │
│  New    Contacted Quote  Negot.  Booked  Complete Lost      ← stage stepper   │
├───────────────────────────────┬──────────────────────────────────────────────┤
│  CONTACT                       │  ACTIVE AUTOMATIONS                          │
│  📞 +63 917 804 6988  [WhatsApp]│  ⚙ W1 Instant Response …… ✅ completed        │
│  ✉  juan@email.com    [Email]  │  ⚙ W2 Follow-up Drip …… ▶ active             │
│  Tags: source:tour, service:tour│     next: msg #2 in 21h  [pause] [exit]     │
│                                │  ⚙ W3 Quote → Booking …… ⏸ not started       │
│  INQUIRY DETAILS               ├──────────────────────────────────────────────┤
│  Service: Tour (Van)           │  ACTIVITY TIMELINE                           │
│  Preferred: Aug 12, 2026       │  • Jul 28 10:02  System — Opportunity created│
│  Add driver: Yes               │  • Jul 28 10:02  W1 — Auto-reply sent (email)│
│  Message: "Interested in the   │  • Jul 28 10:03  W1 — Task: call back 15 min │
│   Canyoneering full course…"   │  • Jul 28 10:15  Joseph — Called, no answer  │
│  [ View raw payload ]          │  • Jul 28 11:02  W2 — Follow-up #1 sent       │
│                                │  ── add note ──────────────────────[ Save ] │
├───────────────────────────────┴──────────────────────────────────────────────┤
│  QUICK ACTIONS: [ Move to Quote Sent ]  [ + Task ]  [ Send Quote ]  [ Assign ▾ ]│
└──────────────────────────────────────────────────────────────────────────────┘
```

**The screen composes three "workflow" meanings the user cares about:**
1. **Funnel stage stepper** — the lead's position in the pipeline; clicking a stage calls `PATCH /api/admin/opportunities/[id]` and logs a `stage_change` activity (which can trigger W3/W4).
2. **Active Automations panel** — the GHL-style workflows this opportunity is enrolled in, their status, next scheduled action, and pause/exit controls (`workflow_enrollments`).
3. **Activity timeline** — every note, message, task, and automation step in chronological order.

Backed by `GET /api/admin/inquiries/[id]` (returns contact + opportunity + inquiry + activities + tasks + enrollments in one payload).

---

## 11. API Reference

### Public
| Method | Path | Body / Query | Purpose |
|---|---|---|---|
| POST | `/api/inquiries` | inquiry payload | Intake: contact+inquiry+opportunity, enroll W1 |

### Auth
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Verify creds, set `auth-token` cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Current admin (portal bootstrap) |

### Admin (JWT-protected)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/inquiries` | List/search/filter/paginate inquiries+opportunities |
| GET | `/api/admin/inquiries/[id]` | Full detail (contact, opp, activities, tasks, enrollments) |
| PATCH | `/api/admin/opportunities/[id]` | Change stage / owner / value / status / lost_reason |
| POST | `/api/admin/opportunities/[id]/activities` | Add note / log call / log message |
| POST | `/api/admin/opportunities/[id]/tasks` | Create task |
| PATCH | `/api/admin/tasks/[taskId]` | Complete / reschedule task |
| POST | `/api/admin/opportunities/[id]/enroll` | Manually enroll into a workflow |
| POST | `/api/admin/enrollments/[id]/pause` | Pause / resume / exit an automation |
| GET | `/api/admin/metrics` | Funnel counts + conversion (dashboard) |

### System
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/cron/workflows` | Process due `workflow_enrollments` (Vercel Cron) |

All admin routes validate the JWT (via middleware for pages + a small `requireAdmin(request)` helper inside each route handler for defense-in-depth) and use **parameterized queries via Drizzle** (no string-concatenated SQL).

---

## 12. The Automation Runner (Vercel Cron)

Time-based steps (the "Wait 24 hours" parts of W2/W3/W4) are driven by a **Vercel Cron** job that pings an endpoint on a schedule.

**`vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/cron/workflows", "schedule": "*/5 * * * *" }
  ]
}
```

**`/api/cron/workflows` logic:**
1. Authenticate the request (`Authorization: Bearer ${CRON_SECRET}`; Vercel sends this header).
2. Select enrollments where `status='active' AND next_run_at <= now()` (indexed).
3. For each, execute the current step via a handler map keyed by `step.type` (`send_message`, `wait`, `create_task`, `notify_admin`, `move_stage`, `add_tags`, `branch`, `enroll`, `exit`).
4. Advance `current_step`, set the next `next_run_at` (for `wait`), or mark `completed`.
5. Write an `activities` row for every action (so it shows in the timeline).

```mermaid
sequenceDiagram
    participant Cron as Vercel Cron (*/5 min)
    participant R as /api/cron/workflows
    participant DB as Postgres
    participant Msg as Email/SMS/WhatsApp
    Cron->>R: POST (Bearer CRON_SECRET)
    R->>DB: SELECT enrollments WHERE next_run_at <= now()
    loop each due enrollment
        R->>R: run step handler
        R->>Msg: send message (if step type)
        R->>DB: log activity + advance step / set next_run_at
    end
    R-->>Cron: 200 { processed: N }
```

> Event-based triggers (W1 on `inquiry.created`, W3 on `stage.changed`) fire **inline** in their route handlers, then hand off timed steps to the same runner. This keeps instant actions instant and defers only the "wait" steps to Cron.

---

## 13. Dependencies & Environment Variables

### New dependencies
```bash
# Database + ORM
npm i drizzle-orm postgres            # or: @neondatabase/serverless
npm i -D drizzle-kit

# Auth
npm i jose bcryptjs
npm i -D @types/bcryptjs

# (optional) messaging provider SDKs when you wire real email/SMS
# npm i resend           # transactional email
```
Recommended hosting: **Neon** or **Vercel Postgres** (Neon under the hood) — you already deploy on Vercel (your hero image is served from `*.public.blob.vercel-storage.com`).

### `.env.local` (gitignored already)
```bash
# --- Database ---
DATABASE_URL="postgres://user:pass@host/db?sslmode=require"

# --- Auth ---
JWT_SECRET="<64+ random chars>"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"

# --- Cron ---
CRON_SECRET="<random>"

# --- Messaging (later phases) ---
RESEND_API_KEY=""
ADMIN_NOTIFY_EMAIL="joe.seph.andrade.ii@gmail.com"
WHATSAPP_BUSINESS_NUMBER="639178046988"

# --- Existing (keep) ---
NEXT_PUBLIC_APP_URL="https://easyridecebu.com"
```
Add these to Vercel Project → Settings → Environment Variables too. **Never** expose `DATABASE_URL`/`JWT_SECRET` with the `NEXT_PUBLIC_` prefix.

---

## 14. Implementation Roadmap (Phased)

### Phase 0 — Foundations (½ day)
- [x] Provision Neon/Vercel Postgres; add `DATABASE_URL`.
- [x] Add deps; create `src/db/client.ts`, `src/db/schema.ts`, `drizzle.config.ts`.
- [x] Generate + run first migration; seed pipeline + 7 stages + the 4 workflow rows.
- **Done when:** `npm run db:studio` shows all tables and seed data.

### Phase 1 — Persist inquiries to Postgres (1 day) ⟵ *core ask*
- [x] Extend `bookingSubmissionSchema` (`tourTitle`, `countryCode`, `utm`).
- [x] Build `src/app/api/inquiries/route.ts` intake transaction (upsert contact → inquiry → opportunity).
- [x] Enroll W1 inline (create tasks + activities; auto-reply can be a stub log first).
- [x] Flip `query.service.ts` to `/api/inquiries`.
- **Done when:** submitting any of the 3 forms creates a `contact`, `inquiry`, and `opportunity @ new_lead`; forms still show the success toast.

### Phase 2 — Admin auth + inquiries list (1–2 days) ⟵ *login + list*
- [x] `admin_users` seed script (`npm run create-admin`).
- [x] `/api/auth/login|logout|me`; update `middleware.ts` to JWT-verify `/admin/**`.
- [x] `/admin/login` page (reuse `loginSchema`); `/admin/layout.tsx` shell.
- [x] `/admin/inquiries` list (`GET /api/admin/inquiries`, DataTable, filters, pagination).
- **Done when:** you can log in and see every inquiry; logging out blocks `/admin`.

### Phase 3 — Per-inquiry workflow view + stage control (2 days) ⟵ *the "workflow" screen*
- [x] `GET /api/admin/inquiries/[id]` aggregate payload.
- [x] `/admin/inquiries/[id]` page: stage stepper, contact, inquiry details, activity timeline, tasks.
- [x] `PATCH /api/admin/opportunities/[id]` (stage/owner/status) + activity logging.
- [x] Add-note + create-task actions.
- **Done when:** you can open a lead, move it through stages, add notes/tasks, and see the timeline update.

### Phase 4 — Automations live (2–3 days)
- [x] `/api/cron/workflows` runner + `vercel.json` cron.
- [x] Wire W2 (drip), W3 (quote→booking on stage change), W4 (post-booking).
- [x] Real messaging (email via Resend; WhatsApp click-to-chat links; SMS optional).
- [x] Active-automations panel + pause/exit controls on the detail page.
- **Done when:** an untouched new lead automatically receives follow-ups and is marked lost after 72h; a booked lead gets confirmation + review requests.

### Phase 5 — Reporting & polish (1 day)
- [x] `/admin` dashboard: stage counts, conversion %, today's tasks, source breakdown.
- [x] Optional `/admin/pipeline` kanban.
- [x] Migrate historical Google Sheet rows; retire `appendToGoogleSheet`.

### Phase 6 — Reviews, Feedback & Referrals (2–3 days) ⟵ *retention & virality (§7A)*
- [x] Add `referrals` + `reviews` tables; `contacts.referral_code` + `referred_by_contact_id`; generate codes.
- [x] `/review/[token]` (NPS + promoter/detractor routing) + `POST /api/reviews`.
- [x] `/r/[code]` warm landing → prefilled `/api/inquiries`; `/thanks/[token]` share hub (1-tap WhatsApp/Messenger).
- [x] Extend **W4** (review + referral invites); optional **W5 Referral Reward** with anti-abuse guardrails.
- [x] `/admin/reviews` (moderate → publish to `Testimonials`) and `/admin/referrals` (payouts + leaderboard).
- [x] Add NPS / referral-rate / k-factor to `/api/admin/metrics`.
- **Done when:** a completed trip triggers a review request; a promoter can 1-tap share a unique link; a referred friend's booking rewards both parties (pending admin approval).

> **Fastest path to your core goal (DB + list + per-inquiry workflow):** Phases 1–3. Automations (Phase 4) and the reviews/referral layer (Phase 6) layer on without touching the public forms.

---

## 15. Security, Anti-Spam & Rate Limiting

- **Public intake hardening:** honeypot field + timing check; per-IP rate limit (e.g. Upstash Ratelimit or a simple DB counter); optional Cloudflare Turnstile/hCaptcha. Cap `message` length (already 1000 via `FORM_CONST.MESSAGE_MAX_LENGTH`).
- **Cookies:** `httpOnly`, `Secure`, `SameSite=Lax`; short access-token TTL; rotate refresh tokens (aligns with your existing `api-client` refresh logic).
- **Password storage:** `bcryptjs` with cost ≥ 10; never log or return hashes.
- **RBAC:** `admin_users.role` — `owner` (manage users), `admin` (all leads), `agent` (assigned leads). Enforce in `requireAdmin()`.
- **SQL injection:** Drizzle parameterization only; no raw string SQL with user input.
- **PII:** phone/email are personal data — restrict access to authenticated admins; add an audit trail via `activities`. Provide a delete-contact path for privacy requests.
- **Secrets:** server-only env; verify `CRON_SECRET` on the cron route so it can't be triggered by the public.

---

## 16. Funnel Reporting & Analytics

The whole point of a funnel is measurement. `GET /api/admin/metrics` powers the dashboard:

- **Stage counts:** open opportunities per stage (funnel bar chart).
- **Conversion rates:** New→Contacted, Contacted→Quote, Quote→Booked, and overall Lead→Booked %.
- **Speed-to-lead:** median time from `inquiry.created` → first `contacted` activity.
- **Source performance:** bookings and revenue by `source` (which form/channel converts best).
- **Loss reasons:** grouped `opportunities.lost_reason` (why deals die).
- **Revenue:** sum of `monetary_value` for `won` this week/month; weighted forecast using `stage.probability`.

```mermaid
flowchart TD
    A["New Leads: 120"] --> B["Contacted: 78 (65%)"]
    B --> C["Quote Sent: 41 (53%)"]
    C --> D["Booked: 19 (46%)"]
    D --> E["Completed: 18"]
```
Example read: only 53% of contacted leads get a quote → your team is slow to quote → prioritize W3 / quote templates.

---

## 17. File-by-File Change Map

**New files**
```
drizzle.config.ts
vercel.json                                   # cron schedule
src/db/client.ts                              # Drizzle + pg/neon client (server-only)
src/db/schema.ts                              # all tables (Drizzle)
src/db/seed.ts                                # pipeline, stages, workflows
scripts/create-admin.ts                       # seed an admin_user (bcrypt hash)
scripts/import-sheet.ts                        # optional: migrate old Sheet rows

src/models/inquiry.schema.ts                  # extended intake zod schema
src/models/crm.types.ts                       # Contact/Opportunity/Activity types

src/app/api/inquiries/route.ts                # NEW intake → Postgres + W1
src/app/api/auth/login/route.ts
src/app/api/auth/logout/route.ts
src/app/api/auth/me/route.ts
src/app/api/admin/inquiries/route.ts          # list
src/app/api/admin/inquiries/[id]/route.ts     # detail aggregate
src/app/api/admin/opportunities/[id]/route.ts # PATCH stage/owner/status
src/app/api/admin/opportunities/[id]/activities/route.ts
src/app/api/admin/opportunities/[id]/tasks/route.ts
src/app/api/admin/tasks/[taskId]/route.ts
src/app/api/admin/metrics/route.ts
src/app/api/cron/workflows/route.ts           # automation runner
src/app/api/reviews/route.ts                  # submit rating/NPS (token-gated)  [§7A]
src/app/api/r/[code]/route.ts                 # resolve referral code + log click [§7A]
src/app/api/referrals/share/route.ts          # log referral share channel        [§7A]
src/app/api/admin/reviews/route.ts            # moderate / publish reviews         [§7A]
src/app/api/admin/referrals/route.ts          # referral tracking + payouts        [§7A]

src/app/admin/layout.tsx                       # portal shell (sidebar + auth bootstrap)
src/app/admin/login/page.tsx
src/app/admin/page.tsx                          # dashboard
src/app/admin/inquiries/page.tsx                # list
src/app/admin/inquiries/[id]/page.tsx           # per-inquiry workflow view
src/app/admin/pipeline/page.tsx                 # optional kanban
src/app/review/[token]/page.tsx                 # post-trip review/feedback (public) [§7A]
src/app/r/[code]/page.tsx                        # referral warm landing (public)     [§7A]
src/app/thanks/[token]/page.tsx                  # referrer share hub (public)         [§7A]
src/app/admin/reviews/page.tsx                   # review moderation                   [§7A]
src/app/admin/referrals/page.tsx                 # referral tracking + payouts          [§7A]

# schema.ts also gains: referrals + reviews tables, contacts.referral_code / referred_by_contact_id  [§7A]

src/services/auth.service.ts                    # login/logout/me
src/services/inquiry.service.ts                 # admin list/detail/patch calls
src/lib/auth/jwt.ts                             # jose sign/verify helpers
src/lib/auth/require-admin.ts                   # route-handler guard
src/lib/workflows/engine.ts                     # step handler map + runner
src/lib/workflows/definitions.ts                # W1–W4 definitions
```

**Modified files**
```
src/services/query.service.ts   # post to /api/inquiries instead of /api/submit-booking (1 line)
src/middleware.ts               # protect /admin/**, JWT-verify with jose
src/models/booking.schema.ts    # extend bookingSubmissionSchema (tourTitle, countryCode, utm)
src/models/api-event.ts         # (optional) reuse AUTHENTICATION event type for login toasts
package.json                    # new deps + scripts (db:generate, db:migrate, db:seed, create-admin)
.env.local / Vercel env         # DATABASE_URL, JWT_SECRET, CRON_SECRET, etc.
```

**Removed (after cutover)**
```
src/app/api/submit-booking/route.ts   # or keep as thin alias during transition
appendToGoogleSheet() + googleapis dep
```

---

## 18. Appendix: Reference Code Snippets

> Illustrative — final code follows your existing conventions (zod schemas in `src/models`, services in `src/services`, PrimeReact forms, the `ApiEvent` toast pattern).

### A. Drizzle client (`src/db/client.ts`)
```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Server-only. Never import from a client component.
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
```

### B. Two tables in Drizzle (`src/db/schema.ts`, pattern for the rest)
```ts
import { pgTable, uuid, text, timestamp, boolean, numeric, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';

export const oppStatus = pgEnum('opp_status', ['open', 'won', 'lost', 'abandoned']);

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name'),
  email: text('email'),
  phone: text('phone'),
  countryCode: text('country_code').default('+63'),
  tags: text('tags').array().notNull().default([]),
  firstSource: text('first_source'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const opportunities = pgTable('opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  stageId: uuid('stage_id').notNull(),
  ownerId: uuid('owner_id'),
  title: text('title').notNull(),
  status: oppStatus('status').notNull().default('open'),
  serviceType: text('service_type'),
  vehicleType: text('vehicle_type'),
  monetaryValue: numeric('monetary_value', { precision: 12, scale: 2 }).notNull().default('0'),
  source: text('source'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### C. Intake endpoint (`src/app/api/inquiries/route.ts`)
```ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { contacts, inquiries, opportunities } from '@/db/schema';
import { and, eq, or } from 'drizzle-orm';
import { inquirySubmissionSchema } from '@/models/inquiry.schema';
import { runWorkflow } from '@/lib/workflows/engine';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = inquirySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    // 1) upsert contact (dedupe by phone or email)
    const [existing] = await tx.select().from(contacts)
      .where(or(eq(contacts.phone, data.phone), data.email ? eq(contacts.email, data.email) : undefined))
      .limit(1);

    const contact = existing ?? (await tx.insert(contacts).values({
      fullName: data.fullName, email: data.email, phone: data.phone,
      countryCode: data.countryCode ?? '+63', firstSource: data.source,
    }).returning())[0];

    // 2) create opportunity @ new_lead  (stageId resolved from seed/config)
    const [opp] = await tx.insert(opportunities).values({
      contactId: contact.id, stageId: NEW_LEAD_STAGE_ID,
      title: `${data.serviceType ?? 'Inquiry'} — ${data.fullName ?? data.phone}`,
      serviceType: data.serviceType, vehicleType: data.vehicleType, source: data.source,
    }).returning();

    // 3) immutable inquiry log
    await tx.insert(inquiries).values({
      contactId: contact.id, opportunityId: opp.id, source: data.source,
      serviceType: data.serviceType, vehicleType: data.vehicleType,
      addDriver: data.addDriver ?? false, message: data.message, tourTitle: data.tourTitle,
      rawPayload: body,
    });

    return { contact, opp };
  });

  // 4) fire W1 (instant reply, admin task, enroll W2) — inline, non-blocking failures caught inside
  await runWorkflow('w1_intake', { opportunityId: result.opp.id, contactId: result.contact.id });

  return NextResponse.json({ success: true, message: 'Booking inquiry received! We will contact you shortly.' });
}
```

### D. Login endpoint (`src/app/api/auth/login/route.ts`)
```ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/db/client';
import { adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { signAccessToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/models/validation-schemas';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: 'Invalid input' }, { status: 400 });

  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);
  if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signAccessToken({ sub: user.id, role: user.role });
  (await cookies()).set('auth-token', token, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 15,
  });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
```

### E. Edge JWT verify in middleware (`src/middleware.ts`)
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const protectedRoutes = ['/admin'];
const authRoutes = ['/admin/login'];
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  let isAuth = false;
  if (token) { try { await jwtVerify(token, secret); isAuth = true; } catch { isAuth = false; } }

  const isProtected = protectedRoutes.some(r => pathname.startsWith(r)) && !authRoutes.some(r => pathname.startsWith(r));
  if (isProtected && !isAuth) {
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  if (authRoutes.some(r => pathname.startsWith(r)) && isAuth) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)'] };
```

### F. Admin list query (`GET /api/admin/inquiries`)
```ts
// Pseudocode of the core query: join opportunity → contact → stage, filter, paginate.
const rows = await db.select({
  id: opportunities.id,
  name: contacts.fullName,
  phone: contacts.phone,
  serviceType: opportunities.serviceType,
  stage: pipelineStages.name,
  source: opportunities.source,
  owner: adminUsers.name,
  createdAt: opportunities.createdAt,
})
.from(opportunities)
.innerJoin(contacts, eq(contacts.id, opportunities.contactId))
.innerJoin(pipelineStages, eq(pipelineStages.id, opportunities.stageId))
.leftJoin(adminUsers, eq(adminUsers.id, opportunities.ownerId))
.where(/* source/stage/search filters */)
.orderBy(desc(opportunities.createdAt))
.limit(pageSize).offset((page - 1) * pageSize);
```

### G. `package.json` scripts to add
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts",
    "create-admin": "tsx scripts/create-admin.ts"
  }
}
```

---

### Summary
This plan swaps your **spreadsheet intake for a Postgres CRM** without touching the public forms (one-line service change), adds a **GoHighLevel-style data model** (contacts → opportunities → pipeline stages → activities), gives you an **admin login and portal** with a **searchable inquiry list** and a **per-inquiry workflow screen** (stage stepper + live automations + timeline), and ships **4 automations** (instant response, follow-up drip, quote→booking, fulfillment/review) driven by a Vercel Cron runner. Build Phases 1–3 first for the core deliverable; layer automations and reporting after.
