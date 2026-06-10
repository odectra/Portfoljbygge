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

## Mock data & Börsdata

All market data is **mock data** — realistic-looking but invented numbers for
40 real Swedish large/mid cap names. See `src/data/stocks.js`, which also
contains a detailed **BÖRSDATA INTEGRATION** section describing exactly which
Börsdata API endpoints and KPI ids replace each mock field, how to map
instrument ids, subscription tier requirements (Pro for Nordic, Pro Global for
global markets) and a sensible refresh cadence (daily close data). Your own
API key goes in `.env.local` as `VITE_BORSDATA_API_KEY` (see `.env.example`).

## Tech

- React 19 + Vite
- Tailwind CSS v4
- No backend — everything runs client-side

## Disclaimer

This is a demo. Nothing in this app is investment advice, and none of the
displayed prices or fundamentals are real.
