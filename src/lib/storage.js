/**
 * localStorage persistence for settings, holdings and investment history.
 * Everything lives under a single versioned key so future schema changes
 * can migrate cleanly.
 */
const STORAGE_KEY = 'stegvis.v1'

export const DEFAULT_STATE = {
  settings: null, // { monthlyCapacity, riskProfile, ethicalFilters: {weapons, gambling, fossilFuels} }
  holdings: {}, // { [stockId]: shares }
  history: [], // [{ date: ISO string, purchases: [{ id, ticker, name, shares, price }], total }]
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw)
    return {
      settings: parsed.settings ?? null,
      holdings: parsed.holdings ?? {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable (private mode) — the app still works,
    // it just won't persist across sessions.
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
