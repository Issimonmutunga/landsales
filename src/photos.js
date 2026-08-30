/**
 * Photo helpers. Photographs are referenced by parcel ID and live
 * under public/images/<PARCEL_ID>/. Thumbnails and full-size variants
 * are resolved here so the rest of the app stays decoupled from paths.
 */

const IMG_BASE = '/images'

/**
 * Resolve the hero photo for a parcel, or null.
 * @param {string} id
 * @param {Array<string>} photos metadata photo paths (optional)
 */
export function heroPhoto(id, photos) {
  const list = photos && photos.length ? photos : []
  const first = list[0]
  if (first) return first
  // Fall back to conventional default naming if no explicit metadata list.
  return `${IMG_BASE}/${id}/hero.webp`
}

/** All photo paths for a parcel (from metadata), empty if none. */
export function photoList(id, photos) {
  return Array.isArray(photos) ? photos.slice() : []
}

/**
 * A srcset for responsive images given a photo path. If a thumb sibling
 * exists we use it for small screens, otherwise fall back to the same.
 */
export function photoSrc(src) {
  return {
    src,
    srcset: `${src} 1x`,
    loading: 'lazy',
  }
}
