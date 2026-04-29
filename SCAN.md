# Project Reliability Scan

This repository includes an automated scanner that audits:

- Static contract integrity (OpenAPI + frontend API contract)
- Backend/frontend build and test health
- Runtime integration bootstrap + API smoke checks (full mode)
- CI parity and completion-gap markers (`TODO`, `FIXME`, etc.)

## Commands

- Quick gate (fails on High/Critical):  
  `pnpm scan:quick`

- Full gate (fails on High/Critical, includes runtime integration):  
  `pnpm scan:full`

- Full report without failing process:  
  `pnpm scan:report`

## Output

Each run produces:

- `reports/scan-YYYY-MM-DD.md` (severity triage board)
- `reports/scan-YYYY-MM-DD.json` (machine-readable findings)

Each finding includes:

- Severity (`Critical|High|Medium|Low`)
- Area, symptom, repro command, expected vs actual
- Probable root cause, fix recommendation
- Owner and status

## Notes

- Full mode expects Docker availability because it runs integration bootstrap.
- Backend HTTP socket e2e tests can be enabled with:  
  `ENABLE_SOCKET_HTTP_E2E=1 pnpm --filter @sebs/backend test:e2e`
