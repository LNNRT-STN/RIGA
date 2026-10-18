const amountFormat = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Splits 1284.37 into "1,284" and ".37" so the decimals can be set smaller, as in KBC Mobile. */
export function splitAmount(value: number) {
  const text = amountFormat.format(Math.abs(value))
  const dot = text.lastIndexOf('.')
  return { sign: value < 0 ? '-' : '', whole: text.slice(0, dot), decimals: text.slice(dot) }
}

export function formatAmount(value: number, currency = 'EUR') {
  const { sign, whole, decimals } = splitAmount(value)
  return `${sign}${whole}${decimals} ${currency}`
}

/** Parses user input such as "12,50" or "1,250.00" into a number. Returns NaN when invalid. */
export function parseAmount(input: string) {
  const cleaned = input.trim().replace(/\s/g, '')
  if (!cleaned) return Number.NaN
  // A single comma followed by 1-2 digits is a decimal comma (Belgian habit).
  const normalised = /^\d+,\d{1,2}$/.test(cleaned) ? cleaned.replace(',', '.') : cleaned.replace(/,/g, '')
  return /^\d+(\.\d{1,2})?$/.test(normalised) ? Number(normalised) : Number.NaN
}

export function isValidBelgianIban(input: string) {
  return /^BE\d{14}$/.test(input.replace(/\s/g, '').toUpperCase())
}

export function formatIban(input: string) {
  return input
    .replace(/\s/g, '')
    .toUpperCase()
    .replace(/(.{4})/g, '$1 ')
    .trim()
}
