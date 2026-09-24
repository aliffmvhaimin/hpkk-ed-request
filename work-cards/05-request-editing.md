# Work Card 05 â€” Owner-Only Request Editing

## Goal
Enable staff to add, edit, and delete only their own current/future multi-code requests with mandatory weekly remarks.

## Inputs
- Work Cards 01â€“04 outputs
- `build-blueprint.md`
- `design.md`

## Files likely touched
- Inline grid/mobile agenda editors
- Code multi-select and weekly remark controls
- Server actions, validation schemas, and tests

## Instructions for the coding agent
- Make only the signed-in staff row editable.
- Allow one or more fixed codes on each eligible date.
- Require a trimmed non-empty weekly remark for every week with a request.
- Save each week's entries and remark transactionally.
- Support editing and confirmed deletion of eligible owned entries.
- Confirm removal of the final weekly entry and remove the empty group.
- Warn about unsaved changes before navigation/logout.
- Show nearby validation, saving, saved, conflict, expired-session, and failure states.
- Keep server/database enforcement as the final boundary.

## What not to do
- Do not let admin edit requests.
- Do not allow unknown codes, past-date edits, approvals, or roster generation.

## Done when
- Staff can complete the eligible owned-request lifecycle.
- Blank remarks and unauthorized operations fail.
- Data persists across refresh and re-authentication.

## Verification steps
- Test one/multiple codes, blank/whitespace remarks, duplicate dates, week boundaries, and final-entry deletion.
- Test Staff A versus Staff B through UI and direct API.
- Test current/future/past dates, stale sessions, and simultaneous-edit conflicts.
- Design check: inline controls, mobile editor, validation, confirmations, and feedback follow `design.md`.

## Localhost test before continuing
After this card, the learner should test:
- Staff A adds a dummy multi-code request and weekly remark.
- Refresh and log out/in; then edit and delete an eligible entry.
- Staff B sees Staff A's request but cannot change it.

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition
Stop after owner lifecycle and isolation proof pass.

## Status
Implementation complete; migration deployed; awaiting owner localhost lifecycle check
