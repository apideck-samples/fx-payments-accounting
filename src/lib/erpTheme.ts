// The ERP / accounting connectors this demo can target. Apideck normalises all
// of them behind one unified Accounting API, so the same read-payables →
// write-payment code runs against any of them by swapping x-apideck-service-id.
//
// `embedded` marks connectors where FX providers commonly want to live *inside*
// the ERP (handling the payment rails from within the customer's workflow) —
// NetSuite being the canonical example. It only drives a UI hint.

export type ErpService = {
  id: string;
  name: string;
  blurb: string;
  embedded?: boolean;
  /** GA unless marked — "in_development" renders an "In dev" badge. */
  status?: "in_development";
};

export const ERP_SERVICES: ErpService[] = [
  {
    id: "netsuite",
    name: "NetSuite",
    blurb: "Mid-market & enterprise ERP — embed the payment rails in the AP workflow",
    embedded: true,
  },
  {
    id: "business-central",
    name: "Dynamics 365 Business Central",
    blurb: "Microsoft ERP for growing businesses",
    embedded: true,
  },
  {
    id: "sage-intacct",
    name: "Sage Intacct",
    blurb: "Cloud financial management for finance teams",
    embedded: true,
  },
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    blurb: "The SMB standard",
  },
  {
    id: "xero",
    name: "Xero",
    blurb: "Popular with international SMBs",
  },
  {
    id: "exact-online",
    name: "Exact Online",
    blurb: "Widely used across the Benelux",
  },
];

// Bank feeds are supported on a narrower (but growing) set than the full
// unified catalog — QuickBooks (Intuit Bank Feeds) and Xero lead; NetSuite works
// through the customer-installed Apideck Bank Feed bundle. Keep this honest for
// the bank-feeds conversation rather than reusing the "45+ connectors" line.
export const BANK_FEED_SERVICES: ErpService[] = [
  {
    id: "xero",
    name: "Xero",
    blurb: "Bank feeds via the Xero partner program — live",
  },
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    blurb: "Intuit Bank Feeds — coming soon",
    status: "in_development",
  },
  {
    id: "netsuite",
    name: "NetSuite",
    blurb: "Via the customer-installed Apideck Bank Feed bundle",
    embedded: true,
  },
];

export const ERP_BY_ID: Record<string, ErpService> = Object.fromEntries(
  [...ERP_SERVICES, ...BANK_FEED_SERVICES].map((s) => [s.id, s])
);

export function isErpService(id: string | null | undefined): id is string {
  return !!id && id in ERP_BY_ID;
}
