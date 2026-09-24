# Build Blueprint

## Source Files

- `START_HERE.md`
- `prompts/00-run-kdbm-lite-coach.md`
- `ED STAFF REQUEST 2026.xlsx`
- `project-brief.md`
- `architecture.md`
- `design.md`

## Project Identity

**Name:** HPKK ED Request

**Purpose:** Replace a shared editable spreadsheet with an authenticated, attributable monthly request system that requires weekly remarks.

## Build Shape

Full-stack application using Next.js, Supabase Auth, PostgreSQL/RLS, Vercel, and Supabase Cloud.

## Version-One Promise

An ED staff member can log in, see the complete monthly request calendar, and safely maintain only their own current/future date requests. Each requested date can contain multiple fixed codes, every affected week requires a remark, and the system retains all usable 2026 workbook data with traceable migration evidence. An administrator manages accounts and views requests but cannot edit request content.

## Scope Lock

### Now

- Admin-created username/password accounts with forced first-login password replacement.
- Staff/admin roles and disabled-account handling.
- Shared monthly grid and mobile personal agenda.
- Inline owner-only editing for current/future dates.
- Multiple fixed codes per date.
- Required Monday-Sunday weekly remarks.
- Account creation, disable/enable, and password reset.
- Repeatable 2026 workbook dry-run/import/reconciliation process.
- Security, behavior, accessibility, responsive, and migration tests.
- Deployment proof on Vercel + Supabase Cloud.

### Later

- Approvals, rejections, notifications, deadline/month locks, structured avoid-shift rules, exports, and operational reporting.

### Never

- Patient data, plain-text passwords, client-only authorization, payroll/leave-balance processing, or silent migration loss.

## Architecture Summary

- Next.js App Router separates public login, authenticated calendar, and admin account routes.
- Supabase Auth owns password verification and sessions; an internal server-side username mapping supports administrator-assigned usernames.
- PostgreSQL owns profiles, fixed codes, weekly groups, dated entries, code selections, and import evidence.
- RLS is the final authorization boundary: authenticated read access for the shared calendar, owner-only current/future mutations, and no admin request mutation.
- Server-only admin handlers use protected credentials for account lifecycle actions.
- All date eligibility and week boundaries use Asia/Kuala_Lumpur.

## Data / State / Storage Rules

- Seed these immutable v1 codes and Malay meanings: `PG/pagi`, `PTG/petang`, `MLM/malam`, `KM/kelepasan malam`, `HK/hari kelepasan`, `CT/cuti`, `K/kursus`, `HKA/hari kelepasan am`, `HKO/hari kelepasan owing`.
- A staff/date pair has at most one request entry and may have one or more codes.
- Every code is a requested option. Avoidance preferences belong in the weekly remark.
- A staff/week pair has at most one weekly group. A group containing entries must have a trimmed, non-empty remark.
- Removing the last entry in a week requires confirmation and removes the empty group.
- Staff may mutate only their own entries dated today or later. Past records remain readable and immutable.
- All logged-in active users may read all staff names, codes, and remarks.
- The admin can manage accounts but cannot insert, update, or delete request groups/entries.
- Normalize usernames for uniqueness and login lookup; preserve the intended display value. Return generic authentication errors.
- Never expose the Supabase service-role key, raw password, or password-equivalent data to the client, logs, or repository.
- Import records retain workbook name, sheet, cell/range, raw content, resolution status, and target IDs.

## Design Direction Summary

Borrow a calm clinical-dashboard mood: navy structure, teal actions, warm neutral surfaces, compact readable density, sticky schedule context, subtle panels, and clear controls. Desktop centers the all-staff grid; mobile centers the user's personal weekly agenda and offers a full-grid toggle. Do not copy a brand or spreadsheet layout, use fake HPKK identity assets, add irrelevant charts, or reduce readability for density.

## Implementation Rules

- Use TypeScript and shared validation schemas at all trust boundaries.
- Validate authorization and business rules on the server/database even when the UI prevents an action.
- Save weekly edits transactionally so entries and their required remark cannot diverge.
- Detect unsaved changes before month navigation, logout, or route changes.
- Treat dates as calendar dates rather than browser-local timestamps; calculate `today` and Monday-Sunday boundaries in Asia/Kuala_Lumpur.
- Keep read queries bounded by selected month and return only fields needed for the grid.
- Provide explicit loading, empty, error, saving, saved, disabled-account, and session-expired states.
- Preserve source evidence during migration and never infer an ambiguous user/date/code/remark relationship silently.
- Keep the interface and user guidance in English; display fixed code meanings in Malay.

## File and Folder Expectations

- `app/`: public, authenticated calendar, and admin routes plus server handlers.
- `components/`: shell, month controls, request grid, personal agenda, weekly editor, code selector, and account controls.
- `lib/`: Supabase clients, auth/role guards, date/week utilities, validation schemas, and domain types.
- `supabase/`: migrations, seed data, RLS policies, and database authorization tests.
- `scripts/`: repeatable workbook inspection/import/reconciliation commands with dry-run default.
- `tests/`: unit/integration and browser acceptance tests.
- `.env.example`: variable names only; no real secrets.

## Work Card Plan

1. Project skeleton and environment contract.
2. Database schema, fixed Malay codes, and RLS.
3. Username login and account lifecycle.
4. Read-only monthly calendar and mobile agenda.
5. Owner-only inline editing and weekly remark validation.
6. Administrator account management.
7. Workbook migration and reconciliation.
8. Security, responsive, accessibility, and end-to-end review.
9. GitHub/Vercel/Supabase deployment proof.

## Review Mirror

- Does the visible product match the calm clinical design rules?
- Can every active user view the shared month and remarks?
- Can each staff user mutate only their own current/future dates?
- Does direct API access fail for anonymous, cross-user, past-date, and admin request mutations?
- Does every non-empty week require a non-blank remark?
- Do multi-code dates persist accurately after refresh/logout/login?
- Does mobile default to a usable personal agenda and retain a full-grid option?
- Are all imported source cells either resolved or explicitly listed for review?
- Are passwords, service credentials, and sensitive errors absent from client output and logs?

## Proof Ladder

1. Static proof: typecheck, lint, unit tests, migration validation, and secret scan pass.
2. Data proof: schema and seed migrations apply to a clean database; RLS allow/deny tests pass.
3. Staff proof: Staff A creates a multi-code request with a weekly remark, refreshes, logs out/in, edits it, and deletes an eligible entry.
4. Isolation proof: Staff B cannot change Staff A through UI or direct API; Staff A cannot edit a past entry.
5. Admin proof: Admin creates/disables/resets an account and cannot modify staff requests.
6. Validation proof: blank/whitespace remarks, invalid codes, duplicate dates, and out-of-range mutations are rejected.
7. Migration proof: all 12 month sheets reconcile to resolved plus review records with source locations.
8. Design proof: desktop and mobile layouts meet `design.md`, including keyboard and screen-reader-critical states.
9. Deployment proof: production URL loads, sessions work, environment variables remain server-safe, and the same acceptance path passes.

## 60-Second Explanation Template

“HPKK ED Request replaces the shared Excel request grid with a secure web application. Staff sign in using administrator-created accounts, see the full monthly request calendar, and edit only their own current or future dates. They may choose multiple fixed request codes, whose meanings remain in Malay, and every affected week requires a remark. Supabase authentication and PostgreSQL Row Level Security enforce identity and ownership even if someone bypasses the interface. The administrator manages accounts and views requests but cannot change them. The migration process imports all 2026 sheets and reports every ambiguous source cell for review instead of guessing.”

## Guardrails for the Coding Agent

- Read `build-status.md`, `build-blueprint.md`, `design.md`, and the current work card before editing.
- Implement only the current work card; do not jump ahead.
- Stop after the card's verification steps and update `build-status.md`.
- Backend, authentication, database, admin access, and workbook migration are explicitly authorized only as defined here.
- Do not add unrelated services, features, tables, roles, workflows, or dependencies.
- Do not add secrets or keys to code, fixtures, screenshots, logs, or commits.
- Do not implement custom password storage; use managed authentication.
- Do not weaken RLS to make a UI flow pass.
- Do not invent claims, testimonials, logos, staff identities, or real operational numbers.
- Use dummy accounts for proof and keep production import data out of public test artifacts.
- Apply the full-stack application guardrails in this Blueprint.
- If a legacy file uses `Build Mode`, treat it as `Build Shape` without stopping.
