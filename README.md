# Apideck FX Payments — Cross-border reconciliation & bank feeds, any ledger

An interactive walkthrough for **FX / cross-border payments platforms**. It has
**two flows**, switchable at the top of the page, because the accounting need
differs by product shape:

- **FX Payments** — a payment *rails* provider reconciling cross-border
  payments into the customer's ERP (bills → payment + realized FX gain/loss).
- **Bank Feeds** — a multi-currency *accounts* provider streaming each
  wallet into the customer's ledger as a native bank feed.

Both run on the same Apideck unified **Accounting API** — different endpoints,
one integration. The whole demo is tied to **one brand** (a fictional FX
provider by default), overridable via `?for=` / `?domain=` — so both flows carry
the same brand. Deep-link a flow with `?usecase=payments` or `?usecase=bankfeed`,
and brand it for any company with `?for=Acme%20FX&domain=acme.com` (no code change).

## FX Payments flow

Shows the closed loop that Apideck's unified **Accounting API** unlocks:

1. **Connect** the customer's ERP once through Apideck Vault.
2. **Read** their _approved_ payables — each in the supplier's own currency —
   straight out of the ledger.
3. **Settle** each one on your own FX rails (your pricing, your margin, your
   fee — this step is _yours_, not an Apideck call).
4. **Write back** into the ERP: a `payment` at the rate you actually settled,
   plus a `journal-entry` booking the realized **FX gain/loss** and your fee.
5. The customer's books **reconcile themselves**.

The whole point: you build this **once** against Apideck and it works across
**NetSuite, QuickBooks, Xero, Sage Intacct, Business Central and Exact Online** —
swap `x-apideck-service-id` and nothing else changes. That's what lets an FX
provider **embed its payment rails inside an ERP** like NetSuite without a
per-platform integration.

> Part of the [Apideck samples](https://github.com/apideck-samples) — see
> [Related samples](#related-samples) below.

## Runs with zero credentials

Every call hits a local mock (`/api/apideck/*`) that mirrors the real
[Apideck unified Accounting API](https://developers.apideck.com/apis/accounting)
request/response shapes. Add credentials to flip the in-app **Mock → Live**
toggle and proxy the exact same calls to `unify.apideck.com`.

```bash
npm install
npm run dev
# → http://localhost:3000
```

Go live (optional):

```bash
cp .env.example .env.local   # add APIDECK_API_KEY + APIDECK_APP_ID
```

## The scenario

**Lumen Interiors GmbH** (EUR-based) owes four overseas suppliers, each in a
different currency — USD, GBP, JPY, SGD. The demo prices each corridor at
interbank mid + 30 bps, settles, and books the realized FX delta vs. the rate
the bill was originally recorded at. You'll see a mix of FX **gains and losses**
across the four — exactly what finance teams need reconciled.

## The Apideck calls

| Step | Call | Purpose |
|------|------|---------|
| Connect | `POST /vault/sessions` → **`@apideck/vault-js`** | Create a session, then open the Vault widget for one-time ERP authorization |
| Read payables | `GET /accounting/bills?filter[status]=authorised` | The payment demand, in supplier currency |
| _(Settle)_ | — | Your FX rails. Not Apideck. |
| Resolve FX account | `GET /accounting/ledger-accounts` | Locate the customer's realized-FX account (guide's step 1) instead of hard-coding |
| Write payment | `POST /accounting/payments` | Recorded at `currency` + `currency_rate` you settled, allocated to the bill |
| Book FX | `POST /accounting/journal-entries` | Balanced entry: realized FX gain/loss + your fee, posted to the resolved account |

This mirrors the flow in Apideck's own guide,
[Handling FX Payments with the Accounting API](https://developers.apideck.com/guides/fx-payments-accounting-api):
resolve the realized-FX ledger account, book at the rate-on-document, then post
the realized variance at settlement.

### The Vault widget

The Connect step calls `POST /vault/sessions` and then opens Apideck Vault:

- **Live mode** (credentials set) — the session returns a real JWT and the demo
  opens the actual **`@apideck/vault-js`** drop-in, scoped to
  `unifiedApi: "accounting"` and the chosen `serviceId`.
- **Mock mode** (no credentials) — there's no real token, so it opens a faithful
  stand-in modal with the same authorize UX.

Vault presents Apideck's full catalog of **45+ ERP & accounting connectors**;
the six cards in the picker are just the ones this demo highlights.

Multi-currency is native to the unified model — `currency` + `currency_rate`
travel on bills, payments and journal entries alike, so the FX story maps onto
the same fields every connector already understands.

## Bank Feeds flow

For a provider whose product is multi-currency *accounts*, the natural
integration is a **bank feed**: each wallet appears in the customer's ledger as
a bank account and its transactions (collections, conversions, fees, payouts)
reconcile automatically.

| Step | Call | Purpose |
|------|------|---------|
| Connect | `POST /vault/sessions` → `@apideck/vault-js` | Authorize the ledger (QuickBooks / Xero / NetSuite) |
| Wallets | — | The provider's own multi-currency balances (not an Apideck call) |
| Register account | `POST /accounting/bank-feed-accounts` | Register each currency wallet as a bank account |
| Push statement | `POST /accounting/bank-feed-statements` | Stream the wallet's transactions for matching |

**Honest coverage note:** bank feeds are a narrower set than the 45+ unified
connectors — **Xero** is live, **QuickBooks** (Intuit Bank Feeds) is in
development, and **NetSuite** works via the customer-installed Apideck Bank Feed
bundle. Lead with Xero; treat the rest as roadmap. (See the companion
[`bank-feeds-sync`](https://github.com/apideck-samples/bank-feeds-sync) sample
for the raw end-user-setup flow.)

## Brand it for a company

No env file needed — pass query params:

```
?usecase=bankfeed                               # open the bank-feed flow
?usecase=payments                               # open the payments flow (default)
?for=Acme%20FX&domain=acme.com                   # brand: label + favicon
?color=635bff                                    # brand: primary/accent color (hex) — themes the whole UI
?service=xero                                    # pre-select the connector
?embedded=1                                      # show embedded-in-ERP badges + callout (off by default)
?consumer=acme-gmbh                              # forwarded as x-apideck-consumer-id
?source=apideck-samples                          # shows the "launched from" banner
```

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind — matches the sample family
- No client SDK required; calls go through a local proxy that mirrors Apideck
- Mock/live toggle via an `apideck-mode` cookie read server-side

## Confirm before production

- **Bill status filter** — connectors differ on the value that means
  "approved to pay" (`authorised`, `open`, `submitted`). Confirm per connector.
- **`currency_rate` direction** — validate whether a given connector expects
  home-per-foreign or foreign-per-home, and set it accordingly.
- **FX gain/loss account** — map to the customer's actual realized-FX ledger
  account (here `7200`) rather than a hard-coded one; pull it from
  `GET /accounting/ledger-accounts`.
- **Idempotency** — key payments/journal entries on your settlement id so a
  retry can't double-post.

## Related samples

Other open-source samples in the [`apideck-samples`](https://github.com/apideck-samples) org:

- [**accounting**](https://github.com/apideck-samples/accounting) — general Apideck Accounting API sample.
- [**bank-feeds-sync**](https://github.com/apideck-samples/bank-feeds-sync) — Bank Feeds API onboarding + continuous push to Xero, QuickBooks, Sage, FreshBooks.
- [**vault**](https://github.com/apideck-samples/vault) — managing integration settings with the Vault API.
- [**hris-employees-sync**](https://github.com/apideck-samples/hris-employees-sync) — sync employees across HRIS providers, onboard via MCP, listen to lifecycle webhooks.
- [**smb-suite**](https://github.com/apideck-samples/smb-suite) — unified Accounting + HRIS feed powering an SMB business-health dashboard and bank-side lending view.
