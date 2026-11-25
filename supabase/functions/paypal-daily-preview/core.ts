// Pure, dependency-free reporting logic. No database writes or exchange estimates.
export const TIME_ZONE = "America/Fortaleza";
export const PAYPAL_ACCOUNT_ID = "8cb28ca7-95f3-4e93-9305-33c2d7771935";

export class PreviewError extends Error {
  constructor(
    public code: string,
    public status = 502,
    public details: Record<string, string | number | boolean> = {},
  ) {
    super(code);
  }
}

export function localDay(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (kind: string) => parts.find((p) => p.type === kind)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function validDay(day: unknown): day is string {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const d = new Date(`${day}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === day;
}

export function dayRange(input: unknown, now: Date) {
  const today = localDay(now);
  const previous = new Date(Date.parse(`${today}T12:00:00Z`) - 86_400_000)
    .toISOString().slice(0, 10);
  const date = input === undefined ? previous : input;
  if (!validDay(date) || date >= today) {
    throw new PreviewError("INVALID_CLOSED_DAY", 400);
  }
  if (
    Date.parse(`${today}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`) >
      90 * 86_400_000
  ) {
    throw new PreviewError("DATE_OUTSIDE_90_DAY_PREVIEW", 400);
  }
  // Fortaleza is UTC-03 throughout the permitted contemporary reporting period.
  const start = `${date}T00:00:00-03:00`;
  const end = `${date}T23:59:59.999-03:00`;
  return {
    date,
    timezone: TIME_ZONE,
    start,
    end,
    end_exclusive: new Date(Date.parse(start) + 86_400_000).toISOString(),
    opening_as_of: new Date(Date.parse(start) - 1).toISOString(),
  };
}

export function toCents(value: unknown): number {
  if (typeof value !== "string" || !/^-?\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new PreviewError("INVALID_BRL_AMOUNT");
  }
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new PreviewError("AMOUNT_TOO_LARGE");
  return negative ? -cents : cents;
}

export function money(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new PreviewError("AMOUNT_TOO_LARGE");
  return `${cents < 0 ? "-" : ""}${Math.floor(Math.abs(cents) / 100)}.${
    String(Math.abs(cents) % 100).padStart(2, "0")
  }`;
}

type Money = { currency_code?: string; value?: string };
export type TransactionInfo = {
  transaction_id?: string;
  paypal_reference_id?: string;
  transaction_event_code?: string;
  transaction_status?: string;
  transaction_initiation_date?: string;
  transaction_updated_date?: string;
  transaction_amount?: Money;
  fee_amount?: Money;
};
export type TransactionDetail = { transaction_info?: TransactionInfo };

function safeText(input: unknown, max = 100): string | null {
  return typeof input === "string" && input.length <= max ? input : null;
}

type ReportRow = {
  transaction_id: string | null;
  reference_id: string | null;
  event_code: string;
  status: string;
  currency: string;
  gross: string | null;
  fee: string | null;
  fee_currency: string | null;
  net_brl: string | null;
  initiated_at: string | null;
  updated_at: string | null;
};

function reconcileSales(rows: ReportRow[]) {
  const consumed = new Set<ReportRow>();
  const sales: Array<{
    source_transaction_id: string;
    source_currency: string;
    source_gross: string;
    source_fee: string;
    source_net: string;
    net_brl: string;
    conversion_transaction_ids: string[];
    fees_already_deducted: true;
  }> = [];
  const merchantCodes = new Set([
    "T0002",
    "T0003",
    "T0005",
    "T0006",
    "T0007",
    "T0011",
    "T0012",
    "T0018",
  ]);
  let total = 0;
  for (const payment of rows) {
    if (
      payment.status !== "S" || !merchantCodes.has(payment.event_code) ||
      !payment.transaction_id || !payment.gross ||
      rows.filter((r) => r.transaction_id === payment.transaction_id).length !==
        1 ||
      (payment.fee_currency !== null &&
        payment.fee_currency !== payment.currency)
    ) continue;
    let gross: number, fee: number;
    try {
      gross = toCents(payment.gross);
      fee = toCents(payment.fee ?? "0");
    } catch {
      continue;
    }
    if (gross <= 0 || gross + fee <= 0) continue;
    if (payment.currency === "BRL" && payment.net_brl !== null) {
      total += gross + fee;
      consumed.add(payment);
      sales.push({
        source_transaction_id: payment.transaction_id,
        source_currency: "BRL",
        source_gross: payment.gross,
        source_fee: payment.fee ?? "0.00",
        source_net: money(gross + fee),
        net_brl: payment.net_brl,
        conversion_transaction_ids: [],
        fees_already_deducted: true,
      });
      continue;
    }
    const links = rows.filter((r) =>
      r.status === "S" && r.event_code === "T0200" &&
      r.reference_id === payment.transaction_id && r.transaction_id !== null
    );
    if (links.length !== 2) continue;
    const debit = links.find((r) => r.currency === payment.currency);
    const credit = links.find((r) => r.currency === "BRL");
    if (
      !debit || !credit || debit === credit || !debit.gross ||
      credit.net_brl === null ||
      !debit.transaction_id || !credit.transaction_id ||
      (debit.fee_currency !== null && debit.fee_currency !== debit.currency)
    ) continue;
    let debitValue: number, debitFee: number, brlNet: number;
    try {
      debitValue = toCents(debit.gross);
      debitFee = toCents(debit.fee ?? "0");
      brlNet = toCents(credit.net_brl);
    } catch {
      continue;
    }
    // Match actual provider conversions; the source fees were already deducted.
    if (
      debitValue !== -(gross + fee) || debitFee !== 0 || brlNet <= 0 ||
      consumed.has(debit) || consumed.has(credit)
    ) continue;
    total += brlNet;
    consumed.add(payment);
    consumed.add(debit);
    consumed.add(credit);
    sales.push({
      source_transaction_id: payment.transaction_id,
      source_currency: payment.currency,
      source_gross: payment.gross,
      source_fee: payment.fee ?? "0.00",
      source_net: money(gross + fee),
      net_brl: money(brlNet),
      conversion_transaction_ids: [debit.transaction_id, credit.transaction_id],
      fees_already_deducted: true,
    });
  }
  return {
    consumed,
    summary: {
      count: sales.length,
      total_net_brl: money(total),
      matched_report_records: consumed.size,
      unmatched_successful_records:
        rows.filter((r) => r.status === "S" && !consumed.has(r)).length,
      posting_basis: "PROVIDER_NET_BRL_NO_SECOND_FEE_DEDUCTION",
      sales,
    },
  };
}

export function buildPreview(details: TransactionDetail[]) {
  const exact = new Set<string>();
  const identities = new Map<string, string>();
  const warnings = new Set<string>();
  const rows: ReportRow[] = [];
  const groups = new Map<
    string,
    { count: number; gross: number; fees: number }
  >();
  let duplicateCount = 0;
  let nonBrlCount = 0;
  let confirmedBrlCount = 0;
  let brlGross = 0;
  let brlFees = 0;
  for (const detail of details) {
    const t = detail?.transaction_info;
    if (
      !t || !t.transaction_id || !t.transaction_amount?.currency_code ||
      !t.transaction_amount.value || !t.transaction_event_code ||
      !t.transaction_status ||
      !Number.isFinite(Date.parse(t.transaction_initiation_date ?? ""))
    ) {
      throw new PreviewError("INVALID_PAYPAL_REPORT_RECORD");
    }
    const currency = t.transaction_amount.currency_code;
    if (
      !/^[A-Z]{3}$/.test(currency) || !/^T\d{4}$/.test(t.transaction_event_code)
    ) {
      throw new PreviewError("INVALID_PAYPAL_REPORT_RECORD");
    }
    // An ID alone is NOT unique in PayPal reporting. Keep currency and event context.
    const identity = JSON.stringify([
      t.transaction_id,
      t.transaction_event_code,
      currency,
      t.transaction_initiation_date,
    ]);
    const fingerprint = JSON.stringify([
      identity,
      t.transaction_status,
      t.transaction_amount.value,
      t.fee_amount?.currency_code ?? null,
      t.fee_amount?.value ?? null,
    ]);
    if (exact.has(fingerprint)) {
      duplicateCount++;
      continue;
    }
    exact.add(fingerprint);
    if (identities.has(identity) && identities.get(identity) !== fingerprint) {
      warnings.add("CONFLICTING_REPORT_RECORDS_REVIEW_REQUIRED");
    }
    identities.set(identity, fingerprint);
    const gross = currency === "BRL"
      ? toCents(t.transaction_amount.value)
      : null;
    const feeCurrencyMatches = !t.fee_amount ||
      t.fee_amount.currency_code === currency;
    const fee = currency === "BRL" && feeCurrencyMatches
      ? toCents(t.fee_amount?.value ?? "0")
      : null;
    if (!feeCurrencyMatches) {
      warnings.add("FEE_CURRENCY_MISMATCH_REVIEW_REQUIRED");
    }
    if (currency !== "BRL") {
      nonBrlCount++;
      warnings.add("NON_BRL_RECORDS_REQUIRE_CONVERSION_RECONCILIATION");
    }
    if (t.transaction_event_code.startsWith("T02")) {
      warnings.add("CURRENCY_CONVERSION_RECORDS_REQUIRE_RECONCILIATION");
    }
    const normalized = {
      transaction_id: safeText(t.transaction_id),
      reference_id: safeText(t.paypal_reference_id),
      event_code: t.transaction_event_code,
      status: t.transaction_status,
      currency,
      gross: safeText(t.transaction_amount.value),
      fee: safeText(t.fee_amount?.value),
      fee_currency: safeText(t.fee_amount?.currency_code),
      net_brl: gross !== null && fee !== null ? money(gross + fee) : null,
      initiated_at: safeText(t.transaction_initiation_date),
      updated_at: safeText(t.transaction_updated_date),
    };
    rows.push(normalized);
    if (t.transaction_status === "S" && gross !== null && fee !== null) {
      confirmedBrlCount++;
      brlGross += gross;
      brlFees += fee;
      const group = groups.get(t.transaction_event_code) ??
        { count: 0, gross: 0, fees: 0 };
      group.count++;
      group.gross += gross;
      group.fees += fee;
      groups.set(t.transaction_event_code, group);
    }
  }
  const reconciled = reconcileSales(rows);
  if (reconciled.summary.unmatched_successful_records > 0) {
    warnings.add("UNCLASSIFIED_SUCCESSFUL_RECORDS_REQUIRE_RECONCILIATION");
  }
  if (!rows.some((r) => r.currency !== "BRL" && !reconciled.consumed.has(r))) {
    warnings.delete("NON_BRL_RECORDS_REQUIRE_CONVERSION_RECONCILIATION");
  }
  if (
    !rows.some((r) =>
      r.event_code.startsWith("T02") && !reconciled.consumed.has(r)
    )
  ) {
    warnings.delete("CURRENCY_CONVERSION_RECORDS_REQUIRE_RECONCILIATION");
  }
  return {
    record_count: rows.length,
    exact_duplicates_ignored: duplicateCount,
    non_brl_record_count: nonBrlCount,
    confirmed_brl_record_count: confirmedBrlCount,
    // Balance effects are not automatically labelled sales: conversions, transfers,
    // refunds and withdrawals need reconciliation before any ledger import.
    confirmed_brl_balance_effects: {
      currency: "BRL",
      gross: money(brlGross),
      fees: money(brlFees),
      net: money(brlGross + brlFees),
    },
    confirmed_brl_by_event: [...groups.entries()].sort(([a], [b]) =>
      a.localeCompare(b)
    ).map(([event_code, g]) => ({
      event_code,
      count: g.count,
      gross: money(g.gross),
      fees: money(g.fees),
      net: money(g.gross + g.fees),
    })),
    warnings: [...warnings],
    reconciled_sales: reconciled.summary,
    transactions: rows,
  };
}

export function equalSecret(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
