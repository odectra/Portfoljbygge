/**
 * ============================================================================
 * MOCK STOCK UNIVERSE — Swedish large & mid cap
 * ============================================================================
 *
 * ⚠️  ALL VALUES BELOW ARE MOCK DATA. ⚠️
 * The companies are real Swedish large/mid cap names, but every number
 * (price, P/E, EV/EBIT, margins, momentum, volatility …) is invented for
 * demo purposes and does NOT reflect real market data. Do not use for
 * actual investment decisions.
 *
 * Field reference:
 *   price          – last close, SEK (mock)
 *   pe             – price / earnings, trailing 12m (mock)
 *   evEbit         – enterprise value / EBIT, trailing 12m (mock)
 *   profitMargin   – net margin, fraction (mock)
 *   roe            – return on equity, fraction (mock)
 *   cashFlowYield  – free cash flow / market cap, fraction (mock)
 *   momentum12m    – 12-month total price return, fraction (mock)
 *   volatility12m  – 12-month std-dev of weekly returns, annualised (mock)
 *   flags          – ESG exclusion flags used by the ethical filters
 *
 * ============================================================================
 * BÖRSDATA INTEGRATION
 * ============================================================================
 *
 * To replace this mock dataset with live fundamentals from Börsdata
 * (https://borsdata.se / https://github.com/Borsdata-Sweden/API):
 *
 * 1) API KEY
 *    The user supplies their own API key (issued under their Börsdata Pro
 *    account, "My Account" → API). Store it OUTSIDE the repo:
 *      - Vite env variable:  VITE_BORSDATA_API_KEY in a local `.env.local`
 *        (never committed), read via `import.meta.env.VITE_BORSDATA_API_KEY`, or
 *      - a gitignored `src/config/borsdata.local.js` exporting { apiKey }.
 *    NOTE: calling Börsdata straight from the browser exposes the key; for
 *    production put a tiny proxy (serverless function) in front of it.
 *    Every request: `?authKey=<API_KEY>` against base
 *    `https://apiservice.borsdata.se/v1`.
 *
 * 2) SUBSCRIPTION TIERS / MARKET ACCESS
 *    - Börsdata "Pro"        → API access to NORDIC markets
 *                              (Sweden, Norway, Finland, Denmark).
 *    - Börsdata "Pro Global" → API access to Nordic + GLOBAL markets
 *                              (US, Germany, UK, Canada …).
 *    This app only needs Swedish large/mid cap, so the regular Pro tier is
 *    sufficient. Without Pro, there is no API access at all.
 *
 * 3) ENDPOINT → FIELD MAPPING
 *    - GET /v1/instruments
 *        Master list of instruments. Filter on countryId = 1 (Sweden) and
 *        marketId for Large/Mid Cap. Gives `insId`, `name`, `ticker`,
 *        `sectorId`/`branchId` → maps to our `id`, `name`, `ticker`, `sector`
 *        (resolve sector names via GET /v1/sectors and /v1/branches).
 *    - GET /v1/instruments/{insId}/stockprices?from=...&to=...
 *        Daily OHLC. Use:
 *          price          → latest close
 *          momentum12m    → close(today) / close(252 trading days ago) − 1
 *          volatility12m  → std-dev of weekly log-returns × √52
 *    - GET /v1/instruments/{insId}/kpis/{kpiId}/last/latest   (single KPI)
 *      or the batch endpoint
 *      GET /v1/instruments/kpis/{kpiId}/last/latest           (all instruments)
 *        KPI ids (see GET /v1/instruments/kpis/metadata for the full list):
 *          pe            → KPI  2  (P/E)
 *          evEbit        → KPI 10  (EV/EBIT)
 *          profitMargin  → KPI 30  (Net margin %)
 *          roe           → KPI 33  (Return on Equity %)
 *          cashFlowYield → KPI 76  (FCF margin) or compute FCF / market cap
 *                          from KPI 61 (Market cap) + report data
 *        Verify ids against the metadata endpoint — they are stable but the
 *        metadata endpoint is the source of truth.
 *    - GET /v1/instruments/{insId}/reports?type=year|r12|quarter
 *        Raw report data if you prefer computing ratios yourself.
 *
 * 4) MAPPING INSTRUMENT IDS TO THIS LIST
 *    Add a `borsdataInsId` field to each stock below. Build the mapping once
 *    by fetching /v1/instruments and matching on `ticker` (Börsdata tickers
 *    use the same Nasdaq Stockholm short names, e.g. "VOLV B", "ERIC B").
 *    Match on ticker, fall back to fuzzy name match, then persist the
 *    mapping — instrument ids never change, tickers occasionally do.
 *
 * 5) REFRESH FREQUENCY
 *    Daily close data is sufficient for this strategy: refresh prices once
 *    per day after Stockholm close (~18:00 CET) and KPIs weekly (they only
 *    change when new reports land). Cache responses in localStorage with a
 *    timestamp and skip refetching within the same day — Börsdata rate-limits
 *    at 100 calls / 10 s, so prefer the batch ("all instruments") endpoints.
 * ============================================================================
 */

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
export const STOCKS = [
  { id: 'VOLV-B',  ticker: 'VOLV B',  name: 'Volvo B',                    sector: 'Industrials',                price: 268.40, pe: 11.2, evEbit:  9.1, profitMargin: 0.092, roe: 0.232, cashFlowYield: 0.078, momentum12m:  0.14, volatility12m: 0.24, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ERIC-B',  ticker: 'ERIC B',  name: 'Ericsson B',                 sector: 'Technology',                 price:  62.15, pe: 17.8, evEbit: 13.4, profitMargin: 0.041, roe: 0.083, cashFlowYield: 0.064, momentum12m:  0.06, volatility12m: 0.33, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ATCO-A',  ticker: 'ATCO A',  name: 'Atlas Copco A',              sector: 'Industrials',                price: 172.30, pe: 27.5, evEbit: 21.8, profitMargin: 0.184, roe: 0.288, cashFlowYield: 0.034, momentum12m:  0.11, volatility12m: 0.22, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'HEXA-B',  ticker: 'HEXA B',  name: 'Hexagon B',                  sector: 'Technology',                 price: 102.85, pe: 22.4, evEbit: 18.9, profitMargin: 0.176, roe: 0.121, cashFlowYield: 0.041, momentum12m: -0.04, volatility12m: 0.29, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SEB-A',   ticker: 'SEB A',   name: 'SEB A',                      sector: 'Banks & Financials',         price: 156.70, pe:  8.9, evEbit:  7.6, profitMargin: 0.412, roe: 0.158, cashFlowYield: 0.088, momentum12m:  0.09, volatility12m: 0.20, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SHB-A',   ticker: 'SHB A',   name: 'Handelsbanken A',            sector: 'Banks & Financials',         price: 118.45, pe:  8.2, evEbit:  7.1, profitMargin: 0.438, roe: 0.129, cashFlowYield: 0.092, momentum12m:  0.04, volatility12m: 0.18, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SWED-A',  ticker: 'SWED A',  name: 'Swedbank A',                 sector: 'Banks & Financials',         price: 224.90, pe:  7.8, evEbit:  6.9, profitMargin: 0.446, roe: 0.164, cashFlowYield: 0.095, momentum12m:  0.12, volatility12m: 0.21, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'NDA-SE',  ticker: 'NDA SE',  name: 'Nordea Bank',                sector: 'Banks & Financials',         price: 128.35, pe:  8.5, evEbit:  7.4, profitMargin: 0.421, roe: 0.151, cashFlowYield: 0.090, momentum12m:  0.07, volatility12m: 0.19, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'INVE-B',  ticker: 'INVE B',  name: 'Investor B',                 sector: 'Banks & Financials',         price: 296.55, pe: 14.6, evEbit: 12.2, profitMargin: 0.310, roe: 0.118, cashFlowYield: 0.046, momentum12m:  0.13, volatility12m: 0.17, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'AZN',     ticker: 'AZN',     name: 'AstraZeneca',                sector: 'Healthcare',                 price: 1342.00, pe: 28.9, evEbit: 22.6, profitMargin: 0.158, roe: 0.183, cashFlowYield: 0.038, momentum12m:  0.08, volatility12m: 0.16, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'HM-B',    ticker: 'HM B',    name: 'H&M B',                      sector: 'Consumer',                   price: 148.25, pe: 19.6, evEbit: 14.8, profitMargin: 0.052, roe: 0.196, cashFlowYield: 0.058, momentum12m: -0.11, volatility12m: 0.31, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SAND',    ticker: 'SAND',    name: 'Sandvik',                    sector: 'Industrials',                price: 218.60, pe: 16.4, evEbit: 13.1, profitMargin: 0.128, roe: 0.172, cashFlowYield: 0.052, momentum12m:  0.10, volatility12m: 0.23, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ABB',     ticker: 'ABB',     name: 'ABB Ltd',                    sector: 'Industrials',                price: 562.80, pe: 24.1, evEbit: 19.3, profitMargin: 0.142, roe: 0.224, cashFlowYield: 0.039, momentum12m:  0.22, volatility12m: 0.21, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ASSA-B',  ticker: 'ASSA B',  name: 'Assa Abloy B',               sector: 'Industrials',                price: 318.95, pe: 21.7, evEbit: 17.2, profitMargin: 0.124, roe: 0.168, cashFlowYield: 0.044, momentum12m:  0.05, volatility12m: 0.19, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ALFA',    ticker: 'ALFA',    name: 'Alfa Laval',                 sector: 'Industrials',                price: 428.10, pe: 23.8, evEbit: 18.6, profitMargin: 0.118, roe: 0.192, cashFlowYield: 0.036, momentum12m:  0.17, volatility12m: 0.25, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SKF-B',   ticker: 'SKF B',   name: 'SKF B',                      sector: 'Industrials',                price: 208.75, pe: 12.6, evEbit: 10.4, profitMargin: 0.086, roe: 0.148, cashFlowYield: 0.068, momentum12m:  0.03, volatility12m: 0.27, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'EPI-A',   ticker: 'EPI A',   name: 'Epiroc A',                   sector: 'Industrials',                price: 198.20, pe: 25.3, evEbit: 20.1, profitMargin: 0.172, roe: 0.246, cashFlowYield: 0.033, momentum12m:  0.02, volatility12m: 0.24, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'TELIA',   ticker: 'TELIA',   name: 'Telia Company',              sector: 'Telecom',                    price:  31.85, pe: 15.2, evEbit: 12.8, profitMargin: 0.064, roe: 0.072, cashFlowYield: 0.082, momentum12m:  0.18, volatility12m: 0.15, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'TEL2-B',  ticker: 'TEL2 B',  name: 'Tele2 B',                    sector: 'Telecom',                    price: 128.60, pe: 18.4, evEbit: 14.2, profitMargin: 0.118, roe: 0.142, cashFlowYield: 0.071, momentum12m:  0.24, volatility12m: 0.16, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ESSITY-B',ticker: 'ESSITY B',name: 'Essity B',                   sector: 'Consumer',                   price: 284.30, pe: 16.8, evEbit: 13.9, profitMargin: 0.098, roe: 0.176, cashFlowYield: 0.061, momentum12m:  0.07, volatility12m: 0.14, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'EVO',     ticker: 'EVO',     name: 'Evolution',                  sector: 'Gaming & Entertainment',     price: 786.40, pe: 14.9, evEbit: 12.6, profitMargin: 0.582, roe: 0.328, cashFlowYield: 0.066, momentum12m: -0.18, volatility12m: 0.38, flags: { weapons: false, gambling: true,  fossilFuels: false } },
  { id: 'BETS-B',  ticker: 'BETS B',  name: 'Betsson B',                  sector: 'Gaming & Entertainment',     price: 148.90, pe: 10.8, evEbit:  8.9, profitMargin: 0.218, roe: 0.242, cashFlowYield: 0.084, momentum12m:  0.28, volatility12m: 0.32, flags: { weapons: false, gambling: true,  fossilFuels: false } },
  { id: 'SAAB-B',  ticker: 'SAAB B',  name: 'Saab B',                     sector: 'Industrials',                price: 412.55, pe: 32.6, evEbit: 26.4, profitMargin: 0.078, roe: 0.158, cashFlowYield: 0.028, momentum12m:  0.46, volatility12m: 0.36, flags: { weapons: true,  gambling: false, fossilFuels: false } },
  { id: 'TETY',    ticker: 'TETY',    name: 'Tethys Oil',                 sector: 'Energy',                     price:  58.20, pe:  7.4, evEbit:  5.8, profitMargin: 0.246, roe: 0.118, cashFlowYield: 0.112, momentum12m: -0.22, volatility12m: 0.41, flags: { weapons: false, gambling: false, fossilFuels: true  } },
  { id: 'IPCO',    ticker: 'IPCO',    name: 'International Petroleum',    sector: 'Energy',                     price: 142.75, pe:  9.2, evEbit:  7.3, profitMargin: 0.228, roe: 0.186, cashFlowYield: 0.098, momentum12m:  0.19, volatility12m: 0.37, flags: { weapons: false, gambling: false, fossilFuels: true  } },
  { id: 'BOL',     ticker: 'BOL',     name: 'Boliden',                    sector: 'Materials',                  price: 348.65, pe: 11.8, evEbit:  9.6, profitMargin: 0.108, roe: 0.154, cashFlowYield: 0.072, momentum12m:  0.16, volatility12m: 0.30, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SSAB-A',  ticker: 'SSAB A',  name: 'SSAB A',                     sector: 'Materials',                  price:  62.40, pe:  8.6, evEbit:  6.8, profitMargin: 0.094, roe: 0.112, cashFlowYield: 0.104, momentum12m: -0.08, volatility12m: 0.34, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SECU-B',  ticker: 'SECU B',  name: 'Securitas B',                sector: 'Industrials',                price: 132.20, pe: 13.4, evEbit: 11.2, profitMargin: 0.042, roe: 0.134, cashFlowYield: 0.076, momentum12m:  0.21, volatility12m: 0.22, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'ELUX-B',  ticker: 'ELUX B',  name: 'Electrolux B',               sector: 'Consumer',                   price:  92.65, pe: 21.2, evEbit: 15.6, profitMargin: 0.018, roe: 0.062, cashFlowYield: 0.048, momentum12m: -0.14, volatility12m: 0.39, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'GETI-B',  ticker: 'GETI B',  name: 'Getinge B',                  sector: 'Healthcare',                 price: 188.45, pe: 17.6, evEbit: 14.1, profitMargin: 0.082, roe: 0.094, cashFlowYield: 0.054, momentum12m: -0.06, volatility12m: 0.28, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'EKTA-B',  ticker: 'EKTA B',  name: 'Elekta B',                   sector: 'Healthcare',                 price:  68.30, pe: 19.4, evEbit: 15.8, profitMargin: 0.058, roe: 0.088, cashFlowYield: 0.051, momentum12m: -0.09, volatility12m: 0.30, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'HUSQ-B',  ticker: 'HUSQ B',  name: 'Husqvarna B',                sector: 'Consumer',                   price:  64.85, pe: 14.2, evEbit: 11.8, profitMargin: 0.048, roe: 0.116, cashFlowYield: 0.069, momentum12m: -0.03, volatility12m: 0.29, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'TREL-B',  ticker: 'TREL B',  name: 'Trelleborg B',               sector: 'Industrials',                price: 384.90, pe: 15.8, evEbit: 12.9, profitMargin: 0.112, roe: 0.128, cashFlowYield: 0.058, momentum12m:  0.12, volatility12m: 0.21, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'AXFO',    ticker: 'AXFO',    name: 'Axfood',                     sector: 'Consumer',                   price: 248.70, pe: 22.6, evEbit: 17.4, profitMargin: 0.034, roe: 0.286, cashFlowYield: 0.049, momentum12m:  0.06, volatility12m: 0.13, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'SKA-B',   ticker: 'SKA B',   name: 'Skanska B',                  sector: 'Real Estate & Construction', price: 218.30, pe: 13.1, evEbit: 10.8, profitMargin: 0.036, roe: 0.122, cashFlowYield: 0.074, momentum12m:  0.15, volatility12m: 0.20, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'AZA',     ticker: 'AZA',     name: 'Avanza Bank',                sector: 'Banks & Financials',         price: 312.45, pe: 20.8, evEbit: 16.9, profitMargin: 0.486, roe: 0.298, cashFlowYield: 0.042, momentum12m:  0.26, volatility12m: 0.26, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'NIBE-B',  ticker: 'NIBE B',  name: 'NIBE Industrier B',          sector: 'Industrials',                price:  48.95, pe: 29.4, evEbit: 23.2, profitMargin: 0.068, roe: 0.082, cashFlowYield: 0.026, momentum12m: -0.16, volatility12m: 0.40, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'LIFCO-B', ticker: 'LIFCO B', name: 'Lifco B',                    sector: 'Industrials',                price: 346.80, pe: 31.2, evEbit: 24.6, profitMargin: 0.138, roe: 0.214, cashFlowYield: 0.029, momentum12m:  0.20, volatility12m: 0.23, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'INDT',    ticker: 'INDT',    name: 'Indutrade',                  sector: 'Industrials',                price: 268.15, pe: 28.7, evEbit: 22.4, profitMargin: 0.112, roe: 0.198, cashFlowYield: 0.031, momentum12m:  0.09, volatility12m: 0.22, flags: { weapons: false, gambling: false, fossilFuels: false } },
  { id: 'AFRY',    ticker: 'AFRY',    name: 'AFRY',                       sector: 'Industrials',                price: 168.50, pe: 14.8, evEbit: 12.1, profitMargin: 0.054, roe: 0.108, cashFlowYield: 0.066, momentum12m:  0.01, volatility12m: 0.25, flags: { weapons: false, gambling: false, fossilFuels: false } },
]

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
