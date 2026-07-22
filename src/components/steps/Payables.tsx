"use client";
import { useEffect, useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import MacWindow from "@/components/MacWindow";
import MockApiCall, { ApiResult } from "@/components/MockApiCall";
import { apideckHeaders, callApideck } from "@/lib/apiClient";
import { BillDTO } from "@/lib/types";
import { FLAG, money, rate } from "@/lib/format";
import { HOME_CURRENCY } from "@/lib/mockData";

export default function Payables({
  consumerId,
  serviceId,
  onLoaded,
  onContinue,
}: {
  consumerId: string;
  serviceId: string;
  onLoaded: (bills: BillDTO[]) => void;
  onContinue: () => void;
}) {
  const [result, setResult] = useState<ApiResult>({ state: "idle" });
  const [bills, setBills] = useState<BillDTO[]>([]);

  const run = async () => {
    setResult({ state: "running" });
    const r = await callApideck(
      "GET",
      "accounting/bills?filter[status]=authorised&limit=20",
      consumerId,
      serviceId
    );
    setResult(
      r.ok
        ? { state: "success", status: r.status, data: r.data, ms: r.ms }
        : { state: "error", status: r.status, data: r.data, ms: r.ms }
    );
    if (r.ok) {
      const list = (((r.data as Record<string, unknown>)?.data as BillDTO[]) ?? []).filter(
        (b) => (b.status ?? "authorised") === "authorised"
      );
      setBills(list);
      onLoaded(list);
    }
  };

  // Auto-run on mount so the step feels alive.
  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = bills.length;

  return (
    <div className="grid lg:grid-cols-5 gap-6 items-start">
      <div className="lg:col-span-3 space-y-4">
        <MacWindow title={`${serviceId} · approved payables`}>
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-accent-500/15 text-accent-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink-900 dark:text-zinc-100">
                  {total > 0 ? `${total} bills` : "Bills"} approved for payment
                </h2>
                <p className="text-sm text-ink-900/60 dark:text-zinc-400 mt-0.5">
                  Read straight from the customer&apos;s ledger — already
                  approved by their finance team, each in the supplier&apos;s
                  own currency. This is the payment demand your rails fulfil.
                </p>
              </div>
            </div>

            {bills.length === 0 ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg bg-ink-800/40 ring-1 ring-white/5 shimmer"
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto dark-scroll -mx-1 px-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-ink-900/45 dark:text-zinc-500 text-left">
                      <th className="font-medium py-2 pr-3">Supplier</th>
                      <th className="font-medium py-2 pr-3">Bill</th>
                      <th className="font-medium py-2 pr-3 text-right">Amount</th>
                      <th className="font-medium py-2 pr-3 text-right">
                        Booked rate
                      </th>
                      <th className="font-medium py-2 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => (
                      <tr
                        key={b.id}
                        className="border-t border-black/5 dark:border-white/5"
                      >
                        <td className="py-2.5 pr-3">
                          <div className="font-medium text-ink-900 dark:text-zinc-200">
                            {b.supplier?.display_name ??
                              b.supplier?.company_name ??
                              "Supplier"}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-ink-900/60 dark:text-zinc-400 font-mono text-xs">
                          {b.number ?? b.id}
                        </td>
                        <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                          <span className="mr-1">{FLAG[b.currency] ?? ""}</span>
                          <span className="font-medium text-ink-900 dark:text-zinc-100">
                            {money(b.total_amount, b.currency)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right text-ink-900/55 dark:text-zinc-400 font-mono text-xs whitespace-nowrap">
                          {b.currency_rate ? `${rate(b.currency_rate)} ${HOME_CURRENCY}` : "—"}
                        </td>
                        <td className="py-2.5 text-right text-ink-900/55 dark:text-zinc-400 text-xs whitespace-nowrap">
                          {b.due_date?.slice(0, 10) ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="border-t border-black/5 dark:border-white/5 px-5 py-3 flex items-center justify-end">
            <button
              type="button"
              onClick={onContinue}
              disabled={bills.length === 0}
              className="inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-medium disabled:opacity-40"
            >
              Quote on your rails <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </MacWindow>
      </div>

      <div className="lg:col-span-2">
        <p className="text-[11px] uppercase tracking-wider text-ink-900/50 dark:text-zinc-500 mb-2">
          One call — any ERP behind it
        </p>
        <MockApiCall
          method="GET"
          endpoint="GET /accounting/bills?filter[status]=authorised"
          headers={apideckHeaders(consumerId, serviceId)}
          result={result}
          onRun={run}
        />
      </div>
    </div>
  );
}
