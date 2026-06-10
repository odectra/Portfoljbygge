import { useState } from 'react'
import { RISK_PROFILES, ETHICAL_FILTERS } from '../data/stocks'
import { Button, Card } from './ui'

/** Edit plan settings; changes re-rank the target portfolio immediately. */
export default function SettingsView({ settings, updateSettings, resetAll }) {
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="p-6">
        <h2 className="text-sm font-bold text-slate-900">Monthly savings capacity</h2>
        <div className="mt-3 flex max-w-xs items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
          <input
            type="number"
            min="100"
            step="100"
            value={settings.monthlyCapacity}
            onChange={(e) =>
              updateSettings({ monthlyCapacity: Math.max(0, Number(e.target.value)) })
            }
            className="w-full bg-transparent py-2.5 text-sm font-semibold outline-none"
          />
          <span className="text-sm font-medium whitespace-nowrap text-slate-400">SEK / month</span>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-bold text-slate-900">Risk profile</h2>
        <p className="mt-1 text-xs text-slate-500">
          Changing this re-weights the factor model and can change your target portfolio.
        </p>
        <div className="mt-3 space-y-2">
          {Object.values(RISK_PROFILES).map((p) => (
            <button
              key={p.id}
              onClick={() => updateSettings({ riskProfile: p.id })}
              className={`block w-full rounded-xl border p-3.5 text-left transition-colors ${
                settings.riskProfile === p.id
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-sm font-bold text-slate-900">{p.label}</span>
              <p className="mt-0.5 text-xs text-slate-500">{p.description}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-bold text-slate-900">Ethical filters</h2>
        <div className="mt-3 space-y-2">
          {ETHICAL_FILTERS.map((f) => (
            <label
              key={f.id}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 hover:border-slate-300"
            >
              <span className="text-sm font-semibold text-slate-800">{f.label}</span>
              <input
                type="checkbox"
                checked={!!settings.ethicalFilters?.[f.id]}
                onChange={(e) =>
                  updateSettings({
                    ethicalFilters: { ...settings.ethicalFilters, [f.id]: e.target.checked },
                  })
                }
                className="h-4 w-4 accent-brand-700"
              />
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-bold text-red-600">Danger zone</h2>
        <p className="mt-1 text-xs text-slate-500">
          Deletes your plan, holdings and investment history from this browser.
        </p>
        <div className="mt-3 flex items-center gap-3">
          {confirmReset ? (
            <>
              <Button variant="danger" onClick={resetAll}>
                Yes, delete everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Reset app
            </Button>
          )}
        </div>
      </Card>

      <p className="pb-4 text-center text-xs text-slate-400">
        Stegvis is a demo. All market data is mocked — see src/data/stocks.js for the Börsdata
        integration notes. Not investment advice.
      </p>
    </div>
  )
}
