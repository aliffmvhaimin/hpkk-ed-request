# Work Card 01 — Project Skeleton

## Goal
Create the minimal Next.js/TypeScript project structure and environment contract without implementing authentication, database schema, or request behavior.

## Inputs
- `build-blueprint.md`
- `architecture.md`
- `design.md`

## Files likely touched
- Project manifest and lockfile
- Next.js and TypeScript configuration
- `app/` shell and global styles
- `.env.example`
- Test/lint configuration

## Instructions for the coding agent
- Scaffold one Next.js App Router project with TypeScript.
- Add only dependencies required by the confirmed stack and this card.
- Create a minimal “HPKK ED Request” shell using the approved visual direction.
- Establish the folder boundaries from the Blueprint.
- Add `.env.example` with variable names only and ignore real environment files.
- Add development, build, typecheck, lint, and test scripts.

## What not to do
- Do not create database tables, authentication, calendar behavior, migration logic, or deployment.
- Do not add credentials, real staff data, or invented HPKK branding.

## Done when
- The project installs and runs locally.
- The shell renders without console errors.
- Typecheck, lint, baseline tests, and production build pass.

## Verification steps
- Run install once and retain the lockfile.
- Run typecheck, lint, tests, and production build.
- Confirm `.env.example` contains names only and secrets are ignored.
- Design check: the shell follows `design.md` mood, spacing, contrast, mobile, and no-fake-branding rules.

## Localhost test before continuing
After this card, the learner should test:
- `npm run dev` starts successfully.
- The HPKK ED Request shell/header loads.
- The page remains readable at desktop and phone widths.

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition
Stop after the shell and project checks pass. Do not begin Supabase work.

## Status
Completed
