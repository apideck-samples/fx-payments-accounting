"use client";
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import MacWindow from "@/components/MacWindow";
import { BillDTO } from "@/lib/types";
import { FLAG, money, signedMoney } from "@/lib/format";
import { HOME_CURRENCY, quoteFromBill } from "@/lib/mockData";

type Recorded = { paymentId?: string; journalEntryId?: string; done: boolean };

export default function Reconciled({
  bills,
  recorded,
  prospect,
  serviceId,
  onReset,
}: {
  bills: BillDTO[];
  recorded: Record<string, Recorded>;
  prospect: string;
  serviceId: string;
  onReset: () => void;
}) {
  const quotes = bills.map((b) => quoteFromBill(b));
  const totalHome = quotes.reduce((s, q) => s + q.homeCostTotal, 0);
  const totalFx = quotes.reduce((s, q) => s + q.fxDelta, 0);
  const totalFees = quotes.reduce((s, q) => s + q.feeHome, 0);

  const tiles = [
    { label: "Bills cleared", value: `${quotes.length}`, tone: "ink" as const },
    {
      label: `Settled (${HOME_CURRENCY})`,
      value: money(totalHome, HOME_CURRENCY),
      tone: "ink" as const,
    },
    {
      label: "Net realized FX",
      value: signedMoney(totalFx, HOME_CURRENCY),
      tone: totalFx >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Fees booked",
      value: money(totalFees, HOME_CURRENCY),
      tone: "ink" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">
          Every payment and FX adjustment is now in {serviceId}. Nothing to
          reconcile by hand.
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
            <div
              className={`text-xl font-semibold mt-1 tabular-nums ${
                t.tone === "up"
                  ? "text-emerald-600 dark:text-emerald-300"
                  : t.tone === "down"
                    ? "text-rose-600 dark:text-rose-300"
                    : "text-ink-900 dark:text-zinc-100"
              }`}
            >
              {t.value}
            </div>
          </div>
        ))}
      </div>

      <MacWindow title="Settlement register">
        <div className="overflow-x-auto dark-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-900/45 dark:text-zinc-500 text-left">
                <th className="font-medium px-5 py-3">Supplier</th>
                <th className="font-medium py-3 pr-3 text-right">Paid</th>
                <th className="font-medium py-3 pr-3 text-right">FX</th>
                <th className="font-medium py-3 pr-3">Payment</th>
                <th className="font-medium py-3 pr-5">Journal entry</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const rec = recorded[q.payable.id];
                return (
                  <tr
                    key={q.payable.id}
                    className="border-t border-black/5 dark:border-white/5"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink-900 dark:text-zinc-200">
                        {q.payable.supplier.name}
                      </div>
                      <div className="text-[11px] text-ink-900/50 dark:text-zinc-500">
                        {FLAG[q.payable.currency] ?? ""}{" "}
                        {money(q.payable.total_amount, q.payable.currency)} @{" "}
                        {q.settledRate}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right whitespace-nowrap font-medium">
                      {money(q.homeCostTotal, HOME_CURRENCY)}
                    </td>
                    <td
                      className={`py-3 pr-3 text-right whitespace-nowrap ${
                        q.fxDelta >= 0
                          ? "text-emerald-600 dark:text-emerald-300"
                          : "text-rose-600 dark:text-rose-300"
                      }`}
                    >
                      {signedMoney(q.fxDelta, HOME_CURRENCY)}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-ink-900/55 dark:text-zinc-400">
                      {rec?.paymentId ?? "—"}
                    </td>
                    <td className="py-3 pr-5 font-mono text-[11px] text-ink-900/55 dark:text-zinc-400">
                      {rec?.journalEntryId ?? "—"}
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
            <b>One integration, every ERP.</b> You built this once against
            Apideck. Flip <code className="font-mono">x-apideck-service-id</code>{" "}
            from <code className="font-mono">{serviceId}</code> to QuickBooks,
            Xero, Sage Intacct or Business Central and {prospect} reconciles
            those customers too — no new code.
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
