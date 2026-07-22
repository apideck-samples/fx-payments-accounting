# Contributing

Thanks for your interest in improving this sample! It's a small, self-contained
Next.js app that demonstrates the Apideck unified Accounting API — bug fixes,
clarity improvements, and additional connector notes are all welcome.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000 — runs on bundled mock data
```

No credentials are required: every `/api/apideck/*` call is served by a local
mock that mirrors the real Apideck response shapes. To exercise the live path,
copy `.env.example` to `.env.local`, add your `APIDECK_API_KEY` and
`APIDECK_APP_ID`, and use the in-app **Mock → Live** toggle.

## Before opening a PR

- `npm run build` passes (this also type-checks).
- Keep the two flows (FX Payments, Bank Feeds) working with zero credentials.
- Don't commit secrets. `.env*.local` is gitignored; never hard-code API keys.
- The demo ships **fictional** data only (companies, accounts, amounts). Please
  keep it that way — don't add real customers, prospects, or account numbers.

## Scope

This is a teaching sample, not a production integration. Favor clarity over
cleverness, and mirror the real Apideck request/response shapes so the code is
copy-pasteable into a real integration.

By contributing, you agree that your contributions are licensed under the
project's [MIT license](./LICENSE).
