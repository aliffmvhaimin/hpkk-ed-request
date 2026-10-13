# Work Card 08 — Security, Accessibility, and Responsive Review

## Goal
Run the complete Review Mirror and make only the smallest fixes required for version-one acceptance.

## Inputs
- Work Cards 01–07 outputs
- `build-blueprint.md`
- `design.md`

## Files likely touched
- Tests and narrowly affected implementation files
- `build-status.md`

## Instructions for the coding agent
- Run all static, database, integration, and browser tests.
- Execute the two-staff/one-admin proof and direct API authorization attacks.
- Review keyboard use, focus, accessible names/errors, table semantics, contrast, and touch targets.
- Review desktop grid and mobile agenda/full-grid toggle.
- Inspect bundles/logs/repository for secrets or password data.
- Fix only confirmed defects within scope, then rerun affected and full checks.

## What not to do
- Do not add features, redesign, loosen policies, or resolve ambiguous import records by guessing.

## Done when
- Every Blueprint proof passes or has a documented external blocker.
- No critical/high security, data-loss, accessibility, or responsive defect remains.

## Verification steps
- Run typecheck, lint, unit/integration, RLS, browser, build, and secret scans.
- Complete staff/admin, blank remark, past date, persistence, disabled account, and reconciliation scenarios.
- Design check: complete every `design.md` checklist item at desktop/phone widths and by keyboard.

## Localhost test before continuing
After this card, the learner should test:
- Complete the staff request and admin account lifecycles.
- Try the important denied actions and confirm safe failures.
- Check desktop/phone layouts for clipping, inaccessible controls, or confusing ownership.

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition
Stop when review passes. Do not deploy until Work Card 09.

## Status
Complete; review fixes verified and owner localhost check accepted
