import assert from "node:assert/strict";
import { assertPostable, createSyncHandler } from "./handler.ts";
import {
  buildPreview,
  dayRange,
  PAYPAL_ACCOUNT_ID,
  TIME_ZONE,
} from "../paypal-daily-preview/core.ts";

const now = new Date("2026-11-25T15:00:00Z");
const secret = "unit-service-not-a-real-key";
const cron = "paypal_sync_" + "a".repeat(64);
const row = {
  transaction_info: {
    transaction_id: "UNIT-SALE",
    transaction_event_code: "T0006",
    transaction_status: "S",
    transaction_initiation_date: "2026-11-24T10:00:00-03:00",
    transaction_amount: { currency_code: "BRL", value: "100.00" },
    fee_amount: { currency_code: "BRL", value: "-5.00" },
  },
};
function report() {
  return {
    ok: true,
    mode: "read_only_preview",
    environment: "live",
    account_id: PAYPAL_ACCOUNT_ID,
    ...dayRange("2026-11-24", now),
    provider_refreshed_through_day_end: true,
    ...buildPreview([row]),
  };
}
function request(
  body: unknown = {},
  token: string | null = secret,
  method = "POST",
) {
  return new Request("https://unit-test/functions/v1/paypal-daily-sync", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
}
const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status });
function setup(
  options: {
    enabled?: boolean;
    cronAllowed?: boolean;
    stale?: boolean;
    warning?: boolean;
    databaseFailure?: boolean;
    missingConfiguration?: boolean;
    gap?: boolean;
    authAllowed?: boolean;
    authUserId?: string;
    accountOwnerId?: string;
    accountActive?: boolean;
    timezone?: string;
  } = {},
) {
  const calls: string[] = [];
  let posted = false;
  let enabled = options.enabled ?? true;
  const env: Record<string, string> = {
    SUPABASE_URL: "https://unit-test",
    SUPABASE_SERVICE_ROLE_KEY: secret,
    SUPABASE_ANON_KEY: "fake-anon",
    PAYPAL_CLIENT_ID: "fake-client",
    PAYPAL_CLIENT_SECRET: "unit-provider-secret",
  };
  // A synchronous fixture with fetch's Promise-returning interface.
  // deno-lint-ignore require-await
  const mock: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    if (url.pathname === "/auth/v1/user") {
      assert.equal(new Headers(init?.headers).get("apikey"), "fake-anon");
      return json({
        id: options.authUserId ?? "unit-owner",
        user_metadata: { id: "unit-owner", role: "admin" },
      }, options.authAllowed === false ? 401 : 200);
    }
    if (url.pathname === "/rest/v1/bank_accounts") {
      assert.equal(url.searchParams.get("id"), `eq.${PAYPAL_ACCOUNT_ID}`);
      assert.equal(
        new Headers(init?.headers).get("authorization"),
        `Bearer ${secret}`,
      );
      return json([{
        user_id: options.accountOwnerId ?? "unit-owner",
        active: options.accountActive ?? true,
      }]);
    }
    if (url.pathname.includes("/rpc/")) {
      assert.equal(
        new Headers(init?.headers).get("authorization"),
        `Bearer ${secret}`,
      );
      if (url.pathname.endsWith("paypal_sync_authorize")) {
        return json(options.cronAllowed ?? true);
      }
      if (url.pathname.endsWith("paypal_sync_activate")) {
        enabled = true;
        return json({ enabled });
      }
      if (url.pathname.endsWith("paypal_sync_plan")) {
        return json({
          enabled,
          timezone: options.timezone ?? TIME_ZONE,
          dates: ["2026-11-24"],
          unrecoverable_gap: options.gap ?? false,
        });
      }
      if (url.pathname.endsWith("paypal_sync_record_failure")) {
        return json(null);
      }
      if (url.pathname.endsWith("paypal_sync_post_day")) {
        if (options.databaseFailure) {
          return json({ message: "PAYPAL_IMPORTED_SALE_CHANGED" }, 400);
        }
        const payload = JSON.parse(String(init?.body));
        assert.equal(payload.p_report.reconciled_sales.total_net_brl, "95.00");
        assert.equal(payload.p_report.date, "2026-11-24");
        const value = {
          new_sales: posted ? 0 : 1,
          already_imported: posted ? 1 : 0,
        };
        posted = true;
        return json(value);
      }
    }
    if (url.pathname === "/v1/oauth2/token") {
      return json({ access_token: "fake-upstream-token" });
    }
    if (url.pathname === "/v1/reporting/transactions") {
      return json({
        transaction_details: options.warning
          ? [
            {
              transaction_info: {
                ...row.transaction_info,
                transaction_event_code: "T1107",
              },
            },
          ]
          : [row],
        total_items: 1,
        total_pages: 1,
        last_refreshed_datetime: options.stale
          ? "2026-11-24T12:00:00Z"
          : "2026-11-25T14:00:00Z",
        end_date: "2026-11-25T08:00:00Z",
      });
    }
    throw new Error("unexpected unit route containing no real credentials");
  };
  return {
    calls,
    handler: createSyncHandler({
      env: (name) => options.missingConfiguration ? undefined : env[name],
      fetch: mock,
      now: () => now,
    }),
  };
}
Deno.test("postability accepts one exact provider-net BRL sale", () => {
  assert.doesNotThrow(() => assertPostable(report(), "2026-11-24"));
});
for (
  const [name, change] of [
    ["wrong account", { account_id: "another" }],
    ["legacy Fortaleza cutoff", { timezone: "America/Fortaleza" }],
    ["current/open day mismatch", { date: "2026-11-25" }],
    ["stale coverage", { provider_refreshed_through_day_end: false }],
    ["warnings", { warnings: ["REVIEW_REQUIRED"] }],
    ["sandbox response", { environment: "sandbox" }],
  ] as const
) {
  Deno.test(`postability rejects ${name}`, () => {
    assert.throws(() =>
      assertPostable({ ...report(), ...change }, "2026-11-24")
    );
  });
}
Deno.test("postability rejects duplicate sale ids", () => {
  const p = report();
  p.reconciled_sales.sales.push(p.reconciled_sales.sales[0]);
  p.reconciled_sales.count = 2;
  assert.throws(() => assertPostable(p, "2026-11-24"));
});
Deno.test("postability rejects an incorrect sum", () => {
  const p = report();
  p.reconciled_sales.total_net_brl = "96.00";
  assert.throws(() => assertPostable(p, "2026-11-24"));
});
Deno.test("a mismatched database calendar blocks before PayPal or any posting", async () => {
  const { handler, calls } = setup({ timezone: "America/Fortaleza" });
  const response = await handler(request({ action: "preview" }));
  assert.equal(response.status, 409);
  assert.equal(
    (await response.json()).error,
    "REPORTING_TIMEZONE_REQUIRES_REVIEW",
  );
  assert(
    !calls.some((c) =>
      c.includes("/v1/reporting/") || c.includes("paypal_sync_post_day")
    ),
  );
});
Deno.test("anonymous and arbitrary tokens make no downstream calls", async () => {
  for (const t of [null, "fake-anon"]) {
    const s = setup();
    assert.equal((await s.handler(request({}, t))).status, 401);
    assert.equal(s.calls.length, 0);
  }
});
Deno.test("disabled or invalid scheduler tokens cannot read the provider", async () => {
  const s = setup({ cronAllowed: false });
  assert.equal((await s.handler(request({}, cron))).status, 401);
  assert.equal(s.calls.length, 1);
});
Deno.test("cron cannot activate or change settings", async () => {
  const s = setup();
  assert.equal(
    (await s.handler(request({ action: "activate" }, cron))).status,
    403,
  );
  assert(!s.calls.some((x) => x.endsWith("paypal_sync_activate")));
});
Deno.test("preview makes no posting or activation calls", async () => {
  const s = setup({ enabled: false });
  const r = await s.handler(request({ action: "preview" }));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).results[0].net_brl, "95.00");
  assert(
    !s.calls.some((x) =>
      x.endsWith("paypal_sync_post_day") || x.endsWith("paypal_sync_activate")
    ),
  );
});
Deno.test("ordinary run does not enable a disabled integration", async () => {
  const s = setup({ enabled: false });
  assert.equal((await s.handler(request())).status, 409);
  assert(!s.calls.includes("/v1/oauth2/token"));
});
Deno.test("admin can activate then run, while cron can only run", async () => {
  const s = setup({ enabled: false });
  const r = await s.handler(request({ action: "activate" }));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).results[0].new_sales, 1);
});
Deno.test("repeated worker runs defer idempotency to the atomic database RPC", async () => {
  const s = setup();
  const first = await (await s.handler(request())).json();
  const next = await (await s.handler(request({}, cron))).json();
  assert.equal(first.results[0].new_sales, 1);
  assert.equal(next.results[0].new_sales, 0);
  assert.equal(next.results[0].already_imported, 1);
});
Deno.test("incomplete provider coverage cannot be posted", async () => {
  const s = setup({ stale: true });
  assert.equal((await s.handler(request())).status, 409);
  assert(!s.calls.some((x) => x.endsWith("paypal_sync_post_day")));
});
Deno.test("unsupported movements are flagged, not guessed into sales", async () => {
  const s = setup({ warning: true });
  assert.equal((await s.handler(request())).status, 409);
  assert(!s.calls.some((x) => x.endsWith("paypal_sync_post_day")));
});
Deno.test("manual changes block further posting and surface a finite safe error", async () => {
  const s = setup({ databaseFailure: true });
  const r = await s.handler(request());
  assert.equal(r.status, 409);
  const b = await r.json();
  assert.equal(b.error, "PAYPAL_IMPORTED_SALE_CHANGED");
  assert(!JSON.stringify(b).includes(secret));
});
Deno.test("older unqueryable gaps require review before any provider call", async () => {
  const s = setup({ gap: true });
  assert.equal((await s.handler(request())).status, 409);
  assert(!s.calls.includes("/v1/oauth2/token"));
});
Deno.test("missing server configuration cannot expose credentials", async () => {
  const s = setup({ missingConfiguration: true });
  assert.equal((await s.handler(request())).status, 503);
  assert.equal(s.calls.length, 0);
});
Deno.test("user-supplied dates and arbitrary options are rejected", async () => {
  const s = setup();
  assert.equal((await s.handler(request({ date: "2026-11-25" }))).status, 400);
  assert(!s.calls.includes("/v1/oauth2/token"));
});

// These are unsigned fixture strings, never actual sessions or provider keys.
const ownerToken = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJVTklUIn0.unit-signature";
Deno.test("production CORS preflight needs no authentication or provider calls", async () => {
  const s = setup();
  const r = request({}, null, "OPTIONS");
  r.headers.set("Origin", "https://www.unlimitapp.com.br");
  const response = await s.handler(r);
  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://www.unlimitapp.com.br",
  );
  assert.equal(s.calls.length, 0);
});
Deno.test("unknown origins are rejected before authentication", async () => {
  const s = setup();
  const r = request({}, ownerToken);
  r.headers.set("Origin", "https://attacker.test");
  const response = await s.handler(r);
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  assert.equal(s.calls.length, 0);
});
Deno.test("validated live account owner may synchronize from production", async () => {
  const s = setup();
  const r = request({}, ownerToken);
  r.headers.set("Origin", "https://unlimitapp.com.br");
  const response = await s.handler(r);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).results[0].new_sales, 1);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://unlimitapp.com.br",
  );
});
Deno.test("owner status request is read-only and does not read PayPal", async () => {
  const s = setup();
  const response = await s.handler(request({ action: "status" }, ownerToken));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).enabled, true);
  assert(!s.calls.includes("/v1/oauth2/token"));
  assert(!s.calls.some((x) => x.endsWith("paypal_sync_post_day")));
});
Deno.test("owner cannot activate or reconfigure the scheduler", async () => {
  const s = setup();
  assert.equal(
    (await s.handler(request({ action: "activate" }, ownerToken))).status,
    403,
  );
  assert(!s.calls.some((x) => x.endsWith("paypal_sync_activate")));
});
Deno.test("another user cannot use editable metadata to claim ownership", async () => {
  const s = setup({ authUserId: "other-user" });
  assert.equal((await s.handler(request({}, ownerToken))).status, 403);
  assert(!s.calls.includes("/v1/oauth2/token"));
  assert(!s.calls.some((x) => x.endsWith("paypal_sync_plan")));
});
Deno.test("expired or forged sessions cannot access the account or provider", async () => {
  const s = setup({ authAllowed: false });
  assert.equal((await s.handler(request({}, ownerToken))).status, 401);
  assert.deepEqual(s.calls, ["/auth/v1/user"]);
});
Deno.test("archived accounts cannot be synchronized through a user session", async () => {
  const s = setup({ accountActive: false });
  assert.equal((await s.handler(request({}, ownerToken))).status, 403);
  assert(!s.calls.includes("/v1/oauth2/token"));
});

Deno.test("scoped diagnostics return review warnings without posting or writing an audit failure", async () => {
  const s = setup({ warning: true });
  const response = await s.handler(request({ action: "preview" }, cron));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.results[0].postable, false);
  assert.equal(body.results[0].review_error, "REPORT_REQUIRES_REVIEW");
  assert(body.results[0].report.warnings.length > 0);
  assert(
    !s.calls.some((x) =>
      x.endsWith("paypal_sync_post_day") ||
      x.endsWith("paypal_sync_record_failure")
    ),
  );
});
Deno.test("owner diagnostics remain read-only even for a stale provider report", async () => {
  const s = setup({ stale: true });
  const response = await s.handler(request({ action: "preview" }, ownerToken));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).results[0].postable, false);
  assert(
    !s.calls.some((x) =>
      x.endsWith("paypal_sync_post_day") ||
      x.endsWith("paypal_sync_record_failure")
    ),
  );
});
