import { createHandler as createPreview } from "../paypal-daily-preview/handler.ts";
import {
  equalSecret,
  PAYPAL_ACCOUNT_ID,
  PreviewError,
  toCents,
  validDay,
} from "../paypal-daily-preview/core.ts";

type Dependencies = {
  env: (name: string) => string | undefined;
  fetch: typeof fetch;
  now: () => Date;
};
type Preview = Record<string, unknown> & {
  date: string;
  reconciled_sales: {
    count: number;
    total_net_brl: string;
    unmatched_successful_records: number;
    sales: Array<Record<string, unknown>>;
  };
};

// One closed day is committed atomically. No partial, ambiguous or estimated
// currency-conversion report may reach the posting RPC.
export function assertPostable(p: Preview, date: string): void {
  if (
    p.ok !== true || p.mode !== "read_only_preview" ||
    p.environment !== "live" ||
    p.account_id !== PAYPAL_ACCOUNT_ID || p.date !== date || !validDay(date) ||
    p.provider_refreshed_through_day_end !== true ||
    !Array.isArray(p.warnings) || p.warnings.length !== 0 ||
    !p.reconciled_sales || !Array.isArray(p.reconciled_sales.sales) ||
    p.reconciled_sales.unmatched_successful_records !== 0 ||
    p.reconciled_sales.count !== p.reconciled_sales.sales.length
  ) throw new PreviewError("REPORT_REQUIRES_REVIEW", 409);
  const seen = new Set<string>();
  let total = 0;
  for (const sale of p.reconciled_sales.sales) {
    const id = sale.source_transaction_id;
    if (
      typeof id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(id) ||
      seen.has(id) || sale.fees_already_deducted !== true
    ) {
      throw new PreviewError("SALE_REQUIRES_REVIEW", 409);
    }
    seen.add(id);
    const amount = toCents(sale.net_brl);
    if (amount <= 0) throw new PreviewError("SALE_REQUIRES_REVIEW", 409);
    total += amount;
  }
  if (
    !Number.isSafeInteger(total) ||
    total !== toCents(p.reconciled_sales.total_net_brl)
  ) {
    throw new PreviewError("REPORT_TOTAL_MISMATCH", 409);
  }
}

export function createSyncHandler(deps: Dependencies) {
  const previewHandler = createPreview(deps);
  const allowedOrigins = new Set([
    "https://www.unlimitapp.com.br",
    "https://unlimitapp.com.br",
    "https://supabase.com",
  ]);
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Origin",
      "Access-Control-Allow-Headers":
        "authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    if (origin && allowedOrigins.has(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
    const respond = (v: unknown, status = 200) =>
      new Response(JSON.stringify(v), { status, headers });
    let authorized = false;
    let currentDate: string | null = null;
    let rpc: (name: string, body?: unknown) => Promise<unknown>;
    try {
      if (origin && !allowedOrigins.has(origin)) {
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
      if (!bearer || bearer.length > 10000) {
        throw new PreviewError("AUTHENTICATION_REQUIRED", 401);
      }
      const url = deps.env("SUPABASE_URL");
      const service = deps.env("SUPABASE_SERVICE_ROLE_KEY");
      if (!url || !service) {
        throw new PreviewError("SERVER_CONFIGURATION_MISSING", 503);
      }
      rpc = async (name, body = {}) => {
        let response: Response;
        try {
          response = await deps.fetch(`${url}/rest/v1/rpc/${name}`, {
            method: "POST",
            headers: {
              apikey: service,
              Authorization: `Bearer ${service}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(20000),
          });
        } catch {
          throw new PreviewError("DATABASE_UNAVAILABLE", 503);
        }
        if (!response.ok) {
          let code = "DATABASE_OPERATION_REJECTED";
          try {
            const failure = await response.json();
            if (
              typeof failure.message === "string" &&
              /^PAYPAL_[A-Z0-9_]{1,64}$/.test(failure.message)
            ) code = failure.message;
          } catch { /* No upstream error body is exposed. */ }
          throw new PreviewError(code, 409);
        }
        try {
          return await response.json();
        } catch {
          throw new PreviewError("INVALID_DATABASE_RESPONSE", 502);
        }
      };
      const admin = equalSecret(bearer, service);
      let caller: "admin" | "cron" | "owner" = "admin";
      if (!admin) {
        if (/^paypal_sync_[a-f0-9]{64}$/.test(bearer)) {
          if (
            await rpc("paypal_sync_authorize", { p_token: bearer }) !== true
          ) {
            throw new PreviewError("ACCESS_DENIED", 401);
          }
          caller = "cron";
        } else if (
          /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(bearer)
        ) {
          // Never decode a JWT or trust editable user_metadata for authorization.
          // Auth validates the live session; account ownership comes from the DB.
          const anon = deps.env("SUPABASE_ANON_KEY");
          if (!anon) {
            throw new PreviewError("SERVER_CONFIGURATION_MISSING", 503);
          }
          let authResponse: Response;
          try {
            authResponse = await deps.fetch(`${url}/auth/v1/user`, {
              headers: { apikey: anon, Authorization: `Bearer ${bearer}` },
              signal: AbortSignal.timeout(15000),
            });
          } catch {
            throw new PreviewError("AUTHENTICATION_UNAVAILABLE", 503);
          }
          if (!authResponse.ok) {
            throw new PreviewError("INVALID_USER_SESSION", 401);
          }
          const user = await authResponse.json();
          if (typeof user.id !== "string") {
            throw new PreviewError("INVALID_USER_SESSION", 401);
          }
          const accountUrl = new URL(`${url}/rest/v1/bank_accounts`);
          accountUrl.searchParams.set("id", `eq.${PAYPAL_ACCOUNT_ID}`);
          accountUrl.searchParams.set("select", "user_id,active");
          let accountResponse: Response;
          try {
            accountResponse = await deps.fetch(accountUrl, {
              headers: { apikey: service, Authorization: `Bearer ${service}` },
              signal: AbortSignal.timeout(15000),
            });
          } catch {
            throw new PreviewError("ACCOUNT_AUTHORIZATION_UNAVAILABLE", 503);
          }
          if (!accountResponse.ok) {
            throw new PreviewError("ACCOUNT_AUTHORIZATION_UNAVAILABLE", 503);
          }
          const accounts = await accountResponse.json();
          if (
            !Array.isArray(accounts) || accounts.length !== 1 ||
            accounts[0].user_id !== user.id || accounts[0].active !== true
          ) {
            throw new PreviewError("FINANCE_ACCOUNT_ACCESS_DENIED", 403);
          }
          caller = "owner";
        } else {
          throw new PreviewError("ACCESS_DENIED", 401);
        }
      }
      authorized = true;
      const raw = await req.text();
      if (raw.length > 1024) throw new PreviewError("REQUEST_TOO_LARGE", 413);
      let input: Record<string, unknown>;
      try {
        input = raw ? JSON.parse(raw) : {};
      } catch {
        throw new PreviewError("INVALID_JSON_BODY", 400);
      }
      if (
        !input || Array.isArray(input) || typeof input !== "object" ||
        Object.keys(input).some((k) => k !== "action")
      ) {
        throw new PreviewError("INVALID_SYNC_OPTIONS", 400);
      }
      const action = input.action ?? "run";
      if (!["run", "preview", "activate", "status"].includes(String(action))) {
        throw new PreviewError("INVALID_SYNC_ACTION", 400);
      }
      if (
        (caller === "cron" && action !== "run") ||
        (caller === "owner" && action !== "run" && action !== "status")
      ) {
        throw new PreviewError("ADMIN_REQUIRED", 403);
      }
      if (action === "activate") await rpc("paypal_sync_activate");
      const plan = await rpc("paypal_sync_plan") as {
        enabled: boolean;
        dates: string[];
        [key: string]: unknown;
      };
      if (plan.unrecoverable_gap === true) {
        throw new PreviewError("HISTORICAL_REPORT_GAP_REQUIRES_REVIEW", 409);
      }
      if (action === "status") {
        return respond({ ok: true, ...plan, real_balance_untouched: true });
      }
      if (action !== "preview" && plan.enabled !== true) {
        throw new PreviewError("IMPORT_NOT_ENABLED", 409);
      }
      if (
        !Array.isArray(plan.dates) || plan.dates.length > 7 ||
        plan.dates.some((d) => !validDay(d))
      ) throw new PreviewError("INVALID_SYNC_PLAN", 502);
      const results: unknown[] = [];
      for (const date of plan.dates) {
        currentDate = date;
        const response = await previewHandler(
          new Request(`${url}/functions/v1/paypal-daily-preview`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${service}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ date }),
          }),
        );
        const preview = await response.json() as Preview;
        if (!response.ok) {
          throw new PreviewError("PAYPAL_DAILY_REPORT_UNAVAILABLE", 502);
        }
        assertPostable(preview, date);
        if (action === "preview") {
          results.push({
            date,
            count: preview.reconciled_sales.count,
            net_brl: preview.reconciled_sales.total_net_brl,
          });
        } else {
          results.push(
            await rpc("paypal_sync_post_day", { p_report: preview }),
          );
        }
      }
      return respond({
        ok: true,
        mode: action === "preview"
          ? "read_only_sync_preview"
          : "daily_sales_import",
        results,
        last_synced_at: deps.now().toISOString(),
        real_balance_untouched: true,
      });
    } catch (error) {
      const code = error instanceof PreviewError
        ? error.code
        : "SYNC_UNAVAILABLE";
      if (authorized && rpc!) {
        // Store only our finite error code. Never record raw upstream responses,
        // authorization headers, credentials, payer identity or thrown messages.
        try {
          await rpc("paypal_sync_record_failure", {
            p_date: currentDate,
            p_code: code,
          });
        } catch { /* Original failure remains visible in HTTP/cron logs. */ }
      }
      return respond({
        ok: false,
        error: code,
        date: currentDate,
        real_balance_untouched: true,
      }, error instanceof PreviewError ? error.status : 500);
    }
  };
}
