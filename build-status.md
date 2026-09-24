# Build Status

## Project

- Name: HPKK ED Request
- Build shape: Full-stack application
- Shape confirmation: Confirmed
- Current KDBM Lite stage: Build
- Current phase: Work Card 07 - Workbook Migration awaiting confirmed staff profile mapping
- Current work card: `work-cards/07-workbook-migration.md`

## Completed work cards

- Work Card 01 - Project Skeleton
- Work Card 02 - Database Schema and RLS
- Work Card 03 - Username Authentication
- Work Card 04 - Monthly Calendar Read View
- Work Card 05 - Owner-Only Request Editing
- Work Card 06 - Administrator Account Management

## Completed planning

- [x] Setup Gate skipped by project owner because the referenced file was absent
- [x] Project Brief / Identity
- [x] Architecture
- [x] Design
- [x] Build Blueprint
- [x] Work Cards

## In progress

- [ ] Work Card 07 - Workbook Migration awaiting confirmed staff profiles/aliases and apply

## Blockers

- The connected database contains only work-card dummy accounts. No workbook staff identity can be mapped or imported without the owner creating real staff profiles or confirming aliases.

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
- Current connected database has no confirmed workbook staff profiles, so the safe dry run resolves 0 importable entries and retains 9,678 cells for review; apply correctly remains blocked
- Workbook import database migration deployed to the linked Supabase project
- Quality checks: 30 tests passed; typecheck passed; lint passed
- Production build: passed with Next.js 16.3.5 using webpack after Work Card 07 changes

## Next instruction for AI

Owner: create or confirm the real staff profiles that correspond to workbook names, or provide the confirmed source-name-to-username aliases. Then rerun npm run import:workbook, review migration-reports/workbook-migration-reconciliation.md, and apply only when the mapping is correct. After apply, spot-check several months and confirm imported past entries are read-only. Do not begin Work Card 08 until this passes.
