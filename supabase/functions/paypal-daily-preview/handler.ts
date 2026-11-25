import {
  buildPreview,
  dayRange,
  equalSecret,
  money,
  PAYPAL_ACCOUNT_ID,
  PreviewError,
  toCents,
} from "./core.ts";
import type { TransactionDetail } from "./core.ts";

type Dependencies = {
  env: (name: string) => string | undefined;
  fetch: typeof fetch;
  now: () => Date;
};
const PAYPAL = "https://api-m.paypal.com";
const ALLOWED_ORIGINS = new Set([
  "https://www.unlimitapp.com.br",
  "https://unlimitapp.com.br",
  "https://supabase.com",
]);

export function createHandler(deps: Dependencies) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Vary": "Origin",
      "Access-Control-Allow-Headers":
        "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "X-Content-Type-Options": "nosniff",
    };
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
    const respond = (value: unknown, status = 200) =>
      new Response(JSON.stringify(value), { status, headers });
    try {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        throw new PreviewError("ORIGIN_NOT_ALLOWED", 403);
      }
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers });
      }
      if (req.method !== "POST") {
        throw new PreviewError("METHOD_NOT_ALLOWED", 405);
      }
      const bearer = req.headers.get("authorization")?.match(/^Bearer (\S+)$/i)
        ?.[1];
      if (!bearer || bearer.length > 10_000) {
        throw new PreviewError("AUTHENTICATION_REQUIRED", 401);
      }
      const supabaseUrl = deps.env("SUPABASE_URL");
      const serviceKey = deps.env("SUPABASE_SERVICE_ROLE_KEY");
      const anonKey = deps.env("SUPABASE_ANON_KEY");
      if (!supabaseUrl || !serviceKey || !anonKey) {
        throw new PreviewError("SERVER_AUTH_CONFIGURATION_MISSING", 503);
      }
      const remote = async (url: string | URL, init: RequestInit = {}) => {
        try {
          return await deps.fetch(url, {
            ...init,
            signal: AbortSignal.timeout(15_000),
          });
        } catch {
          throw new PreviewError("UPSTREAM_UNAVAILABLE", 503);
        }
      };
      const json = async (
        response: Response,
      ): Promise<Record<string, unknown>> => {
        try {
          return await response.json();
        } catch {
          throw new PreviewError("INVALID_UPSTREAM_RESPONSE");
        }
      };
      // The gateway also verifies the JWT (verify_jwt=true). No trusting decoded
      // claims or editable user_metadata. Non-admin requests must belong to the
      // current owner of this particular financial account.
      if (!equalSecret(bearer, serviceKey)) {
        const authResponse = await remote(`${supabaseUrl}/auth/v1/user`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${bearer}` },
        });
        if (!authResponse.ok) {
          throw new PreviewError("INVALID_USER_SESSION", 401);
        }
        const user = await json(authResponse);
        if (typeof user.id !== "string") {
          throw new PreviewError("INVALID_USER_SESSION", 401);
        }
        const accountUrl = new URL(`${supabaseUrl}/rest/v1/bank_accounts`);
        accountUrl.searchParams.set("id", `eq.${PAYPAL_ACCOUNT_ID}`);
        accountUrl.searchParams.set("select", "user_id,active");
        const accountResponse = await remote(accountUrl, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        });
        if (!accountResponse.ok) {
          throw new PreviewError("ACCOUNT_AUTHORIZATION_UNAVAILABLE", 503);
        }
        const account = await accountResponse.json();
        if (
          !Array.isArray(account) || account.length !== 1 ||
          account[0].user_id !== user.id || account[0].active !== true
        ) {
          throw new PreviewError("FINANCE_ACCOUNT_ACCESS_DENIED", 403);
        }
      }
      const rawBody = await req.text();
      if (rawBody.length > 1024) {
        throw new PreviewError("REQUEST_TOO_LARGE", 413);
      }
      let input: Record<string, unknown> = {};
      try {
        input = rawBody ? JSON.parse(rawBody) : {};
        if (!input || Array.isArray(input) || typeof input !== "object") {
          throw new Error();
        }
      } catch {
        throw new PreviewError("INVALID_JSON_BODY", 400);
      }
      if (
        Object.keys(input).some((key) =>
          !["date", "include_balances"].includes(key)
        )
      ) {
        throw new PreviewError("PREVIEW_ONLY_UNKNOWN_OPTION", 400);
      }
      if (
        input.include_balances !== undefined &&
        typeof input.include_balances !== "boolean"
      ) {
        throw new PreviewError("INVALID_BALANCE_OPTION", 400);
      }
      const range = dayRange(input.date, deps.now());
      const clientId = deps.env("PAYPAL_CLIENT_ID")?.trim();
      const clientSecret = deps.env("PAYPAL_CLIENT_SECRET")?.trim();
      if (!clientId || !clientSecret) {
        throw new PreviewError("PAYPAL_CREDENTIALS_MISSING", 503);
      }
      if (
        !/^[A-Za-z0-9_-]+$/.test(clientId) ||
        !/^[A-Za-z0-9_-]+$/.test(clientSecret)
      ) {
        throw new PreviewError("PAYPAL_CREDENTIAL_FORMAT_INVALID", 503);
      }
      const tokenResponse = await remote(`${PAYPAL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: "grant_type=client_credentials",
      });
      const tokenData = await json(tokenResponse);
      if (!tokenResponse.ok || typeof tokenData.access_token !== "string") {
        throw new PreviewError("PAYPAL_AUTHENTICATION_FAILED", 502, {
          upstream_status: tokenResponse.status,
        });
      }
      const token = tokenData.access_token;
      const scopes = typeof tokenData.scope === "string"
        ? tokenData.scope.split(/\s+/)
        : [];
      const scopeFlags = {
        transaction_search: scopes.includes(
          "https://uri.paypal.com/services/reporting/search/read",
        ),
        balances: scopes.includes(
          "https://uri.paypal.com/services/reporting/balances/read",
        ),
      };
      const paypalHeaders = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };
      const deadline = Date.now() + 45_000;
      const details: TransactionDetail[] = [];
      let totalPages = 1;
      let firstTotal: number | undefined;
      let latestRefresh: string | null = null;
      let everyPageHasRefresh = true;
      let everyPageCoversDay = true;
      for (let page = 1; page <= totalPages; page++) {
        if (page > 20 || Date.now() > deadline) {
          throw new PreviewError("REPORT_TOO_LARGE_FOR_PREVIEW", 422);
        }
        const url = new URL(`${PAYPAL}/v1/reporting/transactions`);
        url.searchParams.set("start_date", range.start);
        // Include next midnight in the query, then exclude its exact boundary.
        url.searchParams.set("end_date", range.end_exclusive);
        url.searchParams.set("fields", "transaction_info");
        url.searchParams.set("balance_affecting_records_only", "Y");
        url.searchParams.set("page_size", "500");
        url.searchParams.set("page", String(page));
        const response = await remote(url, { headers: paypalHeaders });
        const data = await json(response);
        if (!response.ok) {
          const details: Record<string, number | boolean> = {
            upstream_status: response.status,
            reporting_scope_present: scopeFlags.transaction_search,
          };
          throw new PreviewError(
            response.status === 403
              ? "PAYPAL_REPORTING_ACCESS_DENIED"
              : "PAYPAL_REPORTING_FAILED",
            502,
            details,
          );
        }
        // PayPal omits transaction_details on some valid zero-result reports.
        // Only accept that omission with an explicit, consistent total of zero.
        const explicitEmpty = data.total_items === 0 &&
          (data.total_pages === 0 || data.total_pages === undefined) &&
          (data.transaction_details === undefined ||
            (Array.isArray(data.transaction_details) &&
              data.transaction_details.length === 0));
        const pageDetails = explicitEmpty ? [] : data.transaction_details;
        const pageTotal = explicitEmpty ? 0 : data.total_pages;
        if (
          !Array.isArray(pageDetails) ||
          !Number.isSafeInteger(pageTotal) ||
          !Number.isSafeInteger(data.total_items) ||
          Number(pageTotal) < 0 || Number(data.total_items) < 0
        ) {
          throw new PreviewError("INVALID_REPORT_PAGINATION", 502, {
            records_array_present: Array.isArray(data.transaction_details),
            total_items_present: typeof data.total_items === "number",
            total_pages_present: typeof data.total_pages === "number",
          });
        }
        const pages = Math.max(1, Number(pageTotal));
        if (pages > 20) {
          throw new PreviewError("REPORT_TOO_LARGE_FOR_PREVIEW", 422);
        }
        if (
          page > 1 && (pages !== totalPages || firstTotal !== data.total_items)
        ) {
          throw new PreviewError("REPORT_CHANGED_RETRY_REQUIRED", 409);
        }
        totalPages = pages;
        firstTotal = Number(data.total_items);
        details.push(...pageDetails as TransactionDetail[]);
        const refreshed = data.last_refreshed_datetime;
        if (
          typeof refreshed === "string" &&
          Number.isFinite(Date.parse(refreshed))
        ) {
          if (
            !latestRefresh || Date.parse(refreshed) < Date.parse(latestRefresh)
          ) latestRefresh = refreshed;
        } else everyPageHasRefresh = false;
        if (
          typeof data.end_date !== "string" ||
          !Number.isFinite(Date.parse(data.end_date)) ||
          Date.parse(data.end_date) < Date.parse(range.end_exclusive)
        ) everyPageCoversDay = false;
      }
      if (details.length !== firstTotal) {
        throw new PreviewError("INCOMPLETE_PAYPAL_REPORT");
      }
      if (
        details.some((detail) => {
          const instant = Date.parse(
            detail.transaction_info?.transaction_initiation_date ?? "",
          );
          return !Number.isFinite(instant) ||
            instant < Date.parse(range.start) ||
            instant > Date.parse(range.end_exclusive);
        })
      ) throw new PreviewError("REPORT_CONTAINS_OUTSIDE_DAY_RECORDS");
      const dayDetails = details.filter((detail) =>
        Date.parse(detail.transaction_info!.transaction_initiation_date!) <
          Date.parse(range.end_exclusive)
      );
      const preview = buildPreview(dayDetails);
      const providerCoversDay = everyPageHasRefresh && everyPageCoversDay &&
        latestRefresh !== null &&
        Date.parse(latestRefresh) >= Date.parse(range.end_exclusive);
      if (!providerCoversDay) {
        preview.warnings.push("PROVIDER_CLOSING_COVERAGE_NOT_CONFIRMED");
      }
      const balanceSnapshots: Array<Record<string, unknown>> = [];
      let transactionBalanceReference: Record<string, unknown> | null = null;
      if (input.include_balances === true) {
        for (
          const [kind, asOf] of [["opening", range.opening_as_of], [
            "closing",
            range.end,
          ]]
        ) {
          if (!scopeFlags.balances) {
            balanceSnapshots.push({
              kind,
              available: false,
              reason: "BALANCE_SCOPE_NOT_PRESENT",
            });
            continue;
          }
          const url = new URL(`${PAYPAL}/v1/reporting/balances`);
          url.searchParams.set("as_of_time", asOf);
          const response = await remote(url, {
            headers: {
              ...paypalHeaders,
              "PayPal-Enforce-ISO8601-Format": "true",
            },
          });
          const data = await json(response);
          if (!response.ok) {
            balanceSnapshots.push({
              kind,
              available: false,
              upstream_status: response.status,
            });
            continue;
          }
          const balances = Array.isArray(data.balances) ? data.balances : [];
          balanceSnapshots.push({
            kind,
            available: true,
            requested_as_of: asOf,
            as_of_time: data.as_of_time,
            last_refresh_time: data.last_refresh_time,
            balances: balances.map((item: Record<string, unknown>) => ({
              currency: item.currency,
              total: item.total_balance,
              available: item.available_balance,
              withheld: item.withheld_balance,
            })),
          });
        }
        if (!scopeFlags.balances) {
          // Search access may expose running balances without a separate Balance
          // API scope. PayPal suppresses ending_balance when optional filters are
          // supplied, so this supplementary report uses only required dates.
          // These are reference observations, never written as an account balance.
          try {
            const url = new URL(`${PAYPAL}/v1/reporting/transactions`);
            url.searchParams.set("start_date", range.start);
            url.searchParams.set("end_date", range.end_exclusive);
            const response = await remote(url, { headers: paypalHeaders });
            const data = await json(response);
            const raw = Array.isArray(data.transaction_details)
              ? data.transaction_details
              : [];
            const observations: Array<Record<string, unknown>> = [];
            if (response.ok) {
              for (const detail of raw) {
                const info = detail?.transaction_info;
                const ending = info?.ending_balance;
                const instant = Date.parse(
                  info?.transaction_initiation_date ?? "",
                );
                if (
                  ending?.currency_code === "BRL" &&
                  typeof ending.value === "string" &&
                  Number.isFinite(instant) &&
                  instant >= Date.parse(range.start) &&
                  instant < Date.parse(range.end_exclusive)
                ) {
                  observations.push({
                    transaction_id: info.transaction_id,
                    at: info.transaction_initiation_date,
                    currency: "BRL",
                    ending_balance: money(toCents(ending.value)),
                  });
                }
              }
            }
            observations.sort((a, b) =>
              Date.parse(String(a.at)) - Date.parse(String(b.at))
            );
            transactionBalanceReference = {
              source: "UNFILTERED_TRANSACTION_REPORT",
              available: response.ok && observations.length > 0,
              upstream_status: response.status,
              full_report_included: response.ok &&
                Number(data.total_pages) <= 1 &&
                data.total_items === raw.length,
              provider_end_date: data.end_date,
              provider_last_refreshed_at: data.last_refreshed_datetime,
              observations,
            };
          } catch (error) {
            transactionBalanceReference = {
              available: false,
              reason: error instanceof PreviewError
                ? error.code
                : "TRANSACTION_BALANCE_UNAVAILABLE",
            };
          }
        }
      }
      return respond({
        ok: true,
        mode: "read_only_preview",
        environment: "live",
        account_id: PAYPAL_ACCOUNT_ID,
        ...range,
        generated_at: deps.now().toISOString(),
        provider_last_refreshed_at: latestRefresh,
        provider_refreshed_through_day_end: providerCoversDay,
        reporting_permissions: scopeFlags,
        database_writes: 0,
        import_enabled: false,
        real_balance_untouched: true,
        next_midnight_records_excluded: details.length - dayDetails.length,
        ...preview,
        balance_snapshots: balanceSnapshots,
        transaction_balance_reference: transactionBalanceReference,
      });
    } catch (error) {
      // Never expose upstream bodies, credentials, access tokens, payer data or
      // exceptions containing request headers. Do not log any of those either.
      if (error instanceof PreviewError) {
        return respond({
          ok: false,
          error: error.code,
          ...error.details,
          database_writes: 0,
          import_enabled: false,
        }, error.status);
      }
      return respond({
        ok: false,
        error: "PREVIEW_UNAVAILABLE",
        database_writes: 0,
        import_enabled: false,
      }, 500);
    }
  };
}
