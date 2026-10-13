# Build Status

## Project

- Name: HPKK ED Request
- Build shape: Full-stack application
- Shape confirmation: Confirmed
- Current KDBM Lite stage: Build
- Current phase: Work Card 09 - GitHub and Vercel Proof
- Current work card: `work-cards/09-github-vercel-proof.md`

## Completed work cards

- Work Card 01 - Project Skeleton
- Work Card 02 - Database Schema and RLS
- Work Card 03 - Username Authentication
- Work Card 04 - Monthly Calendar Read View
- Work Card 05 - Owner-Only Request Editing
- Work Card 06 - Administrator Account Management

- Work Card 07 - Workbook Migration and Reconciliation
- Work Card 08 - Security, Accessibility, and Responsive Review
## Completed planning

- [x] Setup Gate skipped by project owner because the referenced file was absent
- [x] Project Brief / Identity
- [x] Architecture
- [x] Design
- [x] Build Blueprint
- [x] Work Cards

## In progress

- [ ] Work Card 09 - GitHub and Vercel Proof

## Blockers

- None currently.

## Decisions made

- Build type: authenticated multi-user staff request system
- Build shape: full-stack application
- Stack: Next.js, TypeScript, Supabase Auth/PostgreSQL/RLS, Vercel
- Design inspiration: custom calm clinical dashboard
- Storage: Supabase PostgreSQL with database-enforced ownership
- Login: administrator-assigned username and temporary password; forced replacement on first login
- Visibility: all active logged-in users can view all requests and remarks
- Mutation: staff can change only their own current/future requests; admin is request-view-only
- Request data: multiple fixed codes per date and mandatory Monday-Sunday weekly remark
- Language: interface/planning in English; request-code meanings in Malay
- Migration: all 12 sheets in `ED STAFF REQUEST 2026.xlsx`, with traceable ambiguity reporting
- Deployment target: Vercel + Supabase Cloud

## Last verified state

- Coding workspace: available
- File read/write access: verified
- Terminal access: verified
- Source workbook: inspected; 12 monthly sheets found (`JAN` through `DIS`, stored in non-calendar tab order)
- Planning files: created
- Node: v24.18.0
- npm: v11.16.0
- Git: v2.55.0
- GitHub/Vercel/Supabase accounts: not checked
- Dependencies: installed; npm audit reported 0 vulnerabilities
- Quality checks: 2 tests passed; typecheck passed; lint passed
- Production build: passed with Next.js 16.3.5 using webpack
- Localhost: production server verified HTTP 200 at `http://localhost:3010`; owner check accepted
- Database schema: initial migration, seed data, shared types, static tests, and Supabase RLS test script added
- Quality checks: 6 tests passed; typecheck passed; lint passed
- Production build: passed with Next.js 16.3.5 using webpack after Work Card 02 changes
- Runtime database verification: passed against remote Supabase project; all 18 pgTAP RLS and constraint tests verified
- Authentication: username login, forced password change, route guards, sign out, and server-only account services implemented
- Supabase auth smoke test: passed against configured project with dummy `wc03.*` accounts
- Quality checks: 10 tests passed; typecheck passed; lint passed
- Production build: passed with Next.js 16.3.5 using webpack after Work Card 03 changes
- Calendar read view: month navigation, complete Monday-Sunday boundary weeks, shared staff grid, weekly remarks, Malay legend, personal mobile agenda, and read-only states implemented
- Calendar date tests: month boundaries, leap year, year boundary, and Asia/Kuala_Lumpur contract pass
- Quality checks: 14 tests passed; typecheck passed; lint passed
- Production build: passed with Next.js 16.3.5 using webpack after Work Card 04 changes
- Work Card 04 owner localhost check: accepted
- Request editing: owner-only multi-code week editor, required remarks, confirmed final deletion, unsaved-change warnings, conflict/session/failure states implemented
- Transaction migration deployed to linked Supabase project; remote migration state is up to date
- Runtime proof verified blank-remark rejection, staff multi-code persistence, and administrator mutation denial; disposable data cleaned
- Hosted REST endpoint timed out during the extended conflict smoke sequence; static conflict contract remains verified
- Quality checks: 18 tests passed; typecheck passed; lint passed
- Production build: passed with Next.js 16.3.5 using webpack after Work Card 05 code changes
- Work Card 05 owner localhost check: accepted
- Administrator account interface: protected account directory, normalized account creation, enable/disable, reset, one-time generated passwords, confirmations, and admin-only navigation implemented
- Quality checks: 22 tests passed; typecheck passed; lint passed
- Production build: passed with Next.js 16.3.5 using webpack after Work Card 06 changes
- Localhost: production server verified HTTP 200 at `http://localhost:3011/login`; unauthenticated `/dashboard` redirects
- Work Card 06 owner localhost account lifecycle check: accepted
- Workbook migration parser, dry-run-first CLI, mapping configuration, JSON/Markdown reconciliation, source-cell audit trail, and atomic hash-idempotent database RPC implemented
- All 12 workbook sheets reconcile regardless of tab order; 10,667 populated source cells classified with no silent loss
- Workbook migration applied with 80 derived staff accounts and 1,172 exact-code request entries; remaining cells are traceably classified for review or intentional ignore
- Workbook import database migration deployed to the linked Supabase project
- Quality checks: 30 tests passed; typecheck passed; lint passed
- Production build: passed with Next.js 16.3.5 using webpack after Work Card 07 changes
- Work Card 07 repeat apply returned `already_applied` for the same workbook SHA-256 and created zero duplicate accounts
- Work Card 07 owner reconciliation and historical read-only spot-check accepted
- Work Card 08 fixed the date-sensitive runtime proof, owner-scoped its persistence checks, and added Staff B plus past-date direct API attacks
- Runtime auth proof passed; the hosted request lifecycle endpoint timed out after fixture setup, consistent with the previously documented hosted REST timeout
- Linked pgTAP invocation reached the remote project but the current Supabase CLI requires Docker or Podman for its test runner; neither is installed. The previously verified 18-test remote RLS proof and current static policy checks remain green
- Secret scan found no `.env.local` values in tracked files; local credential/reconciliation artifacts remain ignored
- `npm audit --omit=dev` reported 0 vulnerabilities
- Work Card 08 added the required mobile personal agenda/full-grid toggle, accessible table headers/caption, named textbox semantics, announced form errors, visible option focus, and 44px mobile targets
- Work Card 08 follow-up replaced corrupted empty-state glyphs with `-` and added explicit Logout actions to the dashboard and forced password-change screen
- Work Card 08 owner localhost review accepted after correcting the global CSS selector that visually clipped dashboard buttons
- Quality checks: 50 tests passed; typecheck passed; lint passed; production build passed with Next.js 16.3.5 using webpack

## Next instruction for AI

Proceed with Work Card 09 GitHub and Vercel proof. Deployment is not yet performed.
