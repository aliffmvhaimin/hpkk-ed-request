# HPKK ED Request

A staff shift and leave request application for Jabatan Kecemasan & Trauma, HPKK. It replaces a shared request spreadsheet with authenticated staff accounts, a shared calendar, and database-enforced ownership.

**Live application:** [hpkk-ed-request.vercel.app](https://hpkk-ed-request.vercel.app)

## Features

- Weekly staff roster with month/week navigation, search, role filters, and request-code legends in Malay.
- Multiple request codes per date and a required remark for every week containing requests.
- Personal mobile agenda and an all-staff grid.
- Administrator account management, password resets, account edit locks, and inclusive date-range locks.
- Administrator date remarks, printing, and XLSX exports.
- Conflict detection, unsaved-change prompts, and traceable migration of the 2026 workbook.

## Technology

Next.js 16 App Router, React, TypeScript, Supabase Auth/PostgreSQL with Row Level Security, and Vercel. XLSX exports use `fflate`. Install dependencies from `package-lock.json` to reproduce the project's dependency versions.

## Local setup

Use Node.js 24 and npm, matching the production runtime. You also need access to a configured Supabase project.

```sh
git clone https://github.com/aliffmvhaimin/hpkk-ed-request.git
cd hpkk-ed-request
npm ci
```

Copy `.env.example` to `.env.local`. In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set these values:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only credential for account administration and workbook imports. |

The optional `SMOKE_*` variables in `.env.example` are for disposable-account smoke tests. Keep `.env.local` and service credentials out of source control. The service-role key must never use a `NEXT_PUBLIC_` prefix.

Once the database and an account are available:

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000). The application sends unauthenticated visitors to `/login`.

### Database setup

For a new Supabase project, authenticate and link the CLI to the intended project, then apply the repository's migrations:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --linked
```

Run [supabase/seed.sql](supabase/seed.sql) against that project's database to populate the request-code catalog. The seed does not create login accounts. Database details and regression-check instructions are in [supabase/README.md](supabase/README.md).

### First administrator

There is no public registration. A fresh database needs a Supabase Auth user and a matching `public.profiles` row with the same user UUID and `role = 'admin'` before the administrator interface can be used.

For example, create an email-confirmed Auth user with an internal email such as `admin@hpkk-ed-request.local`, then insert its profile using the Auth user's UUID:

```sql
insert into public.profiles (
  id, username, username_display, display_name, role, role_name,
  must_change_password, is_active, can_edit_requests
) values (
  'REPLACE_WITH_AUTH_USER_UUID', 'admin', 'admin', 'Administrator',
  'admin', 'Administrator', true, true, false
);
```

Sign in using the profile's username and the password assigned to the Auth user. The application requires password replacement on first sign-in. Subsequent accounts can be created from **Staff & Accounts**. Username normalization and internal Auth-email mapping are defined in [lib/auth/username.ts](lib/auth/username.ts).

## Access and request rules

| Account | Access |
| --- | --- |
| Active staff | View the shared roster and maintain their own requests when account and date access are unlocked. |
| Administrator | Manage accounts, editing access, date remarks, and exports; view staff requests. |
| Disabled account | Cannot access the authenticated workspace. |

Past dates remain editable when unlocked. Weeks run Monday–Sunday, and the application uses `Asia/Kuala_Lumpur` for the current date. A remark shared with locked requests cannot be edited. Staff request writes use the `save_weekly_requests` database transaction; direct client writes to request tables are denied.

## Commands and validation

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript checks. |
| `npm test` | Run the Node.js test suite. |
| `npm run build` | Create a production build. |
| `npm start` | Serve a completed production build. |
| `npm run import:workbook` | Generate workbook migration reports without applying changes. |

Run lint, typecheck, tests, and a production build before deployment. A webpack build is also available with `npm run build -- --webpack`.

Workbook migration tests require the private `ED STAFF REQUEST 2026.xlsx` file in the project root; it is deliberately excluded from Git. Individual test files can be run with `node --test tests/<file>.test.mjs`. Automated component tests use simulated hooks, and database assertions in the main suite do not replace live authentication, browser, or RLS checks.

## Workbook migration

Place an authorized copy of `ED STAFF REQUEST 2026.xlsx` in the project root and run:

```sh
npm run import:workbook
```

Review the JSON and Markdown reports in `migration-reports/`, including unmatched names and ambiguous date/code/remark mappings. To apply a reviewed import to the configured Supabase project:

```sh
npm run import:workbook -- --apply
```

The importer does not modify the source workbook. It refuses to overwrite existing staff weeks and treats an already-applied workbook hash as idempotent. Apply mode may provision missing staff accounts before the request-data transaction; retain the generated credentials report if an import needs to be rerun. See [scripts/README.md](scripts/README.md) for details.

## Deployment

The application is hosted on the Vercel project `hpkk-ed-request`. Configure the three required Supabase environment variables for the intended Vercel environment; local `.env.local` files are excluded from uploads.

From an authorized checkout, link to the existing project and inspect the upload before publishing:

```sh
npx vercel link
npx vercel deploy --dry --json
npx vercel deploy --prod --yes
```

Select the existing project during linking. `.vercelignore` excludes credentials, private workbooks, migration reports, build output, and temporary files. Apply any new database migrations to the matching Supabase project before publishing code that depends on them.

After deployment, check the login page, JavaScript delivery, unauthenticated redirects, and staff/admin workflows using disposable accounts. A dashboard response may stream with HTTP 200 and contain a login redirect, so verify the redirect content as well as the status code. Deployment history and verification limits are recorded in [build-status.md](build-status.md). Direct CLI deployments publish local files independently of Git pushes.

## Project structure

| Path | Contents |
| --- | --- |
| `app/` | Routes, layouts, loading/error states, and shared CSS. |
| `components/calendar/` | Calendar views, request editors, remarks, and date-access controls. |
| `components/auth/` | Login, password, username, and administrator forms. |
| `lib/` | Authentication, request actions, Supabase clients, calendar utilities, and XLSX export. |
| `supabase/` | SQL migrations, seed data, and database regression checks. |
| `scripts/` | Workbook migration and disposable-account smoke utilities. |
| `tests/` | Automated tests and component harnesses. |

See [architecture.md](architecture.md) for the system design, [build-blueprint.md](build-blueprint.md) for the implementation brief, and [AGENTS.md](AGENTS.md) before changing application code. Next.js-specific guidance is installed under `node_modules/next/dist/docs/`.
