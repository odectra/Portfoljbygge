import { useMemo, useState } from 'react'
import { getTargetPortfolio } from '../lib/factorModel'
import { valueHoldings } from '../lib/recommend'
import { RISK_PROFILES } from '../data/stocks'
import { formatSEK, formatSEKExact, formatPercent } from '../lib/format'
import { Badge, Button, Card, EmptyState, Skeleton } from './ui'

/**
 * Raw inputs behind one stock's factor score, for a user who wants to
 * verify the pick independently (their own Börsdata subscription, broker
 * data, or anywhere else) rather than take the score on faith.
 */
function FactorBreakdown({ stock }) {
  const rows = [
    ['Quality', formatPercent(stock.factors.quality), 'avg rank of profit margin, ROE, cash-flow yield'],
    ['Value', formatPercent(stock.factors.value), 'avg rank of P/E, EV/EBIT (lower is better)'],
    ['Momentum', formatPercent(stock.factors.momentum), '12-month price trend'],
    ['Low volatility', formatPercent(stock.factors.lowVolatility), '12-month price volatility (lower is better)'],
  ]
  const raw = [
    ['P/E', stock.pe.toFixed(1)],
    ['EV/EBIT', stock.evEbit.toFixed(1)],
    ['Profit margin', formatPercent(stock.profitMargin, 1)],
    ['ROE', formatPercent(stock.roe, 1)],
    ['Cash-flow yield', formatPercent(stock.cashFlowYield, 1)],
    ['12m momentum', formatPercent(stock.momentum12m, 1)],
    ['12m volatility', formatPercent(stock.volatility12m, 1)],
  ]
  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3.5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {rows.map(([label, value, hint]) => (
          <div key={label} title={hint}>
            <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
            <p className="text-sm font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
        {raw.map(([label, value]) => (
          <span key={label}>
            {label} <span className="font-semibold text-slate-700">{value}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        P/E, EV/EBIT, margins, ROE and cash-flow yield are curated periodically from public
        reports; price, momentum and volatility are live daily. Verify independently any time —
        Börsdata, your broker, or another source of your choice.
        {!stock.priceIsLive && ' (Price for this stock is a fallback value — today’s fetch didn’t resolve it.)'}
      </p>
    </div>
  )
}

function ListSkeleton() {
  return (
    <Card className="divide-y divide-slate-100">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </Card>
  )
}

/**
 * Two tabs: the user's current holdings (with market values) and the
 * model's current target portfolio with factor scores.
 */
export default function HoldingsView({ stocks, holdings, settings, pricesLoading, onStartInvesting }) {
  const [tab, setTab] = useState('holdings')
  const [expanded, setExpanded] = useState(() => new Set())

  const target = useMemo(
    () => getTargetPortfolio(stocks, settings.riskProfile, settings.ethicalFilters),
    [stocks, settings],
  )

  const toggleExpanded = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const profile = RISK_PROFILES[settings.riskProfile] ?? RISK_PROFILES.balanced

  const byId = new Map(stocks.map((s) => [s.id, s]))
  const targetIds = new Set(target.map((s) => s.id))
  const totalValue = valueHoldings(holdings, stocks)

  const rows = Object.entries(holdings)
    .filter(([, shares]) => shares > 0)
    .map(([id, shares]) => ({ stock: byId.get(id), shares }))
    .filter((r) => r.stock)
    .map((r) => ({ ...r, value: r.shares * r.stock.price }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-200/60 p-1">
        {[
          ['holdings', 'My holdings'],
          ['target', 'Target portfolio'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {pricesLoading ? (
        <ListSkeleton />
      ) : tab === 'holdings' ? (
        rows.length > 0 ? (
          <Card className="divide-y divide-slate-100">
            {rows.map(({ stock, shares, value }) => (
              <div key={stock.id} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                  {stock.ticker.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="truncate">{stock.name}</span>
                    {!targetIds.has(stock.id) && <Badge tone="amber">Outside target</Badge>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {shares} × {formatSEKExact(stock.price)} · {stock.sector}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-slate-900">{formatSEK(value)}</p>
                  <p className="text-xs text-slate-400">
                    {totalValue > 0 ? formatPercent(value / totalValue, 1) : '–'}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-4">
              <span className="text-sm font-semibold text-slate-500">Total value</span>
              <span className="text-sm font-extrabold text-slate-900">{formatSEK(totalValue)}</span>
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon="☐"
              title="No holdings yet"
              body="Run your first monthly investment and your portfolio will appear here."
              action={<Button onClick={onStartInvesting}>Invest this month</Button>}
            />
          </Card>
        )
      ) : (
        <div>
          <p className="mb-3 text-xs text-slate-500">
            Top {target.length} stocks by factor score for your{' '}
            <span className="font-semibold capitalize">{settings.riskProfile}</span> profile, after
            ethical filters. This is what your monthly buys steer toward.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              ['Quality', profile.weights.quality],
              ['Value', profile.weights.value],
              ['Momentum', profile.weights.momentum],
              ['Low volatility', profile.weights.lowVolatility],
            ].map(([label, weight]) => (
              <Badge key={label} tone="brand">
                {label} {formatPercent(weight)}
              </Badge>
            ))}
          </div>
          <Card className="divide-y divide-slate-100">
            {target.map((stock, i) => (
              <div key={stock.id}>
                <button
                  onClick={() => toggleExpanded(stock.id)}
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50/70"
                >
                  <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <span className="truncate">{stock.name}</span>
                      {holdings[stock.id] > 0 && <Badge tone="green">Owned</Badge>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {stock.sector} · {formatSEKExact(stock.price)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-brand-700">{stock.score}</p>
                    <p className="text-[10px] tracking-wide text-slate-400 uppercase">score</p>
                  </div>
                  <span className="shrink-0 text-slate-300">
                    {expanded.has(stock.id) ? '▲' : '▼'}
                  </span>
                </button>
                {expanded.has(stock.id) && <FactorBreakdown stock={stock} />}
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
