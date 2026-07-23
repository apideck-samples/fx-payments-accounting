"use client";
import { useEffect, useState } from "react";

// A brief, branded boot splash. Uses the dynamic accent (so it's already in the
// prospect's color), shows the prospect's real logo (favicon) with an initial
// fallback, plays an orbiting ring + progress sweep, then fades out.
export default function BootLoader({
  prospect,
  domain,
  durationMs = 2200,
}: {
  prospect: string;
  domain: string | null;
  /** Visible time before fade-out. ?loader=<ms> overrides; 0 skips the loader. */
  durationMs?: number;
}) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");
  const [logo, setLogo] = useState(false);

  useEffect(() => {
    if (durationMs <= 0) {
      setPhase("gone");
      return;
    }
    const t1 = setTimeout(() => setPhase("out"), durationMs);
    const t2 = setTimeout(() => setPhase("gone"), durationMs + 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [durationMs]);

  if (phase === "gone" || durationMs <= 0) return null;
  const initial = prospect.trim().charAt(0).toUpperCase() || "A";

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === "out" ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(120% 90% at 50% 10%, rgba(var(--accent-500)/0.18), transparent 55%), linear-gradient(180deg,#0b0b14,#15101e)",
      }}
    >
      <div className="relative h-24 w-24">
        {/* soft accent glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl boot-pulse"
          style={{ background: "rgb(var(--accent-500) / 0.5)" }}
          aria-hidden
        />
        {/* base track */}
        <div className="absolute inset-2 rounded-full border-2 border-white/10" />
        {/* spinning accent arc */}
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent boot-orbit"
          style={{ borderTopColor: "rgb(var(--accent-500))" }}
          aria-hidden
        />
        {/* orbiting dot */}
        <div className="absolute inset-2 boot-orbit" aria-hidden>
          <span
            className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full"
            style={{
              background: "rgb(var(--accent-500))",
              boxShadow: "0 0 12px 2px rgb(var(--accent-500) / 0.8)",
            }}
          />
        </div>
        {/* brand tile — real logo (favicon) with initial fallback */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`relative h-11 w-11 rounded-2xl overflow-hidden flex items-center justify-center ring-1 ring-white/15 shadow-lg transition-colors ${
              logo ? "bg-white" : "bg-accent-500"
            }`}
          >
            <span
              className={`font-bold text-lg text-white ${logo ? "opacity-0" : "opacity-100"}`}
            >
              {initial}
            </span>
            {domain && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                alt=""
                className={`absolute inset-0 m-auto h-8 w-8 object-contain transition-opacity ${
                  logo ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setLogo(true)}
                onError={() => setLogo(false)}
              />
            )}
          </span>
        </div>
      </div>

      <div className="mt-7 h-1 w-52 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent-500 boot-progress"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>

      <div className="mt-5 text-center animate-fade-up">
        <div className="text-sm font-semibold text-white">
          Built for {prospect}
        </div>
        <div className="text-[11px] text-white/50 mt-0.5 tracking-wide">
          Connecting the ledger…
        </div>
      </div>
    </div>
  );
}
