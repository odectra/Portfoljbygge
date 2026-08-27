import { useState } from 'react'
import { usePortfolio } from './hooks/usePortfolio'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import InvestFlow from './components/InvestFlow'
import HoldingsView from './components/HoldingsView'
import SettingsView from './components/SettingsView'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'invest', label: 'Invest', icon: '+' },
  { id: 'holdings', label: 'Holdings', icon: '☰' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function App() {
  const portfolio = usePortfolio()
  const [tab, setTab] = useState('dashboard')
  // Remount the invest flow each time it's opened so it starts at step 1.
  const [investSession, setInvestSession] = useState(0)

  const openInvest = () => {
    setInvestSession((n) => n + 1)
    setTab('invest')
  }

  if (!portfolio.settings) {
    return <Onboarding onComplete={portfolio.completeOnboarding} />
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white">
              S
            </div>
            <div>
              <p className="text-sm leading-tight font-extrabold tracking-tight text-slate-900">
                Stegvis
              </p>
              <p className="text-[10px] leading-tight text-slate-400">My first stock portfolio</p>
            </div>
          </div>
          {/* Desktop nav */}
          <nav className="hidden gap-1 md:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => (t.id === 'invest' ? openInvest() : setTab(t.id))}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === 'dashboard' && (
          <Dashboard
            holdings={portfolio.holdings}
            stocks={portfolio.stocks}
            history={portfolio.history}
            totalInvested={portfolio.totalInvested}
            pricesLoading={portfolio.pricesLoading}
            pricesAsOf={portfolio.pricesAsOf}
            onStartInvesting={openInvest}
          />
        )}
        {tab === 'invest' && (
          <InvestFlow
            key={investSession}
            stocks={portfolio.stocks}
            settings={portfolio.settings}
            holdings={portfolio.holdings}
            setHoldings={portfolio.setHoldings}
            recordPurchase={portfolio.recordPurchase}
            onDone={() => setTab('dashboard')}
          />
        )}
        {tab === 'holdings' && (
          <HoldingsView
            stocks={portfolio.stocks}
            holdings={portfolio.holdings}
            settings={portfolio.settings}
            pricesLoading={portfolio.pricesLoading}
            onStartInvesting={openInvest}
          />
        )}
        {tab === 'settings' && (
          <SettingsView
            settings={portfolio.settings}
            updateSettings={portfolio.updateSettings}
            resetAll={portfolio.resetAll}
          />
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => (t.id === 'invest' ? openInvest() : setTab(t.id))}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
                tab === t.id ? 'text-brand-700' : 'text-slate-400'
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
