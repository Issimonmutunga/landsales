/**
 * Formatting helpers for currency, numbers and status, centralised so
 * the display language stays consistent and easy to change.
 */
import { CONFIG } from './config.js'

/** Format a numeric price using the configured currency. */
export function formatPrice(value, currency) {
  if (value == null || Number.isNaN(Number(value))) return null
  const sym = currency === 'KES' ? CONFIG.currencySymbol : symbolFor(currency)
  const n = Number(value)
  if (n >= 1_000_000) {
    const millions = n / 1_000_000
    const rounded = Number.isInteger(millions) ? millions : millions.toFixed(1)
    return `${sym} ${rounded}M`
  }
  if (n >= 1_000) {
    return `${sym} ${n.toLocaleString('en-KE')}`
  }
  return `${sym} ${n}`
}

function symbolFor(currency) {
  return currency === 'KES' ? 'KSh' : (currency || '') + ' '
}

/** Human-friendly status label. */
export function formatStatus(status) {
  if (status === 'available') return 'Available'
  if (status === 'sold') return 'Sold'
  return status || ''
}

/** Normalise a free-form size string for display. */
export function formatSize(size) {
  return size || null
}
