import { useState } from 'react'
import { RISK_PROFILES, ETHICAL_FILTERS } from '../data/stocks'
import { formatSEK } from '../lib/format'
import { Button, Card, StepDots } from './ui'

const CAPACITY_PRESETS = [1000, 2000, 5000, 10000]

/** Three-step onboarding: savings capacity → risk profile → ethical filters. */
export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [capacity, setCapacity] = useState(2000)
  const [riskProfile, setRiskProfile] = useState('balanced')
  const [filters, setFilters] = useState({ weapons: false, gambling: false, fossilFuels: false })

  const finish = () =>
    onComplete({ monthlyCapacity: capacity, riskProfile, ethicalFilters: filters })

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-10 sm:py-16">
      <header className="mb-8 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-xl font-bold text-white">
          S
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Stegvis</h1>
        <p className="mt-1 text-sm text-slate-500">
          Build your first stock portfolio — one month at a time.
        </p>
      </header>

      <Card className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Step {step + 1} of 3
          </span>
          <StepDots count={3} current={step} />
        </div>

        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              How much can you invest each month?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A steady monthly amount is the engine of this strategy. You can always invest more
              or less in any given month.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CAPACITY_PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => setCapacity(v)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    capacity === v
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {formatSEK(v)}
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-slate-500">Or enter your own amount</span>
              <div className="mt-1 flex items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={capacity}
                  onChange={(e) => setCapacity(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent py-2.5 text-sm font-semibold outline-none"
                />
                <span className="text-sm font-medium whitespace-nowrap text-slate-400">SEK / month</span>
              </div>
            </label>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900">Choose your risk profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              This sets how the factor model weighs quality, value, momentum and volatility when
              picking your target stocks.
            </p>
            <div className="mt-5 space-y-2.5">
              {Object.values(RISK_PROFILES).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRiskProfile(p.id)}
                  className={`block w-full rounded-xl border p-4 text-left transition-colors ${
                    riskProfile === p.id
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{p.label}</span>
                    <span
                      className={`h-4 w-4 rounded-full border-2 ${
                        riskProfile === p.id
                          ? 'border-brand-600 bg-brand-600'
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                  <p className="mt-2 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                    {Object.entries(p.weights)
                      .sort((a, b) => b[1] - a[1])
                      .map(
                        ([k, v]) =>
                          `${k === 'lowVolatility' ? 'Low vol' : k[0].toUpperCase() + k.slice(1)} ${Math.round(v * 100)}%`,
                      )
                      .join(' · ')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900">Any ethical exclusions?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Optional. Excluded sectors are removed before the model picks your 25 target stocks.
            </p>
            <div className="mt-5 space-y-2.5">
              {ETHICAL_FILTERS.map((f) => (
                <label
                  key={f.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
                    filters[f.id]
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-800">{f.label}</span>
                  <input
                    type="checkbox"
                    checked={filters[f.id]}
                    onChange={(e) => setFilters({ ...filters, [f.id]: e.target.checked })}
                    className="h-4 w-4 accent-brand-700"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 0 && capacity < 100}>
              Continue
            </Button>
          ) : (
            <Button onClick={finish}>Build my plan</Button>
          )}
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-400">
        Demo app with mock market data — not investment advice.
      </p>
    </div>
  )
}
