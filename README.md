# HACCP-Builder

A guided web app that walks any food facility operator — in the US or
Canada — through building a formal **HACCP plan**: the Codex Alimentarius /
NACMCF structure of **5 Preliminary Steps** and **7 Principles**. Facility
profile, HACCP team, GMPs/prerequisite programs, an approved-supplier list,
per-product process flow with on-site confirmation, per-product
**formulations** with US/Canada allergen flagging, hazard analysis, CCP
determination (Codex four-question decision tree), preventive control
detail, recall planning (team + annual mock recall log), a full set of
food-safety SOPs (including per-product allergen declarations and HACCP
plan validation/reassessment), and export to a formatted Word document.

This is a working scaffold, not a finished product — see "What's stubbed
out" below before treating this as production-ready.

## Regulatory framing

The classic 12-part Codex/NACMCF HACCP system (5 Preliminary Steps + 7
Principles) is the common backbone that satisfies food safety regulation on
both sides of the border:

- This exact structure is **mandatory verbatim** for FDA seafood HACCP
  (21 CFR 123), FDA juice HACCP (21 CFR 120), and USDA FSIS meat/poultry
  HACCP (9 CFR 417).
- For general US manufactured-food facilities not in those three regulated
  categories, this same structure functionally satisfies (and exceeds)
  FDA's FSMA Hazard Analysis and Risk-Based Preventive Controls requirement
  (21 CFR Part 117 Subpart C, "HARPC"). US GMPs are cited from 21 CFR Part
  117 Subpart B.
- For Canada, CFIA's Safe Food for Canadians Regulations (SFCR) require a
  preventive control plan built on these same HACCP principles; CFIA
  prerequisite-program content (GMPs, sanitation, pest control, recall) is
  cited directly.

This build is intentionally **general/multi-sector** — it doesn't branch
app logic per sector. Instead, the Facility Profile step lets you select
every regulatory scope that applies to you, and surfaces an informational
note: if you process seafood, juice, or meat/poultry, your plan must
additionally satisfy that sector's specific regulation on top of the
general structure this wizard builds.

## Wizard steps

1. **Facility Profile** — facility name/address, every applicable US/CA
   regulatory scope, CFIA licence / FDA registration numbers, responsible
   individual.
2. **HACCP Team** *(Preliminary Step 1)* — the multidisciplinary team
   responsible for the plan. Distinct from the Recall Team (step 11).
3. **GMPs & Prerequisite Programs** — starter documents citing 21 CFR Part
   117 Subpart B and CFIA prerequisite-program guidance.
4. **Vendors / Suppliers** — the facility-wide approved supplier list.
5. **Products** *(Preliminary Steps 2 & 3)* — description/distribution,
   intended use, and intended consumers for each product.
6. **Process Flow** *(Preliminary Steps 4 & 5, per product)* — the flow
   diagram, plus on-site confirmation (confirmed-by/at/notes).
7. **Formulations** *(per product)* — ingredient-level detail: %
   of formulation, functional role, supplier (linked to the Vendor list),
   country of origin, and US/Canada allergen flagging.
8. **Hazard Analysis** *(Principle 1, per product)* — biological/chemical/
   physical/radiological hazards at each step, seeded from a static library
   and from flagged allergen ingredients.
9. **CCP Determination** *(Principle 2, per product)* — the Codex
   four-question decision tree, re-evaluated server-side on every answer.
10. **Preventive Controls** *(Principles 3-7, per product)* — critical
    limits, monitoring, corrective action, verification, recordkeeping,
    responsible party for each CCP.
11. **Recall Plan** — recall team roles/contacts, mock recall log, and the
    generated Recall Plan document.
12. **SOPs** — per-product allergen declarations (built from Formulations
    data), supplier verification, HACCP plan validation & annual
    reassessment, corrective-action & verification records, and more.
13. **Review & Export** — summary stats and the unlock/export flow.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Prisma** ORM, targeting Postgres (see DEPLOYMENT.md for provisioning
  one — locally you can point `DATABASE_URL` at any Postgres instance,
  including a free Neon/Supabase database or Docker)
- **NextAuth** (credentials provider, JWT sessions — no third-party
  identity provider ever sees user data)
- **Stripe** for billing (one-time plan unlock + optional recurring storage
  subscription), with a dev-mode bypass so the whole flow is testable
  without live keys
- **docx** for generating the exported Word document

## Running locally

```bash
cd haccp-builder
npm install
cp .env.example .env        # fill in DATABASE_URL (Postgres) and NEXTAUTH_SECRET at minimum
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The schema targets Postgres — `DATABASE_URL` needs to point at a real
Postgres instance even for local dev. A free [Neon](https://neon.tech) or
[Supabase](https://supabase.com) database works well, or run one locally
with `docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres`.

**Verification note:** this scaffold was built and checked in a sandboxed
environment whose network allowlist blocks Prisma's engine-binary CDN
(`binaries.prisma.sh`), so `prisma generate` couldn't be run to completion
there (same limitation the reference PCP Planner app documented). What
*was* verified in that environment: `npm install` completes cleanly, and
`next build`'s webpack compilation stage passes with zero syntax/import
errors across every route and component (78 source files). The only
`next build` failures observed there are TypeScript type errors that trace
directly back to the un-generated Prisma Client (e.g. `Module
"@prisma/client" has no exported member 'Plan'`, plus the implicit-`any`
cascades that follow from it) — nothing else. Run `npx prisma generate`
followed by `npm run build` on a machine with normal network access (any
laptop, CI runner, or standard host) — that step is required once and will
resolve every remaining type error.

Visit `http://localhost:3000`. Register an account, create a plan, and walk
through the wizard. Since `STRIPE_SECRET_KEY` is blank by default, the
Review & Export step will offer a "(Dev mode) Simulate unlock" button
instead of a real Stripe checkout, so you can test the full flow including
docx export without billing credentials.

## Data model

See `prisma/schema.prisma`. Key entities:

- `User` — account + membership/billing state
- `Plan` — one HACCP plan for a facility, owns a serialized JSON
  `facilityProfile` string plus relational `products`, `vendors`, `sops`,
  `recallContacts`, `mockRecallRecords`, `haccpTeamMembers`, and export
  records
- `HaccpTeamMember` — Preliminary Step 1: the HACCP team, distinct from
  `RecallContact` (the recall team) — a person can be on both
- `Vendor` — the facility-wide approved supplier list; can be linked from
  an `Ingredient`'s formulation record
- `Product` — one product made at the facility. Holds product-specific
  fields (Preliminary Steps 2 & 3) plus the Preliminary Step 5 on-site flow
  confirmation fields (`flowConfirmedBy`, `flowConfirmedAt`,
  `flowConfirmationNotes`), and owns its own `processSteps` and
  `ingredients`
- `Ingredient` — **new in HACCP-Builder**, scoped to `Product`: name, %
  of formulation, functional role, optional linked `Vendor`, country of
  origin, allergen flag + type (UI-suggested from the combined US/Canada
  priority-allergen checklist, `src/lib/allergenLibrary.ts`). Feeds
  suggested hazards (`src/lib/hazardLibrary.ts`) and the per-product
  allergen declaration in the allergen-control SOP
- `ProcessStep` — one step in a product's process flow (Preliminary Step 4)
- `Hazard` — one hazard at a process step, including the four CCP
  decision-tree answers, the resulting `ccpStatus`, and preventive-control
  fields (Principles 3-7)
- `Sop` — a generated/edited GMP or food-safety document
- `RecallContact` / `MockRecallRecord` — the recall team and mock-recall
  log

Note: several fields that would naturally be Prisma `enum`s (membership
tier, plan status, hazard type/severity/likelihood, CCP status) are typed
as `String` instead, following the same convention as the reference app.
Allowed values are documented in comments in the schema and enforced in
application code.

## Core logic

- `src/lib/ccpDecisionTree.ts` — pure-function implementation of the Codex
  four-question CCP decision tree, ported as-is from the reference app with
  HACCP-appropriate copy. The hazard API route re-runs this server-side on
  every answer update, so `ccpStatus` is never trusted from the client.
- `src/lib/hazardLibrary.ts` — seed hazard suggestions keyed by process-step
  name, plus `suggestAllergenHazardsForStep`, which suggests an allergen
  cross-contact hazard at receiving/mixing/packaging/changeover steps for
  any ingredient flagged as an allergen on the Formulations step.
- `src/lib/allergenLibrary.ts` — the combined US/Canada priority-allergen
  checklist, tagged by jurisdiction.
- `src/lib/sopTemplates.ts` — starter templates for GMPs/prerequisite
  programs, the recall plan, and remaining food-safety SOPs, each citing
  the specific US and/or Canadian regulation it maps to. The
  `allergen_control` template is **per-product**, generated directly from
  each product's `Ingredient` records — a genuine improvement over the
  reference app's facility-wide-only version.
- `src/lib/exportDocx.ts` — assembles the whole plan into a single `.docx`
  via the `docx` package.
- `src/lib/entitlements.ts` — single source of truth for what a user/plan
  is entitled to (export gating, retention window, active subscription
  check).

## Privacy & data handling

- **Isolation by construction.** Every API route resolves the current user
  from the signed session (`src/lib/session.ts`) and scopes every Prisma
  query by `userId` (directly, or transitively through the owning `Plan` /
  `Product` / `ProcessStep`). There is no endpoint that accepts a bare
  plan/product/step/hazard/ingredient id without also checking ownership.
- **Credentials, not OAuth.** Sign-in is email + password (bcrypt-hashed,
  12 rounds); sessions are signed JWTs (`NEXTAUTH_SECRET`).
- **Retention model.** Plans on the standard tier get a
  `retentionExpiresAt` timestamp (`DEFAULT_RETENTION_DAYS`, default 90) set
  on creation and refreshed on unlock/subscription events. An active
  storage subscription removes that expiry. **Note:** the actual purge job
  is not implemented yet — see "What's stubbed out."
- **User-initiated deletion.** `DELETE /api/plans/[id]` deletes a plan and
  everything under it via cascading deletes. `User.dataDeletionRequestedAt`
  is reserved on the schema for a full-account deletion flow (not yet wired
  up).
- **Download anytime.** Once a plan is unlocked, export isn't gated by
  storage-subscription status, only by the one-time unlock.

## Billing model

Identical to the reference app: one-time fee per plan (`Plan.isPaid`)
unlocks `.docx` export; optional recurring storage subscription
(`User.storageSubscriptionEnd`) removes the default retention window.
Stripe Checkout (`/api/billing/checkout`), fulfilled via webhook
(`/api/billing/webhook`). Until `STRIPE_SECRET_KEY` is set, both routes
no-op safely and the UI falls back to a dev-mode unlock button
(`/api/billing/checkout-dev-unlock`, gated by `ALLOW_FREE_UNLOCK` once
deployed).

To go live: create the two Stripe Prices, set `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_ONE_TIME`, and
`STRIPE_PRICE_ID_STORAGE_SUBSCRIPTION`, and register the webhook endpoint
in the Stripe dashboard.

## What's stubbed out / next steps

1. **Retention purge job.** No scheduled job yet purges plans past
   `retentionExpiresAt`.
2. **Account deletion flow.** No user-facing "delete my account and all
   data" action yet (cascading relations are already set up for it).
3. **Email verification / password reset.** Registration is immediate with
   no email step.
4. **PDF export**, in addition to docx, if desired.
5. **A real review/sign-off step** — e.g. an e-signature or "reviewed by
   [name] on [date]" attestation before export.
6. **Legal/regulatory review of the templates and CCP tree language.** The
   language here follows the standard Codex/NACMCF structure and the cited
   FDA/USDA FSIS/CFIA terminology as understood at the time of writing, but
   has not been reviewed by a food-safety consultant, lawyer, FDA, USDA
   FSIS, or CFIA; treat it as a strong starting draft, not a compliance
   guarantee.
7. **Sector-specific HACCP requirements** (21 CFR 123 seafood, 21 CFR 120
   juice, 9 CFR 417 meat/poultry) are cited but not separately enforced in
   app logic — this build is intentionally general/multi-sector.
8. **Production database.** Postgres is already the configured provider
   (see DEPLOYMENT.md); the string-typed enum fields and the JSON-string
   `facilityProfile` field could be converted to native Prisma `enum`/`Json`
   types if desired.
