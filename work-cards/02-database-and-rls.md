# Work Card 02 — Database Schema and RLS

## Goal
Implement the Supabase schema, fixed request codes, constraints, and database-enforced access policies.

## Inputs
- `architecture.md`
- `build-blueprint.md`

## Files likely touched
- `supabase/migrations/`
- `supabase/seed.sql`
- `supabase/tests/`
- Shared database types

## Instructions for the coding agent
- Create profiles, request codes, weekly groups, request entries, entry-code joins, and import-record tables.
- Seed the nine fixed codes with their confirmed Malay meanings.
- Add keys, constraints, trimmed-remark checks, and month-query indexes.
- Enable RLS with separate select/insert/update/delete policies.
- Allow active users to read shared calendar data.
- Allow staff to mutate only their own current/future requests; deny admin, cross-user, disabled-user, and anonymous request mutations.
- Handle Asia/Kuala_Lumpur date boundaries safely.

## What not to do
- Do not create login UI, calendar UI, admin UI, or import logic.
- Do not use unconditional authenticated-write policies.

## Done when
- A clean database applies migrations and seeds.
- RLS tests prove all allow/deny boundaries.
- Constraints reject blank remarks, duplicate staff/date entries, and unknown codes.

## Verification steps
- Run migrations and seed against a disposable local/test project.
- Test anonymous, Staff A, Staff B, disabled staff, and admin operations directly.
- Test today/future mutations and past-date denial.
- Design check: no visible UI is required; database terms must support the user labels in `design.md`.

## Localhost test before continuing
No meaningful browser preview yet. Continue after migration, seed, and RLS tests pass.

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition
Stop after database and authorization tests pass.

## Status
Complete

## Implementation notes
- Added the initial Supabase migration for profiles, fixed request codes, weekly request groups, request entries, entry-code joins, and import records.
- Added fixed request-code seed data using the confirmed Malay meanings.
- Added RLS policies for shared active-user reads and owner-only staff mutations on current/future request content.
- Added Asia/Kuala_Lumpur date helpers and Monday week-boundary checks.
- Added a Supabase pgTAP RLS proof script covering anonymous, Staff A, Staff B, disabled staff, and admin boundaries.
- Hardened role and active helper functions to ensure disabled staff cannot mutate requests.

## Verification completed
- `npm test` passed locally (6/6 tests).
- `npm run typecheck` passed locally.
- `npm run lint` passed locally.
- Production build passed locally with Next.js webpack.
- Applied schema migration, functions, triggers, and seed data to remote Supabase project.
- Executed all 18 pgTAP database RLS and constraint tests against the Supabase database; all 18 passed (100%).
- Verified constraints reject blank remarks, duplicate staff/date entries, unknown codes, and unauthorized staff/admin/disabled mutations.

## Verification pending
- None. Work Card 02 runtime verification is completely satisfied.
