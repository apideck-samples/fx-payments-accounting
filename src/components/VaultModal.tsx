"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { ERP_BY_ID } from "@/lib/erpTheme";

type RowState = "idle" | "connecting" | "connected";

// Mock of the Apideck Vault drop-in widget. In production you'd take the
// session token returned by POST /vault/sessions and mount @apideck/vault-js
// (or redirect to the hosted session_uri) — the same UI, with live OAuth. In
// this credential-free demo we render a faithful stand-in so the connect step
// still shows the Vault authorization UX for the ERP the customer picked.
export default function VaultModal({
  serviceId,
  sessionUri,
  consumerLabel,
  onClose,
  onComplete,
}: {
  serviceId: string;
  sessionUri: string;
  consumerLabel: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const svc = ERP_BY_ID[serviceId];
  const name = svc?.name ?? serviceId;
  const [state, setState] = useState<RowState>("idle");

  const authorize = useCallback(() => {
    setState("connecting");
    const ms = 800 + Math.random() * 700;
    setTimeout(() => setState("connected"), ms);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state !== "connecting") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, onClose]);

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-up"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && state !== "connecting") onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white text-ink-900 shadow-2xl ring-1 ring-black/10 overflow-hidden">
        {/* Header — Vault chrome */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-ink-900 text-white flex items-center justify-center font-bold text-[13px]">
              A
            </span>
            <div>
              <div className="text-[13px] font-semibold leading-none">
                Apideck Vault
              </div>
              <div className="text-[10px] text-ink-900/55 leading-none mt-0.5">
                Securely connect your accounting system
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={state === "connecting"}
            aria-label="Close"
            className="text-ink-900/40 hover:text-ink-900 disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Consumer + session id */}
        <div className="px-5 py-3 bg-zinc-50 border-b border-black/5 text-[11px] text-ink-900/60 flex items-center justify-between gap-3">
          <span className="truncate">
            Authorizing as{" "}
            <span className="text-ink-900 font-medium">{consumerLabel}</span>
          </span>
          <span className="font-mono text-[10px] text-ink-900/50 truncate max-w-[160px]">
            {sessionUri.replace("https://vault.apideck.com/session/", "")}
          </span>
        </div>

        {/* The connector being authorized */}
        <div className="px-5 py-5">
          <div
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl ring-1 transition ${
              state === "connected"
                ? "bg-emerald-50 ring-emerald-200"
                : state === "connecting"
                  ? "bg-sky-50 ring-sky-200"
                  : "bg-white ring-black/10"
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-ink-900 text-white text-[13px] font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{name}</div>
              <div className="text-[11px] text-ink-900/55 truncate">
                {svc?.blurb ?? "Accounting connector"}
              </div>
            </div>
            {state === "connected" ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : state === "connecting" ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-sky-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…
              </span>
            ) : (
              <button
                onClick={authorize}
                className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-md bg-ink-900 text-white hover:bg-ink-800"
              >
                <Lock className="w-3 h-3" /> Authorize
              </button>
            )}
          </div>

          {state === "connecting" && (
            <p className="text-[11px] text-ink-900/50 mt-3 text-center">
              Redirecting to {name} for OAuth…
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-black/5 flex items-center justify-between gap-3 bg-zinc-50">
          <div className="flex items-center gap-1.5 text-[11px] text-ink-900/55">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            OAuth handled by Apideck — credentials never touch your servers
          </div>
          {state === "connected" ? (
            <button
              onClick={onComplete}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Done
            </button>
          ) : (
            <span className="text-[10px] text-ink-900/40 font-mono">
              @apideck/vault-js
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
