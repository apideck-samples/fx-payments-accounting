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
};

function truthy(v: string | null): boolean {
  return v === "1" || v === "true" || v === "yes";
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
