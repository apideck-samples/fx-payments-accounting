"use client";
import { useEffect, useState } from "react";
import { isErpService } from "./erpTheme";

export type UseCase = "payments" | "bankfeed";

export type LaunchParams = {
  /** Source the user arrived from — `apideck-samples` shows a welcome banner. */
  source: string | null;
  /** Optional ERP connector to pre-select in the connect step. */
  service: string | null;
  /** Optional consumer id forwarded into Apideck calls. */
  consumerId: string | null;
  /** Brand override — set ?for=Acme&domain=acme.com to brand the demo for a
   *  company without editing any file. Neutral param names keep the shared
   *  URL friendly (?for / ?company for the label, ?domain / ?logo for the icon). */
  prospectDomain: string | null;
  prospectName: string | null;
  /** Which flow to open first — ?usecase=bankfeed for the bank-feed story. */
  useCase: UseCase | null;
  /** Show the embedded-in-ERP surface (Embeddable badges + callout). Off by
   *  default; enable with ?embedded=1 (or true/yes). */
  embedded: boolean;
  /** Prospect brand color as an "R G B" triplet (from ?color=), or null. */
  primaryColor: string | null;
};

function truthy(v: string | null): boolean {
  return v === "1" || v === "true" || v === "yes";
}

/** Parse a hex color (#rrggbb, rrggbb, #rgb) into a "R G B" triplet, or null. */
export function hexToRgbTriplet(raw: string | null): string | null {
  if (!raw) return null;
  let h = raw.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Darken an "R G B" triplet by `amount` (0–1) for hover shades. */
export function darkenTriplet(triplet: string, amount = 0.14): string {
  return triplet
    .split(" ")
    .map((n) => Math.max(0, Math.round(Number(n) * (1 - amount))))
    .join(" ");
}

function parse(search: string): LaunchParams {
  const p = new URLSearchParams(search);
  const svc = p.get("service");
  const uc = (p.get("usecase") ?? p.get("use_case"))?.toLowerCase();
  return {
    source: p.get("source") ?? p.get("utm_source"),
    service: isErpService(svc) ? svc : null,
    consumerId: p.get("consumer_id") ?? p.get("consumer"),
    prospectDomain: p.get("domain") ?? p.get("logo"),
    prospectName: p.get("for") ?? p.get("company"),
    useCase: uc === "bankfeed" || uc === "payments" ? (uc as UseCase) : null,
    embedded: truthy(p.get("embedded")),
    primaryColor: hexToRgbTriplet(p.get("color") ?? p.get("primary")),
  };
}

const EMPTY: LaunchParams = {
  source: null,
  service: null,
  consumerId: null,
  prospectDomain: null,
  prospectName: null,
  useCase: null,
  embedded: false,
  primaryColor: null,
};

export function useLaunchParams(): LaunchParams {
  const [params, setParams] = useState<LaunchParams>(EMPTY);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setParams(parse(window.location.search));
  }, []);
  return params;
}

/** The prospect this demo is branded for. Uses the caller's fallback name/domain
 *  unless overridden by ?prospect_name (label) / ?prospect (favicon domain). */
export function useProspect(
  fallbackName = "Nimbus FX",
  fallbackDomain: string | null = null
): { name: string; domain: string | null } {
  const launch = useLaunchParams();
  const name = launch.prospectName ?? fallbackName;
  const domain =
    launch.prospectDomain ?? (launch.prospectName ? null : fallbackDomain);
  return { name, domain };
}
