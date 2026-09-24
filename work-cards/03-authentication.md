# Work Card 03 — Username Authentication

## Goal
Implement secure username login, sessions, forced first-login password replacement, and server-side account lifecycle services.

## Inputs
- Work Cards 01–02 outputs
- `architecture.md`
- `build-blueprint.md`

## Files likely touched
- Public/authenticated route groups
- Supabase server clients and route guards
- Login/password-change components
- Server actions and authentication tests

## Instructions for the coding agent
- Implement server-side normalized username lookup to the managed auth identity.
- Use managed password authentication and secure cookie-based sessions.
- Return safe generic credential errors.
- Force `must_change_password` users to replace the temporary password before app access.
- Guard authenticated/admin routes and reject disabled profiles.
- Implement server-only create, disable/enable, and reset services; their UI comes later.
- Keep service credentials out of browser code and responses.

## What not to do
- Do not store or log passwords.
- Do not add public registration, email recovery, calendar UI, or admin UI.

## Done when
- Dummy staff/admin accounts authenticate by username.
- Password-change and active-profile gates cannot be bypassed.
- Sign out invalidates the usable session.

## Verification steps
- Test username normalization, duplicates, correct/wrong passwords, disabled accounts, and generic errors.
- Test forced password change and direct navigation attempts.
- Inspect client bundles/logs for secret or password leakage.
- Design check: auth screens follow `design.md` focus, contrast, label, error, and mobile rules.

## Localhost test before continuing
After this card, the learner should test:
- A dummy user logs in with a temporary password.
- First login forces a new password before protected content.
- Wrong credentials fail safely and sign out returns to login.

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition
Stop after authentication and route-protection proof passes.

## Status
Awaiting owner check

## Implementation notes
- Added Supabase server/admin clients for cookie sessions and service-role-only account operations.
- Added username normalization and server-side username-to-auth-user lookup.
- Added login, forced password-change, sign-out, active-profile, disabled-profile, and admin route guards.
- Added server-only account lifecycle helpers for create, enable/disable, and temporary-password reset.
- Added login, change-password, protected dashboard, and protected admin placeholder routes.

## Verification completed
- `npm test` passed locally with 10 tests.
- `npm run typecheck` passed locally.
- `npm run lint` passed locally.
- Production build passed locally with Next.js webpack.
- Supabase auth smoke test passed against the configured project.
- Local production server verified at `http://localhost:3011/login`; unauthenticated `/dashboard` redirects.

## Owner check
- Open `http://localhost:3011/login`.
- Test first-login flow with username `wc03.temp` and the temporary password configured in the local smoke-test environment.
- Wrong passwords should fail safely.
- Sign out should return to login.
