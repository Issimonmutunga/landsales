/**
 * Photo helpers. Photographs live under public/images/<PARCEL_ID>/ as
 * optimized WebP files. Each photo has a small "-thumb.webp" sibling for
 * instant loading; the full image loads on demand (lazy) and on larger
 * screens via srcset.
 *
 * Strategy (per build brief §17):
 *   thumbnail  -> immediately (small, fast)
 *   full image -> on demand (lazy loading + larger srcset candidate)
 */

import { BASE } from './config.js'

const IMG_BASE = `${BASE}/images`

/**
 * Rebases an application-owned path so it is correct under the current
 * deployment base. External (http/https) and already-based paths are left
 * untouched.
 * @param {string} path
 */
function rebase(path) {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith(BASE)) return path
  if (path.startsWith('/')) return BASE + path
  return path
}

/**
 * Resolve the hero photo for a parcel, or null.
 * @param {string} id
 * @param {Array<string>} [photos] metadata photo paths
 */
export function heroPhoto(id, photos) {
  const list = Array.isArray(photos) && photos.length ? photos : []
  if (list.length) return rebase(list[0])
  return `${IMG_BASE}/${id}/hero.webp`
}

/** All full-size photo paths for a parcel (from metadata), empty if none. */
export function photoList(id, photos) {
  return (Array.isArray(photos) ? photos : []).map(rebase)
}

/** Derive the thumbnail path from a full-size photo path. */
export function thumbOf(src) {
  if (!src) return null
  const i = src.lastIndexOf('.')
  return i === -1 ? src : `${src.slice(0, i)}-thumb${src.slice(i)}`
}

/**
 * Build an <img> dataset: thumbnails load first, the full image is
 * declared as a srcset candidate so browsers upgrade on large screens,
 * and lazy loading defers offscreen images.
 */
export function photoImgAttrs(src, { eager = false } = {}) {
  const thumb = thumbOf(src)
  return {
    src: thumb || src,
    srcset: `${thumb || src}, ${src} 2x`,
    sizes: '100vw',
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
  }
}
