# Scripts

Run npm run import:workbook for a dry run across all 12 month sheets. The command writes JSON and Markdown reconciliation reports under migration-reports/ and never edits the source workbook.

The importer builds a canonical roster from every staff name in the workbook. It proposes a unique lowercase dotted username for each person, preserves the three workbook roles: `JURURAWAT TERLATIH`, `PENOLONG PEGAWAI PERUBATAN`, and `PEMBANTU PERAWATAN KESIHATAN` (including the March `PEMBANTU PERAWATAN KLINIKAL` label as the same group). Dry-run reports show the proposed account roster. On `--apply`, missing staff accounts are created with one-time random passwords in the gitignored `migration-reports/workbook-created-accounts.json` file, and users must change those passwords at first sign-in.

Source-name aliases remain available in `workbook-import-map.json` for explicit exceptions. Apply refuses to overwrite an existing staff week and treats the same workbook hash as already applied. Account creation happens before the request-data transaction, so keep the generated credentials file if request import needs to be rerun.
