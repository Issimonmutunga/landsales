/**
 * Lightweight filter + search state and helpers. Status is authoritative
 * from plots.json (metadata); filtering is applied to the map by hiding
 * parcel IDs on the MapLibre layers, so updates are instant with no
 * page reload.
 */
import { getAllProperties, loadProperties } from './properties.js'
import { getAllParcelIds, loadParcels } from './parcels.js'

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
]

let state = { status: 'all', query: '' }

/** Set a filter value (status or query) and return whether anything changed. */
export function setFilter(key, value) {
  if (key === 'status' && state.status !== value) {
    state.status = value
    return true
  }
  if (key === 'query' && state.query !== value) {
    state.query = value
    return true
  }
  return false
}

export function getFilterState() {
  return { ...state }
}

/**
 * Compute the set of parcel IDs that pass the current filter and search.
 * @returns {string[]}
 */
export function visibleIds() {
  const ids = getAllParcelIds()
  if (state.status === 'all' && !state.query.trim()) return ids

  const props = getAllProperties()
  const q = state.query.trim().toLowerCase()

  return ids.filter((id) => {
    if (state.status !== 'all') {
      const p = props[id]
      if (!p || p.status !== state.status) return false
    }
    if (q) return matchesQuery(id, props[id], q)
    return true
  })
}

function matchesQuery(id, meta, q) {
  if (id.toLowerCase().includes(q)) return true
  if (!meta) return false
  if (meta.name && String(meta.name).toLowerCase().includes(q)) return true
  if (meta.size && String(meta.size).toLowerCase().includes(q)) return true
  if (Array.isArray(meta.landmarks)) {
    if (meta.landmarks.some((lm) => lm && lm.name && String(lm.name).toLowerCase().includes(q))) {
      return true
    }
  }
  return false
}

/**
 * Build a MapLibre filter expression selecting the given visible IDs.
 * @param {string[]} ids
 */
export function idFilterExpr(ids) {
  if (ids.length === 0) return ['==', ['get', 'id'], '__none__']
  if (ids.length === 1) return ['==', ['get', 'id'], ids[0]]
  return ['in', ['get', 'id'], ['literal', ids]]
}

/** All parcel layer IDs that should be filtered for visibility. */
export const PARCEL_FILTER_LAYERS = [
  'parcels-fill',
  'parcels-line',
  'parcels-hover-fill',
  'parcels-selected-fill',
  'parcels-selected-line',
  'parcels-labels',
]

export { loadProperties, loadParcels }
