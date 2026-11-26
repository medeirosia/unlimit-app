# PayPal daily preview (read-only)

Protected production Edge Function for reviewing yesterday's PayPal movements.
This is **not** a ledger importer. It never updates accounts, creates financial
records, edits the manual Saldo Real, installs a cron job or sends payments.

## Configuration

- Supabase platform JWT verification: **true**.
- Existing server-only Secrets: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`.
- Uses the default Supabase Auth environment variables, not frontend
  credentials.
- Authorized callers: the current owner of the configured PayPal finance
  account, after server-side Auth validation, or an exact service-role key
  supplied by a trusted server / the Supabase Dashboard tester. Never put that
  key in the app.
- Application origins: the two production Unlimit domains and Supabase
  Dashboard.

## Request

POST JSON `{ "date": "2026-11-24", "include_balances": true }`. With `{}`, the
date defaults to D-1 in PayPal's `America/Los_Angeles` calendar (PST/PDT).
Explicit dates must be closed days within the preceding 90 days. Start/end
are independent civil midnights, including 23/25-hour DST transition days. The
provider query includes next midnight and excludes that boundary locally, so
truncation of fractional seconds cannot silently omit the final second.

## Safety and accounting

- Exchanges credentials for an OAuth token only against `api-m.paypal.com`.
- Queries every page, requesting balance-affecting records and transaction info.
- Omits payer names, emails, addresses, notes, credentials and tokens from
  output.
- Keeps non-BRL amounts separate; **does not estimate currency conversion**.
- Matches a successful merchant payment to its two provider conversion rows by
  reference ID, currency and exact source net. One sale remains one sale, not
  three. Reports the actual BRL conversion credit, with source fees already
  deducted. Ambiguous/mismatched conversions stay flagged instead of posting.
- Does not assume that a positive balance movement is a sale. Conversion rows,
  withdrawals, refunds and other event types remain separate for reconciliation.
- Reporting IDs alone are not unique. Only exact repeated contextual records are
  excluded; conflicting records trigger a review warning.
- Missing pages and changed reports fail closed rather than returning totals.
- Optional opening/closing provider balances are reference snapshots only.
- If the token lacks Balance API access, a required-dates-only Transaction
  Search request checks whether the provider supplies running balances. It does
  not expand scopes or change any balance, and marks incomplete report
  references.
- Automatic import remains false until accounting rules, the opening balance,
  first import date and a reconciled preview are validated separately.

## Local checks

Run `deno task check` and `deno task test` in this directory. No provider
Secrets or network access are used by the tests; their credentials are fake
fixtures.

## Official references checked 2026-11-25

- https://developer.paypal.com/api/transaction-search/v1/search-get
- https://developer.paypal.com/api/transaction-search/v1/balances-get/
- https://developer.paypal.com/api/rest/authentication/
- https://supabase.com/docs/guides/functions/auth-headers
- https://supabase.com/docs/guides/functions/secrets

## Operational note

PayPal reporting can lag processed transactions by up to three hours. A
successful OAuth response alone does not prove Transaction Search access: test
the actual report endpoint before describing the integration as connected.
