import { TARGET_PORTFOLIO_SIZE } from '../data/stocks'
import { valueHoldings } from '../lib/recommend'
import { formatSEK } from '../lib/format'
import AllocationChart from './AllocationChart'
import { Badge, Button, Card, EmptyState, Skeleton } from './ui'

function Stat({ label, value, sub }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-3 h-3 w-3/4" />
          <Skeleton className="mt-3 h-3 w-2/3" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-3 h-3 w-5/6" />
        </Card>
      </div>
    </div>
  )
}

export default function Dashboard({
  holdings,
  stocks,
  history,
  totalInvested,
  pricesLoading,
  pricesAsOf,
  onStartInvesting,
}) {
  if (pricesLoading) return <DashboardSkeleton />

  const holdingCount = Object.values(holdings).filter((s) => s > 0).length
  const completion = Math.min(1, holdingCount / TARGET_PORTFOLIO_SIZE)
  const portfolioValue = valueHoldings(holdings, stocks)
  const hasHoldings = holdingCount > 0
  const priceDate = pricesAsOf
    ? new Date(pricesAsOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total invested" value={formatSEK(totalInvested)} sub="across all months" />
        <Stat
          label="Portfolio value"
          value={formatSEK(portfolioValue)}
          sub={priceDate ? `at prices as of ${priceDate}` : 'at demo prices'}
        />
        <Stat
          label="Holdings"
          value={`${holdingCount} / ${TARGET_PORTFOLIO_SIZE}`}
          sub="stocks toward target"
        />
        <Stat
          label="Portfolio complete"
          value={`${Math.round(completion * 100)}%`}
          sub={`${TARGET_PORTFOLIO_SIZE - holdingCount} stocks to go`}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Progress toward {TARGET_PORTFOLIO_SIZE} stocks</h2>
          <Badge tone={completion >= 1 ? 'green' : 'brand'}>
            {completion >= 1 ? 'Target reached' : `${Math.round(completion * 100)}%`}
          </Badge>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-700"
            style={{ width: `${completion * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          A diversified portfolio of 20–30 stocks spreads risk across companies and sectors. The
          monthly recommendations steer you there automatically.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Allocation by sector</h2>
          {hasHoldings ? (
            <AllocationChart holdings={holdings} stocks={stocks} />
          ) : (
            <EmptyState
              icon="◔"
              title="No holdings yet"
              body="Make your first monthly investment and your sector allocation will show up here."
              action={
                <Button onClick={onStartInvesting}>Invest this month</Button>
              }
            />
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Recent investments</h2>
          {history.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {history.slice(0, 6).map((entry) => (
                <li key={entry.date} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(entry.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {entry.purchases.map((p) => `${p.shares}× ${p.ticker}`).join(', ')}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-slate-900">
                    {formatSEK(entry.total)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="↗"
              title="Nothing here yet"
              body="Your confirmed monthly purchases will be logged here."
            />
          )}
        </Card>
      </div>
    </div>
  )
}
