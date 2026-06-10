import { getTargetPortfolio } from './factorModel'

/**
 * Monthly buy recommendation
 * --------------------------
 * Goal: move the portfolio toward an equal-weight position in each of the
 * target stocks (top 25 by factor score).
 *
 * Approach:
 *  1. Value current holdings at today's prices and add this month's budget
 *     → the prospective portfolio value.
 *  2. Each target stock "should" hold 1/25 of that value; the gap between
 *     that and its current value is its underweight.
 *  3. Greedily allocate the budget: buy shares of the most underweight
 *     stock first (at least 1 share, never more than closes its gap),
 *     re-rank, repeat — so a large budget is spread across several of the
 *     most underweight names instead of all landing in one.
 */
export function getMonthlyRecommendation({ stocks, holdings, budget, riskProfileId, ethicalFilters }) {
  const target = getTargetPortfolio(stocks, riskProfileId, ethicalFilters)
  const priceById = new Map(stocks.map((s) => [s.id, s.price]))

  const holdingsValue = Object.entries(holdings).reduce(
    (sum, [id, shares]) => sum + shares * (priceById.get(id) ?? 0),
    0,
  )
  const prospectiveValue = holdingsValue + budget
  const targetValuePerStock = prospectiveValue / target.length

  // Working copy of how much each target stock is currently worth.
  const current = new Map(target.map((s) => [s.id, (holdings[s.id] ?? 0) * s.price]))
  const planned = new Map() // id → shares to buy
  let remaining = budget

  for (;;) {
    // Most underweight target stock the remaining budget can afford ≥1 share of.
    const candidates = target
      .map((s) => ({ stock: s, gap: targetValuePerStock - current.get(s.id) }))
      .filter((c) => c.gap > 0 && c.stock.price <= remaining)
      .sort((a, b) => b.gap - a.gap)
    if (candidates.length === 0) break

    const { stock, gap } = candidates[0]
    // Don't overshoot the target weight, but always buy at least one share.
    const affordable = Math.floor(remaining / stock.price)
    const toCloseGap = Math.max(1, Math.floor(gap / stock.price))
    const shares = Math.min(affordable, toCloseGap)

    planned.set(stock.id, (planned.get(stock.id) ?? 0) + shares)
    current.set(stock.id, current.get(stock.id) + shares * stock.price)
    remaining -= shares * stock.price
  }

  const purchases = target
    .filter((s) => planned.has(s.id))
    .map((s) => {
      const shares = planned.get(s.id)
      return {
        stock: s,
        shares,
        cost: shares * s.price,
        currentShares: holdings[s.id] ?? 0,
        isNew: !(holdings[s.id] > 0),
      }
    })
    .sort((a, b) => b.cost - a.cost)

  return {
    target,
    purchases,
    totalCost: budget - remaining,
    leftover: remaining,
    prospectiveValue,
    targetValuePerStock,
  }
}

/** Total market value of a holdings map at current prices. */
export function valueHoldings(holdings, stocks) {
  const priceById = new Map(stocks.map((s) => [s.id, s.price]))
  return Object.entries(holdings).reduce(
    (sum, [id, shares]) => sum + shares * (priceById.get(id) ?? 0),
    0,
  )
}
