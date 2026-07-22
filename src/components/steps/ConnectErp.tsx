"use client";
import { useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Link2, Sparkles } from "lucide-react";
import MacWindow from "@/components/MacWindow";
import MockApiCall, { ApiResult } from "@/components/MockApiCall";
import VaultModal from "@/components/VaultModal";
import { BANK_FEED_SERVICES, ERP_SERVICES, ErpService } from "@/lib/erpTheme";
import { apideckHeaders, callApideck } from "@/lib/apiClient";
import { COMPANY } from "@/lib/mockData";

// The @apideck/vault-js token is the JWT embedded in the session_uri
// (…/session/<jwt>), used when the API also doesn't return session_token.
function tokenFromUri(uri?: string): string | undefined {
  if (!uri) return undefined;
  return uri.split("/session/")[1] || undefined;
}

type Mode = "payments" | "bankfeed";

function config(mode: Mode, prospect: string) {
  if (mode === "bankfeed") {
    return {
      services: BANK_FEED_SERVICES,
      defaultSvc: "quickbooks",
      windowTitle: `${prospect} · connect your customer's ledger`,
      heading: (
        <>
          Where does <span className="text-accent-500">{COMPANY.name}</span>{" "}
          reconcile its books?
        </>
      ),
      sub: `Your customer authorizes once through Apideck Vault. ${prospect}'s wallets then appear as bank accounts in whichever ledger they use — no per-system integration.`,
      overflow: (
        <>
          Bank feeds run through <b className="font-medium">QuickBooks</b> (Intuit
          Bank Feeds) and <b className="font-medium">Xero</b>; NetSuite via the
          Apideck Bank Feed bundle — a narrower set than the 45+ unified
          connectors, and growing.
        </>
      ),
      connectedMsg: "wallets are ready to sync as a bank feed.",
      nextLabel: "Show the wallets",
      note: (
        <>
          <b>Multi-currency by design:</b> each {prospect} currency wallet becomes
          its own bank-feed account with its own currency, so every collection,
          conversion and fee reconciles in the customer&apos;s books
          automatically.
        </>
      ),
    };
  }
  return {
    services: ERP_SERVICES,
    defaultSvc: "netsuite",
    windowTitle: `${prospect} · connect your customer's ERP`,
    heading: (
      <>
        Where does <span className="text-accent-500">{COMPANY.name}</span> keep
        its books?
      </>
    ),
    sub: "Your customer authorizes once through Apideck Vault. The same code below works for every connector — you never build a per-ERP integration.",
    overflow: (
      <>
        + 45 more — QuickBooks Desktop, Sage 50, Sage 200, Zoho Books, MYOB,
        FreshBooks, Odoo, Moneybird, Pennylane and more.{" "}
        <span className="text-ink-900/70 dark:text-zinc-300">
          Apideck connects to 45+ ERP &amp; accounting systems through one API.
        </span>
      </>
    ),
    connectedMsg: "payables are ready to read.",
    nextLabel: "Read approved payables",
    note: (
      <>
        <b>Embedded-in-ERP:</b> NetSuite customers want their payment rails inside
        the AP approval workflow. Because Apideck normalizes the ledger, the same{" "}
        {prospect} integration lives natively in NetSuite, Business Central and
        Sage Intacct without a rebuild.
      </>
    ),
  };
}

export default function ConnectErp({
  serviceId,
  onPick,
  consumerId,
  onConnected,
  prospect,
  mode = "payments",
}: {
  serviceId: string | null;
  onPick: (id: string) => void;
  consumerId: string;
  onConnected: () => void;
  prospect: string;
  mode?: Mode;
}) {
  const cfg = config(mode, prospect);
  const [result, setResult] = useState<ApiResult>({ state: "idle" });
  const [connected, setConnected] = useState(false);
  const [sessionUri, setSessionUri] = useState<string | null>(null);
  const [showVault, setShowVault] = useState(false);
  const svc = serviceId ?? cfg.defaultSvc;

  const run = async () => {
    setResult({ state: "running" });
    const r = await callApideck("POST", "vault/sessions", consumerId, svc, {
      consumer_metadata: { account_name: COMPANY.name },
      redirect_uri: "https://app.example.com/callback",
    });
    setResult(
      r.ok
        ? { state: "success", status: r.status, data: r.data, ms: r.ms }
        : { state: "error", status: r.status, data: r.data, ms: r.ms }
    );
    if (r.ok) {
      const data = ((r.data as any)?.data ?? {}) as {
        session_uri?: string;
        session_token?: string;
      };
      const uri = data.session_uri ?? "https://vault.apideck.com/session/demo";
      const token = data.session_token ?? tokenFromUri(uri);

      // Live mode returns a real Vault session JWT → open the actual
      // @apideck/vault-js drop-in. Mock mode has no real token, so we fall
      // back to the stand-in modal.
      if (r.source === "live" && token) {
        const { ApideckVault } = await import("@apideck/vault-js");
        ApideckVault.open({
          token,
          unifiedApi: "accounting",
          serviceId: svc,
          showConsumer: true,
          onConnectionChange: () => setConnected(true),
          onClose: () => {},
        });
      } else {
        setSessionUri(uri);
        setShowVault(true);
      }
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6 items-start">
      <div className="lg:col-span-3 space-y-4">
        <MacWindow title={cfg.windowTitle}>
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-5">
              <span className="w-9 h-9 rounded-xl bg-accent-500/15 text-accent-500 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink-900 dark:text-zinc-100">
                  {cfg.heading}
                </h2>
                <p className="text-sm text-ink-900/60 dark:text-zinc-400 mt-0.5">
                  {cfg.sub}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {cfg.services.map((s: ErpService) => {
                const active = svc === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onPick(s.id)}
                    className={`text-left rounded-xl p-3.5 ring-1 transition ${
                      active
                        ? "bg-accent-500/10 ring-accent-500/40"
                        : "bg-ink-800/40 ring-white/10 hover:ring-black/20 dark:hover:ring-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-ink-900 dark:text-zinc-100">
                        {s.name}
                      </span>
                      {s.embedded && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-500/15 text-accent-500 ring-1 ring-accent-500/30">
                          {mode === "bankfeed" ? "Bundle" : "Embeddable"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-900/55 dark:text-zinc-500 mt-1 leading-snug">
                      {s.blurb}
                    </p>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] text-ink-900/50 dark:text-zinc-500 text-center">
              {cfg.overflow}
            </p>

            {connected && (
              <div className="mt-5 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-300 animate-fade-up">
                <CheckCircle2 className="w-4 h-4" />
                Connection <code className="font-mono">{svc}</code> is callable —{" "}
                {cfg.connectedMsg}
              </div>
            )}
          </div>
          <div className="border-t border-black/5 dark:border-white/5 px-5 py-3 flex items-center justify-between">
            <span className="text-[11px] text-ink-900/50 dark:text-zinc-500 inline-flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Consumer:{" "}
              <code className="font-mono">{consumerId}</code>
            </span>
            <button
              type="button"
              onClick={onConnected}
              disabled={!connected}
              className="inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-medium disabled:opacity-40"
            >
              {cfg.nextLabel} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </MacWindow>

        <div className="flex items-start gap-2.5 rounded-xl bg-accent-500/[0.06] ring-1 ring-accent-500/20 px-4 py-3 text-[12.5px] text-ink-900/70 dark:text-zinc-300">
          <Sparkles className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
          <span>{cfg.note}</span>
        </div>
      </div>

      <div className="lg:col-span-2">
        <p className="text-[11px] uppercase tracking-wider text-ink-900/50 dark:text-zinc-500 mb-2">
          The one call that starts it all
        </p>
        <MockApiCall
          method="POST"
          endpoint="POST /vault/sessions"
          headers={{
            ...apideckHeaders(consumerId, svc),
            Authorization: "Bearer sk_live_•••••",
          }}
          body={{
            consumer_metadata: { account_name: COMPANY.name },
            redirect_uri: "https://app.example.com/callback",
          }}
          result={result}
          onRun={run}
        />
        <p className="mt-2 text-[11px] text-ink-900/45 dark:text-zinc-500 leading-snug">
          In <b>Live</b> mode this launches the real{" "}
          <code className="font-mono">@apideck/vault-js</code> widget with the
          session token. In <b>Mock</b> mode (no credentials) it opens a
          stand-in with the same UX.
        </p>
      </div>

      {showVault && sessionUri && (
        <VaultModal
          serviceId={svc}
          sessionUri={sessionUri}
          consumerLabel={COMPANY.name}
          onClose={() => setShowVault(false)}
          onComplete={() => {
            setConnected(true);
            setShowVault(false);
          }}
        />
      )}
    </div>
  );
}
