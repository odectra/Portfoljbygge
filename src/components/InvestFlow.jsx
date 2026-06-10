import { useEffect, useMemo, useState } from 'react'
import { getMonthlyRecommendation } from '../lib/recommend'
import { formatSEK, formatSEKExact } from '../lib/format'
import { Badge, Button, Card, EmptyState, Skeleton, StepDots } from './ui'

const STEPS = ['Amount', 'Verify holdings', 'Recommendation', 'Done']

/**
 * The monthly flow: enter this month's amount → verify current holdings →
 * review the model's buy recommendation → confirm and log the purchase.
 */
export default function InvestFlow({
  stocks,
  settings,
  holdings,
  setHoldings,
  recordPurchase,
  onDone,
}) {
  const [step, setStep] = useState(0)
  const [budget, setBudget] = useState(settings.monthlyCapacity)
  const [draftHoldings, setDraftHoldings] = useState(holdings)
  const [thinking, setThinking] = useState(true)

  // Simulate the model run / price fetch so the recommendation step has a
  // real loading state (matches how a live Börsdata call will behave).
  useEffect(() => {
    if (step !== 2 || !thinking) return
    const t = setTimeout(() => setThinking(false), 1100)
    return () => clearTimeout(t)
  }, [step, thinking])

  const goToRecommendation = () => {
    setThinking(true)
    setStep(2)
  }

  const recommendation = useMemo(
    () =>
      getMonthlyRecommendation({
        stocks,
        holdings: draftHoldings,
        budget,
        riskProfileId: settings.riskProfile,
        ethicalFilters: settings.ethicalFilters,
      }),
    [stocks, draftHoldings, budget, settings],
  )

  const confirm = () => {
    setHoldings(draftHoldings)
    recordPurchase(recommendation.purchases)
    setStep(3)
  }

  const byId = new Map(stocks.map((s) => [s.id, s]))
  const heldRows = Object.entries(draftHoldings)
    .filter(([, shares]) => shares > 0)
    .map(([id, shares]) => ({ stock: byId.get(id), shares }))
    .filter((r) => r.stock)
    .sort((a, b) => a.stock.name.localeCompare(b.stock.name))

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">{STEPS[step]}</h1>
        <StepDots count={STEPS.length} current={step} />
      </div>

      {step === 0 && (
        <Card className="p-6">
          <h2 className="text-sm font-bold text-slate-900">
            How much can you invest this month?
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your plan is {formatSEK(settings.monthlyCapacity)} per month, but any amount works —
            the model adapts the recommendation to what you have.
          </p>
          <div className="mt-5 flex items-center rounded-xl border border-slate-300 bg-white px-4 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
            <input
              type="number"
              min="0"
              step="100"
              value={budget}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent py-3 text-lg font-bold outline-none"
              autoFocus
            />
            <span className="text-sm font-medium text-slate-400">SEK</span>
          </div>
          {budget > 0 && budget < Math.min(...stocks.map((s) => s.price)) && (
            <p className="mt-2 text-xs font-medium text-amber-600">
              That's below the cheapest share price — consider saving it for next month.
            </p>
          )}
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(1)} disabled={budget <= 0}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-6">
          <h2 className="text-sm font-bold text-slate-900">Do these holdings look right?</h2>
          <p className="mt-1 text-sm text-slate-500">
            The recommendation is based on what you already own. Adjust share counts if you've
            bought or sold outside the app.
          </p>

          <div className="mt-5">
            {heldRows.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {heldRows.map(({ stock, shares }) => (
                  <li key={stock.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{stock.name}</p>
                      <p className="text-xs text-slate-400">
                        {stock.ticker} · {formatSEKExact(stock.price)}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={shares}
                      onChange={(e) =>
                        setDraftHoldings({
                          ...draftHoldings,
                          [stock.id]: Math.max(0, Math.floor(Number(e.target.value))),
                        })
                      }
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm font-semibold focus:border-brand-600 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                    />
                    <span className="w-12 text-xs text-slate-400">shares</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="☐"
                title="You don't own anything yet"
                body="That's expected for your first month — the model will start your portfolio from scratch."
              />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button onClick={goToRecommendation}>
              {heldRows.length > 0 ? 'Holdings are correct' : 'Continue'}
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          {thinking ? (
            <div>
              <h2 className="text-sm font-bold text-slate-900">Crunching the numbers…</h2>
              <p className="mt-1 text-sm text-slate-500">
                Scoring 40 stocks on quality, value, momentum and volatility for your{' '}
                {settings.riskProfile} profile.
              </p>
              <div className="mt-6 space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="mt-2 h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : recommendation.purchases.length > 0 ? (
            <div>
              <h2 className="text-sm font-bold text-slate-900">This month's buy</h2>
              <p className="mt-1 text-sm text-slate-500">
                The most underweight positions versus your equal-weight target of 25 stocks, at
                current prices.
              </p>

              <ul className="mt-5 space-y-2.5">
                {recommendation.purchases.map(({ stock, shares, cost, isNew }) => (
                  <li
                    key={stock.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-800">
                      {stock.ticker.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <span className="truncate">{stock.name}</span>
                        {isNew && <Badge tone="green">New position</Badge>}
                      </p>
                      <p className="text-xs text-slate-400">
                        {stock.sector} · score {stock.score} · {formatSEKExact(stock.price)}/share
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {shares} {shares === 1 ? 'share' : 'shares'}
                      </p>
                      <p className="text-xs text-slate-500">{formatSEK(cost)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-xl bg-slate-100/80 p-4 text-sm">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Total purchase</span>
                  <span>{formatSEKExact(recommendation.totalCost)}</span>
                </div>
                <div className="mt-1 flex justify-between text-slate-500">
                  <span>Left over (rolls into next month)</span>
                  <span>{formatSEKExact(recommendation.leftover)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={confirm}>Confirm purchase</Button>
              </div>
            </div>
          ) : (
            <div>
              <EmptyState
                icon="◫"
                title="Budget too small for a full share"
                body={`${formatSEK(budget)} doesn't cover one share of any underweight stock in your target portfolio. Save it and come back next month with a bigger amount.`}
                action={
                  <Button variant="secondary" onClick={() => setStep(0)}>
                    Change amount
                  </Button>
                }
              />
            </div>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
            ✓
          </div>
          <h2 className="text-lg font-bold text-slate-900">Purchase logged</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {recommendation.purchases.length}{' '}
            {recommendation.purchases.length === 1 ? 'stock' : 'stocks'} added for{' '}
            {formatSEK(recommendation.totalCost)}. Your holdings and history are updated — see you
            next month.
          </p>
          <div className="mt-6">
            <Button onClick={onDone}>Back to dashboard</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
