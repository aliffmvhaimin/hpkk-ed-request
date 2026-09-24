# Architecture

## Build Shape

Full-stack application.

## Stack Decision

- Next.js with TypeScript for the application, UI, route handlers, and server-side session handling.
- Supabase Auth for managed password authentication.
- Supabase PostgreSQL for shared storage and Row Level Security (RLS).
- Vercel for the Next.js deployment and Supabase Cloud for authentication/database hosting.
- Automated unit/integration tests plus browser-level acceptance tests for authorization-critical flows.

## Structure Overview

The application has a public login route and authenticated staff/admin areas. The default authenticated view is a month selector and all-staff request grid. Staff edit only their own row. A personal mobile agenda is the default small-screen view, with a toggle to the full grid. The administrator has a separate account-management area but no ability to edit staff requests.

## Component Map

- Login form: username and password, generic error messages, forced-password-change routing.
- Application shell: project title, signed-in identity, month navigation, role-aware navigation, sign out.
- Monthly request grid: sticky date headings and staff-name column, read-only rows for other staff, inline controls on the owner's row.
- Weekly remark editor: one required remark for each Monday-Sunday group containing at least one request.
- Mobile personal agenda: week groups, date-code controls, remarks, save/delete affordances, and full-grid toggle.
- Admin account panel: create account, assign staff display name, issue temporary password, disable/enable account, and reset password.
- Import review view or report: unmatched names, invalid dates, unrecognised values, and ambiguous remark mappings.

## Data / State Model

### `profiles`

- `id`: UUID, primary key and foreign key to the managed auth user.
- `username`: unique, case-insensitive normalized username; display casing retained separately if needed.
- `display_name`: staff name shown in the grid.
- `role`: `staff` or `admin`.
- `must_change_password`: boolean.
- `is_active`: boolean.
- timestamps.

### `request_codes`

Seeded fixed rows for `PG`, `PTG`, `MLM`, `KM`, `HK`, `CT`, `K`, `HKA`, and `HKO`, with their Malay meanings. Version one does not expose code management in the admin UI.

### `weekly_request_groups`

- `id`: UUID.
- `owner_id`: authenticated staff UUID.
- `week_start`: Monday date.
- `remark`: required non-blank text.
- `source`: `app` or `xlsx_import`.
- timestamps.
- unique constraint on `owner_id + week_start`.

### `request_entries`

- `id`: UUID.
- `group_id`: weekly request group.
- `owner_id`: denormalized owner UUID for straightforward RLS checks.
- `request_date`: calendar date.
- timestamps.
- unique constraint on `owner_id + request_date`.

### `request_entry_codes`

- Join table between a request entry and one or more fixed request codes.
- unique constraint on `request_entry_id + code_id`.

### `import_records`

- Stores source workbook, sheet, cell/range reference, raw value, import status, and linked target record when resolved.
- Used for reconciliation and manual review; it does not grant edit access to migrated requests.

## Storage Logic

- Passwords are handled only by Supabase Auth and are never stored in application tables or logs.
- Admin account operations use server-only credentials and server-side route handlers; service-role credentials never reach the browser.
- Arbitrary usernames map server-side to managed auth identities. Username lookup and login return generic errors to avoid revealing whether an account exists.
- Browser sessions use secure server-managed cookies. Disabled profiles are rejected even if an auth session still exists.
- RLS permits authenticated users to select active profiles, request groups, entries, codes, and remarks needed for the shared calendar.
- RLS permits staff to insert/update/delete only rows whose `owner_id` equals their authenticated user ID, with current-or-future date checks. Past imported and submitted entries are read-only.
- Admin users do not receive a policy that changes staff request data.
- Weekly groups cannot be saved with a blank/whitespace-only remark when they contain entries. Removing the final entry removes the now-empty group after confirmation.

## User Flow

1. Admin creates a staff profile and temporary credential.
2. Staff signs in with the assigned username and temporary password.
3. First login requires a new password before the calendar is accessible.
4. Staff selects a month and sees all staff request rows and remarks.
5. Staff edits their own date cells inline, choosing one or more fixed codes.
6. Staff enters a non-blank remark for every affected Monday-Sunday week and saves.
7. The server/database verifies identity, ownership, date eligibility, valid codes, and required remarks.
8. Saved data remains visible after refresh, logout, and login.
9. Admin views all requests and maintains accounts without changing request content.

## File Expectations

- Use the Next.js App Router with separate public, authenticated, and admin route groups.
- Keep Supabase browser and server clients separate.
- Keep schema migrations, RLS policies, seed data, and authorization tests under the Supabase project directory.
- Put workbook import logic in a repeatable script with dry-run and apply modes; do not make the spreadsheet parser part of the normal web request path.
- Keep domain types and validation schemas centralized so UI, server handlers, and tests share the same rules.

## Constraints

- UI and documentation are English; request code meanings are Malay.
- All logged-in staff can read all staff names, request codes, and remarks.
- Only the owner may mutate a request, and only for current/future dates.
- Weeks are Monday-Sunday and use the Asia/Kuala_Lumpur calendar date.
- One staff member has at most one request entry per date, with one or more codes.
- A weekly remark is mandatory if any date in that week contains a request.
- No application secrets in source control or browser bundles.
- Imported raw evidence must remain traceable to workbook sheet/cell locations.

## Technical Non-Goals

- No approval workflow, roster generation, notifications, payroll, leave balance, or HR integration.
- No public sign-up, email-based self-registration, social login, or password recovery email in version one.
- No editing of request-code definitions in version one.
- No offline mode or browser-local source of truth.

## Verification Notes

- Test RLS directly for anonymous, Staff A, Staff B, disabled staff, and admin identities.
- Prove Staff A cannot modify Staff B through direct API calls, not only through hidden UI controls.
- Test blank and whitespace-only remarks, multi-code dates, duplicate dates, week boundaries, past dates, and Asia/Kuala_Lumpur date rollover.
- Reconcile imported record counts by sheet, staff, date, code, and review status; no source cell may disappear silently.
- Test temporary-password enforcement, account disablement, generic login errors, session persistence, and sign out.
