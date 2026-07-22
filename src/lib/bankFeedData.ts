// ─────────────────────────────────────────────────────────────────────────
// Bank-feed scenario data (the multi-currency wallet use case).
//
// An FX provider gives its customers multi-currency accounts. Those balances
// behave like bank accounts, so the customer wants them to *appear* as bank
// accounts in their ledger and reconcile automatically. The provider pushes
// each wallet into the customer's accounting system as a bank feed:
//   POST /accounting/bank-feed-accounts   — register the wallet as a bank account
//   POST /accounting/bank-feed-statements — stream its transactions for matching
//
// Convention (mirrors apideck-bank-feeds-sample): amount > 0 = money in = debit
// on the feed; amount < 0 = money out = credit.
// ─────────────────────────────────────────────────────────────────────────

export const BANKFEED_CUSTOMER = {
  id: "lumen-interiors",
  name: "Lumen Interiors GmbH",
  base_currency: "EUR",
};

export type WalletTxn = {
  id: string;
  postedDate: string; // UTC
  description: string;
  amount: number; // + = money in, − = money out
  counterparty?: string;
  reference?: string;
  transactionType: "deposit" | "transfer" | "payment" | "fee";
};

export type Wallet = {
  id: string;
  name: string;
  number: string;
  currency: string;
  country: string;
  startBalance: number;
  startDate: string;
  endDate: string;
  transactions: WalletTxn[];
};

// Three multi-currency wallets with a month of realistic activity —
// collections, conversions between wallets, a supplier payout, and fees.
export const FX_WALLETS: Wallet[] = [
  {
    id: "wallet-eur-4021",
    name: "EUR account ••4021",
    number: "4021",
    currency: "EUR",
    country: "GB",
    startBalance: 12300.0,
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-30T00:00:00.000Z",
    transactions: [
      {
        id: "fxtxn-eur-01",
        postedDate: "2026-06-04T00:00:00.000Z",
        description: "Incoming collection — Meridian Foods GmbH",
        amount: 18500.0,
        counterparty: "Meridian Foods GmbH",
        reference: "INV-2041",
        transactionType: "deposit",
      },
      {
        id: "fxtxn-eur-02",
        postedDate: "2026-06-12T00:00:00.000Z",
        description: "FX conversion EUR → USD",
        amount: -6200.0,
        counterparty: "FX desk",
        reference: "FX-88213",
        transactionType: "transfer",
      },
      {
        id: "fxtxn-eur-03",
        postedDate: "2026-06-12T00:00:00.000Z",
        description: "FX margin & transfer fee",
        amount: -45.0,
        counterparty: "FX provider",
        transactionType: "fee",
      },
    ],
  },
  {
    id: "wallet-usd-7788",
    name: "USD account ••7788",
    number: "7788",
    currency: "USD",
    country: "GB",
    startBalance: 3100.0,
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-30T00:00:00.000Z",
    transactions: [
      {
        id: "fxtxn-usd-01",
        postedDate: "2026-06-12T00:00:00.000Z",
        description: "FX conversion EUR → USD settled",
        amount: 6700.0,
        counterparty: "FX desk",
        reference: "FX-88213",
        transactionType: "transfer",
      },
      {
        id: "fxtxn-usd-02",
        postedDate: "2026-06-18T00:00:00.000Z",
        description: "Incoming collection — Northwind Trading LLC",
        amount: 12400.0,
        counterparty: "Northwind Trading LLC",
        reference: "INV-2044",
        transactionType: "deposit",
      },
      {
        id: "fxtxn-usd-03",
        postedDate: "2026-06-24T00:00:00.000Z",
        description: "Supplier payout — Pacific Components Inc.",
        amount: -14900.0,
        counterparty: "Pacific Components Inc.",
        reference: "PO-5521",
        transactionType: "payment",
      },
    ],
  },
  {
    id: "wallet-gbp-3390",
    name: "GBP account ••3390",
    number: "3390",
    currency: "GBP",
    country: "GB",
    startBalance: 4800.0,
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-30T00:00:00.000Z",
    transactions: [
      {
        id: "fxtxn-gbp-01",
        postedDate: "2026-06-09T00:00:00.000Z",
        description: "Incoming collection — Brixton Retail Ltd.",
        amount: 9250.0,
        counterparty: "Brixton Retail Ltd.",
        reference: "INV-2043",
        transactionType: "deposit",
      },
      {
        id: "fxtxn-gbp-02",
        postedDate: "2026-06-27T00:00:00.000Z",
        description: "Account fee",
        amount: -30.0,
        counterparty: "FX provider",
        transactionType: "fee",
      },
    ],
  },
];

export function walletEndBalance(w: Wallet): number {
  const net = w.transactions.reduce((s, t) => s + t.amount, 0);
  return Math.round((w.startBalance + net) * 100) / 100;
}

// POST /accounting/bank-feed-accounts body — register the wallet as a bank account.
export function feedAccountBody(w: Wallet) {
  return {
    id: w.id,
    bank_account_type: "bank",
    source_account_id: w.id,
    target_account_name: w.name,
    target_account_number: w.number,
    currency: w.currency,
    country: w.country,
    feed_status: "pending",
  };
}

// POST /accounting/bank-feed-statements body — stream the wallet's transactions.
export function statementBody(w: Wallet, bankFeedAccountId: string) {
  const end = walletEndBalance(w);
  return {
    id: `stmt-${w.id}-2026-06`,
    bank_feed_account_id: bankFeedAccountId,
    status: "pending",
    start_date: w.startDate,
    end_date: w.endDate,
    start_balance: w.startBalance,
    start_balance_credit_or_debit: w.startBalance >= 0 ? "debit" : "credit",
    end_balance: end,
    end_balance_credit_or_debit: end >= 0 ? "debit" : "credit",
    transactions: w.transactions.map((t) => ({
      source_transaction_id: t.id, // unique across the whole connection
      posted_date: t.postedDate,
      description: t.description,
      amount: Math.abs(t.amount),
      credit_or_debit: t.amount >= 0 ? "debit" : "credit", // money-in = debit
      counterparty: t.counterparty,
      reference: t.reference,
      transaction_type: t.transactionType,
    })),
  };
}
