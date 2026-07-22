"use client";

// Thin browser-side wrapper around the local /api/apideck proxy. Adds the
// Apideck scoping headers (app-id, consumer-id, service-id) the same way a
// real integration would, times the round-trip, and reports whether the
// response came from live Apideck or the bundled mock (x-apideck-source).

export type CallResult = {
  ok: boolean;
  status: number;
  data: unknown;
  ms: number;
  source: string; // "live" | "mock" | "live-error"
};

export function apideckHeaders(consumerId: string, serviceId: string) {
  return {
    "Content-Type": "application/json",
    "x-apideck-app-id": "demo-app-id",
    "x-apideck-consumer-id": consumerId,
    "x-apideck-service-id": serviceId,
  } as Record<string, string>;
}

export async function callApideck(
  method: "GET" | "POST",
  path: string,
  consumerId: string,
  serviceId: string,
  body?: unknown
): Promise<CallResult> {
  const start = performance.now();
  const res = await fetch(`/api/apideck/${path}`, {
    method,
    headers: apideckHeaders(consumerId, serviceId),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const ms = Math.round(performance.now() - start);
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return {
    ok: res.ok,
    status: res.status,
    data,
    ms,
    source: res.headers.get("x-apideck-source") ?? "mock",
  };
}
