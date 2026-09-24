# Work Card 09 — GitHub, Supabase, and Vercel Proof

## Goal
Publish the verified application safely and capture reproducible production proof.

## Inputs
- Work Cards 01–08 outputs
- `architecture.md`
- `build-blueprint.md`

## Files likely touched
- Deployment configuration if required
- `.env.example` if variable names change
- Project documentation and `build-status.md`

## Instructions for the coding agent
- Confirm the repository contains no secrets, public workbook copy, or public migration report with remarks.
- Push only after the owner confirms repository visibility.
- Apply production Supabase migrations, seeds, RLS, and server secrets.
- Configure Vercel variables with correct server/client separation.
- Deploy and run the critical proof path in production.
- Record URL, commit, migration version, results, and reviewed import ambiguities.

## What not to do
- Do not expose service credentials, passwords, real staff data, or private workbook content.
- Do not weaken production RLS or skip authorization checks.

## Done when
- Production is tied to the verified commit/schema.
- Login, password change, calendar, owner editing, admin lifecycle, denials, and migrated-data checks pass.

## Verification steps
- Run production smoke and direct authorization tests with dummy Staff A, Staff B, and admin accounts.
- Confirm variables, source maps, and logs reveal no secrets.
- Verify desktop and phone layouts.
- Design check: production matches `design.md` without deployment regressions.

## Localhost test before continuing
After this card, the learner should test:
- Compare production with verified localhost behavior.
- Complete one dummy request and account lifecycle in production.
- Confirm the URL works in a fresh private/incognito session.

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition
Stop after production proof is recorded. Do not add post-v1 features.

## Status
Not started
