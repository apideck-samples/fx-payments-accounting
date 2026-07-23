"use client";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

// Analytics for the hosted demo. Matches the Apideck PostHog setup (EU cloud via
// the svc.apideck.com reverse proxy, manual pageviews, no autocapture). It is
// fully env-gated: with no NEXT_PUBLIC_POSTHOG_KEY (the default in the open-
// source repo) posthog is never initialized and every capture() is a safe no-op,
// so forks never send events. The live deploy sets the key as a Vercel env var.
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || typeof window === "undefined") return;
    if ((posthog as unknown as { __loaded?: boolean }).__loaded) return;

    const options: Record<string, unknown> = {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://svc.apideck.com",
      ui_host: "https://eu.posthog.com",
      capture_pageview: false, // captured manually in PostHogTracking
      capture_pageleave: true,
      autocapture: false,
      person_profiles: "identified_only",
      persistence: "localStorage+cookie",
      loaded: (ph: typeof posthog) => {
        if (process.env.NODE_ENV === "development") ph.debug();
        try {
          ph.register({ site_section: "samples", source: "fx-payments-sample" });
        } catch {
          /* noop */
        }
      },
    };

    // Cross-subdomain cookies only when actually served from apideck.com
    // (e.g. embedded on the marketing site) — never on vercel.app.
    if (window.location.hostname.endsWith("apideck.com")) {
      options.cookie_domain = ".apideck.com";
      options.cross_subdomain_cookie = true;
    }

    posthog.init(key, options);
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
