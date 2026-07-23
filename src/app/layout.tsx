import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import { PostHogProvider } from "@/components/PostHogProvider";
import PostHogTracking from "@/components/PostHogTracking";

export const metadata: Metadata = {
  title: "Apideck FX Payments — Cross-border reconciliation, any ERP",
  description:
    "How an FX payments platform reads approved payables out of a customer's ERP, settles them on its own rails, and writes the payment + realized FX gain/loss back — through one Apideck unified Accounting integration that works across NetSuite, QuickBooks, Xero and more.",
};

// Restore the user's theme choice before React hydrates so we don't flash
// the wrong mode on first paint. Stored value is "light" | "dark"; default
// is "dark" to match the sample-family aesthetic.
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('apideck-demo-theme');
    var d = t === 'light' ? false : true;
    document.documentElement.classList.toggle('dark', d);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

// Apply a prospect brand color (?color= / ?primary=) to the accent CSS vars
// before first paint — no flash, and the boot loader is already on-brand.
const colorInitScript = `
(function(){
  try {
    var p = new URLSearchParams(location.search);
    var raw = p.get('color') || p.get('primary');
    if (!raw) return;
    var h = raw.replace(/^#/, '').trim();
    if (h.length === 3) h = h.split('').map(function(c){ return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return;
    var r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    var d = function(x){ return Math.max(0, Math.round(x * 0.86)); };
    var el = document.documentElement;
    el.style.setProperty('--accent-500', r + ' ' + g + ' ' + b);
    el.style.setProperty('--accent-600', d(r) + ' ' + d(g) + ' ' + d(b));
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: colorInitScript }} />
      </head>
      <body className="min-h-screen antialiased text-ink-900 dark:text-zinc-100">
        <PostHogProvider>
          <SessionProvider>{children}</SessionProvider>
          <Suspense fallback={null}>
            <PostHogTracking />
          </Suspense>
        </PostHogProvider>
      </body>
    </html>
  );
}
