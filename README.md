# Stegvis — My First Stock Portfolio

A React single-page app that helps first-time investors build a diversified
portfolio of 20–30 Swedish stocks over time, inspired by the early consumer
versions of Sigmastocks. Each month you tell it how much you can invest, verify
your holdings, and it recommends the optimal buys to steer your portfolio
toward a 25-stock, equal-weight target picked by a factor model.

> **Stegvis** is Swedish for "step by step" — which is exactly how the
> portfolio gets built.

## Features

- **Onboarding** — monthly savings capacity, risk profile
  (Conservative / Balanced / Growth) and optional ethical filters
  (weapons, gambling, fossil fuels).
- **Factor model** — ranks 40 Swedish large/mid caps on Quality
  (profit margin, ROE, cash flow yield), Value (P/E, EV/EBIT), Momentum
  (12-month trend) and Low volatility, with weights set by risk profile.
  The top 25 after ethical filters form the target portfolio.
- **Monthly buy flow** — enter this month's amount, verify/edit current
  holdings, get a recommendation that allocates the budget to the most
  underweight positions (whole shares only), confirm, and the holdings log
  updates.
- **Dashboard** — total invested, portfolio value, holdings count,
  completion % toward the 25-stock target, sector allocation chart and
  investment history.
- **Persistence** — holdings, settings and history are stored in
  `localStorage` and survive reloads.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed URL (default `http://localhost:5173`).

## Data

Prices, 12-month momentum and 12-month volatility are **live** — fetched
daily (weekdays, after Stockholm close) from Yahoo Finance's free, no-key
chart data by `scripts/fetch-prices.mjs` running in
`.github/workflows/update-prices.yml` (see that script's header comment for
why Yahoo rather than Stooq, which was tried first).
The result is committed to `src/data/prices.json` and bundled at build time;
see the top of `src/data/stocks.js` for the merge logic and fallback
behaviour if a ticker's fetch fails.

Fundamentals (P/E, EV/EBIT, margins, ROE, cash-flow yield) are **hand-curated**
in `src/data/stocks.js` from public company reports, refreshed roughly
quarterly — they change slowly enough that this doesn't need to be live, and
there's no free, redistributable source for them the way there is for price
history.

This app deliberately does **not** integrate Börsdata: its API terms only
permit delivery of data to private individuals for their own analysis, and
explicitly prohibit building an external system/website/widget that displays
API data — including a "bring your own key" design where each visitor
supplies their own key. If you want Börsdata data for your own analysis, use
their own site, Excel plugin, or Google Sheets add-on instead.

## Tech

- React 19 + Vite
- Tailwind CSS v4
- No backend — everything runs client-side; the only server-side piece is
  the daily GitHub Actions price fetch above

## Disclaimer

Nothing in this app is investment advice. Prices are delayed (previous
close) and fundamentals are periodically curated, not live — don't use
either for actual trading decisions.
