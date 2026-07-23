"use client";
import { useEffect, useState } from "react";

// A brief, branded boot splash. Uses the dynamic accent (so it's already in the
// prospect's color), plays an orbiting ring + progress sweep, then fades out.
export default function BootLoader({ prospect }: { prospect: string }) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1150);
    const t2 = setTimeout(() => setPhase("gone"), 1650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;
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
        {/* brand tile */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-11 w-11 rounded-2xl bg-accent-500 text-white flex items-center justify-center font-bold text-lg ring-1 ring-white/15 shadow-lg">
            {initial}
          </span>
        </div>
      </div>

      <div className="mt-7 h-1 w-52 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent-500 boot-progress" />
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
