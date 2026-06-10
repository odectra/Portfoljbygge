import { RISK_PROFILES, TARGET_PORTFOLIO_SIZE } from '../data/stocks'

/**
 * Factor model
 * ------------
 * Each stock is scored on four factors, normalised as percentile ranks
 * (0–1) within the eligible universe so that no single metric's scale
 * dominates:
 *
 *   Quality        = avg rank of profit margin ↑, ROE ↑, cash flow yield ↑
 *   Value          = avg rank of P/E ↓, EV/EBIT ↓
 *   Momentum       = rank of 12-month price trend ↑
 *   Low volatility = rank of 12-month volatility ↓
 *
 * The composite score is the weighted sum of the four factor ranks, with
 * weights set by the user's risk profile. The target portfolio is the
 * top `TARGET_PORTFOLIO_SIZE` stocks by composite score after the user's
 * ethical filters have removed flagged companies.
 */

/** Percentile rank (0–1) of each value in `values`. Ties share the average rank. */
function percentileRanks(values) {
  const indexed = values.map((v, i) => ({ v, i }))
  indexed.sort((a, b) => a.v - b.v)
  const ranks = new Array(values.length)
  let pos = 0
  while (pos < indexed.length) {
    let end = pos
    while (end + 1 < indexed.length && indexed[end + 1].v === indexed[pos].v) end++
    const avgRank = (pos + end) / 2
    for (let k = pos; k <= end; k++) {
      ranks[indexed[k].i] = values.length === 1 ? 0.5 : avgRank / (values.length - 1)
    }
    pos = end + 1
  }
  return ranks
}

/** Remove stocks hit by any of the user's active ethical filters. */
export function applyEthicalFilters(stocks, ethicalFilters = {}) {
  const active = Object.keys(ethicalFilters).filter((k) => ethicalFilters[k])
  if (active.length === 0) return stocks
  return stocks.filter((s) => active.every((flag) => !s.flags[flag]))
}

/**
 * Score every stock in `stocks` for the given risk profile.
 * Returns the list sorted by composite score (best first), each entry
 * annotated with `factors` (per-factor ranks) and `score` (0–100).
 */
export function scoreStocks(stocks, riskProfileId) {
  const profile = RISK_PROFILES[riskProfileId] ?? RISK_PROFILES.balanced
  const w = profile.weights
  if (stocks.length === 0) return []

  const marginR = percentileRanks(stocks.map((s) => s.profitMargin))
  const roeR = percentileRanks(stocks.map((s) => s.roe))
  const cfyR = percentileRanks(stocks.map((s) => s.cashFlowYield))
  // Lower is better for valuation multiples and volatility → invert the rank.
  const peR = percentileRanks(stocks.map((s) => -s.pe))
  const evEbitR = percentileRanks(stocks.map((s) => -s.evEbit))
  const momR = percentileRanks(stocks.map((s) => s.momentum12m))
  const lowVolR = percentileRanks(stocks.map((s) => -s.volatility12m))

  return stocks
    .map((stock, i) => {
      const factors = {
        quality: (marginR[i] + roeR[i] + cfyR[i]) / 3,
        value: (peR[i] + evEbitR[i]) / 2,
        momentum: momR[i],
        lowVolatility: lowVolR[i],
      }
      const composite =
        factors.quality * w.quality +
        factors.value * w.value +
        factors.momentum * w.momentum +
        factors.lowVolatility * w.lowVolatility
      return { ...stock, factors, score: Math.round(composite * 100) }
    })
    .sort((a, b) => b.score - a.score)
}

/**
 * The target portfolio: top stocks by factor score after ethical filters.
 */
export function getTargetPortfolio(stocks, riskProfileId, ethicalFilters) {
  const eligible = applyEthicalFilters(stocks, ethicalFilters)
  return scoreStocks(eligible, riskProfileId).slice(0, TARGET_PORTFOLIO_SIZE)
}
