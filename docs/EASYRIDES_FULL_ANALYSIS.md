# EasyRideCebu — Full Project Analysis

*Business + platform analysis of `easyrides-app`, written from the code, data and docs in this repository.*
*Date: 2026-09-11 · Branch: `IMP-CRM` · 180 commits · ~35,300 lines across 223 TS/TSX files.*

---

## Table of contents

1. [What EasyRideCebu is](#1-what-easyridecebu-is)
2. [What this application is](#2-what-this-application-is)
3. [The services offered](#3-the-services-offered)
4. [The tour catalogue](#4-the-tour-catalogue)
5. [The fleet](#5-the-fleet)
6. [Pricing model, end to end](#6-pricing-model-end-to-end)
7. [Payments and money handling](#7-payments-and-money-handling)
8. [The customer journey](#8-the-customer-journey)
9. [The CRM / funnel system](#9-the-crm--funnel-system)
10. [The admin portal](#10-the-admin-portal)
11. [Referrals and reviews (the growth loop)](#11-referrals-and-reviews-the-growth-loop)
12. [Data model](#12-data-model)
13. [Technical architecture](#13-technical-architecture)
14. [Marketing and SEO setup](#14-marketing-and-seo-setup)
15. [Where the truth lives (content ownership)](#15-where-the-truth-lives-content-ownership)
16. [Findings: inconsistencies, gaps and risks](#16-findings-inconsistencies-gaps-and-risks)
17. [Quick reference — where things live](#17-quick-reference--where-things-live)

---

## 1. What EasyRideCebu is

**EasyRideCebu** (also written *Easy Ride Cebu Tours*, domain **easyridecebutours.com**) is a **small, owner-operated car rental and tour operator based in Cebu City, Philippines**. It rents vehicles, drives tourists around Cebu, and sells packaged day tours to the island's best-known destinations.

| | |
|---|---|
| **Legal/brand name** | EasyRideCebu |
| **Website** | https://www.easyridecebutours.com |
| **Phone / WhatsApp / Viber** | +63 917 804 6988 |
| **Email** | trishiaandrade2708@gmail.com |
| **Facebook / Messenger** | facebook.com/easyridecebu (Messenger thread `102398992770751`) |
| **Instagram** | instagram.com/easyridecebu |
| **Base** | Cebu City, Cebu 6000, PH (10.3157, 123.8854) |
| **Areas served** | Cebu City, Mandaue, Lapu-Lapu / Mactan, Cebu Province — plus Bohol; service radius declared as 150 km |
| **Operating hours** | Mon–Sat 08:00–20:00, Sun 09:00–18:00 |
| **Currency / payments accepted** | PHP — Cash, GCash, BPI bank transfer |
| **Bank/wallet account names** | Trishia Andrade (GCash), Trishia Cansancio (BPI) |

It is genuinely a **micro-business**: the AI planning doc records production as *3 contacts, 7 leads, 3 quotes, 3 payments, 0 reviews, 0 referrals* at the time of writing. The software is deliberately built ahead of the volume — the system is designed to make a one- or two-person operation behave like a much larger one.

**The positioning**, taken from the site copy: fixed honest rates, clean air-conditioned vehicles, fast replies, local expertise, no hidden fees. The hero line is *"Easy Cebu rides, ready when you are."* The brand palette is tropical — mango/sunset orange, coral (Cebu red), palm green, cream, papaya, terracotta — drawn from the logo's palm trees.

---

## 2. What this application is

The repo is **one Next.js 16 app that contains two products**:

### A. The public marketing + lead-capture site
A conversion-optimised single landing page plus catalogue pages, built to turn a visitor into an inquiry as fast as possible. Section order deliberately walks Attention → Interest → Desire → Trust → Action, with every CTA pointing at one capture form (`#contact`).

Public routes:

| Route | Purpose |
|---|---|
| `/` | Landing page: hero, trust bar, services, how-it-works, fleet, featured tours, transfer rates, driver add-on, why-us, testimonials, contact form, footer |
| `/tours`, `/tours/[slug]` | Tour catalogue and per-tour detail (itinerary, inclusions, pricing by vehicle class) |
| `/fleet/[slug]` | Per-vehicle page with gallery + a vehicle-specific inquiry form |
| `/promo/[slug]` | Shareable campaign landing pages for Facebook/Instagram/Viber posts |
| `/quote/[token]` | The customer's checkout: priced quote, accept/decline, pick a payment method, upload proof |
| `/review/[token]` | Post-trip star/NPS feedback, then a nudge to Google/Facebook |
| `/r/[code]` | Warm landing for a referred friend ("Juan recommends EasyRideCebu — ₱300 off") |
| `/thanks/[code]` | The referrer's one-tap share hub (WhatsApp / Messenger / copy link) |

### B. The admin portal — a purpose-built CRM
A GoHighLevel-style funnel and CRM at `/admin/**`, protected by JWT cookie auth. It owns leads, the pipeline, quotes, payments, the tour and fleet catalogue, campaigns, reviews, referrals, a trip calendar and a funnel report. This is where most of the recent engineering effort has gone (branch `IMP-CRM`).

Plus a **public read-only JSON API** (`/api/tours`, `/api/vehicles`, and their `[slug]` variants) with permissive CORS so a partner page, booking widget or no-code tool can read the catalogue.

---

## 3. The services offered

Five services are sold, defined in `src/data/services.ts` and expanded in `Easyride-Services.docx`:

| # | Service | What it is | Selling points |
|---|---|---|---|
| 1 | **Car Rentals** (self-drive or with driver) | Daily vehicle rental — drive yourself, or add a professional driver | Unlimited-mileage option, comprehensive insurance, 24/7 roadside support |
| 2 | **Airport / Hotel Transfers** | Mactan-Cebu International Airport ↔ hotel, and port transfers | Flight tracking, meet & greet with your name, fixed rates |
| 3 | **Tour Packages** | Curated Cebu (and Bohol) day tours, 1D up to 5D4N | Expert local guides, all-inclusive options, driver doubles as guide/photographer |
| 4 | **Custom Itinerary** | Build-your-own trip designed with the team | Flexible scheduling, personalised routes, budget planning |
| 5 | **City Transport** | Point-to-point and hourly transport around Cebu City / Mandaue for business, events, errands | Business-class vehicles, professional chauffeurs, hourly bookings |

The inquiry form's service picker mirrors this as four choices: **Car Rental · Airport Transfer · Tour Package · Custom Tour / Other**.

Two service lines documented in the services doc but *not* yet productised as pages on the site: **multi-day packages (5D4N / 4D3N / 3D2N / 2D1N)** and **"transport anywhere in Cebu"** — both currently funnel through the custom-inquiry path rather than having their own priced products.

---

## 4. The tour catalogue

**13 packages** ship in the seed catalogue (`src/data/tours.json`, imported into Postgres and thereafter editable in `/admin/tours`). Every tour is priced by **vehicle class**, not per head — a strong commercial signal: EasyRideCebu sells *the vehicle and the driver*, and third-party entrance fees stay outside the price.

| # | Tour | Duration | Sedan (1–3 pax) | SUV (4–6 pax) | Van (7–14 pax) | Featured |
|---|---|---|---|---|---|---|
| 1 | **City & Uphill Tour** | 8 hours | ₱4,000 | ₱4,500 | ₱6,000 | ★ |
| 2 | **Moalboal & Canyoneering** | Full day | ₱5,500 | ₱6,500 | ₱7,500 | ★ |
| 3 | **Cebu Safari Adventure** | Full day | ₱4,000 | ₱4,500 | ₱5,500 | ★ |
| 4 | **Oslob & Simala** | Full day | ₱5,500 | ₱6,500 | ₱8,000 | |
| 5 | **Cebu West Highland Tour** | Full day | ₱4,500 | ₱5,500 | ₱6,500 | |
| 6 | **Simala Shrine Visit** | 10 hours | ₱4,000 | ₱4,500 | ₱6,000 | |
| 7 | **Simala & Mountain** | Full day | ₱5,500 | ₱6,500 | ₱7,500 | |
| 8 | **Oslob – Moalboal – Kawasan** | Full day | ₱7,500 | ₱8,500 | ₱9,500 | |
| 9 | **Bohol Countryside** | Full day | ₱5,500 | ₱6,000 | ₱7,000 | |
| 10 | **Cebu → Hagnaya Port Transfer** (for Bantayan) | 3 hours | ₱4,500 | ₱5,000 | ₱5,500 | |
| 11 | **Cebu → Maya Port Transfer** (for Malapascua) | 3.5 hours | ₱4,500 | ₱5,000 | ₱5,500 | |
| 12 | **Simala with Ocean Park** | 10 hours | ₱5,000 | ₱5,500 | ₱6,000 | |
| 13 | **City Tour w/ Anjo World** | 10 hours | ₱4,500 | ₱5,000 | ₱5,500 | |

### What the tours actually cover

- **City / heritage circuit** — Temple of Leah, Taoist Temple, Tops Busay, La Vie in the Sky, Sirao Flower Garden, Fort San Pedro, Magellan's Cross, Sto. Niño Church, Heritage Park, San Diego Ancestral House, 10,000 Roses (optional), House of Lechon.
- **South Cebu adventure** — Oslob whale sharks, Sumilon Island, Tumalog Falls, Moalboal sardine run, turtle watching, Kawasan Falls canyoneering, Mantayupan Falls.
- **Pilgrimage** — Simala Shrine (Sibonga), Archbishop Teofilo Camomot Shrine, Boljoon Church, plus the obligatory Carcar lechon and chicharon stop.
- **Family / attraction** — Cebu Safari (Carmen), Cebu Ocean Park, Anjo World theme park, West 35 Eco Mountain Resort, Buwakan ni Alejandra, Strawberry Farm de Cantipla.
- **Inter-island** — Bohol countryside (Chocolate Hills, tarsiers, Loboc, man-made forest) and port transfers feeding Bantayan and Malapascua.

### The standard inclusion / exclusion pattern

Every package uses the same commercial shape:

- **Included:** the vehicle (sedan/SUV/van), hotel or airport pickup and drop-off, **driver who also acts as guide and photographer**, and fuel.
- **Excluded:** entrance fees, parking fees, meals, and any activity add-on.

Recurring priced add-ons the customer pays on top:

| Add-on | Price |
|---|---|
| Whale shark encounter (Oslob) | ₱500 / pax |
| Sumilon Island (boat + entrance) | ₱500 / pax |
| Tumalog Falls (motor ride + entrance) | ₱200–₱500 / pax |
| Full-course canyoneering incl. lunch | ₱2,100 / pax |
| Kawasan Falls entrance + guide | ₱500 / pax |
| 10,000 Roses detour | ₱1,000 / group (fuel + driver) |
| La Vie in the Sky entrance | ₱100 (consumable) |
| Cebu Ocean Park | ₱600 weekday / ₱800 weekend |
| CCLEX toll | ₱90 per way |

---

## 5. The fleet

Sold and managed **by vehicle class, not by individual car** — one row per class is what the public page has always advertised and what an editor maintains (`/admin/vehicles`).

| Class | Sample units | Capacity | Rate (24 hours) | Features |
|---|---|---|---|---|
| **Sedan** | Vios / Mirage G4 (AT) | 5-seater | **₱1,500 / day** | Air-conditioned, automatic, fuel-efficient, city-friendly |
| **SUV** ★ most popular | Xpander / Avanza / Innova (AT) | 7-seater | **₱2,500 / day** | Air-conditioned, automatic, spacious, family-friendly |
| **Van** | NV350 / Hiace Commuter | 15-seater | **₱3,500 / day** | Air-conditioned, group travel, luggage space, tour-ready |

Notes from the code and copy:

- All units are automatic transmission and fully air-conditioned; the pitch is *well-maintained, regularly safety-checked, road-ready*.
- The fleet cards show the rate against a struck-through "was" price computed as **rate × 1.2** — a presentational anchor, not a stored list price.
- Each class has its own page (`/fleet/[slug]`) with a gallery and a dedicated inquiry form.
- The fleet on the landing page is read live from Postgres per request, so whatever the portal publishes is what the next visitor sees.

---

## 6. Pricing model, end to end

### 6.1 Self-drive rental

| Vehicle | Per day (24h) |
|---|---|
| Sedan (5-seater) | ₱1,500 |
| SUV (7-seater) | ₱2,500 |
| Van (15-seater) | ₱3,500 |

**Discounts apply for bookings of more than 3 days** (advertised on the fleet section as "Book for 3+ days & get discounted rates"; the actual discount is negotiated per quote, not encoded).

### 6.2 Driver add-on

| Item | Site / structured data | Services doc (`Easyride-Services.docx`) |
|---|---|---|
| Driver fee (8 hours) | **₱1,000** | ₱850 |
| Overtime per succeeding hour | **₱100** | ₱250 |

For out-of-town trips the renter covers **fuel, the driver's meals and accommodation**. ⚠️ See [§16](#16-findings-inconsistencies-gaps-and-risks) — the two sources disagree.

### 6.3 Airport ↔ hotel transfers (within Cebu City)

| Passengers | Rate per way |
|---|---|
| 1–3 pax | **₱700** |
| 4–6 pax ★ most booked | **₱1,000** |
| 7–14 pax | **₱1,500** |

Fixed rates, no surge pricing, flight tracking and meet-and-greet included. Destinations outside the city (Moalboal, Oslob, Bantayan) are quoted individually — and the Hagnaya/Maya port runs are sold as tour-catalogue items at ₱4,500–₱5,500.

### 6.4 Tours

Per-vehicle pricing, ₱4,000–₱9,500 depending on package and class — see [§4](#4-the-tour-catalogue). Entrance fees, meals and activities are always the customer's.

### 6.5 Discounts and credits

- **Referral credit:** ₱500 off the referrer's next booking, ₱300 off the friend's first booking. Credits are enforced in the database (`referral_credits`), valid 365 days, capped at 5 rewards per referrer per rolling 30 days.
- **Quote-level `discount`** — an agent can apply any discount as a line on a quote.

---

## 7. Payments and money handling

Three payment methods, defined in `src/data/payment-methods.ts` and offered on the quote checkout page:

| Method | Account | Proof required | Paid when |
|---|---|---|---|
| **GCash** | Trishia Andrade · 0917 804 6988 (QR available) | Reference number **and** screenshot | Up front |
| **BPI bank transfer** | Trishia Cansancio · 1199778214 (QR available) | Reference number **and** screenshot | Up front |
| **Cash** | — | A note saying *when* they'll pay | On pickup |

Design decisions worth noting, because they reflect real operational thinking:

- A typed reference number is treated as *a claim*; the **screenshot is the only thing an admin can match against the bank app**, so it is mandatory for anything paid in advance.
- Payment proofs are stored **base64 in Postgres** and served through an admin-authenticated route rather than a public bucket — these are screenshots of people's banking apps.
- Every payment starts as `submitted` and **only a human moves it to `verified` or `rejected`**.
- Quotes support **`full_payment` vs `partial_payment`**, plus an optional **deposit / downpayment** amount, so a booking can be settled in instalments (the most recent feature work on this branch).
- Retired payment methods stay in the list (with `selectable: false`) so historic quotes keep rendering a real label instead of a raw slug.

---

## 8. The customer journey

```
Facebook/Google/Instagram post or search
        ↓
Landing page  ·  /tours/[slug]  ·  /fleet/[slug]  ·  /promo/[slug]  ·  /r/[code]
        ↓  (one inquiry form, everywhere)
POST /api/inquiries → contact upserted, opportunity created @ "New Lead"
        ↓  W1: instant auto-reply + admin alert + "call back in 15 min" task
Agent negotiates (WhatsApp / Messenger / phone)
        ↓
Agent sends a priced quote → stage moves to "Quote Sent"
        ↓
Customer opens /quote/[token] → accepts → picks GCash / BPI / Cash
        ↓  uploads payment screenshot
Admin verifies the payment in /admin/payments
        ↓  stage = "Booked (Won)"
Trip runs (visible on /admin/calendar)
        ↓  W4: trip reminder, then review request
/review/[token] → stars/NPS → public review nudge → referral invite
        ↓
/thanks/[code] share hub → friend lands on /r/[code] with ₱300 off → new lead
```

Live-chat escape hatches sit on every page: a Facebook Messenger widget, `tel:` links, and one-tap WhatsApp deep links.

---

## 9. The CRM / funnel system

Modelled explicitly on GoHighLevel: **contact** (the person) → **inquiry** (one immutable form submission) → **opportunity** (the mutable deal that moves through stages).

### Pipeline — deliberately only four stages

| # | Stage | Meaning | Probability |
|---|---|---|---|
| 1 | **New Lead** | Form just submitted | 10% |
| 2 | **Quote Sent** | A priced checkout link is with the customer | 50% |
| 3 | **Booked (Won)** | Customer accepted and chose how to pay | 100% |
| 4 | **Lost** | Didn't convert, with a recorded reason | 0% |

"Contacted", "Negotiation" and "Completed" were consciously **cut** — reaching out and haggling are *activities on the timeline*, and a finished trip is just a won deal whose trip date has passed. The reasoning: *a stage nobody updates is worse than no stage at all, because it makes the funnel report lie.* Lost is a side exit reachable from any stage, not step 4.

### The five automations

Definitions live in `src/lib/workflows/definitions.ts` as JSON, executed by a cron-driven engine with **14 deterministic action types** (`upsert_contact`, `create_opportunity`, `send_message`, `notify_admin`, `create_task`, `add_tags`, `enroll`, `wait`, `exit_if`, `exit`, `move_stage`, `wait_until_trip_date`, `update_lifetime_value`, `issue_referral_rewards`).

| Workflow | Trigger | What it does |
|---|---|---|
| **W1 · Instant Lead Capture** | `inquiry.created` | Upsert contact → create opportunity → instant auto-reply → alert admin → "call back within 15 min" task → tag by source/service → enrol in W2 |
| **W2 · Speed-to-Lead Follow-Up** | Lead idle in New Lead | Nudges at 1h / 24h / 72h, then marks Lost (no response) |
| **W3 · Quote → Booking** | Stage → Quote Sent | Quote summary, 1-day reminder, 2-day nudge, then Lost (went cold) |
| **W4 · Fulfillment, Review & Re-engagement** | Stage → Booked / trip date | Confirmation + itinerary, driver task, day-before reminder, post-trip review request, referral invite, 30/90-day re-engagement, lifetime-value update |
| **W5 · Referral Reward** | `referral.converted` | Issues the ₱500 credit and the friend's ₱300 discount |

**Speed-to-lead is the stated core thesis:** *"Tourists message 3–4 operators at once. The first to reply usually wins."*

### Messaging

- **Email** via Resend when `RESEND_API_KEY` is set; otherwise every send is logged to the activity timeline so the funnel is fully testable before paying a provider.
- **WhatsApp** is a click-to-chat `wa.me` deep link, not the Business API — the automation stores a ready-to-send link and an agent sends it in one tap.
- 20 message templates: `instant_ack`, `followup_1/2/final`, `quote_summary`, `quote_reminder`, `booking_confirmation`, `payment_submitted`, `payment_verified`, `trip_reminder`, `driver_reminder`, `review_request`, `referral_invite`, `re_engagement_30/90`, `detractor_alert`, and others.

---

## 10. The admin portal

JWT-cookie authenticated (`jose` + `bcryptjs`), roles `owner | admin | agent`.

| Screen | What it does |
|---|---|
| `/admin` | Funnel dashboard — stage counts, adjacent-stage conversion rates, lead→booked %, source performance, lost reasons, open tasks, review + referral metrics (incl. a **K-factor**: invites per customer × their conversion rate) |
| `/admin/inquiries` + `/[id]` | The lead list and the per-lead workspace: stage bar, activity timeline, tasks, quotes, payments, credits, workflow enrolments |
| `/admin/pipeline` | Kanban view of the funnel |
| `/admin/calendar` | Month grid of trips by `preferred_date` (local-time throughout, on purpose) |
| `/admin/payments` + `/[id]` | The verification queue — view the proof screenshot, verify or reject with a note |
| `/admin/tours`, `/admin/vehicles` | Full CRUD over the public catalogue: TipTap rich-text descriptions, image upload to Vercel Blob (converted to WebP), slug management, publish/feature/sort flags |
| `/admin/campaigns` + `/new` | Build a `/promo/[slug]` landing page for a social post — banner (og:image), CTA label, pre-selected service/vehicle, end date, view count vs. lead count |
| `/admin/reviews` | Approve customer reviews; approved ones **replace the curated testimonials on the landing page** |
| `/admin/referrals` | Referral ledger and reward payouts |

Two supporting guides exist for the operator: `docs/ADMIN_PORTAL_GUIDE.md` (how stages, quotes and payments work in practice) and `docs/CRM_FUNNEL_IMPLEMENTATION_PLAN.md` (the ~1,200-line design document this whole CRM was built from).

---

## 11. Referrals and reviews (the growth loop)

Described in the plan as *"often the highest-ROI part of the whole system"* for a trust-driven Cebu tours business.

- **Double-sided offer:** give ₱300, get ₱500. The referrer's side is a **booking credit, not cash** — the money stays in the business and the CRM can actually enforce it (`referral_credits` with `available → applied → redeemed` states, so two live quotes can't discount the same ₱500 and a declined quote returns it).
- **Anti-abuse:** max 5 rewards per referrer per rolling 30 days; credits expire after 365 days.
- **Review flow:** star rating and/or NPS at `/review/[token]`. Promoter = 4–5 stars or NPS ≥ 9. Promoters get the referral invite; detractors trigger a private recovery alert to the admin.
- **Compliance:** the public Google/Facebook review links are shown to **everyone regardless of score** — routing unhappy customers to private recovery *as well* is fine, hiding the public option from them would be review gating.

---

## 12. Data model

PostgreSQL via Drizzle ORM; 11 migrations applied. Core tables:

| Table | Role |
|---|---|
| `admin_users` | Portal logins (owner/admin/agent) |
| `contacts` | The person — deduped by phone/email, carries `referral_code`, `referred_by_contact_id`, lifetime value |
| `inquiries` | One immutable form submission (source, UTM, service/vehicle type, preferred date, message) |
| `pipelines`, `pipeline_stages` | The funnel definition, as rows so it can be renamed without a migration |
| `opportunities` | The mutable deal: stage, status (`open/won/lost/abandoned`), value, `preferred_date`, lost reason |
| `activities` | The timeline: notes, stage changes, inbound/outbound messages, calls, emails, tasks, workflow events |
| `tasks` | Agent to-dos with due dates |
| `workflows`, `workflow_enrollments` | Automation definitions (JSONB) and each lead's position in them |
| `quotes` | Token-addressed checkout: line items, subtotal, discount, total, deposit, validity, payment method/reference/note |
| `payments` | What the customer claims they sent, incl. base64 proof image, verified by a human |
| `referrals`, `referral_credits` | The virality layer and its money ledger |
| `reviews` | Rating / NPS / comment / public-channel click-through |
| `tours` | The public tour catalogue (pricing, itinerary, inclusions, exclusions as JSONB/arrays) |
| `vehicles` | The fleet, one row per class |
| `campaigns` | Shareable `/promo/[slug]` offer pages with view counts |

---

## 13. Technical architecture

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.0.7** (App Router), React 19.2 |
| Language | TypeScript 5 |
| Database | PostgreSQL + **Drizzle ORM 0.45** (`postgres` driver) |
| Styling | **Tailwind CSS v4** with a custom tropical CSS-variable palette |
| UI kit | PrimeReact 10.8 + PrimeIcons, Framer Motion for animation |
| Forms | React Hook Form 7 + **Zod 4** via `@hookform/resolvers` |
| Client state | Zustand 5 (user store, event pub/sub, loading bar, resettable filters) |
| Auth | `jose` JWT in an HTTP-only cookie + `bcryptjs`, enforced by `src/middleware.ts` and `AuthGuard` |
| Rich text | TipTap 3, sanitised with `sanitize-html` on the way in |
| File storage | Vercel Blob (`@vercel/blob`) for tour/vehicle/campaign images, converted to WebP |
| Email | Resend (optional — falls back to logging) |
| Legacy integration | `googleapis` — the original Google Sheets intake, now superseded by Postgres |
| Deploy | Vercel, region **sin1** (Singapore — nearest to Cebu); also a Dockerfile + docker-compose with `output: "standalone"` |

Architectural notes:

- Feature-modular `src/` layout: `app / components / core / guards / hooks / layouts / lib / models / services / stores / types`.
- Business logic lives in **server-only repositories** under `src/lib/**` (`crm`, `tours`, `vehicles`, `campaigns`, `workflows`, `funnel`, `messaging`), keeping route handlers thin.
- The landing page is `force-dynamic` — a deliberate fix, documented in the code: static generation baked *empty* fleet and tour sections into every deploy because the build box's `DATABASE_URL` is a placeholder and the readers swallow errors and return `[]`.
- Public catalogue endpoints get explicit CORS (`GET/HEAD/OPTIONS`, no credentials), scoped by path so it can never reach `/api/admin/*` or `/api/auth/*`.
- The codebase is unusually **well-commented at the "why" level** — most modules open with a rationale paragraph explaining the trade-off that was made. This is one of its real assets.

---

## 14. Marketing and SEO setup

- Rich **JSON-LD** in the root layout: a combined `AutoRental` + `LocalBusiness` + `TravelAgency` entity with address, geo, opening hours, `areaServed`, payment methods, social profiles — plus an **`OfferCatalog` built live from the published tours** (a tour published in the portal appears in structured data automatically) and a 5-question **FAQPage**.
- Full Open Graph + Twitter card metadata, canonical URLs, Google Search Console verification, robots directives with `max-image-preview: large`.
- ~28 targeted keywords: *car rental cebu, cebu tour package, oslob whale shark tour, moalboal canyoneering, simala shrine tour, van rental cebu, cebu car rental with driver…*
- Campaign pages (`/promo/[slug]`) exist specifically to be pasted into a Facebook/Instagram/Viber post: correct 1200×630 og:image, plain-text og:description, and lead attribution back to the campaign.
- A dedicated `SEO-GUIDE.md` accompanies the work.

---

## 15. Where the truth lives (content ownership)

This matters for anyone editing content:

| Content | Source of truth | Seed / fallback |
|---|---|---|
| Tours | **Postgres `tours`**, edited at `/admin/tours` | `src/data/tours.json` via `npm run import-tours` (one-time; `--only-if-empty` on deploy) |
| Fleet | **Postgres `vehicles`**, edited at `/admin/vehicles` | The `FLEET` array in `scripts/import-vehicles.ts` |
| Testimonials | **Postgres `reviews`** (approved ones) | Three hard-coded quotes in `Testimonials.tsx` when none are approved |
| Services (the 5 cards) | **Hard-coded** in `src/data/services.ts` | — |
| Airport transfer rates | **Hard-coded** in `TransferRatesSection.tsx` | — |
| Driver fee | **Hard-coded** in `DriverBanner.tsx` (and again in the layout's FAQ JSON-LD) | — |
| Payment methods | **Hard-coded** in `src/data/payment-methods.ts` | — |

So: tours, fleet and testimonials are self-service; **services, transfer rates and the driver fee require a code change**.

---

## 16. Findings: inconsistencies, gaps and risks

Ordered roughly by business impact.

1. **⚠️ The cron that runs every automation is not scheduled.** `vercel.json` has no `crons` key, so `/api/cron/workflows` is never invoked. Every timed step in W2–W5 (`wait`, `wait_until_trip_date`) is **inert in production** — no follow-up drips, no quote reminders, no trip reminders, no review requests. The AI plan flags this as *"worth more than any AI feature"*. This is the single highest-value fix in the repo.
2. **Driver-fee figures disagree across sources.** The site says ₱1,000 / 8h + ₱100 overtime; `Easyride-Services.docx` says ₱850 / 8h + ₱250 overtime. One of them is being quoted to customers and the other isn't. Pick one and make the doc follow the code (or vice versa).
3. **The driver fee is duplicated in two places in code** — `DriverBanner.tsx` and the FAQ JSON-LD in `layout.tsx`. They currently agree; nothing keeps them agreeing. Same class of risk for the transfer rates and the self-drive day rates (repeated in `ContactSection.tsx`'s vehicle dropdown and the FAQ schema).
4. **No customer conversation ever reaches the CRM.** All real negotiation happens on WhatsApp and Messenger, neither of which is connected — WhatsApp is only a `wa.me` deep link. Every inquiry so far has arrived with an empty `message`. The AI plan's own conclusion: *getting the conversation into the CRM is a bigger lever than any AI feature*; even a "log what the customer said" textarea would create the raw material.
5. **`README.md` is still the unmodified boilerplate template** ("This is a template/boilerplate. Customize it for your specific needs!"). It describes a generic Next.js 15 starter, not EasyRideCebu — no mention of the CRM, the database, the admin portal, or the seed scripts. A new developer's first file is the least accurate one in the repo.
6. **`docs/PROJECT_ANALYSIS.md` is stale.** It describes 16 tours in static JSON, Google Sheets intake, and an app with no CRM. Reality is 13 seeded tours in Postgres with a full funnel system. It should be dated, superseded, or deleted.
7. **Payment proofs are base64 blobs in Postgres.** A deliberate privacy choice (better than a public bucket) but it inflates row size and backups; there is no retention/purge policy for images of people's banking apps. Worth deciding how long they're kept.
8. **Fallback testimonials are fictional-looking names** ("Marco Reyes", "Hannah Lim", "David Cooper") rendered as real 5-star reviews whenever no reviews are approved — which, with 0 reviews in production, is *right now*. That is a live trust/authenticity exposure on the homepage, and easy to fix by hiding the section instead.
9. **Multi-day packages are advertised but not sold.** The services copy promises 5D4N / 4D3N / 3D2N / 2D1N packages; the catalogue contains only day tours and transfers. Either build the products or soften the claim.
10. **Uncommitted work in the tree** at the time of writing: a new public `src/app/api/vehicles/[slug]/` route plus a modified `next.config.ts` (the CORS block for it). It works, but it's unversioned.
11. **Personal accounts are the payment rails.** GCash and BPI are in individual names (Trishia Andrade / Trishia Cansancio) hard-coded into the repo. Fine for a micro-business; worth revisiting for reconciliation and trust as volume grows.
12. **`src/modules/example-feature/`, `/dashboard` and `/auth-module`** are leftover scaffolding from the boilerplate and are dead weight next to the real `/admin` portal.
13. **Manual payment verification is the throughput ceiling.** Every booking waits on a human matching a screenshot to a bank app. The AI plan's top recommendation — a vision-based payment-proof reader — targets exactly this, and it's the one AI feature where the data genuinely exists.

**What is notably good:** the funnel design is disciplined (four stages, each earning its place), the money handling is honest about what is evidence and what is a claim, the credit ledger models reservation/release correctly, review collection is compliance-aware, and the code documents its own trade-offs better than most commercial codebases.

---

## 17. Quick reference — where things live

```
src/data/tours.json                 13 tour packages (seed for Postgres)
src/data/services.ts                the 5 headline services
src/data/payment-methods.ts         GCash / BPI / Cash + QR config
scripts/import-vehicles.ts          the 3 fleet classes (seed)
src/db/schema.ts                    every table, heavily commented
src/lib/funnel/stages.ts            the 4 pipeline stages
src/lib/workflows/definitions.ts    W1–W5 automations
src/lib/messaging/templates.ts      the 20 message templates
src/lib/crm/rewards.ts              ₱500 / ₱300 referral offer
src/components/landing/             all landing-page sections
src/app/admin/                      the CRM portal
docs/CRM_FUNNEL_IMPLEMENTATION_PLAN.md   the design document behind the CRM
docs/ADMIN_PORTAL_GUIDE.md               the operator's manual
docs/AI_PLAN.md                          realistic AI roadmap + production data volumes
Easyride-Services.docx                   the business's own services & rates sheet
```

*Prices in this document are the values committed in the repository (seed catalogue and hard-coded sections). The live tour and fleet prices are whatever `/admin` has published to Postgres.*
