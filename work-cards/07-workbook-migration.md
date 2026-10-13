# Work Card 07 — Workbook Migration and Reconciliation

## Goal
Build and run a repeatable, traceable migration for all 12 sheets in `ED STAFF REQUEST 2026.xlsx`.

## Inputs
- `ED STAFF REQUEST 2026.xlsx`
- Work Cards 01–06 outputs
- `architecture.md`

## Files likely touched
- `scripts/` workbook importer/reconciler
- Import mapping/configuration
- Migration tests and review-report location
- `import_records` through controlled execution

## Instructions for the coding agent
- Default to dry-run and require an explicit apply flag for writes.
- Read JAN–DIS regardless of tab order.
- Derive the staff roster from every workbook staff row, generate unique usernames, and map 2026 calendar dates.
- Map exact recognized codes; preserve combined, annotated, rich-text, or unknown values for review rather than guessing.
- Map `CATATAN` to Monday-Sunday groups only when unambiguous.
- Record source workbook, sheet, cell/range, raw value, status, reason, and target IDs.
- Make reruns idempotent and prevent duplicates.
- Produce per-sheet/staff/status reconciliation and machine-readable plus readable review reports.

## What not to do
- Do not edit the source workbook.
- Create accounts only for names found in workbook staff rows. Do not drop data, infer ambiguous request codes, overwrite live edits, or expose personal remarks publicly.

## Done when
- Every relevant source cell is resolved, intentionally ignored with reason, or listed for review.
- Totals reconcile and reruns do not duplicate data.

## Verification steps
- Test all sheets, tab order, serial/text dates, repeated names, rich text, combined codes, blank remarks, and cross-month weeks.
- Spot-check representative staff/weeks against the workbook.
- Verify imported past data is visible but read-only.
- Design check: any internal review output uses readable tables and status conventions from `design.md`.

## Localhost test before continuing
After this card, the learner should test:
- Compare representative imported rows/remarks with several workbook months.
- Confirm imported past entries cannot be edited.
- Review ambiguity totals and confirm no source data vanished silently.

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition
Stop after reconciliation and idempotency proof pass.

## Status
Complete - migration, reconciliation, idempotency proof, and owner spot-check passed
