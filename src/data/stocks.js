/**
 * ============================================================================
 * STOCK UNIVERSE — Swedish large & mid cap
 * ============================================================================
 *
 * price / momentum12m / volatility12m are LIVE, sourced daily from Stooq
 * (free, delayed end-of-day close data — see scripts/fetch-prices.mjs and
 * .github/workflows/update-prices.yml) and merged in below from
 * src/data/prices.json, which that workflow regenerates and commits once
 * per weekday after Stockholm close. mockPrice / mockMomentum12m /
 * mockVolatility12m are the fallback used only for a stock the fetch
 * couldn't resolve (see PRICES_AS_OF for the live snapshot's date).
 *
 * pe / evEbit / profitMargin / roe / cashFlowYield are fundamentals and stay
 * hand-curated — update them from company reports roughly once a quarter,
 * since they don't move week to week and there's no free, redistributable
 * source for them the way there is for price history.
 *
 * NOTE ON BÖRSDATA: this app deliberately does NOT integrate Börsdata.
 * Börsdata's API terms only permit delivery of data to private individuals
 * for their own analysis, and explicitly prohibit building an external
 * system/website/widget that displays API data — including one where each
 * user supplies their own key. That rules out using it here, even gated
 * behind a personal setting. Use Börsdata directly (their own site, Excel
 * plugin or Google Sheets add-on) for private analysis instead.
 *
 * Field reference:
 *   price          – last close, SEK (live, daily)
 *   pe             – price / earnings, trailing 12m (curated)
 *   evEbit         – enterprise value / EBIT, trailing 12m (curated)
 *   profitMargin   – net margin, fraction (curated)
 *   roe            – return on equity, fraction (curated)
 *   cashFlowYield  – free cash flow / market cap, fraction (curated)
 *   momentum12m    – 12-month total price return, fraction (live, daily)
 *   volatility12m  – 12-month std-dev of weekly returns, annualised (live, daily)
 *   flags          – ESG exclusion flags used by the ethical filters
 * ============================================================================
 */

import priceData from './prices.json'

export const SECTORS = [
  'Industrials',
  'Technology',
  'Banks & Financials',
  'Healthcare',
  'Consumer',
  'Telecom',
  'Materials',
  'Energy',
  'Real Estate & Construction',
  'Gaming & Entertainment',
]

// prettier-ignore
const STOCKS_BASE = [
  { id: 'VOLV-B',  ticker: 'VOLV B',  name: 'Volvo B',                    sector: 'Industrials',                mockPrice: 268.40, pe: 11.2, evEbit:  9.1, profitMargin: 0.092, roe: 0.232, cashFlowYield: 0.078, mockMomentum12m:  0.14, mockVolatility12m: 0.24, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ERIC-B',  ticker: 'ERIC B',  name: 'Ericsson B',                 sector: 'Technology',                 mockPrice:  62.15, pe: 17.8, evEbit: 13.4, profitMargin: 0.041, roe: 0.083, cashFlowYield: 0.064, mockMomentum12m:  0.06, mockVolatility12m: 0.33, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ATCO-A',  ticker: 'ATCO A',  name: 'Atlas Copco A',              sector: 'Industrials',                mockPrice: 172.30, pe: 27.5, evEbit: 21.8, profitMargin: 0.184, roe: 0.288, cashFlowYield: 0.034, mockMomentum12m:  0.11, mockVolatility12m: 0.22, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'HEXA-B',  ticker: 'HEXA B',  name: 'Hexagon B',                  sector: 'Technology',                 mockPrice: 102.85, pe: 22.4, evEbit: 18.9, profitMargin: 0.176, roe: 0.121, cashFlowYield: 0.041, mockMomentum12m: -0.04, mockVolatility12m: 0.29, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SEB-A',   ticker: 'SEB A',   name: 'SEB A',                      sector: 'Banks & Financials',         mockPrice: 156.70, pe:  8.9, evEbit:  7.6, profitMargin: 0.412, roe: 0.158, cashFlowYield: 0.088, mockMomentum12m:  0.09, mockVolatility12m: 0.20, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SHB-A',   ticker: 'SHB A',   name: 'Handelsbanken A',            sector: 'Banks & Financials',         mockPrice: 118.45, pe:  8.2, evEbit:  7.1, profitMargin: 0.438, roe: 0.129, cashFlowYield: 0.092, mockMomentum12m:  0.04, mockVolatility12m: 0.18, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SWED-A',  ticker: 'SWED A',  name: 'Swedbank A',                 sector: 'Banks & Financials',         mockPrice: 224.90, pe:  7.8, evEbit:  6.9, profitMargin: 0.446, roe: 0.164, cashFlowYield: 0.095, mockMomentum12m:  0.12, mockVolatility12m: 0.21, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'NDA-SE',  ticker: 'NDA SE',  name: 'Nordea Bank',                sector: 'Banks & Financials',         mockPrice: 128.35, pe:  8.5, evEbit:  7.4, profitMargin: 0.421, roe: 0.151, cashFlowYield: 0.090, mockMomentum12m:  0.07, mockVolatility12m: 0.19, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'INVE-B',  ticker: 'INVE B',  name: 'Investor B',                 sector: 'Banks & Financials',         mockPrice: 296.55, pe: 14.6, evEbit: 12.2, profitMargin: 0.310, roe: 0.118, cashFlowYield: 0.046, mockMomentum12m:  0.13, mockVolatility12m: 0.17, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'AZN',     ticker: 'AZN',     name: 'AstraZeneca',                sector: 'Healthcare',                 mockPrice: 1342.00, pe: 28.9, evEbit: 22.6, profitMargin: 0.158, roe: 0.183, cashFlowYield: 0.038, mockMomentum12m:  0.08, mockVolatility12m: 0.16, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'HM-B',    ticker: 'HM B',    name: 'H&M B',                      sector: 'Consumer',                   mockPrice: 148.25, pe: 19.6, evEbit: 14.8, profitMargin: 0.052, roe: 0.196, cashFlowYield: 0.058, mockMomentum12m: -0.11, mockVolatility12m: 0.31, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SAND',    ticker: 'SAND',    name: 'Sandvik',                    sector: 'Industrials',                mockPrice: 218.60, pe: 16.4, evEbit: 13.1, profitMargin: 0.128, roe: 0.172, cashFlowYield: 0.052, mockMomentum12m:  0.10, mockVolatility12m: 0.23, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ABB',     ticker: 'ABB',     name: 'ABB Ltd',                    sector: 'Industrials',                mockPrice: 562.80, pe: 24.1, evEbit: 19.3, profitMargin: 0.142, roe: 0.224, cashFlowYield: 0.039, mockMomentum12m:  0.22, mockVolatility12m: 0.21, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ASSA-B',  ticker: 'ASSA B',  name: 'Assa Abloy B',               sector: 'Industrials',                mockPrice: 318.95, pe: 21.7, evEbit: 17.2, profitMargin: 0.124, roe: 0.168, cashFlowYield: 0.044, mockMomentum12m:  0.05, mockVolatility12m: 0.19, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ALFA',    ticker: 'ALFA',    name: 'Alfa Laval',                 sector: 'Industrials',                mockPrice: 428.10, pe: 23.8, evEbit: 18.6, profitMargin: 0.118, roe: 0.192, cashFlowYield: 0.036, mockMomentum12m:  0.17, mockVolatility12m: 0.25, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SKF-B',   ticker: 'SKF B',   name: 'SKF B',                      sector: 'Industrials',                mockPrice: 208.75, pe: 12.6, evEbit: 10.4, profitMargin: 0.086, roe: 0.148, cashFlowYield: 0.068, mockMomentum12m:  0.03, mockVolatility12m: 0.27, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'EPI-A',   ticker: 'EPI A',   name: 'Epiroc A',                   sector: 'Industrials',                mockPrice: 198.20, pe: 25.3, evEbit: 20.1, profitMargin: 0.172, roe: 0.246, cashFlowYield: 0.033, mockMomentum12m:  0.02, mockVolatility12m: 0.24, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'TELIA',   ticker: 'TELIA',   name: 'Telia Company',              sector: 'Telecom',                    mockPrice:  31.85, pe: 15.2, evEbit: 12.8, profitMargin: 0.064, roe: 0.072, cashFlowYield: 0.082, mockMomentum12m:  0.18, mockVolatility12m: 0.15, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'TEL2-B',  ticker: 'TEL2 B',  name: 'Tele2 B',                    sector: 'Telecom',                    mockPrice: 128.60, pe: 18.4, evEbit: 14.2, profitMargin: 0.118, roe: 0.142, cashFlowYield: 0.071, mockMomentum12m:  0.24, mockVolatility12m: 0.16, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ESSITY-B',ticker: 'ESSITY B',name: 'Essity B',                   sector: 'Consumer',                   mockPrice: 284.30, pe: 16.8, evEbit: 13.9, profitMargin: 0.098, roe: 0.176, cashFlowYield: 0.061, mockMomentum12m:  0.07, mockVolatility12m: 0.14, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'EVO',     ticker: 'EVO',     name: 'Evolution',                  sector: 'Gaming & Entertainment',     mockPrice: 786.40, pe: 14.9, evEbit: 12.6, profitMargin: 0.582, roe: 0.328, cashFlowYield: 0.066, mockMomentum12m: -0.18, mockVolatility12m: 0.38, flags: { weapons: false, gambling: true,  fossilFuels: false } },
  { id: 'BETS-B',  ticker: 'BETS B',  name: 'Betsson B',                  sector: 'Gaming & Entertainment',     mockPrice: 148.90, pe: 10.8, evEbit:  8.9, profitMargin: 0.218, roe: 0.242, cashFlowYield: 0.084, mockMomentum12m:  0.28, mockVolatility12m: 0.32, flags: { weapons: false, gambling: true,  fossilFuels: false } },
  { id: 'SAAB-B',  ticker: 'SAAB B',  name: 'Saab B',                     sector: 'Industrials',                mockPrice: 412.55, pe: 32.6, evEbit: 26.4, profitMargin: 0.078, roe: 0.158, cashFlowYield: 0.028, mockMomentum12m:  0.46, mockVolatility12m: 0.36, flags: { weapons: true,  gambling: false, fossilFuels: false } },
  { id: 'TETY',    ticker: 'TETY',    name: 'Tethys Oil',                 sector: 'Energy',                     mockPrice:  58.20, pe:  7.4, evEbit:  5.8, profitMargin: 0.246, roe: 0.118, cashFlowYield: 0.112, mockMomentum12m: -0.22, mockVolatility12m: 0.41, flags: { weapons: false, gambling: false, fossilFuels: true  } },
  { id: 'IPCO',    ticker: 'IPCO',    name: 'International Petroleum',    sector: 'Energy',                     mockPrice: 142.75, pe:  9.2, evEbit:  7.3, profitMargin: 0.228, roe: 0.186, cashFlowYield: 0.098, mockMomentum12m:  0.19, mockVolatility12m: 0.37, flags: { weapons: false, gambling: false, fossilFuels: true  } },
  { id: 'BOL',     ticker: 'BOL',     name: 'Boliden',                    sector: 'Materials',                  mockPrice: 348.65, pe: 11.8, evEbit:  9.6, profitMargin: 0.108, roe: 0.154, cashFlowYield: 0.072, mockMomentum12m:  0.16, mockVolatility12m: 0.30, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SSAB-A',  ticker: 'SSAB A',  name: 'SSAB A',                     sector: 'Materials',                  mockPrice:  62.40, pe:  8.6, evEbit:  6.8, profitMargin: 0.094, roe: 0.112, cashFlowYield: 0.104, mockMomentum12m: -0.08, mockVolatility12m: 0.34, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SECU-B',  ticker: 'SECU B',  name: 'Securitas B',                sector: 'Industrials',                mockPrice: 132.20, pe: 13.4, evEbit: 11.2, profitMargin: 0.042, roe: 0.134, cashFlowYield: 0.076, mockMomentum12m:  0.21, mockVolatility12m: 0.22, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ELUX-B',  ticker: 'ELUX B',  name: 'Electrolux B',               sector: 'Consumer',                   mockPrice:  92.65, pe: 21.2, evEbit: 15.6, profitMargin: 0.018, roe: 0.062, cashFlowYield: 0.048, mockMomentum12m: -0.14, mockVolatility12m: 0.39, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'GETI-B',  ticker: 'GETI B',  name: 'Getinge B',                  sector: 'Healthcare',                 mockPrice: 188.45, pe: 17.6, evEbit: 14.1, profitMargin: 0.082, roe: 0.094, cashFlowYield: 0.054, mockMomentum12m: -0.06, mockVolatility12m: 0.28, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'EKTA-B',  ticker: 'EKTA B',  name: 'Elekta B',                   sector: 'Healthcare',                 mockPrice:  68.30, pe: 19.4, evEbit: 15.8, profitMargin: 0.058, roe: 0.088, cashFlowYield: 0.051, mockMomentum12m: -0.09, mockVolatility12m: 0.30, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'HUSQ-B',  ticker: 'HUSQ B',  name: 'Husqvarna B',                sector: 'Consumer',                   mockPrice:  64.85, pe: 14.2, evEbit: 11.8, profitMargin: 0.048, roe: 0.116, cashFlowYield: 0.069, mockMomentum12m: -0.03, mockVolatility12m: 0.29, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'TREL-B',  ticker: 'TREL B',  name: 'Trelleborg B',               sector: 'Industrials',                mockPrice: 384.90, pe: 15.8, evEbit: 12.9, profitMargin: 0.112, roe: 0.128, cashFlowYield: 0.058, mockMomentum12m:  0.12, mockVolatility12m: 0.21, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'AXFO',    ticker: 'AXFO',    name: 'Axfood',                     sector: 'Consumer',                   mockPrice: 248.70, pe: 22.6, evEbit: 17.4, profitMargin: 0.034, roe: 0.286, cashFlowYield: 0.049, mockMomentum12m:  0.06, mockVolatility12m: 0.13, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SKA-B',   ticker: 'SKA B',   name: 'Skanska B',                  sector: 'Real Estate & Construction', mockPrice: 218.30, pe: 13.1, evEbit: 10.8, profitMargin: 0.036, roe: 0.122, cashFlowYield: 0.074, mockMomentum12m:  0.15, mockVolatility12m: 0.20, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'AZA',     ticker: 'AZA',     name: 'Avanza Bank',                sector: 'Banks & Financials',         mockPrice: 312.45, pe: 20.8, evEbit: 16.9, profitMargin: 0.486, roe: 0.298, cashFlowYield: 0.042, mockMomentum12m:  0.26, mockVolatility12m: 0.26, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'NIBE-B',  ticker: 'NIBE B',  name: 'NIBE Industrier B',          sector: 'Industrials',                mockPrice:  48.95, pe: 29.4, evEbit: 23.2, profitMargin: 0.068, roe: 0.082, cashFlowYield: 0.026, mockMomentum12m: -0.16, mockVolatility12m: 0.40, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'LIFCO-B', ticker: 'LIFCO B', name: 'Lifco B',                    sector: 'Industrials',                mockPrice: 346.80, pe: 31.2, evEbit: 24.6, profitMargin: 0.138, roe: 0.214, cashFlowYield: 0.029, mockMomentum12m:  0.20, mockVolatility12m: 0.23, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'INDT',    ticker: 'INDT',    name: 'Indutrade',                  sector: 'Industrials',                mockPrice: 268.15, pe: 28.7, evEbit: 22.4, profitMargin: 0.112, roe: 0.198, cashFlowYield: 0.031, mockMomentum12m:  0.09, mockVolatility12m: 0.22, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'AFRY',    ticker: 'AFRY',    name: 'AFRY',                       sector: 'Industrials',                mockPrice: 168.50, pe: 14.8, evEbit: 12.1, profitMargin: 0.054, roe: 0.108, cashFlowYield: 0.066, mockMomentum12m:  0.01, mockVolatility12m: 0.25, flags: { weapons: false, gambling: false, fossilFuels: false } },
]

/** Date (YYYY-MM-DD) the live price snapshot in prices.json was fetched, or null before the first run. */
export const PRICES_AS_OF = priceData.asOf ?? null

/**
 * STOCKS_BASE with price/momentum/volatility merged in from the live daily
 * snapshot (prices.json), falling back to the mock* values for any stock
 * the fetch couldn't resolve. `priceIsLive` flags which one a stock got.
 */
export const STOCKS = STOCKS_BASE.map((stock) => {
  const live = priceData.stocks?.[stock.id]
  return {
    ...stock,
    price: live?.price ?? stock.mockPrice,
    momentum12m: live?.momentum12m ?? stock.mockMomentum12m,
    volatility12m: live?.volatility12m ?? stock.mockVolatility12m,
    priceIsLive: Boolean(live),
  }
})

export const RISK_PROFILES = {
  conservative: {
    id: 'conservative',
    label: 'Conservative',
    description: 'Stability first. Favours profitable, low-volatility companies at reasonable prices.',
    weights: { quality: 0.4, value: 0.3, lowVolatility: 0.2, momentum: 0.1 },
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    description: 'A blend of quality, value and trend. A sensible default for most savers.',
    weights: { quality: 0.3, value: 0.3, momentum: 0.25, lowVolatility: 0.15 },
  },
  growth: {
    id: 'growth',
    label: 'Growth',
    description: 'Trend-driven. Leans into momentum while keeping an eye on quality and price.',
    weights: { momentum: 0.4, quality: 0.25, value: 0.25, lowVolatility: 0.1 },
  },
}

export const ETHICAL_FILTERS = [
  { id: 'weapons', label: 'Exclude weapons & defence' },
  { id: 'gambling', label: 'Exclude gambling & betting' },
  { id: 'fossilFuels', label: 'Exclude fossil fuels' },
]

/** Number of stocks in the target portfolio. */
export const TARGET_PORTFOLIO_SIZE = 25
