"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import MacWindow from "@/components/MacWindow";
import MockApiCall, { ApiResult } from "@/components/MockApiCall";
import { apideckHeaders, callApideck } from "@/lib/apiClient";
import { BillDTO } from "@/lib/types";
import { FLAG, money } from "@/lib/format";
import {
  HOME_CURRENCY,
  LEDGER,
  LedgerAccount,
  Quote,
  findFxAccount,
  journalLineItems,
  quoteFromBill,
} from "@/lib/mockData";

type Recorded = { paymentId?: string; journalEntryId?: string; done: boolean };

function paymentBody(q: Quote, prospect: string) {
  return {
    currency: q.payable.currency,
    currency_rate: q.settledRate,
    total_amount: q.payable.total_amount,
    transaction_date: new Date().toISOString(),
    reference: `${prospect} FX settlement · ${q.payable.number}`,
    payment_method: "fx_platform",
    type: "accounts_payable",
    supplier: { id: q.payable.supplier.id },
    account: {
      id: LEDGER.clearing.id,
      name: LEDGER.clearing.name,
      code: LEDGER.clearing.code,
    },
    allocations: [
      { type: "bill", id: q.payable.id, amount: q.payable.total_amount },
    ],
  };
}

function journalBody(q: Quote, prospect: string, fxAccount: LedgerAccount) {
  return {
    title: `FX settlement — ${q.payable.supplier.name} (${q.payable.number})`,
    currency: HOME_CURRENCY,
    currency_rate: 1,
    memo: `${prospect}: realized FX ${
      q.fxDelta >= 0 ? "gain" : "loss"
    } + settlement fee on ${q.payable.number}`,
    line_items: journalLineItems(q, fxAccount),
  };
}

export default function WriteBack({
  consumerId,
  serviceId,
  bills,
  prospect,
  onRecorded,
  onContinue,
}: {
  consumerId: string;
  serviceId: string;
  bills: BillDTO[];
  prospect: string;
  onRecorded: (map: Record<string, Recorded>) => void;
  onContinue: () => void;
}) {
  const quotes = useMemo(() => bills.map((b) => quoteFromBill(b)), [bills]);
  const [focus, setFocus] = useState(0);
  const [recorded, setRecorded] = useState<Record<string, Recorded>>({});
  const [payResults, setPayResults] = useState<Record<string, ApiResult>>({});
  const [jeResults, setJeResults] = useState<Record<string, ApiResult>>({});
  const [busy, setBusy] = useState(false);

  // Guide step 1: resolve the realized-FX account from the chart of accounts
  // instead of hard-coding it. Runs once when the step opens.
  const [fxAccount, setFxAccount] = useState<LedgerAccount>(LEDGER.fxGainLoss);
  const [ledgerResult, setLedgerResult] = useState<ApiResult>({ state: "idle" });
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const resolveFxAccount = async () => {
    setLedgerResult({ state: "running" });
    const r = await callApideck(
      "GET",
      "accounting/ledger-accounts?filter[classification]=expense",
      consumerId,
      serviceId
    );
    setLedgerResult(
      r.ok
        ? { state: "success", status: r.status, data: r.data, ms: r.ms }
        : { state: "error", status: r.status, data: r.data, ms: r.ms }
    );
    if (r.ok) {
      const accounts =
        ((r.data as Record<string, unknown>)?.data as Array<
          Partial<LedgerAccount> & { name?: string; code?: string }
        >) ?? [];
      setFxAccount(findFxAccount(accounts));
    }
  };

  useEffect(() => {
    void resolveFxAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRec = (id: string, patch: Partial<Recorded>) => {
    setRecorded((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      onRecorded(next);
      return next;
    });
  };

  const settle = async (q: Quote) => {
    const id = q.payable.id;
    // 1 — record the payment
    setPayResults((p) => ({ ...p, [id]: { state: "running" } }));
    const pay = await callApideck(
      "POST",
      "accounting/payments",
      consumerId,
      serviceId,
      paymentBody(q, prospect)
    );
    setPayResults((p) => ({
      ...p,
      [id]: pay.ok
        ? { state: "success", status: pay.status, data: pay.data, ms: pay.ms }
        : { state: "error", status: pay.status, data: pay.data, ms: pay.ms },
    }));
    const paymentId =
      ((pay.data as any)?.data?.id as string | undefined) ?? undefined;
    setRec(id, { paymentId });

    // 2 — book the FX gain/loss + fee
    setJeResults((p) => ({ ...p, [id]: { state: "running" } }));
    const je = await callApideck(
      "POST",
      "accounting/journal-entries",
      consumerId,
      serviceId,
      journalBody(q, prospect, fxAccount)
    );
    setJeResults((p) => ({
      ...p,
      [id]: je.ok
        ? { state: "success", status: je.status, data: je.data, ms: je.ms }
        : { state: "error", status: je.status, data: je.data, ms: je.ms },
    }));
    const journalEntryId =
      ((je.data as any)?.data?.id as string | undefined) ?? undefined;
    setRec(id, { journalEntryId, done: pay.ok && je.ok });
  };

  const settleAll = async () => {
    setBusy(true);
    for (let i = 0; i < quotes.length; i++) {
      setFocus(i);
      // eslint-disable-next-line no-await-in-loop
      await settle(quotes[i]);
    }
    setBusy(false);
  };

  const doneCount = Object.values(recorded).filter((r) => r?.done).length;
  const allDone = doneCount === quotes.length && quotes.length > 0;
  const fq = quotes[focus];

  return (
    <div className="grid lg:grid-cols-5 gap-6 items-start">
      <div className="lg:col-span-2 space-y-4">
        <MacWindow title="Write back to the ledger">
          <div className="p-5">
            <h2 className="text-base font-semibold text-ink-900 dark:text-zinc-100">
              Two writes per payable
            </h2>
            <p className="text-sm text-ink-900/60 dark:text-zinc-400 mt-1 mb-4">
              A <b>payment</b> allocated to the bill at the rate you actually
              settled, then a <b>journal entry</b> for the realized FX gain/loss
              and your fee. The customer&apos;s books reconcile automatically.
            </p>

            <div className="space-y-1.5">
              {quotes.map((q, i) => {
                const rec = recorded[q.payable.id];
                const running =
                  payResults[q.payable.id]?.state === "running" ||
                  jeResults[q.payable.id]?.state === "running";
                return (
                  <button
                    key={q.payable.id}
                    type="button"
                    onClick={() => setFocus(i)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 ring-1 transition flex items-center gap-3 ${
                      i === focus
                        ? "bg-accent-500/10 ring-accent-500/40"
                        : "bg-ink-800/40 ring-white/10 hover:ring-black/20 dark:hover:ring-white/20"
                    }`}
                  >
                    <span className="shrink-0">
                      {rec?.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : running ? (
                        <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
                      ) : (
                        <span className="w-4 h-4 inline-block rounded-full ring-1 ring-black/20 dark:ring-white/20" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate text-ink-900 dark:text-zinc-200">
                        {q.payable.supplier.name}
                      </span>
                      <span className="block text-[11px] text-ink-900/50 dark:text-zinc-500">
                        {FLAG[q.payable.currency] ?? ""}{" "}
                        {money(q.payable.total_amount, q.payable.currency)}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-ink-900/45 dark:text-zinc-500 shrink-0">
                      {q.payable.number}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-black/5 dark:border-white/5 px-5 py-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={settleAll}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-medium disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
              {allDone ? "Re-run all" : "Settle & record all"}
            </button>
            <span className="text-[11px] text-ink-900/50 dark:text-zinc-500">
              {doneCount}/{quotes.length} recorded
            </span>
          </div>
        </MacWindow>

        {allDone && (
          <button
            type="button"
            onClick={onContinue}
            className="w-full inline-flex items-center justify-center gap-1.5 text-sm px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium animate-fade-up"
          >
            View reconciliation <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="lg:col-span-3 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-900/50 dark:text-zinc-500 mb-2 flex items-center gap-2">
            Step 1 · resolve the realized-FX account
            <span className="text-accent-500 font-mono normal-case tracking-normal">
              {fxAccount.nominal_code} {fxAccount.name}
            </span>
          </p>
          <MockApiCall
            method="GET"
            endpoint="GET /accounting/ledger-accounts?filter[classification]=expense"
            headers={apideckHeaders(consumerId, serviceId)}
            result={ledgerResult}
            onRun={resolveFxAccount}
            expanded={ledgerOpen}
            setExpanded={setLedgerOpen}
          />
        </div>
        {fq && (
          <>
            <p className="text-[11px] uppercase tracking-wider text-ink-900/50 dark:text-zinc-500 pt-1">
              Then, per payable · {fq.payable.supplier.name} · {fq.payable.number}
            </p>
            <MockApiCall
              method="POST"
              endpoint="POST /accounting/payments"
              headers={apideckHeaders(consumerId, serviceId)}
              body={paymentBody(fq, prospect)}
              result={payResults[fq.payable.id] ?? { state: "idle" }}
              onRun={() => settle(fq)}
            />
            <MockApiCall
              method="POST"
              endpoint="POST /accounting/journal-entries"
              headers={apideckHeaders(consumerId, serviceId)}
              body={journalBody(fq, prospect, fxAccount)}
              result={jeResults[fq.payable.id] ?? { state: "idle" }}
              onRun={() => settle(fq)}
            />
          </>
        )}
      </div>
    </div>
  );
}
