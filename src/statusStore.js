/**
 * Client-side overlay for demo role interactions. No backend yet, so
 * seller/admin changes (status toggles, draft listings) are kept in
 * localStorage and layered on top of the read-only plots.json metadata.
 */

const STATUS_KEY = 'ls.statusOverrides'
const DRAFTS_KEY = 'ls.drafts'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — changes won't persist */
  }
}

/** All parcel status overrides (id -> status). */
export function readStatusOverrides() {
  const value = readJson(STATUS_KEY, {})
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

/** Record a status override for a parcel. */
export function writeStatusOverride(id, status) {
  const overrides = readStatusOverrides()
  overrides[id] = status
  writeJson(STATUS_KEY, overrides)
}

/** Remove all status overrides. */
export function clearStatusOverrides() {
  try {
    localStorage.removeItem(STATUS_KEY)
  } catch {
    /* ignore */
  }
}

/** Draft listings created in the seller view. */
export function listDrafts() {
  const value = readJson(DRAFTS_KEY, [])
  return Array.isArray(value) ? value : []
}

/** Add a draft listing (most recent first). */
export function addDraft(draft) {
  const drafts = listDrafts()
  drafts.unshift(draft)
  writeJson(DRAFTS_KEY, drafts)
}

/** Remove a draft listing by id. */
export function removeDraft(id) {
  writeJson(
    DRAFTS_KEY,
    listDrafts().filter((d) => d.id !== id),
  )
}

/** Remove all draft listings. */
export function clearDrafts() {
  try {
    localStorage.removeItem(DRAFTS_KEY)
  } catch {
    /* ignore */
  }
}
