"use client";
import { Check } from "lucide-react";

export type StepId =
  | "connect"
  | "payables"
  | "settle"
  | "writeback"
  | "done"
  | "wallets"
  | "sync";

export type Step = { id: StepId; label: string };

export const PAYMENT_STEPS: Step[] = [
  { id: "connect", label: "Connect ERP" },
  { id: "payables", label: "Read payables" },
  { id: "settle", label: "Settle on rails" },
  { id: "writeback", label: "Write back" },
  { id: "done", label: "Reconciled" },
];

export const BANKFEED_STEPS: Step[] = [
  { id: "connect", label: "Connect ledger" },
  { id: "wallets", label: "Wallets" },
  { id: "sync", label: "Push feed" },
  { id: "done", label: "Reconciled" },
];

export default function Stepper({
  steps,
  current,
  furthest,
  onJump,
}: {
  steps: Step[];
  current: StepId;
  furthest: number; // index of the furthest-reached step
  onJump: (id: StepId) => void;
}) {
  const STEPS = steps;
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <nav className="flex items-center gap-1 sm:gap-2 py-6 overflow-x-auto dark-scroll">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const reachable = i <= furthest;
        return (
          <div key={s.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump(s.id)}
              className={`inline-flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 text-xs font-medium ring-1 transition ${
                active
                  ? "bg-ink-900 text-white ring-black/20 dark:bg-accent-500 dark:ring-white/10"
                  : done
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30"
                    : reachable
                      ? "bg-white/60 dark:bg-ink-800/60 text-ink-900/70 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:ring-black/20"
                      : "bg-white/40 dark:bg-ink-800/40 text-ink-900/30 dark:text-zinc-600 ring-black/5 dark:ring-white/5 cursor-not-allowed"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] ${
                  active
                    ? "bg-white/20"
                    : done
                      ? "bg-emerald-500/30"
                      : "bg-black/5 dark:bg-white/10"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                className={`h-px w-4 sm:w-8 ${
                  i < currentIdx
                    ? "bg-emerald-500/40"
                    : "bg-black/10 dark:bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
