import assert from "node:assert/strict";
import {
  buildPreview,
  dayRange,
  equalSecret,
  money,
  PreviewError,
  toCents,
} from "./core.ts";

const now = new Date("2026-11-25T13:00:00Z");
export function transaction(overrides: Record<string, unknown> = {}) {
  return {
    transaction_info: {
      transaction_id: "UNIT-TRANSACTION-1",
      transaction_event_code: "T0006",
      transaction_status: "S",
      transaction_initiation_date: "2026-11-24T10:00:00-03:00",
      transaction_updated_date: "2026-11-24T10:00:00-03:00",
      transaction_amount: { currency_code: "BRL", value: "100.00" },
      fee_amount: { currency_code: "BRL", value: "-5.00" },
      ...overrides,
    },
  };
}

Deno.test("D-1 follows PayPal Pacific time, not Fortaleza or the server UTC calendar", () => {
  assert.equal(dayRange(undefined, now).date, "2026-11-24");
  assert.equal(
    dayRange(undefined, new Date("2026-11-25T07:59:59Z")).date,
    "2026-11-23",
  );
  assert.equal(
    dayRange(undefined, new Date("2026-11-25T08:00:00Z")).date,
    "2026-11-24",
  );
  assert.equal(
    dayRange(undefined, new Date("2026-01-01T12:00:00Z")).date,
    "2025-12-31",
  );
});
Deno.test("D-1 boundaries include the whole local day, with an explicit opening cutoff", () => {
  const r = dayRange("2026-11-24", now);
  assert.equal(r.timezone, "America/Los_Angeles");
  assert.equal(r.start, "2026-11-24T08:00:00.000Z");
  assert.equal(r.end, "2026-11-25T07:59:59.999Z");
  assert.equal(r.opening_as_of, "2026-11-24T07:59:59.999Z");
});
Deno.test("summer reports use PDT without drifting the PayPal day", () => {
  const r = dayRange("2026-07-01", new Date("2026-07-02T13:00:00Z"));
  assert.equal(r.start, "2026-07-01T07:00:00.000Z");
  assert.equal(r.end_exclusive, "2026-07-02T07:00:00.000Z");
});
Deno.test("both daylight-saving transitions use civil midnights, not fixed 24-hour windows", () => {
  const spring = dayRange("2026-03-08", new Date("2026-03-09T13:00:00Z"));
  assert.equal(spring.start, "2026-03-08T08:00:00.000Z");
  assert.equal(spring.end_exclusive, "2026-03-09T07:00:00.000Z");
  const fall = dayRange("2026-11-01", now);
  assert.equal(fall.start, "2026-11-01T07:00:00.000Z");
  assert.equal(fall.end_exclusive, "2026-11-02T08:00:00.000Z");
});
Deno.test("invalid, open and out-of-range dates are rejected", () => {
  for (
    const day of [
      "2026-02-30",
      "24/11/2026",
      "2026-11-25",
      "2026-12-01",
      "2026-01-01",
      null,
    ]
  ) {
    assert.throws(() => dayRange(day, now), PreviewError);
  }
});
Deno.test("money stays exact in integer cents; no rounding or guessed conversion", () => {
  assert.equal(toCents("2167.08"), 216708);
  assert.equal(toCents("-0.90"), -90);
  assert.equal(toCents("12.3"), 1230);
  assert.equal(money(toCents("0.10") + toCents("0.20")), "0.30");
  for (
    const invalid of ["NaN", "1,99", "1.999", "1e4", "9007199254740991", 4]
  ) {
    assert.throws(() => toCents(invalid), PreviewError);
  }
});
Deno.test("exact repeated reporting rows are ignored without removing distinct ID contexts", () => {
  const t = transaction();
  const result = buildPreview([
    t,
    t,
    transaction({ transaction_event_code: "T0200" }),
  ]);
  assert.equal(result.record_count, 2);
  assert.equal(result.exact_duplicates_ignored, 1);
  assert.equal(result.confirmed_brl_balance_effects.net, "190.00");
  assert(
    result.warnings.includes(
      "CURRENCY_CONVERSION_RECORDS_REQUIRE_RECONCILIATION",
    ),
  );
});
Deno.test("pending records, currency conversions and foreign currencies remain distinct", () => {
  const result = buildPreview([
    transaction(),
    transaction({
      transaction_id: "refund",
      transaction_event_code: "T1107",
      transaction_amount: { currency_code: "BRL", value: "-20.00" },
      fee_amount: { currency_code: "BRL", value: "1.00" },
    }),
    transaction({ transaction_id: "pending", transaction_status: "P" }),
    transaction({
      transaction_id: "usd",
      transaction_amount: { currency_code: "USD", value: "20.00" },
      fee_amount: { currency_code: "USD", value: "-1.00" },
    }),
    transaction({
      transaction_id: "converted",
      transaction_event_code: "T0200",
      transaction_amount: { currency_code: "BRL", value: "95.00" },
      fee_amount: undefined,
    }),
  ]);
  assert.equal(result.confirmed_brl_balance_effects.net, "171.00");
  assert.equal(result.confirmed_brl_record_count, 3);
  assert.equal(result.non_brl_record_count, 1);
  assert.equal(
    result.transactions.find((t) => t.currency === "USD")?.net_brl,
    null,
  );
});
Deno.test("fees in another currency are not silently converted or summed", () => {
  const result = buildPreview([
    transaction({ fee_amount: { currency_code: "USD", value: "-5.00" } }),
  ]);
  assert.equal(result.transactions[0].net_brl, null);
  assert.equal(result.confirmed_brl_balance_effects.net, "0.00");
  assert(result.warnings.includes("FEE_CURRENCY_MISMATCH_REVIEW_REQUIRED"));
});
Deno.test("changing amounts under the same reporting identity requires review", () => {
  const result = buildPreview([
    transaction(),
    transaction({
      transaction_amount: { currency_code: "BRL", value: "99.00" },
    }),
  ]);
  assert(
    result.warnings.includes("CONFLICTING_REPORT_RECORDS_REVIEW_REQUIRED"),
  );
});
Deno.test("payer identity and transaction notes are excluded from normalized output", () => {
  const source = {
    ...transaction({ transaction_note: "private note" }),
    payer_info: { email: "private@example.test" },
  };
  const result = buildPreview([source]);
  assert(!JSON.stringify(result).includes("private"));
});
Deno.test("secret comparison requires the complete value", () => {
  assert(equalSecret("fake-token", "fake-token"));
  assert(!equalSecret("fake-token", "fake-toke"));
  assert(!equalSecret("fake-token", "other-toke"));
});

function availabilityRecord(
  code: string,
  amount: string,
  extra: Record<string, unknown> = {},
) {
  return transaction({
    transaction_id: `UNIT-${code}-${amount}`,
    paypal_reference_id: "UNIT-ORIGINAL-SALE",
    transaction_event_code: code,
    transaction_amount: { currency_code: "BRL", value: amount },
    fee_amount: undefined,
    ...extra,
  });
}
Deno.test("a partial hold never reduces the original net sale or creates an expense", () => {
  const result = buildPreview([
    transaction(),
    availabilityRecord("T2101", "-25.00"),
  ]);
  assert.equal(result.reconciled_sales.count, 1);
  assert.equal(result.reconciled_sales.total_net_brl, "95.00");
  assert.equal(result.confirmed_brl_balance_effects.net, "70.00");
  assert.equal(result.availability_movements.held_brl, "25.00");
  assert.equal(
    result.availability_movements.financial_posting,
    "NONE_AVAILABILITY_ONLY",
  );
  assert.equal(result.reconciled_sales.unmatched_successful_records, 0);
  assert.deepEqual(result.warnings, []);
});
Deno.test("a full hold still counts the full net sale once", () => {
  const result = buildPreview([
    transaction(),
    availabilityRecord("T2101", "-95.00"),
  ]);
  assert.equal(result.reconciled_sales.total_net_brl, "95.00");
  assert.equal(result.confirmed_brl_balance_effects.net, "0.00");
  assert.deepEqual(result.warnings, []);
});
Deno.test("a later-day release does not create a second sale", () => {
  const result = buildPreview([availabilityRecord("T2102", "95.00")]);
  assert.equal(result.reconciled_sales.count, 0);
  assert.equal(result.reconciled_sales.total_net_brl, "0.00");
  assert.equal(result.availability_movements.released_brl, "95.00");
  assert.deepEqual(result.warnings, []);
});
for (
  const [hold, release] of [["T2101", "T2102"], ["T2103", "T2104"], [
    "T2105",
    "T2106",
  ], ["T2107", "T2108"]]
) {
  Deno.test(`${hold}/${release} is availability-only, not additional revenue`, () => {
    const r = buildPreview([
      transaction(),
      availabilityRecord(hold, "-10.00"),
      availabilityRecord(release, "10.00"),
    ]);
    assert.equal(r.reconciled_sales.total_net_brl, "95.00");
    assert.equal(r.availability_movements.record_count, 2);
    assert.deepEqual(r.warnings, []);
  });
}
Deno.test("malformed holds, fees, foreign currencies and unknown events remain blocked", () => {
  for (
    const record of [
      availabilityRecord("T2101", "25.00"),
      availabilityRecord("T2102", "-25.00"),
      availabilityRecord("T2101", "-25.00", {
        fee_amount: { currency_code: "BRL", value: "-1.00" },
      }),
      availabilityRecord("T2101", "-25.00", {
        transaction_amount: { currency_code: "EUR", value: "-25.00" },
      }),
      availabilityRecord("T9900", "-25.00"),
    ]
  ) {
    const r = buildPreview([record]);
    assert.equal(r.reconciled_sales.unmatched_successful_records, 1);
    assert(
      r.warnings.includes(
        "UNCLASSIFIED_SUCCESSFUL_RECORDS_REQUIRE_RECONCILIATION",
      ),
    );
  }
});
Deno.test("repeated hold rows are deduplicated but never added to sales", () => {
  const h = availabilityRecord("T2101", "-25.00");
  const r = buildPreview([transaction(), h, h]);
  assert.equal(r.availability_movements.record_count, 1);
  assert.equal(r.availability_movements.held_brl, "25.00");
  assert.equal(r.exact_duplicates_ignored, 1);
  assert.equal(r.reconciled_sales.count, 1);
});

function convertedTriplet(
  id: string,
  brl = "85.11",
  gross = "15.00",
  fee = "-1.31",
) {
  const paymentId = `PAYMENT-${id}`;
  return [
    transaction({
      transaction_id: paymentId,
      transaction_amount: { currency_code: "EUR", value: gross },
      fee_amount: { currency_code: "EUR", value: fee },
    }),
    transaction({
      transaction_id: `FX-DEBIT-${id}`,
      paypal_reference_id: paymentId,
      transaction_event_code: "T0200",
      transaction_amount: {
        currency_code: "EUR",
        value: money(-(toCents(gross) + toCents(fee))),
      },
      fee_amount: undefined,
    }),
    transaction({
      transaction_id: `FX-CREDIT-${id}`,
      paypal_reference_id: paymentId,
      transaction_event_code: "T0200",
      transaction_amount: { currency_code: "BRL", value: brl },
      fee_amount: undefined,
    }),
  ];
}
Deno.test("three linked provider records become one sale using the actual BRL credit", () => {
  const p = buildPreview(convertedTriplet("1"));
  assert.equal(p.reconciled_sales.count, 1);
  assert.equal(p.reconciled_sales.total_net_brl, "85.11");
  assert.equal(p.reconciled_sales.matched_report_records, 3);
  assert.equal(p.reconciled_sales.unmatched_successful_records, 0);
  assert.equal(p.reconciled_sales.sales[0].source_net, "13.69");
  assert.equal(p.reconciled_sales.sales[0].fees_already_deducted, true);
  assert.deepEqual(p.warnings, []);
});
Deno.test("six EUR sales reproduce the observed 18-row BRL conversion pattern without tripling", () => {
  const rows = [1, 2, 3, 4].flatMap((n) => convertedTriplet(String(n)));
  rows.push(
    ...convertedTriplet("5", "231.91", "41.00", "-2.97"),
    ...convertedTriplet("6", "231.91", "41.00", "-2.97"),
  );
  const p = buildPreview(rows);
  assert.equal(p.record_count, 18);
  assert.equal(p.reconciled_sales.count, 6);
  assert.equal(p.reconciled_sales.total_net_brl, "804.26");
  assert.equal(p.reconciled_sales.matched_report_records, 18);
  assert.equal(p.reconciled_sales.unmatched_successful_records, 0);
});
Deno.test("repeated source rows still produce only one reconciled sale", () => {
  const rows = convertedTriplet("1");
  const p = buildPreview([...rows, ...rows]);
  assert.equal(p.reconciled_sales.count, 1);
  assert.equal(p.reconciled_sales.total_net_brl, "85.11");
  assert.equal(p.exact_duplicates_ignored, 3);
});
Deno.test("a conversion that does not consume the original net is left for review", () => {
  const rows = convertedTriplet("1");
  rows[1].transaction_info.transaction_amount = {
    currency_code: "EUR",
    value: "-13.68",
  };
  const p = buildPreview(rows);
  assert.equal(p.reconciled_sales.count, 0);
  assert.equal(p.reconciled_sales.unmatched_successful_records, 3);
});
Deno.test("an unrelated BRL conversion credit is not treated as a sale", () => {
  const rows = convertedTriplet("1");
  rows[2] = transaction({
    ...rows[2].transaction_info,
    paypal_reference_id: "OTHER-PAYMENT",
  });
  assert.equal(buildPreview(rows).reconciled_sales.count, 0);
});
Deno.test("ambiguous conversion matches are never guessed", () => {
  const rows = convertedTriplet("1");
  rows.push(transaction({
    transaction_id: "ANOTHER-CREDIT",
    paypal_reference_id: "PAYMENT-1",
    transaction_event_code: "T0200",
    transaction_amount: { currency_code: "BRL", value: "85.11" },
    fee_amount: undefined,
  }));
  assert.equal(buildPreview(rows).reconciled_sales.count, 0);
});
Deno.test("direct BRL payments are net of their fee, while refunds remain distinct", () => {
  const p = buildPreview([
    transaction(),
    transaction({
      transaction_id: "REFUND",
      transaction_event_code: "T1107",
      transaction_amount: { currency_code: "BRL", value: "-20.00" },
      fee_amount: undefined,
    }),
  ]);
  assert.equal(p.reconciled_sales.total_net_brl, "95.00");
  assert.equal(p.reconciled_sales.count, 1);
  assert.equal(p.reconciled_sales.unmatched_successful_records, 1);
  assert.equal(p.confirmed_brl_balance_effects.net, "75.00");
});
