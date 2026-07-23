"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 100);

function isLikelyBot() {
  if (typeof navigator === "undefined") return false;
  return /HeadlessChrome|puppeteer|playwright|bot|crawler|spider|axios|curl|Go-http-client/i.test(
    navigator.userAgent || ""
  );
}

export default function PostHogTracking() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Register demo context (flow + brand + attribution) so every event carries it.
  useEffect(() => {
    if (!posthog) return;
    const p = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    try {
      posthog.register({
        demo_for: p.get("for") ?? p.get("company") ?? null,
        demo_usecase: p.get("usecase") ?? p.get("use_case") ?? "payments",
        demo_service: p.get("service") ?? null,
        demo_consumer: p.get("consumer") ?? p.get("consumer_id") ?? null,
        demo_source: p.get("source") ?? p.get("utm_source") ?? null,
        demo_embedded: ["1", "true", "yes"].includes(p.get("embedded") ?? ""),
      });
    } catch {
      /* noop */
    }
  }, [posthog]);

  // Manual $pageview (autocapture + capture_pageview are off).
  useEffect(() => {
    if (!posthog || typeof window === "undefined" || isLikelyBot()) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [posthog, pathname, searchParams]);

  // Auto-capture meaningful clicks as `ui_button clicked` (matches the taxonomy
  // used across Apideck properties). Button text maps cleanly to the demo funnel
  // (e.g. "read-approved-payables", "settle-record-all", "view-reconciliation").
  useEffect(() => {
    if (!posthog || typeof window === "undefined") return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const clickable = target?.closest(
        'a, button, [role="button"], [data-click-id]'
      );
      if (!clickable || isLikelyBot()) return;

      const rawText =
        clickable.getAttribute("aria-label") ||
        clickable.textContent?.trim() ||
        "";
      const buttonText = rawText.slice(0, 200);
      const fallbackId =
        clickable.getAttribute("data-click-id") || clickable.id || "";
      const buttonName = toSlug(buttonText || fallbackId || "unknown");

      posthog.capture("ui_button clicked", {
        button_name: buttonName,
        button_text: buttonText || undefined,
        tag: clickable.tagName.toLowerCase(),
        href: clickable.getAttribute("href") || undefined,
        path: window.location.pathname,
        $current_url: window.location.href,
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [posthog]);

  return null;
}
