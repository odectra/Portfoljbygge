import { formatPercent } from '../lib/format'

const SECTOR_COLORS = {
  Industrials: 'bg-brand-600',
  Technology: 'bg-sky-500',
  'Banks & Financials': 'bg-indigo-500',
  Healthcare: 'bg-rose-400',
  Consumer: 'bg-amber-400',
  Telecom: 'bg-violet-400',
  Materials: 'bg-orange-500',
  Energy: 'bg-stone-500',
  'Real Estate & Construction': 'bg-lime-500',
  'Gaming & Entertainment': 'bg-fuchsia-500',
}

/**
 * Sector allocation as a stacked bar + legend, computed from current
 * holdings valued at today's prices.
 */
export default function AllocationChart({ holdings, stocks }) {
  const byId = new Map(stocks.map((s) => [s.id, s]))
  const bySector = new Map()
  let total = 0

  for (const [id, shares] of Object.entries(holdings)) {
    const stock = byId.get(id)
    if (!stock || shares <= 0) continue
    const value = shares * stock.price
    bySector.set(stock.sector, (bySector.get(stock.sector) ?? 0) + value)
    total += value
  }

  const rows = [...bySector.entries()]
    .map(([sector, value]) => ({ sector, value, share: value / total }))
    .sort((a, b) => b.value - a.value)

  if (rows.length === 0) return null

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {rows.map((r) => (
          <div
            key={r.sector}
            className={`${SECTOR_COLORS[r.sector] ?? 'bg-slate-400'} h-full`}
            style={{ width: `${r.share * 100}%` }}
            title={`${r.sector}: ${formatPercent(r.share, 1)}`}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.sector} className="flex items-center gap-2.5 text-sm">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${SECTOR_COLORS[r.sector] ?? 'bg-slate-400'}`}
            />
            <span className="flex-1 truncate text-slate-600">{r.sector}</span>
            <span className="font-semibold text-slate-800">{formatPercent(r.share, 1)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
