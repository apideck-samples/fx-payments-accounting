"use client";
import { ArrowRight, Repeat, TrendingDown, TrendingUp } from "lucide-react";
import MacWindow from "@/components/MacWindow";
import { BillDTO } from "@/lib/types";
import { FLAG, money, rate, signedMoney } from "@/lib/format";
import { HOME_CURRENCY, quoteFromBill, FX_MARGIN_BPS } from "@/lib/mockData";

export default function Settlement({
  bills,
  onContinue,
  prospect,
}: {
  bills: BillDTO[];
  onContinue: () => void;
  prospect: string;
}) {
  const quotes = bills.map((b) => quoteFromBill(b));
  const totalHome = quotes.reduce((s, q) => s + q.homeCostTotal, 0);
  const totalFx = quotes.reduce((s, q) => s + q.fxDelta, 0);
  const totalFees = quotes.reduce((s, q) => s + q.feeHome, 0);

  return (
    <div className="space-y-4">
      <MacWindow title={`${prospect} rails · FX quotes`}>
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-1">
            <span className="w-9 h-9 rounded-xl bg-accent-500/15 text-accent-500 flex items-center justify-center shrink-0">
              <Repeat className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink-900 dark:text-zinc-100">
                Settle each payable on your own rails
              </h2>
              <p className="text-sm text-ink-900/60 dark:text-zinc-400 mt-0.5">
                This step is <b>{prospect}&apos;s</b> domain — not an Apideck
                call. You price each corridor at interbank mid + a{" "}
                {FX_MARGIN_BPS} bps margin, add your fee, and lock the rate.
                Apideck comes back in the next step to record the result.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto dark-scroll mt-4 -mx-1 px-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-900/45 dark:text-zinc-500 text-left">
                  <th className="font-medium py-2 pr-3">Corridor</th>
                  <th className="font-medium py-2 pr-3 text-right">Send</th>
                  <th className="font-medium py-2 pr-3 text-right">Mid</th>
                  <th className="font-medium py-2 pr-3 text-right">
                    Locked rate
                  </th>
                  <th className="font-medium py-2 pr-3 text-right">Fee</th>
                  <th className="font-medium py-2 pr-3 text-right">
                    Cost ({HOME_CURRENCY})
                  </th>
                  <th className="font-medium py-2 text-right">FX vs. book</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.payable.id}
                    className="border-t border-black/5 dark:border-white/5"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-ink-900 dark:text-zinc-200">
                        {q.payable.supplier.name}
                      </div>
                      <div className="text-[11px] text-ink-900/50 dark:text-zinc-500">
                        {FLAG[q.payable.currency] ?? ""} {q.payable.currency} →{" "}
                        {HOME_CURRENCY}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right whitespace-nowrap font-medium">
                      {money(q.payable.total_amount, q.payable.currency)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs text-ink-900/55 dark:text-zinc-400">
                      {rate(q.payable.mid_rate)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs text-ink-900 dark:text-zinc-200">
                      {rate(q.settledRate)}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-ink-900/55 dark:text-zinc-400 whitespace-nowrap">
                      {money(q.feeHome, HOME_CURRENCY)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium whitespace-nowrap">
                      {money(q.homeCostTotal, HOME_CURRENCY)}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          q.fxDelta >= 0
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-rose-600 dark:text-rose-300"
                        }`}
                      >
                        {q.fxDelta >= 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        {signedMoney(q.fxDelta, HOME_CURRENCY)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black/10 dark:border-white/10 font-semibold">
                  <td className="py-2.5 pr-3" colSpan={4}>
                    Total to settle
                  </td>
                  <td className="py-2.5 pr-3 text-right text-ink-900/60 dark:text-zinc-400">
                    {money(totalFees, HOME_CURRENCY)}
                  </td>
                  <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                    {money(totalHome, HOME_CURRENCY)}
                  </td>
                  <td
                    className={`py-2.5 text-right whitespace-nowrap ${
                      totalFx >= 0
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-rose-600 dark:text-rose-300"
                    }`}
                  >
                    {signedMoney(totalFx, HOME_CURRENCY)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div className="border-t border-black/5 dark:border-white/5 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-ink-900/50 dark:text-zinc-500">
            Rates locked · settlement instructed on your network
          </span>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-medium"
          >
            Write payments back to the ERP <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </MacWindow>
    </div>
  );
}
