# Work Card 06 â€” Administrator Account Management

## Goal
Provide a protected admin interface for creating, enabling/disabling, and resetting accounts without request-edit access.

## Inputs
- Work Cards 01â€“05 outputs
- Server account services from Work Card 03
- `design.md`

## Files likely touched
- Admin account route/components
- Admin-only actions/handlers
- Account validation and tests

## Instructions for the coding agent
- Show username, display name, role, active state, and password-change-required state; never show saved passwords.
- Create unique normalized usernames and one-time temporary passwords.
- Present a temporary password only at creation/reset and never persist it in app data/logs.
- Support disable/enable and reset with confirmation.
- Block non-admin access at route and server layers.
- Prove admin remains read-only for request content.

## What not to do
- Do not add public registration, bulk upload, email recovery, request editing, or extra roles.

## Done when
- Admin completes each lifecycle action.
- Staff cannot access/call admin operations.
- Reset users must change their temporary password.

## Verification steps
- Test duplicate/case-variant usernames, invalid inputs, create, disable, enable, and reset.
- Test direct calls as staff and anonymous users.
- Confirm no temporary password remains in tables, logs, or browser history after one-time display.
- Design check: admin table/forms, confirmations, errors, focus, and mobile layout follow `design.md`.

## Localhost test before continuing
After this card, the learner should test:
- Admin creates a dummy account and the user completes first-login password replacement.
- Admin disables and re-enables it with expected access changes.
- Staff cannot open admin pages, and admin cannot edit staff requests.

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition
Stop after account lifecycle and admin-boundary tests pass.

## Status
Implementation complete; awaiting owner localhost account lifecycle check
