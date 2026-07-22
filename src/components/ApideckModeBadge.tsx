"use client";
import { useCallback, useEffect, useState } from "react";
import { Cloud, Database, Lock } from "lucide-react";

type ModeInfo = { mode: "live" | "mock"; live_available: boolean };

// Interactive toggle between mock and live mode. The "live" option is
// disabled (with a lock + tooltip) when the server doesn't have Apideck
// credentials in the environment. The toggle drives an `apideck-mode`
// cookie that the catch-all proxy in /api/apideck/[...path] reads at
// request time.
export default function ApideckModeBadge() {
  const [info, setInfo] = useState<ModeInfo | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/apideck-mode", { cache: "no-store" });
      setInfo(await r.json());
    } catch {
      setInfo({ mode: "mock", live_available: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const flipTo = async (next: "live" | "mock") => {
    if (!info) return;
    if (next === info.mode) return;
    if (next === "live" && !info.live_available) return;
    setBusy(true);
    // 1 year expiry — purely a user preference, not a security boundary.
    if (next === "mock") {
      document.cookie = "apideck-mode=mock; path=/; max-age=31536000; samesite=lax";
    } else {
      document.cookie = "apideck-mode=; path=/; max-age=0";
    }
    await refresh();
    setBusy(false);
  };

  if (!info) return null;

  const isLive = info.mode === "live";
  const liveLocked = !info.live_available;

  return (
    <div
      className={`hidden md:inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider rounded-full ring-1 p-0.5 transition ${
        isLive
          ? "bg-emerald-500/10 ring-emerald-500/30"
          : "bg-amber-500/10 ring-amber-500/30"
      } ${busy ? "opacity-60" : ""}`}
      title={
        liveLocked
          ? "Set APIDECK_API_KEY and APIDECK_APP_ID in .env.local to unlock Live mode"
          : "Toggle between live Apideck and bundled mock data"
      }
    >
      <button
        type="button"
        onClick={() => flipTo("mock")}
        disabled={busy}
        aria-pressed={info.mode === "mock"}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition ${
          info.mode === "mock"
            ? "bg-amber-500/30 text-amber-800 dark:text-amber-200"
            : "text-amber-700/70 dark:text-amber-300/70 hover:bg-amber-500/15"
        }`}
      >
        <Database className="w-3 h-3" /> Mock
      </button>
      <button
        type="button"
        onClick={() => flipTo("live")}
        disabled={busy || liveLocked}
        aria-pressed={info.mode === "live"}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition ${
          info.mode === "live"
            ? "bg-emerald-500/30 text-emerald-800 dark:text-emerald-200"
            : liveLocked
              ? "text-emerald-700/40 dark:text-emerald-300/30 cursor-not-allowed"
              : "text-emerald-700/70 dark:text-emerald-300/70 hover:bg-emerald-500/15"
        }`}
      >
        {liveLocked ? (
          <Lock className="w-3 h-3" />
        ) : (
          <Cloud className="w-3 h-3" />
        )}
        Live
      </button>
    </div>
  );
}
