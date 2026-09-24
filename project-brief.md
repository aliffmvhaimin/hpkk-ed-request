# Project Brief

## Project Identity

HPKK ED Request

## One-Sentence Concept

A secure multi-user web application for HPKK Emergency Department staff to view the monthly request calendar and submit or maintain only their own shift and holiday requests.

## Target User

- ED staff who submit shift and holiday requests.
- An administrator or roster manager who creates staff accounts and reviews the complete request calendar.

## User Goal

Staff can see the full monthly request picture, record their own requests under the correct identity, and supply the required explanation. The administrator receives a consistent, attributable set of requests for roster planning.

## Build Shape

Full-stack application.

## Shape Confirmation

Confirmed. The system requires real authentication, shared persistent data, two roles, database-enforced ownership, and import of an existing multi-user workbook.

## Version-One Success

- An administrator can create, disable, and reset staff accounts.
- Staff sign in with an administrator-assigned username and temporary password, then replace that password on first login.
- All signed-in staff can view the full monthly request grid and all weekly remarks.
- Staff can add, edit, or delete only their own requests for current or future dates.
- A weekly remark is required whenever a week contains a request.
- All usable 2026 data from the supplied workbook is imported, with ambiguous data reported for review.

## Now / Later / Never

### Now

- Username/password login and role-based access.
- Monthly all-staff request grid.
- Inline editing on the signed-in staff member's row.
- Multiple fixed request codes per date.
- Mandatory weekly remarks.
- Administrator account management.
- Complete 2026 workbook migration with a review report.
- Responsive desktop and mobile views.

### Later

- Approval or rejection workflow.
- Notifications and reminders.
- Administrator-controlled submission deadlines or month locking.
- Structured preferred-versus-avoided shift rules.
- Reporting and export features beyond the migration/reconciliation proof.

### Never

- Patient or clinical data.
- Payroll, leave-balance, or HR-system processing in this application.
- Automatic roster generation in version one.
- Plain-text password storage or authorization enforced only in the browser.

## Assumptions

- The application interface and planning documentation are in English.
- Request code labels and meanings are stored in Malay.
- Fixed codes are: `PG` (pagi), `PTG` (petang), `MLM` (malam), `KM` (kelepasan malam), `HK` (hari kelepasan), `CT` (cuti), `K` (kursus), `HKA` (hari kelepasan am), and `HKO` (hari kelepasan owing).
- Every selected code is a requested option. A wish to avoid a shift is explained in the weekly remark.
- Weeks run Monday through Sunday, matching the workbook.
- Vercel and Supabase Cloud are acceptable deployment services for staff request data.

## Proof Target

Use two dummy staff accounts and one dummy administrator account to prove permitted and denied actions, forced first-login password change, required weekly remarks, persistence after refresh/logout/login, responsive behavior, and reconciliation of the migrated workbook data.

## Owner Notes

This is a self-directed project. Scope expansion is approved by the project owner through confirmation of the Project Brief and Architecture; no external approval gate is required by this planning framework.
