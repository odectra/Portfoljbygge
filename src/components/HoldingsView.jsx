import { useMemo, useState } from 'react'
import { getTargetPortfolio } from '../lib/factorModel'
import { valueHoldings } from '../lib/recommend'
import { formatSEK, formatSEKExact, formatPercent } from '../lib/format'
import { Badge, Button, Card, EmptyState, Skeleton } from './ui'

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

  const target = useMemo(
    () => getTargetPortfolio(stocks, settings.riskProfile, settings.ethicalFilters),
    [stocks, settings],
  )

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
          <Card className="divide-y divide-slate-100">
            {target.map((stock, i) => (
              <div key={stock.id} className="flex items-center gap-3 p-4">
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
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
