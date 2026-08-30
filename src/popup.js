/**
 * Premium parcel popup. Builds the popup DOM from parcel geometry +
 * property metadata and returns it, so the caller can decide whether to
 * show it as a MapLibre popup (desktop) or a bottom sheet (mobile).
 */
import maplibregl from 'maplibre-gl'
import { getProperty } from './properties.js'
import { heroPhoto, photoImgAttrs } from './photos.js'
import { formatPrice, formatStatus, formatSize } from './format.js'
import { CONFIG } from './config.js'

const AVAILABLE_COLOR = '#14532d'
const SOLD_COLOR = '#8a938c'

/**
 * Build the popup DOM node for a parcel.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
export function buildPopupNode(id, { onView } = {}) {
  const meta = getProperty(id)
  const price = formatPrice(meta?.price, meta?.currency)
  const status = formatStatus(meta?.status)
  const size = formatSize(meta?.size)
  const photo = heroPhoto(id, meta?.photos)

  const node = document.createElement('div')
  node.className = 'pp'
  node.setAttribute('role', 'dialog')
  node.setAttribute('aria-label', `Property ${id}`)

  const statusColor = meta?.status === 'available' ? AVAILABLE_COLOR : SOLD_COLOR

  let photoBlock = ''
  if (photo) {
    const attrs = photoImgAttrs(photo, { eager: true })
    photoBlock = `
      <img class="pp-photo" src="${attrs.src}" srcset="${attrs.srcset}" sizes="${attrs.sizes}"
        loading="${attrs.loading}" decoding="${attrs.decoding}" alt="${id} land photo" />
    `
  } else {
    photoBlock = `<div class="pp-photo pp-photo--placeholder" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.4">
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <circle cx="9" cy="10" r="1.6"/>
          <path d="M3 17l5-4 4 3 3-2 6 4"/>
        </svg>
      </div>`
  }

  let specs = ''
  const items = []
  if (meta?.road_access != null) {
    items.push(
      meta.road_access
        ? { icon: 'road', label: 'Road access' }
        : { icon: 'road', label: 'No road access' },
    )
  }
  if (meta?.water != null) {
    items.push(
      meta.water ? { icon: 'water', label: 'Water nearby' } : { icon: 'water', label: 'No water' },
    )
  }
  if (meta?.landmarks?.length) {
    const lm = meta.landmarks[0]
    const dist =
      lm.distance_km != null ? ` · ${lm.distance_km} km from ${lm.name}` : ` · near ${lm.name}`
    items.push({ icon: 'pin', label: dist.replace(/^ \u00b7 /, '') })
  }
  specs = items
    .map((it) => `<span class="pp-spec">${icon(it.icon)}<span>${it.label}</span></span>`)
    .join('')

  node.innerHTML = `
    ${photoBlock}
    <div class="pp-body">
      <div class="pp-head">
        <span class="pp-id">${id}</span>
        ${status ? `<span class="pp-badge" style="color:${statusColor};border-color:${statusColor}">${status}</span>` : ''}
      </div>
      ${size ? `<div class="pp-size">${size}</div>` : ''}
      <div class="pp-price-row">
        <span class="pp-price">${price || ''}</span>
      </div>
      ${items.length ? `<div class="pp-specs">${specs}</div>` : ''}
      <a class="pp-cta" href="/plot/${id}" data-action="view">View property</a>
    </div>
  `

  const viewBtn = node.querySelector('[data-action="view"]')
  if (viewBtn && onView) {
    viewBtn.addEventListener('click', (e) => {
      if (e) {
        e.preventDefault()
        window.location.href = viewBtn.getAttribute('href')
      }
    })
  }
  return node
}

function icon(name) {
  const paths = {
    road: '<path d="M4 19l5-5M8 15l3-3M12 12l5-5M16 8l4-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    water: '<path d="M12 3C8 7 5 10 5 13a7 7 0 0014 0c0-3-3-6-7-10z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    pin: '<path d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="11" r="2.2" fill="currentColor"/>',
  }
  const d = paths[name] || paths.pin
  return `<svg class="pp-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">${d}</svg>`
}

/**
 * Open a MapLibre popup anchored to a parcel feature.
 * @param {maplibregl.Map} map
 * @param {string} id
 * @param {object} feature
 * @param {object} [maplibreglModule] maplibregl namespace (defaults to imported)
 */
export function showPopup(map, id, feature, onView) {
  const node = buildPopupNode(id, { onView })
  const popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: '320px',
    offset: 12,
  })
    .setLngLat(maplibregl.LngLat.convert(popupCenter(feature)))
    .setDOMContent(node)
    .addTo(map)
  return popup
}

function popupCenter(feature) {
  // Use the geometry centroid or an inline lodash-style bbox center.
  const bbox = getBBox(feature.geometry)
  if (!bbox) return feature.geometry.coordinates[0][0]
  const c = [
    (bbox[0] + bbox[2]) / 2,
    (bbox[1] + bbox[3]) / 2,
  ]
  return c
}

function getBBox(geometry) {
  if (!geometry) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  walk(geometry.coordinates, (lon, lat) => {
    if (lon < minX) minX = lon
    if (lat < minY) minY = lat
    if (lon > maxX) maxX = lon
    if (lat > maxY) maxY = lat
  })
  if (minX === Infinity) return null
  return [minX, minY, maxX, maxY]
}

function walk(coords, fn) {
  if (typeof coords[0] === 'number') {
    fn(coords[0], coords[1])
    return
  }
  for (const c of coords) walk(c, fn)
}

export { AVAILABLE_COLOR, SOLD_COLOR }
