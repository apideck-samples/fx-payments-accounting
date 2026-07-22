"use client";
import { useState } from "react";
import { Check, ChevronDown, Copy, Loader2, Play } from "lucide-react";

export type ApiResult =
  | { state: "idle" }
  | { state: "running" }
  | { state: "success"; status: number; data: unknown; ms: number }
  | { state: "error"; status: number; data: unknown; ms: number };

export default function MockApiCall({
  method,
  endpoint,
  headers,
  body,
  result,
  onRun,
  expanded = true,
  setExpanded,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  headers?: Record<string, string>;
  body?: unknown;
  result: ApiResult;
  onRun: () => void | Promise<void>;
  expanded?: boolean;
  setExpanded?: (v: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const running = result.state === "running";
  const done = result.state === "success" || result.state === "error";

  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    POST: "bg-accent-500/15 text-accent-500 ring-accent-500/30",
    PUT: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    DELETE: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    PATCH: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const headerEl = (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 ring-1 ring-white/10 rounded-t-lg">
      <span
        className={`text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded ring-1 ${methodColors[method]}`}
      >
        {method}
      </span>
      <code className="text-xs text-zinc-200 font-mono truncate flex-1">
        {endpoint}
      </code>
      {result.state === "success" && (
        <span className="text-[10px] text-emerald-300">
          {result.status} · {result.ms}ms
        </span>
      )}
      {result.state === "error" && (
        <span className="text-[10px] text-rose-300">
          {result.status} · {result.ms}ms
        </span>
      )}
      {setExpanded && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-zinc-500 hover:text-zinc-200"
        >
          <ChevronDown
            className={`w-4 h-4 transition ${expanded ? "" : "-rotate-90"}`}
          />
        </button>
      )}
    </div>
  );

  return (
    <div className="code-panel rounded-lg overflow-hidden ring-1 ring-white/5">
      {headerEl}
      {expanded && (
        <div className="bg-zinc-950">
          {headers && Object.keys(headers).length > 0 && (
            <div className="border-b border-white/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Headers
              </div>
              <div className="space-y-0.5 text-[11px] font-mono">
                {Object.entries(headers).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-zinc-500">{k}:</span>
                    <span className="text-zinc-300 truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {body !== undefined && (
            <div className="border-b border-white/5">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Request body
                </span>
                <button
                  onClick={() => copy(JSON.stringify(body, null, 2))}
                  className="text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1 text-[10px]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" /> copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> copy
                    </>
                  )}
                </button>
              </div>
              <pre className="px-3 pb-3 text-[11px] leading-relaxed text-zinc-300 font-mono whitespace-pre-wrap break-words max-h-56 overflow-auto dark-scroll">
                {JSON.stringify(body, null, 2)}
              </pre>
            </div>
          )}

          {(result.state === "success" || result.state === "error") && (
            <div className="border-b border-white/5">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Response
                </span>
                <button
                  onClick={() =>
                    copy(JSON.stringify((result as any).data, null, 2))
                  }
                  className="text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1 text-[10px]"
                >
                  <Copy className="w-3 h-3" /> copy
                </button>
              </div>
              <pre className="px-3 pb-3 text-[11px] leading-relaxed text-emerald-200 font-mono whitespace-pre-wrap break-words max-h-72 overflow-auto dark-scroll">
                {JSON.stringify(
                  (result as { data: unknown }).data,
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          <div className="px-3 py-2 flex items-center gap-2 bg-zinc-900/40">
            <button
              type="button"
              onClick={onRun}
              disabled={running}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-accent-500 hover:bg-accent-600 text-white font-medium disabled:opacity-60"
            >
              {running ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : done ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {running ? "Sending…" : done ? "Run again" : "Send request"}
            </button>
            {result.state === "success" && (
              <span className="text-[10px] text-emerald-400 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Success
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
