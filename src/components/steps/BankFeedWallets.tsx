"use client";
import { ArrowRight, Wallet as WalletIcon } from "lucide-react";
import MacWindow from "@/components/MacWindow";
import { FX_WALLETS, walletEndBalance } from "@/lib/bankFeedData";
import { FLAG, money } from "@/lib/format";

export default function BankFeedWallets({
  onContinue,
  prospect,
}: {
  onContinue: () => void;
  prospect: string;
}) {
  return (
    <div className="space-y-4">
      <MacWindow title={`${prospect} · multi-currency accounts`}>
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-1">
            <span className="w-9 h-9 rounded-xl bg-accent-500/15 text-accent-500 flex items-center justify-center shrink-0">
              <WalletIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink-900 dark:text-zinc-100">
                Your customer&apos;s {prospect} wallets
              </h2>
              <p className="text-sm text-ink-900/60 dark:text-zinc-400 mt-0.5">
                This is <b>{prospect}&apos;s</b> own data — the balances and
                activity you already hold. Next, you&apos;ll stream each wallet
                into the customer&apos;s ledger as a bank feed so it reconciles
                like any other bank account.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {FX_WALLETS.map((w) => (
              <div
                key={w.id}
                className="rounded-xl bg-ink-800/40 ring-1 ring-white/10 p-4"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-zinc-100">
                  <span>{FLAG[w.currency] ?? ""}</span>
                  {w.name}
                </div>
                <div className="text-2xl font-semibold mt-2 tabular-nums text-ink-900 dark:text-zinc-100">
                  {money(walletEndBalance(w), w.currency)}
                </div>
                <div className="text-[11px] text-ink-900/50 dark:text-zinc-500 mt-1">
                  {w.transactions.length} transactions · {w.currency}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-black/5 dark:border-white/5 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-ink-900/50 dark:text-zinc-500">
            {FX_WALLETS.length} wallets · balances held on your network
          </span>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-medium"
          >
            Sync as bank feeds <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </MacWindow>
    </div>
  );
}
