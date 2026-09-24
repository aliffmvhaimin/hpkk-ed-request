# Scripts

Run npm run import:workbook for a dry run across all 12 month sheets. The command writes JSON and Markdown reconciliation reports under migration-reports/ and never edits the source workbook.

Only confirmed active staff profiles are matched. Add human-confirmed source-name aliases to workbook-import-map.json, review the report, then run npm run import:workbook -- --apply. Apply is atomic, refuses to overwrite an existing staff week, and treats the same workbook hash as already applied.
