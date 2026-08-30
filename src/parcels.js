/**
 * Loads authoritative parcel geometry from public/data/plots.geojson
 * and validates it. This is the single source of truth for parcel
 * location, shape and identity.
 */

/**
 * @typedef {import('geojson').FeatureCollection} FeatureCollection
 */

const GEOJSON_URL = '/data/plots.geojson'
const SUPPORTED_STATUSES = ['available', 'sold']

let geojson = null
let byId = new Map()

/**
 * Fetch and validate the GeoJSON. Returns the FeatureCollection.
 * Throws on invalid geometry or duplicate/missing IDs.
 */
export async function loadParcels() {
  if (geojson) return geojson

  let text
  try {
    const res = await fetch(GEOJSON_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    text = await res.text()
  } catch (err) {
    throw new Error(`Unable to load parcel map: ${err.message}`)
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Unable to load property map: invalid GeoJSON.')
  }

  validateGeoJSON(parsed)
  geojson = parsed
  byId = new Map(parsed.features.map((f) => [f.properties.id, f]))
  return geojson
}

function validateGeoJSON(fc) {
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    throw new Error('Unable to load property map: not a valid GeoJSON FeatureCollection.')
  }
  const seen = new Set()
  for (const feature of fc.features) {
    const id = feature && feature.properties && feature.properties.id
    if (!id || typeof id !== 'string') {
      throw new Error('Unable to load property map: a parcel is missing its geometric ID.')
    }
    if (seen.has(id)) {
      throw new Error(`Unable to load property map: duplicate parcel ID "${id}".`)
    }
    seen.add(id)
    if (!feature.geometry || !feature.geometry.type || !Array.isArray(feature.geometry.coordinates)) {
      throw new Error(`Unable to load property map: parcel "${id}" has invalid geometry.`)
    }
  }
}

export function getAllParcelIds() {
  return geojson ? geojson.features.map((f) => f.properties.id) : []
}

/** Look up a single parcel feature by ID. */
export function getParcel(id) {
  return byId.get(id) || null
}

/** Look up the geometry of a parcel by ID. */
export function getParcelGeometry(id) {
  const f = byId.get(id)
  return f ? f.geometry : null
}

export { SUPPORTED_STATUSES }
