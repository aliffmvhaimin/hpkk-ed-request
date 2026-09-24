# Work Card 04 â€” Monthly Calendar Read View

## Goal
Build the authenticated read-only all-staff monthly calendar and mobile personal agenda.

## Inputs
- Work Cards 01â€“03 outputs
- `design.md`
- `build-blueprint.md`

## Files likely touched
- Authenticated calendar route
- Month navigation, grid, legend, and agenda components
- Month query/mapping utilities and tests

## Instructions for the coding agent
- Query the selected month plus boundary days needed for complete Monday-Sunday groups.
- Render all active staff rows, dates, codes, and weekly remarks.
- Add sticky staff-name/date headers and a concise code legend with Malay meanings.
- Identify the signed-in user's row and mark other rows read-only.
- On mobile, default to the personal week-grouped agenda with a full-grid toggle.
- Implement loading, empty, query-error, no-session, and session-expired states.

## What not to do
- Do not add editing, account management, workbook import, or approvals.

## Done when
- Month navigation loads correct dates/data.
- Authenticated roles see permitted shared calendar content.
- Desktop and mobile layouts meet the confirmed hierarchy.

## Verification steps
- Test month lengths, leap year, year boundaries, week grouping, and Asia/Kuala_Lumpur dates.
- Test populated/empty months, loading, and query failure.
- Verify remarks and multi-code dates remain understandable without color.
- Design check: grid, sticky context, chips, empty state, agenda, and mobile toggle follow `design.md`.

## Localhost test before continuing
After this card, the learner should test:
- Navigate across three months and confirm dates/weekday headings.
- Confirm dummy requests and remarks are visible but read-only.
- At phone width, confirm the personal agenda opens first and the full-grid toggle works.

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition
Stop after the read views pass. Do not enable editing.

## Status
Implementation complete; awaiting owner localhost check
