const sek = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0,
})

const sekExact = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatSEK = (n) => sek.format(n)
export const formatSEKExact = (n) => sekExact.format(n)
export const formatPercent = (n, digits = 0) =>
  `${(n * 100).toFixed(digits)}%`
