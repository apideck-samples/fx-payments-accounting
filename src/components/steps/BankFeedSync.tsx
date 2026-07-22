"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import MacWindow from "@/components/MacWindow";
import MockApiCall, { ApiResult } from "@/components/MockApiCall";
import { apideckHeaders, callApideck } from "@/lib/apiClient";
import {
  FX_WALLETS,
  Wallet,
  feedAccountBody,
  statementBody,
  walletEndBalance,
} from "@/lib/bankFeedData";
import { FLAG, money } from "@/lib/format";

type Synced = { accountId?: string; statementId?: string; done: boolean };

export default function BankFeedSync({
  consumerId,
  serviceId,
  onSynced,
  onContinue,
}: {
  consumerId: string;
  serviceId: string;
  onSynced: (map: Record<string, Synced>) => void;
  onContinue: () => void;
}) {
  const wallets = FX_WALLETS;
  const [focus, setFocus] = useState(0);
  const [synced, setSynced] = useState<Record<string, Synced>>({});
  const [acctResults, setAcctResults] = useState<Record<string, ApiResult>>({});
  const [stmtResults, setStmtResults] = useState<Record<string, ApiResult>>({});
  const [busy, setBusy] = useState(false);

  const setRec = (id: string, patch: Partial<Synced>) => {
    setSynced((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      onSynced(next);
      return next;
    });
  };

  const sync = async (w: Wallet) => {
    // 1 — register the wallet as a bank-feed account
    setAcctResults((p) => ({ ...p, [w.id]: { state: "running" } }));
    const acct = await callApideck(
      "POST",
      "accounting/bank-feed-accounts",
      consumerId,
      serviceId,
      feedAccountBody(w)
    );
    setAcctResults((p) => ({
      ...p,
      [w.id]: acct.ok
        ? { state: "success", status: acct.status, data: acct.data, ms: acct.ms }
        : { state: "error", status: acct.status, data: acct.data, ms: acct.ms },
    }));
    const accountId =
      ((acct.data as any)?.data?.id as string | undefined) ?? w.id;
    setRec(w.id, { accountId });

    // 2 — push the wallet's statement (transactions) for reconciliation
    setStmtResults((p) => ({ ...p, [w.id]: { state: "running" } }));
    const stmt = await callApideck(
      "POST",
      "accounting/bank-feed-statements",
      consumerId,
      serviceId,
      statementBody(w, accountId)
    );
    setStmtResults((p) => ({
      ...p,
      [w.id]: stmt.ok
        ? { state: "success", status: stmt.status, data: stmt.data, ms: stmt.ms }
        : { state: "error", status: stmt.status, data: stmt.data, ms: stmt.ms },
    }));
    const statementId =
      ((stmt.data as any)?.data?.id as string | undefined) ?? undefined;
    setRec(w.id, { statementId, done: acct.ok && stmt.ok });
  };

  const syncAll = async () => {
    setBusy(true);
    for (let i = 0; i < wallets.length; i++) {
      setFocus(i);
      // eslint-disable-next-line no-await-in-loop
      await sync(wallets[i]);
    }
    setBusy(false);
  };

  const doneCount = Object.values(synced).filter((s) => s?.done).length;
  const allDone = doneCount === wallets.length && wallets.length > 0;
  const fw = wallets[focus];

  return (
    <div className="grid lg:grid-cols-5 gap-6 items-start">
      <div className="lg:col-span-2 space-y-4">
        <MacWindow title="Push the bank feed">
          <div className="p-5">
            <h2 className="text-base font-semibold text-ink-900 dark:text-zinc-100">
              Two writes per wallet
            </h2>
            <p className="text-sm text-ink-900/60 dark:text-zinc-400 mt-1 mb-4">
              Register the wallet as a <b>bank-feed account</b>, then push its{" "}
              <b>statement</b> of transactions. The wallet now reconciles inside
              the ledger like any bank account.
            </p>

            <div className="space-y-1.5">
              {wallets.map((w, i) => {
                const rec = synced[w.id];
                const running =
                  acctResults[w.id]?.state === "running" ||
                  stmtResults[w.id]?.state === "running";
                return (
                  <button
                    key={w.id}
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
                        {FLAG[w.currency] ?? ""} {w.name}
                      </span>
                      <span className="block text-[11px] text-ink-900/50 dark:text-zinc-500">
                        {money(walletEndBalance(w), w.currency)} ·{" "}
                        {w.transactions.length} txns
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-black/5 dark:border-white/5 px-5 py-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={syncAll}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-medium disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
              {allDone ? "Re-run all" : "Sync all wallets"}
            </button>
            <span className="text-[11px] text-ink-900/50 dark:text-zinc-500">
              {doneCount}/{wallets.length} synced
            </span>
          </div>
        </MacWindow>

        {allDone && (
          <button
            type="button"
            onClick={onContinue}
            className="w-full inline-flex items-center justify-center gap-1.5 text-sm px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium animate-fade-up"
          >
            View the reconciled feeds <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="lg:col-span-3 space-y-3">
        {fw && (
          <>
            <p className="text-[11px] uppercase tracking-wider text-ink-900/50 dark:text-zinc-500">
              {FLAG[fw.currency] ?? ""} {fw.name}
            </p>
            <MockApiCall
              method="POST"
              endpoint="POST /accounting/bank-feed-accounts"
              headers={apideckHeaders(consumerId, serviceId)}
              body={feedAccountBody(fw)}
              result={acctResults[fw.id] ?? { state: "idle" }}
              onRun={() => sync(fw)}
            />
            <MockApiCall
              method="POST"
              endpoint="POST /accounting/bank-feed-statements"
              headers={apideckHeaders(consumerId, serviceId)}
              body={statementBody(fw, synced[fw.id]?.accountId ?? fw.id)}
              result={stmtResults[fw.id] ?? { state: "idle" }}
              onRun={() => sync(fw)}
            />
          </>
        )}
      </div>
    </div>
  );
}
