#!/usr/bin/env node
/**
 * Fetches previous-close EOD prices for the Stegvis stock universe from
 * Yahoo Finance's unofficial chart JSON endpoint — free, no key, no login —
 * and writes src/data/prices.json for the app to read at build time. Run
 * daily by .github/workflows/update-prices.yml.
 *
 * Stooq (stooq.com) was tried first since its terms are clearer about free
 * reuse, but its CSV endpoint returns a JavaScript bot-challenge page to
 * requests from cloud/CI IP ranges (confirmed against GitHub Actions' own
 * runners) — not fixable by request headers, and not worth building a
 * browser-automation workaround for. Yahoo's endpoint is undocumented and
 * technically outside its own ToS for automated reuse, same category of risk
 * as scraping in general; it's the standard fallback for this exact use case
 * and, unlike Stooq from a CI IP, actually returns data.
 *
 * Deliberately does NOT use Börsdata: see the note at the top of
 * src/data/stocks.js for why.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'prices.json')

// Keep in sync with the `id` / `ticker` fields in src/data/stocks.js.
const TICKERS = [
  { id: 'VOLV-B', ticker: 'VOLV B' },
  { id: 'ERIC-B', ticker: 'ERIC B' },
  { id: 'ATCO-A', ticker: 'ATCO A' },
  { id: 'HEXA-B', ticker: 'HEXA B' },
  { id: 'SEB-A', ticker: 'SEB A' },
  { id: 'SHB-A', ticker: 'SHB A' },
  { id: 'SWED-A', ticker: 'SWED A' },
  { id: 'NDA-SE', ticker: 'NDA SE' },
  { id: 'INVE-B', ticker: 'INVE B' },
  { id: 'AZN', ticker: 'AZN' },
  { id: 'HM-B', ticker: 'HM B' },
  { id: 'SAND', ticker: 'SAND' },
  { id: 'ABB', ticker: 'ABB' },
  { id: 'ASSA-B', ticker: 'ASSA B' },
  { id: 'ALFA', ticker: 'ALFA' },
  { id: 'SKF-B', ticker: 'SKF B' },
  { id: 'EPI-A', ticker: 'EPI A' },
  { id: 'TELIA', ticker: 'TELIA' },
  { id: 'TEL2-B', ticker: 'TEL2 B' },
  { id: 'ESSITY-B', ticker: 'ESSITY B' },
  { id: 'EVO', ticker: 'EVO' },
  { id: 'BETS-B', ticker: 'BETS B' },
  { id: 'SAAB-B', ticker: 'SAAB B' },
  { id: 'TETY', ticker: 'TETY' },
  { id: 'IPCO', ticker: 'IPCO' },
  { id: 'BOL', ticker: 'BOL' },
  { id: 'SSAB-A', ticker: 'SSAB A' },
  { id: 'SECU-B', ticker: 'SECU B' },
  { id: 'ELUX-B', ticker: 'ELUX B' },
  { id: 'GETI-B', ticker: 'GETI B' },
  { id: 'EKTA-B', ticker: 'EKTA B' },
  { id: 'HUSQ-B', ticker: 'HUSQ B' },
  { id: 'TREL-B', ticker: 'TREL B' },
  { id: 'AXFO', ticker: 'AXFO' },
  { id: 'SKA-B', ticker: 'SKA B' },
  { id: 'AZA', ticker: 'AZA' },
  { id: 'NIBE-B', ticker: 'NIBE B' },
  { id: 'LIFCO-B', ticker: 'LIFCO B' },
  { id: 'INDT', ticker: 'INDT' },
  { id: 'AFRY', ticker: 'AFRY' },
]

// Yahoo Finance's convention for Nasdaq Stockholm names: uppercase,
// space→hyphen share-class suffix, ".ST" market suffix
// (e.g. "VOLV B" → "VOLV-B.ST"). If a ticker turns out not to follow that
// pattern, add an override here — check the Action run's log for "FAIL"
// lines after changing this.
const SYMBOL_OVERRIDES = {}

function toYahooSymbol({ id, ticker }) {
  return SYMBOL_OVERRIDES[id] ?? ticker.toUpperCase().replace(/\s+/g, '-') + '.ST'
}

async function fetchHistory(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.json()
  const result = body?.chart?.result?.[0]
  const err = body?.chart?.error
  if (err) throw new Error(`Yahoo error: ${err.description ?? JSON.stringify(err)}`)
  const timestamps = result?.timestamp
  const closes = result?.indicators?.quote?.[0]?.close
  if (!timestamps || !closes) throw new Error(`unexpected response shape: ${JSON.stringify(body).slice(0, 300)}`)
  const rows = timestamps
    .map((t, i) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), close: closes[i] }))
    .filter((r) => Number.isFinite(r.close))
  if (rows.length === 0) throw new Error('no usable rows')
  return rows
}

/** Latest close vs. the close ~252 trading days back (or the oldest available). */
function momentum12m(rows) {
  const last = rows[rows.length - 1].close
  const base = rows[Math.max(0, rows.length - 1 - 252)].close
  return base > 0 ? last / base - 1 : null
}

/** Annualised std-dev of weekly (every 5th trading day) log returns over the trailing ~12 months. */
function volatility12m(rows) {
  const weeklyCloses = rows
    .slice(-253)
    .filter((_, i) => i % 5 === 0)
    .map((r) => r.close)
  if (weeklyCloses.length < 4) return null
  const returns = weeklyCloses.slice(1).map((c, i) => Math.log(c / weeklyCloses[i]))
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length
  return Math.sqrt(variance) * Math.sqrt(52)
}

const round4 = (n) => (n === null ? null : Math.round(n * 10000) / 10000)

async function fetchOne(stock) {
  const rows = await fetchHistory(toStooqSymbol(stock))
  return {
    price: Math.round(rows[rows.length - 1].close * 100) / 100,
    momentum12m: round4(momentum12m(rows)),
    volatility12m: round4(volatility12m(rows)),
  }
}

async function loadExisting() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, 'utf8'))
  } catch {
    return { asOf: null, stocks: {} }
  }
}

async function main() {
  const existing = await loadExisting()
  const stocks = { ...existing.stocks }
  let okCount = 0
  let failCount = 0

  for (const stock of TICKERS) {
    const symbol = toStooqSymbol(stock)
    try {
      stocks[stock.id] = await fetchOne(stock)
      okCount++
      console.log(`OK    ${stock.id.padEnd(9)} ${symbol.padEnd(12)} price=${stocks[stock.id].price}`)
    } catch (err) {
      failCount++
      console.warn(`FAIL  ${stock.id.padEnd(9)} ${symbol.padEnd(12)} ${err.message} — keeping previous value`)
    }
    // Be polite to a free, unauthenticated endpoint.
    await new Promise((r) => setTimeout(r, 150))
  }

  console.log(`\n${okCount} ok, ${failCount} failed, out of ${TICKERS.length} tickers`)

  if (okCount === 0) {
    console.error('All fetches failed — leaving prices.json untouched.')
    process.exit(1)
  }

  const output = { asOf: new Date().toISOString().slice(0, 10), stocks }
  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n')

  // More than half failing points at a symbol-mapping problem worth fixing,
  // not routine per-ticker noise — fail the job loudly so it gets noticed.
  if (failCount > TICKERS.length / 2) {
    console.error(
      `More than half of tickers failed (${failCount}/${TICKERS.length}) — check SYMBOL_OVERRIDES in this script.`,
    )
    process.exit(1)
  }
}

main()
