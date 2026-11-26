# PayPal daily sales sync and manual control

The existing daily job remains active at 09:00 America/Fortaleza. The manual
button beside the PayPal Saldo Atual uses the same atomic, idempotent importer.
Both paths query only closed days. They never change manual Saldo Real fields.

## Total-balance accounting, including withheld funds

The owner selected total net sales, including temporarily withheld money, not
only the amount currently available for withdrawal. Standard BRL hold/release
pairs T2101/T2102, T2103/T2104, T2105/T2106 and T2107/T2108 are classified as
availability-only records when their status, currency, sign and zero-fee fields
are consistent. Holds are not expenses and releases are not additional sales.
The original sale is posted once at its actual provider net BRL conversion
credit, with fees already deducted. Unknown or malformed movements still block
posting for review; there is no blanket exclusion of T21xx events.

The provider's sales-volume chart is not a substitute for transaction-level net
accounting. Reporting cutoffs/time zones and fees must be reconciled explicitly;
amounts are never changed to match a rounded chart total.

All PayPal sales use the owner's existing **Low-Tickets LATAM** receivable
category. Missing/ambiguous categories require review instead of an uncategorized
posting. Existing imported PayPal receipts were reclassified by a separate
category-only migration with a private rollback archive; amounts, effective
dates, statement records and manual balances are preserved.

## Authentication

This Edge Function implements authentication itself (`verify_jwt=false`):

- Exact server service key: administrative setup and tests.
- Scoped cron bearer validated through a service-only RPC: `run` or read-only
  `preview` diagnostics.
- Live Supabase Auth session validated with `/auth/v1/user`, followed by an
  account-owner/active lookup from the database: `run`, read-only `status` and
  read-only `preview` diagnostics.
  User-editable metadata and decoded JWT claims are never trusted. Other users,
  anonymous requests, expired sessions and archived accounts are rejected.
- Browser CORS permits only the two production domains and Supabase Dashboard.
  No provider secret, service key or cron credential is sent to the frontend.

Database RPCs remain service-only. The existing account lock, source mapping,
unique key and transactional inserts protect against double clicks, scheduled
overlap and retries. One sale creates one received receivable and one linked
statement receipt. PayPal conversion legs and fees are reconciled, not posted
again; unrecognized/conflicting records require review rather than adjustments.

## User interface

`PayPalSyncButton` is shown for the configured PayPal account to users with the
existing financial account view/edit permissions; server ownership validation
is still authoritative. It appears in desktop and mobile account layouts.

The control disables itself during a request, shows a loading state, provides
success/error feedback, displays the server's last successful consultation and
refreshes the account list plus the parent financial totals. Failed attempts
are distinct from successful timestamps. A retry never re-enters existing sales.

The read-only `status` action never queries PayPal or posts a financial entry.
Neither the button nor user sessions can activate or change the schedule.
`preview` diagnostics return redacted provider reports and review reasons,
including reports that cannot be posted. They make no ledger or failure-log
writes. No arbitrary account/date can be supplied by the caller.

## Operations

The job is `unlimit-paypal-daily-d1`. `private.paypal_sync_days` contains completed
day checks; `private.paypal_sync_runs` contains safe finite error codes/status.
A successful cron dispatch only queues HTTP: also inspect its HTTP result and
the sync-run status. The system rechecks recent closed days and catches up
missing reports; old gaps outside provider retention require review.

To pause, disable the private config and unschedule that named job. Keep source
mappings/receipts. Do not delete financial data to retry. Refunds, withdrawals
and ambiguous transactions are not guessed into sales or balance corrections.

## Verification

- `deno task check`, `deno task test`, `deno lint .`: 76 backend/authorization
  tests, all using fake credentials and no network.
- From repo root: `deno test --no-prompt tests/paypal-sync.test.ts`: 10 UI helper
  tests, including repeat results, failed attempts and Fortaleza timestamps.
- Frontend TypeScript, targeted ESLint and production Vite build passed.
- Live user-session clicking is intentionally deferred at the user's request.
- Category-only backfill and future Low-Tickets LATAM posting/repetition were
  verified separately with transaction rollback; synthetic rows did not persist.

Deploy the sync folder plus the sibling preview `handler.ts` and `core.ts`,
preserving their relative folders. Existing provider Secrets remain server-only.
The original SQL migration is included for source control; it was already
applied to production and must not be rerun as a frontend deployment step.
