// ─────────────────────────────────────────────────────────────────────────
// Bundled demo data. Mirrors the Apideck unified Accounting API shapes
// (https://developers.apideck.com/apis/accounting) so the walkthrough runs
// with zero credentials, then swaps to live Apideck data unchanged once
// APIDECK_API_KEY + APIDECK_APP_ID are set.
//
// Scenario: "Lumen Interiors GmbH" is a EUR-based furniture maker and a
// customer of the FX platform. It keeps its books in an
// ERP (NetSuite in the demo) and has four APPROVED payables to overseas
// suppliers, each in a different currency. The FX platform reads those
// payables, settles them on its own rails, and writes the payment + the
// realized FX gain/loss back into the ERP.
// ─────────────────────────────────────────────────────────────────────────

export const HOME_CURRENCY = "EUR";

export const COMPANY = {
  id: "lumen-interiors",
  name: "Lumen Interiors GmbH",
  country: "DE",
  base_currency: HOME_CURRENCY,
};

// The FX platform charges a margin over mid-market plus a small fixed fee.
export const FX_MARGIN_BPS = 30; // 0.30% over interbank mid
export type LedgerAccount = {
  id: string;
  name: string;
  nominal_code: string;
  code: string;
};

export const LEDGER: Record<string, LedgerAccount> = {
  ap: { id: "acct_2100", name: "Accounts Payable", nominal_code: "2100", code: "AP" },
  clearing: {
    id: "acct_1050",
    name: "Settlement Clearing",
    nominal_code: "1050",
    code: "BANK",
  },
  fxGainLoss: {
    id: "acct_7200",
    name: "Realized FX Gain / (Loss)",
    nominal_code: "7200",
    code: "FX",
  },
  fees: {
    id: "acct_7250",
    name: "Bank & FX Fees",
    nominal_code: "7250",
    code: "FEE",
  },
};

// Chart of accounts returned by GET /accounting/ledger-accounts. Following the
// Apideck FX guide, the realized FX account is resolved from here at runtime
// rather than hard-coded — the guide's step 1.
export const CHART_OF_ACCOUNTS = [
  { ...LEDGER.ap, classification: "liability", type: "accounts_payable" },
  { ...LEDGER.clearing, classification: "asset", type: "bank" },
  { ...LEDGER.fxGainLoss, classification: "expense", type: "other_expense" },
  { ...LEDGER.fees, classification: "expense", type: "expense" },
];

/** Pick the realized FX gain/loss account out of a chart of accounts. Prefer an
 *  exact code match, then fall back to a gain/loss-specific name pattern (so a
 *  "Settlement Clearing" that merely mentions FX doesn't win). */
export function findFxAccount(
  accounts: Array<Partial<LedgerAccount> & { name?: string; code?: string }>
): LedgerAccount {
  const byCode = accounts.find((a) => a.code === LEDGER.fxGainLoss.code);
  if (byCode) return byCode as LedgerAccount;
  const byName = accounts.find((a) =>
    /realized fx|fx gain|gain\s*\/?\s*\(?loss|foreign exchange/i.test(a.name ?? "")
  );
  return (byName as LedgerAccount) ?? LEDGER.fxGainLoss;
}

export type Payable = {
  id: string;
  number: string;
  supplier: { id: string; name: string; country: string };
  currency: string;
  total_amount: number;
  /** Rate booked on the bill at bill_date: home-currency value of 1 foreign unit. */
  booked_rate: number;
  /** Live interbank mid at settlement time: home value of 1 foreign unit. */
  mid_rate: number;
  /** Fixed fee (in home currency) the FX platform charges on this corridor. */
  fee_home: number;
  bill_date: string;
  due_date: string;
  status: "authorised";
};

// Amounts and rates picked to yield a realistic mix of FX gains and losses.
export const PAYABLES: Payable[] = [
  {
    id: "bill_apex_9921",
    number: "BILL-9921",
    supplier: { id: "sup_apex", name: "Apex Metals Inc.", country: "US" },
    currency: "USD",
    total_amount: 24500.0,
    booked_rate: 0.915,
    mid_rate: 0.908,
    fee_home: 6.0,
    bill_date: "2026-06-22",
    due_date: "2026-07-22",
    status: "authorised",
  },
  {
    id: "bill_bright_4471",
    number: "BILL-4471",
    supplier: { id: "sup_bright", name: "Bright Textiles Ltd.", country: "GB" },
    currency: "GBP",
    total_amount: 12400.0,
    booked_rate: 1.172,
    mid_rate: 1.1795,
    fee_home: 6.0,
    bill_date: "2026-06-28",
    due_date: "2026-07-28",
    status: "authorised",
  },
  {
    id: "bill_nakamura_3380",
    number: "BILL-3380",
    supplier: { id: "sup_nakamura", name: "Nakamura Components K.K.", country: "JP" },
    currency: "JPY",
    total_amount: 1850000,
    booked_rate: 0.00605,
    mid_rate: 0.00598,
    fee_home: 6.0,
    bill_date: "2026-06-15",
    due_date: "2026-07-15",
    status: "authorised",
  },
  {
    id: "bill_globalfreight_1024",
    number: "BILL-1024",
    supplier: { id: "sup_freight", name: "Global Freight Pte Ltd.", country: "SG" },
    currency: "SGD",
    total_amount: 9800.0,
    booked_rate: 0.689,
    mid_rate: 0.6905,
    fee_home: 6.0,
    bill_date: "2026-07-01",
    due_date: "2026-07-31",
    status: "authorised",
  },
];

export type Quote = {
  payable: Payable;
  marginBps: number;
  /** Rate the FX platform executes at: mid + margin (home per foreign). */
  settledRate: number;
  feeHome: number;
  /** Home-currency cost of the FX (excl. fee) at the settled rate. */
  homeCostFx: number;
  /** Home-currency cost including the platform fee. */
  homeCostTotal: number;
  /** Home value the bill was booked at (total_amount × booked_rate). */
  homeBooked: number;
  /** Realized FX gain (+) or loss (−) in home currency vs. the booked rate. */
  fxDelta: number;
};

export function quoteFor(payable: Payable, marginBps = FX_MARGIN_BPS): Quote {
  const settledRate = round(payable.mid_rate * (1 + marginBps / 10000), 6);
  const homeCostFx = round(payable.total_amount * settledRate, 2);
  const homeBooked = round(payable.total_amount * payable.booked_rate, 2);
  // Positive = it cost less to settle than it was booked at = FX gain.
  const fxDelta = round(homeBooked - homeCostFx, 2);
  return {
    payable,
    marginBps,
    settledRate,
    feeHome: payable.fee_home,
    homeCostFx,
    homeCostTotal: round(homeCostFx + payable.fee_home, 2),
    homeBooked,
    fxDelta,
  };
}

// Balanced journal entry booking the realized FX gain/loss + the platform fee
// against the settlement clearing account. Debits always equal credits. The FX
// account is passed in (resolved from GET /accounting/ledger-accounts) so the
// entry posts to the customer's real realized-FX account.
export function journalLineItems(q: Quote, fxAccount: LedgerAccount = LEDGER.fxGainLoss) {
  const lines: Array<{
    description: string;
    total_amount: number;
    type: "debit" | "credit";
    ledger_account: LedgerAccount;
  }> = [];

  // FX gain/loss. A loss (fxDelta < 0) is an expense → debit. A gain → credit.
  if (q.fxDelta !== 0) {
    lines.push({
      description:
        q.fxDelta < 0
          ? `Realized FX loss on ${q.payable.number}`
          : `Realized FX gain on ${q.payable.number}`,
      total_amount: Math.abs(q.fxDelta),
      type: q.fxDelta < 0 ? "debit" : "credit",
      ledger_account: fxAccount,
    });
  }

  // Platform fee — always an expense.
  lines.push({
    description: `FX settlement fee — ${q.payable.supplier.name}`,
    total_amount: q.feeHome,
    type: "debit",
    ledger_account: LEDGER.fees,
  });

  // Balancing line against the clearing account so debits === credits.
  const debit = lines
    .filter((l) => l.type === "debit")
    .reduce((s, l) => s + l.total_amount, 0);
  const credit = lines
    .filter((l) => l.type === "credit")
    .reduce((s, l) => s + l.total_amount, 0);
  const diff = round(debit - credit, 2);
  if (diff !== 0) {
    lines.push({
      description: "FX settlement clearing",
      total_amount: Math.abs(diff),
      type: diff > 0 ? "credit" : "debit",
      ledger_account: LEDGER.clearing,
    });
  }
  return lines;
}

export function payableById(id: string): Payable | undefined {
  return PAYABLES.find((p) => p.id === id);
}

// Build a quote from a bill returned by GET /accounting/bills. When the bill is
// one of our known payables we use its corridor pricing (mid_rate + fee); for
// an unknown bill (e.g. live Apideck data) we fall back to booked-rate pricing
// with a zero FX delta so the walkthrough still renders.
export function quoteFromBill(bill: {
  id: string;
  currency: string;
  currency_rate?: number;
  total_amount: number;
  supplier?: { display_name?: string; company_name?: string };
  number?: string;
}): Quote {
  const known = payableById(bill.id);
  if (known) return quoteFor(known);
  const booked = bill.currency_rate ?? 1;
  const synthetic: Payable = {
    id: bill.id,
    number: bill.number ?? bill.id,
    supplier: {
      id: "sup_unknown",
      name: bill.supplier?.display_name ?? bill.supplier?.company_name ?? "Supplier",
      country: "",
    },
    currency: bill.currency,
    total_amount: bill.total_amount,
    booked_rate: booked,
    mid_rate: booked,
    fee_home: 6.0,
    bill_date: "",
    due_date: "",
    status: "authorised",
  };
  return quoteFor(synthetic);
}

function round(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
