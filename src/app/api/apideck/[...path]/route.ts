import { NextRequest, NextResponse } from "next/server";
import { CHART_OF_ACCOUNTS, PAYABLES } from "@/lib/mockData";
import { apideckProxy, hasApideckCreds } from "@/lib/apideckServer";

// Mock of the Apideck unified Accounting API — request/response shapes mirror
// https://developers.apideck.com/apis/accounting. Every route returns realistic
// data with a small artificial latency so the walkthrough feels like a real
// network call. When APIDECK_API_KEY + APIDECK_APP_ID are set (and the UI
// toggle is on "Live"), the identical calls proxy to unify.apideck.com instead.
//
// Endpoints implemented:
//   POST /vault/sessions                     — hosted connect session
//   GET  /vault/connections/{service_id}     — connection health
//   GET  /accounting/bills                   — approved payables to settle
//   POST /accounting/payments                — write the settled payment back
//   POST /accounting/journal-entries         — book realized FX gain/loss + fee

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

const delay = (min = 300, max = 750) =>
  new Promise<void>((r) =>
    setTimeout(r, Math.floor(min + Math.random() * (max - min)))
  );

function requireHeaders(req: NextRequest) {
  const missing: string[] = [];
  for (const h of ["x-apideck-app-id", "x-apideck-consumer-id"]) {
    if (!req.headers.get(h)) missing.push(h);
  }
  return missing;
}

function ok(
  body: Record<string, unknown>,
  status = 200,
  service = "netsuite"
) {
  return NextResponse.json(
    {
      status_code: status,
      status: status >= 200 && status < 300 ? "OK" : "Error",
      service,
      ...body,
    },
    { status }
  );
}

async function handle(method: string, route: string, req: NextRequest) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const service = req.headers.get("x-apideck-service-id") ?? "netsuite";
  await delay();

  // Vault — create hosted connect session
  if (method === "POST" && route === "vault/sessions") {
    return ok(
      {
        resource: "Sessions",
        operation: "vaultSessionsCreate",
        data: {
          session_uri: `https://vault.apideck.com/session/${uid("vs")}`,
          expires_in: 1800,
        },
      },
      201,
      service
    );
  }

  // Vault — connection health
  if (method === "GET" && route.startsWith("vault/connections/")) {
    const service_id = route.split("/")[2] || service;
    return ok(
      {
        resource: "Connection",
        operation: "vaultConnectionsOne",
        data: {
          id: `connection_${service_id}_${uid("c").slice(0, 8)}`,
          service_id,
          unified_api: "accounting",
          state: "callable",
          integration_state: "callable",
          updated_at: new Date().toISOString(),
        },
      },
      200,
      service
    );
  }

  // Accounting — chart of accounts (resolve the realized FX gain/loss account)
  if (method === "GET" && route === "accounting/ledger-accounts") {
    const classification = url.searchParams.get("filter[classification]");
    const accounts = classification
      ? CHART_OF_ACCOUNTS.filter((a) => a.classification === classification)
      : CHART_OF_ACCOUNTS;
    return ok(
      {
        resource: "LedgerAccounts",
        operation: "ledgerAccountsAll",
        data: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          nominal_code: a.nominal_code,
          code: a.code,
          classification: a.classification,
          type: a.type,
          status: "active",
        })),
        meta: { items_on_page: accounts.length },
      },
      200,
      service
    );
  }

  // Accounting — list approved payables (bills authorised for payment)
  if (method === "GET" && route === "accounting/bills") {
    return ok(
      {
        resource: "Bills",
        operation: "billsAll",
        data: PAYABLES.map((b) => ({
          id: b.id,
          number: b.number,
          supplier: {
            id: b.supplier.id,
            display_name: b.supplier.name,
            company_name: b.supplier.name,
            address: { country: b.supplier.country },
          },
          currency: b.currency,
          currency_rate: b.booked_rate,
          total_amount: b.total_amount,
          balance: b.total_amount,
          status: b.status,
          bill_date: b.bill_date,
          due_date: b.due_date,
          line_items: [
            {
              line_number: 1,
              description: `Goods & services — ${b.supplier.name}`,
              total_amount: b.total_amount,
              type: "expense_account",
            },
          ],
        })),
        meta: { items_on_page: PAYABLES.length },
      },
      200,
      service
    );
  }

  // Accounting — create the payment (the FX platform settled it, now record it)
  if (method === "POST" && route === "accounting/payments") {
    return ok(
      {
        resource: "Payments",
        operation: "paymentsAdd",
        data: {
          id: uid("pmt"),
          downstream_id: uid("ds"),
          currency: body.currency,
          currency_rate: body.currency_rate,
          total_amount: body.total_amount,
          reference: body.reference,
          payment_method: body.payment_method ?? "fx_platform",
          transaction_date: body.transaction_date ?? new Date().toISOString(),
          type: body.type ?? "accounts_payable",
          supplier: body.supplier,
          account: body.account,
          allocations: body.allocations ?? [],
          status: "authorised",
          reconciled: true,
        },
      },
      201,
      service
    );
  }

  // Accounting — book the realized FX gain/loss + fee as a journal entry
  if (method === "POST" && route === "accounting/journal-entries") {
    const lineItems = Array.isArray(body.line_items) ? body.line_items : [];
    return ok(
      {
        resource: "JournalEntries",
        operation: "journalEntriesAdd",
        data: {
          id: uid("je"),
          downstream_id: uid("ds"),
          title: body.title,
          currency: body.currency,
          currency_rate: body.currency_rate ?? 1,
          memo: body.memo,
          posted_at: new Date().toISOString(),
          line_items: lineItems.map(
            (l: Record<string, unknown>, i: number) => ({
              id: uid("jel"),
              line_number: i + 1,
              ...l,
            })
          ),
        },
      },
      201,
      service
    );
  }

  // Accounting — bank feed accounts (register a wallet as a bank account)
  if (method === "GET" && route === "accounting/bank-feed-accounts") {
    return ok(
      {
        resource: "BankFeedAccounts",
        operation: "bankFeedAccountsAll",
        data: [],
        meta: { items_on_page: 0 },
      },
      200,
      service
    );
  }
  if (method === "POST" && route === "accounting/bank-feed-accounts") {
    return ok(
      {
        resource: "BankFeedAccounts",
        operation: "bankFeedAccountsAdd",
        data: {
          id: body.id ?? uid("bfa"),
          bank_account_type: body.bank_account_type ?? "bank",
          source_account_id: body.source_account_id,
          target_account_name: body.target_account_name,
          target_account_number: body.target_account_number,
          currency: body.currency,
          country: body.country,
          feed_status: "active",
        },
      },
      201,
      service
    );
  }

  // Accounting — bank feed statements (stream the wallet's transactions)
  if (method === "POST" && route === "accounting/bank-feed-statements") {
    const txns = Array.isArray(body.transactions) ? body.transactions : [];
    return ok(
      {
        resource: "BankFeedStatements",
        operation: "bankFeedStatementsAdd",
        data: {
          id: body.id ?? uid("bfs"),
          bank_feed_account_id: body.bank_feed_account_id,
          status: "processed",
          start_date: body.start_date,
          end_date: body.end_date,
          start_balance: body.start_balance,
          end_balance: body.end_balance,
          transactions_count: txns.length,
        },
      },
      201,
      service
    );
  }

  return NextResponse.json(
    {
      status_code: 404,
      status: "Not Found",
      detail: `Unknown route: ${method} /${route}`,
      received_body: body,
    },
    { status: 404 }
  );
}

// When APIDECK_API_KEY + APIDECK_APP_ID are set we proxy to the real unified
// API. Otherwise we serve the bundled mock data via handle().
async function route(method: "GET" | "POST", req: NextRequest, path: string[]) {
  const missing = requireHeaders(req);
  if (missing.length)
    return NextResponse.json(
      { status_code: 401, status: "Unauthorized", missing_headers: missing },
      { status: 401 }
    );

  // Cookie-based runtime override — when the user picks "Mock" in the UI toggle
  // we set apideck-mode=mock, forcing the proxy to skip the live path even when
  // credentials are configured.
  const cookieMode = req.cookies.get("apideck-mode")?.value;
  const forceMock = cookieMode === "mock";

  if (hasApideckCreds() && !forceMock) {
    const url = new URL(req.url);
    const consumerId =
      req.headers.get("x-apideck-consumer-id") || "demo-consumer";
    const serviceId = req.headers.get("x-apideck-service-id") || undefined;
    const fullPath = `${path.join("/")}${url.search}`;
    let body: unknown = undefined;
    if (method === "POST") {
      body = await req.json().catch(() => ({}));
    }
    try {
      const { status, data } = await apideckProxy({
        method,
        path: fullPath,
        consumerId,
        serviceId,
        body,
      });
      return NextResponse.json(data, {
        status,
        headers: { "x-apideck-source": "live" },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { status_code: 502, status: "Bad Gateway", detail: message },
        { status: 502, headers: { "x-apideck-source": "live-error" } }
      );
    }
  }

  const res = await handle(method, path.join("/"), req);
  res.headers.set("x-apideck-source", "mock");
  return res;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return route("GET", req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return route("POST", req, path);
}
