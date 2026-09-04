/**
 * Loads descriptive property metadata from public/data/plots.json
 * and links it to the authoritative parcel geometry by parcel ID.
 */
import { loadParcels, getAllParcelIds } from './parcels.js'
import { BASE } from './config.js'

const METADATA_URL = `${BASE}/data/plots.json`
const SUPPORTED_STATUSES = ['available', 'sold']

let properties = null

/**
 * Load plots.json metadata and cross-validate it against the GeoJSON.
 * A property in the metadata without geometry is reported; so is a
 * geometric parcel without metadata.
 */
export async function loadProperties() {
  if (properties) return properties
  await loadParcels()

  let res
  try {
    res = await fetch(METADATA_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    properties = await res.json()
  } catch (err) {
    throw new Error(`Unable to load property information: ${err.message}`)
  }

  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    throw new Error('Unable to load property information: unexpected data format.')
  }

  validateProperties(properties)
  return properties
}

function validateProperties(properties) {
  const parcelIds = new Set(getAllParcelIds())
  for (const [id, meta] of Object.entries(properties)) {
    if (meta && meta.status && !SUPPORTED_STATUSES.includes(meta.status)) {
      console.warn(`Property "${id}" has unsupported status "${meta.status}".`)
    }
    if (!parcelIds.has(id)) {
      console.warn(`Property "${id}" exists in plots.json but has no geometry in plots.geojson.`)
    }
  }
  for (const id of parcelIds) {
    if (!(id in properties)) {
      console.warn(`Parcel "${id}" has geometry in plots.geojson but no metadata in plots.json.`)
    }
  }
}

/** Get metadata for a single parcel ID (or null). */
export function getProperty(id) {
  if (!properties || !properties[id]) return null
  return properties[id]
}

/** All loaded property metadata keyed by parcel ID. */
export function getAllProperties() {
  return properties || {}
}

/** Number of properties with a given status. */
export function countByStatus(status) {
  if (!properties) return 0
  return Object.values(properties).filter((p) => p && p.status === status).length
}

export { SUPPORTED_STATUSES }
