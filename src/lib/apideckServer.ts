// Server-only Apideck helpers.
//
// The demo runs in two modes: when APIDECK_API_KEY + APIDECK_APP_ID are set
// in the environment we proxy the catch-all /api/apideck/* route to the
// real Apideck unified API (unify.apideck.com). When they're unset, the
// route falls back to the bundled mock data in src/lib/mockData.ts.
//
// `import "server-only"` would normally guard this, but we want it usable
// from API routes without forcing the package — these helpers should never
// be imported from a "use client" component.

const APIDECK_BASE = "https://unify.apideck.com";

export type ApideckEnv = {
  apiKey: string;
  appId: string;
  defaultConsumerId: string;
};

export function getApideckEnv(): ApideckEnv | null {
  const apiKey = process.env.APIDECK_API_KEY;
  const appId = process.env.APIDECK_APP_ID;
  if (!apiKey || !appId) return null;
  return {
    apiKey,
    appId,
    defaultConsumerId:
      process.env.APIDECK_DEFAULT_CONSUMER_ID || "northwind-roofing",
  };
}

export function hasApideckCreds(): boolean {
  return getApideckEnv() !== null;
}

export type ProxyOptions = {
  method: string;
  path: string; // e.g. "vault/sessions" or "accounting/invoices?limit=5"
  consumerId: string;
  serviceId?: string;
  body?: unknown;
};

export async function apideckProxy({
  method,
  path,
  consumerId,
  serviceId,
  body,
}: ProxyOptions): Promise<{ status: number; data: unknown }> {
  const env = getApideckEnv();
  if (!env) {
    throw new Error("Apideck credentials not configured");
  }
  const url = `${APIDECK_BASE}/${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.apiKey}`,
    "x-apideck-app-id": env.appId,
    "x-apideck-consumer-id": consumerId,
    "Content-Type": "application/json",
  };
  if (serviceId) headers["x-apideck-service-id"] = serviceId;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}
