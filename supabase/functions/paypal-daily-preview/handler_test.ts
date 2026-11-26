import assert from "node:assert/strict";
import { createHandler } from "./handler.ts";

const env: Record<string, string> = {
  SUPABASE_URL: "https://unit-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "fake-service-token",
  SUPABASE_ANON_KEY: "fake-anon-key",
  PAYPAL_CLIENT_ID: "fake-client-id",
  PAYPAL_CLIENT_SECRET: "super-private-unit-secret",
};
const fakeScopes =
  "https://uri.paypal.com/services/reporting/search/read https://uri.paypal.com/services/reporting/balances/read";
const record = {
  transaction_info: {
    transaction_id: "UNIT-1",
    transaction_event_code: "T0006",
    transaction_status: "S",
    transaction_initiation_date: "2026-11-24T10:00:00-03:00",
    transaction_amount: { currency_code: "BRL", value: "100.00" },
    fee_amount: { currency_code: "BRL", value: "-5.00" },
  },
};
const dataResponse = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), {
    status,
    headers: { "Content-Type": "application/json" },
  });
function setup(
  overrides: Record<string, string> = {},
  route?: (url: URL, init?: RequestInit) => Response,
) {
  const calls: Array<{ url: URL; method: string }> = [];
  const mockFetch: typeof fetch = (input, init) => {
    const url = new URL(String(input));
    calls.push({ url, method: init?.method ?? "GET" });
    if (route) return Promise.resolve(route(url, init));
    if (url.pathname === "/v1/oauth2/token") {
      return Promise.resolve(
        dataResponse({
          access_token: "private-unit-access-token",
          scope: fakeScopes,
        }),
      );
    }
    if (url.pathname === "/v1/reporting/transactions") {
      return Promise.resolve(dataResponse({
        transaction_details: [record],
        total_items: 1,
        total_pages: 1,
        last_refreshed_datetime: "2026-11-25T10:00:00Z",
        end_date: "2026-11-25T08:00:00Z",
      }));
    }
    if (url.pathname === "/v1/reporting/balances") {
      return Promise.resolve(
        dataResponse({
          balances: [{
            currency: "BRL",
            total_balance: { currency_code: "BRL", value: "100.00" },
          }],
        }),
      );
    }
    throw new Error("Unexpected test route");
  };
  const handler = createHandler({
    env: (key) => ({ ...env, ...overrides })[key],
    fetch: mockFetch,
    now: () => new Date("2026-11-25T13:00:00Z"),
  });
  return { handler, calls };
}
function request(
  body: unknown = {},
  bearer: string | null = env.SUPABASE_SERVICE_ROLE_KEY,
  extra: Record<string, string> = {},
) {
  return new Request("https://unit-test/functions/v1/paypal-daily-preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...extra,
    },
    body: JSON.stringify(body),
  });
}

Deno.test("anonymous requests stop before reading PayPal", async () => {
  const { handler, calls } = setup();
  assert.equal((await handler(request({}, null))).status, 401);
  assert.equal(calls.length, 0);
});
Deno.test("untrusted origins stop before any upstream call", async () => {
  const { handler, calls } = setup();
  assert.equal(
    (await handler(request({}, undefined, { origin: "https://attacker.test" })))
      .status,
    403,
  );
  assert.equal(calls.length, 0);
});
Deno.test("missing provider configuration returns no secrets and makes no PayPal call", async () => {
  const { handler, calls } = setup({ PAYPAL_CLIENT_SECRET: "" });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal(calls.length, 0);
});
Deno.test("successful preview requests D-1, filters to balance effects and never writes a database", async () => {
  const { handler, calls } = setup();
  const response = await handler(request());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.date, "2026-11-24");
  assert.equal(body.confirmed_brl_balance_effects.net, "95.00");
  assert.equal(body.database_writes, 0);
  assert.equal(body.import_enabled, false);
  assert.equal(body.real_balance_untouched, true);
  assert.equal(body.provider_refreshed_through_day_end, true);
  assert.equal(
    calls[1].url.searchParams.get("balance_affecting_records_only"),
    "Y",
  );
  assert.equal(calls[1].url.searchParams.get("fields"), "transaction_info");
  assert.equal(
    calls[1].url.searchParams.get("start_date"),
    "2026-11-24T08:00:00.000Z",
  );
  assert(
    calls.every((c) =>
      c.method === "GET" || c.url.pathname === "/v1/oauth2/token"
    ),
  );
  for (
    const secret of [
      env.PAYPAL_CLIENT_SECRET,
      env.PAYPAL_CLIENT_ID,
      "private-unit-access-token",
    ]
  ) {
    assert(!JSON.stringify(body).includes(secret));
  }
});
Deno.test("the handler refuses any import option", async () => {
  const { handler, calls } = setup();
  const response = await handler(request({ import: true }));
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});
Deno.test("optional historical balances remain read-only", async () => {
  const { handler, calls } = setup();
  const response = await handler(request({ include_balances: true }));
  assert.equal((await response.json()).balance_snapshots.length, 2);
  assert.equal(
    calls.filter((c) => c.url.pathname === "/v1/reporting/balances").length,
    2,
  );
  assert(
    calls.every((c) =>
      c.method === "GET" || c.url.pathname === "/v1/oauth2/token"
    ),
  );
});
Deno.test("reporting permission errors are distinguished without exposing response bodies", async () => {
  const { handler } = setup(
    {},
    (url) =>
      url.pathname.endsWith("/token")
        ? dataResponse({
          access_token: "private-unit-access-token",
          scope: "openid",
        })
        : dataResponse({
          name: "PERMISSION_DENIED",
          debug: env.PAYPAL_CLIENT_SECRET,
        }, 403),
  );
  const response = await handler(request());
  const body = await response.json();
  assert.equal(body.error, "PAYPAL_REPORTING_ACCESS_DENIED");
  assert.equal(body.upstream_status, 403);
  assert.equal(body.reporting_scope_present, false);
  assert(!JSON.stringify(body).includes(env.PAYPAL_CLIENT_SECRET));
});
Deno.test("an authenticated but unrelated user cannot access this finance account", async () => {
  const { handler, calls } = setup(
    {},
    (url) =>
      url.pathname.endsWith("/user")
        ? dataResponse({ id: "unrelated-user" })
        : dataResponse([{ user_id: "account-owner", active: true }]),
  );
  const response = await handler(request({}, "unrelated-user-jwt"));
  assert.equal(response.status, 403);
  assert(calls.every((c) => !c.url.host.includes("paypal")));
});
Deno.test("expired or forged user sessions cannot reach the provider", async () => {
  const { handler, calls } = setup(
    {},
    () => dataResponse({ error: "invalid" }, 401),
  );
  assert.equal((await handler(request({}, "forged-jwt"))).status, 401);
  assert.equal(calls.length, 1);
});
Deno.test("incomplete pagination never returns a seemingly complete preview", async () => {
  const { handler } = setup(
    {},
    (url) =>
      url.pathname.endsWith("/token")
        ? dataResponse({
          access_token: "private-unit-access-token",
          scope: fakeScopes,
        })
        : dataResponse({
          transaction_details: [record],
          total_items: 2,
          total_pages: 1,
        }),
  );
  assert.equal(
    (await (await handler(request())).json()).error,
    "INCOMPLETE_PAYPAL_REPORT",
  );
});
Deno.test("all pages are fetched and an identical repeated row is counted only once", async () => {
  const { handler, calls } = setup(
    {},
    (url) =>
      url.pathname.endsWith("/token")
        ? dataResponse({
          access_token: "private-unit-access-token",
          scope: fakeScopes,
        })
        : dataResponse({
          transaction_details: [record],
          total_items: 2,
          total_pages: 2,
        }),
  );
  const body = await (await handler(request())).json();
  assert.equal(body.record_count, 1);
  assert.equal(body.exact_duplicates_ignored, 1);
  assert.equal(
    calls.filter((c) => c.url.pathname.endsWith("/transactions")).length,
    2,
  );
});
Deno.test("provider exceptions cannot leak secrets in an error response", async () => {
  const { handler } = setup({}, () => {
    throw new Error(env.PAYPAL_CLIENT_SECRET);
  });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert(!(await response.text()).includes(env.PAYPAL_CLIENT_SECRET));
});

Deno.test("the current finance account owner can request a preview using a validated session", async () => {
  const { handler, calls } = setup({}, (url) => {
    if (url.pathname.endsWith("/user")) {
      return dataResponse({ id: "account-owner" });
    }
    if (url.pathname.endsWith("/bank_accounts")) {
      return dataResponse([{ user_id: "account-owner", active: true }]);
    }
    if (url.pathname.endsWith("/token")) {
      return dataResponse({
        access_token: "private-unit-access-token",
        scope: fakeScopes,
      });
    }
    return dataResponse({
      transaction_details: [record],
      total_items: 1,
      total_pages: 1,
    });
  });
  assert.equal((await handler(request({}, "owner-jwt"))).status, 200);
  assert.equal(calls.filter((c) => c.url.host.includes("paypal")).length, 2);
  assert(
    calls.filter((c) => c.url.host.includes("supabase")).every((c) =>
      c.method === "GET"
    ),
  );
});
Deno.test("missing refresh metadata is not treated as a complete closing", async () => {
  const { handler } = setup(
    {},
    (url) =>
      url.pathname.endsWith("/token")
        ? dataResponse({
          access_token: "private-unit-access-token",
          scope: fakeScopes,
        })
        : dataResponse({
          transaction_details: [record],
          total_items: 1,
          total_pages: 1,
        }),
  );
  const body = await (await handler(request())).json();
  assert.equal(body.provider_refreshed_through_day_end, false);
  assert(body.warnings.includes("PROVIDER_CLOSING_COVERAGE_NOT_CONFIRMED"));
});
Deno.test("records outside the requested local day are not included in a daily total", async () => {
  const { handler } = setup(
    {},
    (url) =>
      url.pathname.endsWith("/token")
        ? dataResponse({
          access_token: "private-unit-access-token",
          scope: fakeScopes,
        })
        : dataResponse({
          transaction_details: [{
            transaction_info: {
              ...record.transaction_info,
              transaction_initiation_date: "2026-11-23T23:59:59-03:00",
            },
          }],
          total_items: 1,
          total_pages: 1,
        }),
  );
  assert.equal(
    (await (await handler(request())).json()).error,
    "REPORT_CONTAINS_OUTSIDE_DAY_RECORDS",
  );
});

Deno.test("the next midnight boundary is queried but excluded from yesterday", async () => {
  const nextMidnight = {
    transaction_info: {
      ...record.transaction_info,
      transaction_id: "NEXT-DAY",
      transaction_initiation_date: "2026-11-25T08:00:00Z",
    },
  };
  const { handler, calls } = setup(
    {},
    (url) =>
      url.pathname.endsWith("/token")
        ? dataResponse({
          access_token: "private-unit-access-token",
          scope: fakeScopes,
        })
        : dataResponse({
          transaction_details: [record, nextMidnight],
          total_items: 2,
          total_pages: 1,
          end_date: "2026-11-25T08:00:00Z",
          last_refreshed_datetime: "2026-11-25T10:00:00Z",
        }),
  );
  const body = await (await handler(request())).json();
  assert.equal(body.record_count, 1);
  assert.equal(body.next_midnight_records_excluded, 1);
  assert.equal(body.confirmed_brl_balance_effects.net, "95.00");
  assert.equal(body.provider_refreshed_through_day_end, true);
  assert.equal(
    calls[1].url.searchParams.get("end_date"),
    "2026-11-25T08:00:00.000Z",
  );
});

Deno.test("historical running balances can be checked with existing Search access only", async () => {
  const { handler, calls } = setup({}, (url) => {
    if (url.pathname.endsWith("/token")) {
      return dataResponse({
        access_token: "private-unit-access-token",
        scope: "https://uri.paypal.com/services/reporting/search/read",
      });
    }
    return dataResponse({
      transaction_details: [{
        transaction_info: {
          ...record.transaction_info,
          ending_balance: { currency_code: "BRL", value: "350.11" },
        },
      }],
      total_items: 1,
      total_pages: 1,
      end_date: "2026-11-25T08:00:00Z",
      last_refreshed_datetime: "2026-11-25T10:00:00Z",
    });
  });
  const body = await (await handler(request({ include_balances: true })))
    .json();
  assert.equal(body.reporting_permissions.balances, false);
  assert.equal(body.transaction_balance_reference.available, true);
  assert.equal(body.transaction_balance_reference.full_report_included, true);
  assert.equal(
    body.transaction_balance_reference.observations[0].ending_balance,
    "350.11",
  );
  assert.equal(
    calls.filter((c) => c.url.pathname.endsWith("/balances")).length,
    0,
  );
  const supplemental = calls.at(-1)!.url;
  assert.deepEqual([...supplemental.searchParams.keys()].sort(), [
    "end_date",
    "start_date",
  ]);
  assert.equal(body.database_writes, 0);
});

Deno.test("a zero-result PayPal report may omit the transaction array", async () => {
  const { handler } = setup(
    {},
    (url) =>
      url.pathname.endsWith("/token")
        ? dataResponse({
          access_token: "private-unit-access-token",
          scope: fakeScopes,
        })
        : dataResponse({
          total_items: 0,
          total_pages: 0,
          end_date: "2026-11-25T08:00:00Z",
          last_refreshed_datetime: "2026-11-25T10:00:00Z",
        }),
  );
  const response = await handler(request());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.record_count, 0);
  assert.equal(body.reconciled_sales.count, 0);
  assert.equal(body.reconciled_sales.total_net_brl, "0.00");
});
Deno.test("an absent transaction array with a nonzero total still fails closed", async () => {
  const { handler } = setup(
    {},
    (url) =>
      url.pathname.endsWith("/token")
        ? dataResponse({
          access_token: "private-unit-access-token",
          scope: fakeScopes,
        })
        : dataResponse({ total_items: 3, total_pages: 1 }),
  );
  assert.equal(
    (await (await handler(request())).json()).error,
    "INVALID_REPORT_PAGINATION",
  );
});
