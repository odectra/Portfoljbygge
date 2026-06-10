import { useCallback, useEffect, useMemo, useState } from 'react'
import { STOCKS } from '../data/stocks'
import { loadState, saveState, clearState, DEFAULT_STATE } from '../lib/storage'

/**
 * Central app state: settings, holdings and purchase history, persisted to
 * localStorage. Also exposes a simulated "price fetch" so every data view
 * has a real loading state to render — when the Börsdata integration is
 * wired in (see src/data/stocks.js), `pricesLoading` becomes the actual
 * fetch status.
 */
export function usePortfolio() {
  const [state, setState] = useState(loadState)
  const [pricesLoading, setPricesLoading] = useState(true)

  useEffect(() => {
    saveState(state)
  }, [state])

  // Mock data is local, but we simulate a short fetch so loading skeletons
  // behave the way they will with a real API.
  useEffect(() => {
    const t = setTimeout(() => setPricesLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  const completeOnboarding = useCallback((settings) => {
    setState((s) => ({ ...s, settings }))
  }, [])

  const updateSettings = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const setHoldings = useCallback((holdings) => {
    // Drop zero/negative rows so the holdings map stays clean.
    const cleaned = Object.fromEntries(
      Object.entries(holdings).filter(([, shares]) => shares > 0),
    )
    setState((s) => ({ ...s, holdings: cleaned }))
  }, [])

  const recordPurchase = useCallback((purchases) => {
    setState((s) => {
      const holdings = { ...s.holdings }
      for (const p of purchases) {
        holdings[p.stock.id] = (holdings[p.stock.id] ?? 0) + p.shares
      }
      const entry = {
        date: new Date().toISOString(),
        purchases: purchases.map((p) => ({
          id: p.stock.id,
          ticker: p.stock.ticker,
          name: p.stock.name,
          shares: p.shares,
          price: p.stock.price,
        })),
        total: purchases.reduce((sum, p) => sum + p.cost, 0),
      }
      return { ...s, holdings, history: [entry, ...s.history] }
    })
  }, [])

  const resetAll = useCallback(() => {
    clearState()
    setState({ ...DEFAULT_STATE })
  }, [])

  const totalInvested = useMemo(
    () => state.history.reduce((sum, e) => sum + e.total, 0),
    [state.history],
  )

  return {
    stocks: STOCKS,
    settings: state.settings,
    holdings: state.holdings,
    history: state.history,
    totalInvested,
    pricesLoading,
    completeOnboarding,
    updateSettings,
    setHoldings,
    recordPurchase,
    resetAll,
  }
}
