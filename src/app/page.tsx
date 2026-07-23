"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Github } from "lucide-react";
import Stepper, {
  PAYMENT_STEPS,
  BANKFEED_STEPS,
  StepId,
} from "@/components/Stepper";
import ThemeToggle from "@/components/ThemeToggle";
import ApideckModeBadge from "@/components/ApideckModeBadge";
import ConnectErp from "@/components/steps/ConnectErp";
import Payables from "@/components/steps/Payables";
import Settlement from "@/components/steps/Settlement";
import WriteBack from "@/components/steps/WriteBack";
import Reconciled from "@/components/steps/Reconciled";
import BankFeedWallets from "@/components/steps/BankFeedWallets";
import BankFeedSync from "@/components/steps/BankFeedSync";
import BankFeedReconciled from "@/components/steps/BankFeedReconciled";
import { UseCase, useLaunchParams, useProspect } from "@/lib/launchParams";
import { useSession } from "@/lib/session";
import { COMPANY } from "@/lib/mockData";
import { BillDTO } from "@/lib/types";

type Recorded = { paymentId?: string; journalEntryId?: string; done: boolean };
type Synced = { accountId?: string; statementId?: string; done: boolean };

const DEFAULT_SVC: Record<UseCase, string> = {
  payments: "netsuite",
  bankfeed: "xero",
};

export default function Page() {
  const launch = useLaunchParams();
  const { session } = useSession();

  const [useCase, setUseCase] = useState<UseCase>("payments");
  const [step, setStep] = useState<StepId>("connect");
  const [serviceId, setServiceId] = useState<string>("netsuite");
  const [maxIdx, setMaxIdx] = useState(0);

  // Payments-flow state
  const [bills, setBills] = useState<BillDTO[]>([]);
  const [recorded, setRecorded] = useState<Record<string, Recorded>>({});
  // Bank-feed-flow state
  const [syncedFeeds, setSyncedFeeds] = useState<Record<string, Synced>>({});

  // One brand for the whole demo (both flows). Defaults to a fictional FX
  // provider; brand it for any company at runtime with
  // ?for=Acme%20FX&domain=acme.com — no code change.
  const { name: prospect, domain: prospectDomain } = useProspect(
    "Nimbus FX",
    null
  );

  // Deep-link ?usecase= and ?service=.
  useEffect(() => {
    if (launch.useCase) {
      setUseCase(launch.useCase);
      setServiceId(launch.service ?? DEFAULT_SVC[launch.useCase]);
    } else if (launch.service) {
      setServiceId(launch.service);
    }
  }, [launch.useCase, launch.service]);

  const steps = useCase === "bankfeed" ? BANKFEED_STEPS : PAYMENT_STEPS;
  const furthest = useMemo(
    () => steps.findIndex((s) => s.id === step),
    [steps, step]
  );
  useEffect(() => {
    setMaxIdx((m) => Math.max(m, furthest));
  }, [furthest]);

  const consumerId = session?.consumerId ?? launch.consumerId ?? COMPANY.id;

  const go = (id: StepId) => setStep(id);

  const resetFlow = () => {
    setBills([]);
    setRecorded({});
    setSyncedFeeds({});
    setMaxIdx(0);
    setStep("connect");
  };

  const switchUseCase = (uc: UseCase) => {
    if (uc === useCase) return;
    setUseCase(uc);
    setServiceId(DEFAULT_SVC[uc]);
    resetFlow();
  };

  return (
    <main className="min-h-screen">
      <Header
        prospect={prospect}
        prospectDomain={prospectDomain}
        onReset={resetFlow}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <UseCaseSwitch useCase={useCase} onSwitch={switchUseCase} />

        <Stepper steps={steps} current={step} furthest={maxIdx} onJump={go} />

        {launch.source === "apideck-samples" && (
          <div className="mb-5 rounded-xl bg-ink-900 text-white ring-1 ring-white/10 px-4 py-3 text-sm animate-fade-up">
            Launched from Apideck Samples — this walkthrough runs on bundled mock
            data. Add credentials to <code>.env.local</code> to go live.
          </div>
        )}

        <div className="animate-fade-up" key={`${useCase}-${step}`}>
          {/* Shared connect step */}
          {step === "connect" && (
            <ConnectErp
              serviceId={serviceId}
              onPick={setServiceId}
              consumerId={consumerId}
              onConnected={() =>
                go(useCase === "bankfeed" ? "wallets" : "payables")
              }
              prospect={prospect}
              mode={useCase}
              embedded={launch.embedded}
            />
          )}

          {/* FX Payments flow */}
          {useCase === "payments" && step === "payables" && (
            <Payables
              consumerId={consumerId}
              serviceId={serviceId}
              onLoaded={setBills}
              onContinue={() => go("settle")}
            />
          )}
          {useCase === "payments" && step === "settle" && (
            <Settlement
              bills={bills}
              prospect={prospect}
              onContinue={() => go("writeback")}
            />
          )}
          {useCase === "payments" && step === "writeback" && (
            <WriteBack
              consumerId={consumerId}
              serviceId={serviceId}
              bills={bills}
              prospect={prospect}
              onRecorded={setRecorded}
              onContinue={() => go("done")}
            />
          )}
          {useCase === "payments" && step === "done" && (
            <Reconciled
              bills={bills}
              recorded={recorded}
              prospect={prospect}
              serviceId={serviceId}
              onReset={resetFlow}
            />
          )}

          {/* Bank feed flow */}
          {useCase === "bankfeed" && step === "wallets" && (
            <BankFeedWallets
              prospect={prospect}
              onContinue={() => go("sync")}
            />
          )}
          {useCase === "bankfeed" && step === "sync" && (
            <BankFeedSync
              consumerId={consumerId}
              serviceId={serviceId}
              onSynced={setSyncedFeeds}
              onContinue={() => go("done")}
            />
          )}
          {useCase === "bankfeed" && step === "done" && (
            <BankFeedReconciled
              synced={syncedFeeds}
              prospect={prospect}
              serviceId={serviceId}
              onReset={resetFlow}
            />
          )}
        </div>

        <Footer />
      </div>
    </main>
  );
}

function UseCaseSwitch({
  useCase,
  onSwitch,
}: {
  useCase: UseCase;
  onSwitch: (uc: UseCase) => void;
}) {
  const tabs: Array<{ id: UseCase; label: string; sub: string }> = [
    { id: "payments", label: "FX Payments", sub: "Reconcile cross-border payments into the ledger" },
    { id: "bankfeed", label: "Bank Feeds", sub: "Stream multi-currency wallets into the ledger" },
  ];
  return (
    <div className="pt-6 flex flex-col sm:flex-row gap-2">
      {tabs.map((t) => {
        const active = t.id === useCase;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSwitch(t.id)}
            className={`flex-1 text-left rounded-xl px-4 py-3 ring-1 transition ${
              active
                ? "bg-accent-500/10 ring-accent-500/40"
                : "bg-white/50 dark:bg-ink-800/50 ring-black/10 dark:ring-white/10 hover:ring-black/20 dark:hover:ring-white/20"
            }`}
          >
            <div
              className={`text-sm font-semibold ${
                active
                  ? "text-accent-500"
                  : "text-ink-900 dark:text-zinc-200"
              }`}
            >
              {t.label}
            </div>
            <div className="text-[11px] text-ink-900/55 dark:text-zinc-500 mt-0.5">
              {t.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Header({
  prospect,
  prospectDomain,
  onReset,
}: {
  prospect: string;
  prospectDomain: string | null;
  onReset: () => void;
}) {
  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2 flex items-center justify-between gap-4">
      <button onClick={onReset} className="group inline-flex items-center gap-2.5 select-none text-left">
        <span className="w-7 h-7 rounded-lg bg-ink-900 dark:bg-accent-500 text-white flex items-center justify-center font-bold text-[13px] ring-1 ring-black/20 dark:ring-white/10 group-hover:scale-105 transition">
          A
        </span>
        <div>
          <div className="text-[13px] font-semibold leading-none text-ink-900 dark:text-zinc-100">
            Apideck · FX Payments
          </div>
          <div className="text-[10px] leading-none mt-0.5 text-ink-900/60 dark:text-zinc-400">
            Cross-border reconciliation &amp; bank feeds into any ledger
          </div>
        </div>
      </button>

      <div className="flex items-center gap-2">
        <ProspectBadge prospect={prospect} domain={prospectDomain} />
        <ApideckModeBadge />
        <ThemeToggle />
        <a
          href="https://developers.apideck.com/apis/accounting"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md ring-1 ring-black/10 dark:ring-white/15 bg-white/60 dark:bg-ink-800/60 hover:bg-white dark:hover:bg-ink-700 text-ink-900 dark:text-zinc-200 font-medium"
        >
          Docs <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}

// Prospect badge with a network-free fallback: an initial-letter avatar is
// always shown; the remote logo fades in only if it genuinely loads, so a
// deprecated/blocked logo endpoint can never leave a broken-image glyph.
function ProspectBadge({
  prospect,
  domain,
}: {
  prospect: string;
  domain: string | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const initial = prospect.trim().charAt(0).toUpperCase() || "•";
  // Reset load state when the prospect/domain changes (use-case switch).
  useEffect(() => setLoaded(false), [domain]);
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-ink-900/60 dark:text-zinc-400 rounded-full ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-ink-800/60 pl-1 pr-2.5 py-1">
      <span className="relative w-4 h-4 rounded overflow-hidden inline-flex items-center justify-center bg-accent-500/20 text-accent-500 text-[9px] font-bold ring-1 ring-black/10 dark:ring-white/10">
        <span className={loaded ? "opacity-0" : "opacity-100"}>{initial}</span>
        {domain && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt=""
            className={`absolute inset-0 w-full h-full object-contain transition-opacity ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
          />
        )}
      </span>
      Built for {prospect}
    </span>
  );
}

function Footer() {
  return (
    <footer className="mt-16 pt-6 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-900/45 dark:text-zinc-500">
      <span>
        Built on the Apideck guide{" "}
        <a
          href="https://developers.apideck.com/guides/fx-payments-accounting-api"
          target="_blank"
          rel="noreferrer"
          className="text-accent-500 hover:underline"
        >
          Handling FX Payments with the Accounting API
        </a>{" "}
        · runs on mock data, live with your own credentials.
      </span>
      <a
        href="https://github.com/apideck-samples"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 hover:text-ink-900 dark:hover:text-zinc-200"
      >
        <Github className="w-3.5 h-3.5" /> apideck-samples
      </a>
    </footer>
  );
}
