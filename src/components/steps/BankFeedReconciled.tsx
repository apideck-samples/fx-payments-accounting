"use client";
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import MacWindow from "@/components/MacWindow";
import { FX_WALLETS, walletEndBalance } from "@/lib/bankFeedData";
import { FLAG, money } from "@/lib/format";

type Synced = { accountId?: string; statementId?: string; done: boolean };

export default function BankFeedReconciled({
  synced,
  prospect,
  serviceId,
  onReset,
}: {
  synced: Record<string, Synced>;
  prospect: string;
  serviceId: string;
  onReset: () => void;
}) {
  const wallets = FX_WALLETS;
  const totalTxns = wallets.reduce((s, w) => s + w.transactions.length, 0);
  const currencies = Array.from(new Set(wallets.map((w) => w.currency)));

  const tiles = [
    { label: "Wallets synced", value: `${wallets.length}` },
    { label: "Currencies", value: currencies.join(" · ") },
    { label: "Transactions fed", value: `${totalTxns}` },
    { label: "Bank feed status", value: "Active" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">
          Every {prospect} wallet is now a live bank feed in {serviceId} —
          balances and transactions reconcile automatically.
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl bg-white/60 dark:bg-ink-800/60 ring-1 ring-black/10 dark:ring-white/10 p-4"
          >
            <div className="text-[11px] uppercase tracking-wider text-ink-900/45 dark:text-zinc-500">
              {t.label}
            </div>
            <div className="text-lg font-semibold mt-1 tabular-nums text-ink-900 dark:text-zinc-100">
              {t.value}
            </div>
          </div>
        ))}
      </div>

      <MacWindow title="Bank feeds now in the ledger">
        <div className="overflow-x-auto dark-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-900/45 dark:text-zinc-500 text-left">
                <th className="font-medium px-5 py-3">Wallet → bank account</th>
                <th className="font-medium py-3 pr-3 text-right">Balance</th>
                <th className="font-medium py-3 pr-3 text-right">Txns</th>
                <th className="font-medium py-3 pr-3">Feed account</th>
                <th className="font-medium py-3 pr-5">Statement</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => {
                const rec = synced[w.id];
                return (
                  <tr
                    key={w.id}
                    className="border-t border-black/5 dark:border-white/5"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink-900 dark:text-zinc-200">
                        {FLAG[w.currency] ?? ""} {w.name}
                      </div>
                      <div className="text-[11px] text-ink-900/50 dark:text-zinc-500">
                        {w.currency} bank feed
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right whitespace-nowrap font-medium">
                      {money(walletEndBalance(w), w.currency)}
                    </td>
                    <td className="py-3 pr-3 text-right text-ink-900/60 dark:text-zinc-400">
                      {w.transactions.length}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-ink-900/55 dark:text-zinc-400">
                      {rec?.accountId ?? "—"}
                    </td>
                    <td className="py-3 pr-5 font-mono text-[11px] text-ink-900/55 dark:text-zinc-400">
                      {rec?.statementId ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </MacWindow>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl bg-accent-500/[0.06] ring-1 ring-accent-500/20 px-5 py-4">
        <div className="flex items-start gap-2.5 text-[13px] text-ink-900/75 dark:text-zinc-300">
          <Sparkles className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
          <span>
            <b>Sticky by design.</b> Once {prospect} is a live bank feed in the
            customer&apos;s daily reconciliation, it&apos;s embedded in their
            workflow. Same <code className="font-mono">bank-feed-accounts</code> /{" "}
            <code className="font-mono">bank-feed-statements</code> code drives
            QuickBooks and Xero — no per-ledger build.
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-lg bg-white/70 dark:bg-ink-800/70 ring-1 ring-black/10 dark:ring-white/10 hover:ring-black/20 font-medium shrink-0"
        >
          <RotateCcw className="w-4 h-4" /> Run again
        </button>
      </div>
    </div>
  );
}
