/**
 * Property detail view — a dedicated, shareable page (/plot/:id).
 * Renders a focused map of the single parcel plus its full property
 * information, photographs and contact actions.
 */
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CONFIG } from '../config.js'
import { CompactAttributionControl } from '../map.js'
import { loadProperties, getProperty } from '../properties.js'
import { getParcelGeometry } from '../parcels.js'
import { mountStatus } from '../ui.js'
import { formatPrice, formatStatus, formatSize } from '../format.js'
import { heroPhoto, photoList, photoImgAttrs } from '../photos.js'
import { setSeo } from '../seo.js'

let map = null
let resizeHandler = null

/**
 * Render the property page for a single parcel ID.
 * @param {string} id
 * @param {HTMLElement} app
 * @returns {Promise<boolean>} true if the property was found and rendered.
 */
export async function propertyView(id, app) {
  app.innerHTML = ''
  const status = mountStatus(app)

  try {
    await loadProperties()
  } catch (err) {
    console.error(err)
    status.textContent = 'Unable to load property information.'
    status.classList.add('status--error')
    return false
  }

  const meta = getProperty(id)
  const bounds = getParcelBounds(id)

  if (!meta && !bounds) {
    renderNotFound(app, id)
    return false
  }

  const partial = !meta || !bounds
  renderDetail(app, id, meta, bounds, partial)
  document.title = documentTitle(id, meta)
  setPropertySeo(id, meta)

  if (bounds) {
    initDetailMap(app, id, bounds)
  }
  return true
}

function renderDetail(app, id, meta, bounds, partial) {
  const price = formatPrice(meta?.price, meta?.currency)
  const statusLabel = formatStatus(meta?.status)
  const size = formatSize(meta?.size)
  const statusColor = meta?.status === 'available' ? '#7a5538' : '#673515'

  const description = meta?.description || 'No description has been provided for this parcel yet.'

  let factsHtml = ''
  const facts = []
  if (meta?.road_access != null) {
    facts.push(meta.road_access ? 'Road access' : 'No road access')
  }
  if (meta?.water != null) {
    facts.push(meta.water ? 'Water nearby' : 'No water')
  }
  if (facts.length) {
    factsHtml = `<section class="pv-block">
      <h2 class="pv-h2">Key facts</h2>
      <ul class="pv-facts">
        ${facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
      </ul>
    </section>`
  }

  const landmarksHtml = meta?.landmarks?.length
    ? `<section class="pv-block pv-nearby">
        <h2 class="pv-h2">Nearby places</h2>
        <ul class="pv-landmarks">
          ${meta.landmarks
            .map(
              (lm) => `
            <li class="pv-landmark">
              <span class="pv-lm-name">${escapeHtml(lm.name)}</span>
              <span class="pv-lm-dist">${
                lm.distance_km != null ? `${lm.distance_km} km` : ''
              }</span>
            </li>`,
            )
            .join('')}
        </ul>
      </section>`
    : ''

  const whatsappHref = `https://wa.me/${CONFIG.seller.whatsappNumber}?text=${encodeURIComponent(
    `Hello, I'm interested in ${id} (${CONFIG.site.name}).`,
  )}`
  const callHref = `tel:${CONFIG.seller.contactNumber.replace(/[^+\d]/g, '')}`

  app.innerHTML = `
    <div class="pv">
      <header class="pv-topbar">
        <a class="pv-back" href="/" aria-label="Back to map">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          <span>Map</span>
        </a>
        <a class="brand-link pv-brand" href="/" aria-label="${CONFIG.site.name} home">
          <span class="brand-name">${CONFIG.site.name}</span>
        </a>
      </header>

      <main class="pv-main">
        <div class="pv-card">

          <div class="pv-media">
            <figure class="pv-hero">
              ${heroImgHtml(id, meta)}
            </figure>
            ${thumbsHtml(id, meta)}
          </div>

          <div class="pv-body">
            <div class="pv-head">
              <div class="pv-id-row">
                <span class="pv-id">${id}</span>
                ${
                  statusLabel
                    ? `<span class="pv-badge" style="color:${statusColor};border-color:${statusColor}">${statusLabel}</span>`
                    : ''
                }
              </div>
              ${price ? `<div class="pv-price">${price}</div>` : ''}
              ${size ? `<div class="pv-size">${size}</div>` : ''}
            </div>

            ${factsHtml}

            <section class="pv-block">
              <h2 class="pv-h2">About this land</h2>
              <p class="pv-desc">${escapeHtml(description)}</p>
            </section>

            <section class="pv-block pv-location">
              <h2 class="pv-h2">Location</h2>
              <div class="pv-map-wrap">
                <div id="pv-map" class="pv-map"></div>
                <div class="pv-map-overlay"><span class="pp-id">${id}</span></div>
              </div>
              ${landmarksHtml}
            </section>

            <div class="pv-contact">
              <a class="pv-btn pv-btn--primary" href="${whatsappHref}" target="_blank" rel="noopener">
                ${icon('wa')} WhatsApp us
              </a>
              <a class="pv-btn pv-btn--ghost" href="${callHref}">
                ${icon('call')} Call ${CONFIG.seller.contactNumber}
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  `
}

function heroImgHtml(id, meta) {
  const hero = heroPhoto(id, meta?.photos)
  const a = photoImgAttrs(hero, { eager: true })
  return `<img src="${a.src}" srcset="${a.srcset}" sizes="${a.sizes}"
    loading="${a.loading}" decoding="${a.decoding}" alt="${id} photograph" />`
}

function thumbsHtml(id, meta) {
  const photos = photoList(id, meta?.photos).slice(1)
  if (!photos.length) return ''
  return `<div class="pv-thumbs">
    ${photos
      .map((p, i) => {
        const a = photoImgAttrs(p)
        return `<img src="${a.src}" srcset="${a.srcset}" sizes="${a.sizes}"
          loading="${a.loading}" decoding="${a.decoding}" alt="${id} photograph ${i + 2}" />`
      })
      .join('')}
  </div>`
}

function renderNotFound(app, id) {
  app.innerHTML = `
    <div class="pv pv--notfound">
      <div class="pv-nf-inner">
        <h1>Property not found</h1>
        <p>We could not find parcel "${escapeHtml(id)}". It may have been removed.</p>
        <a class="pv-btn pv-btn--primary" href="/">Back to the map</a>
      </div>
    </div>
  `
}

function initDetailMap(app, id, parcelBounds) {
  const el = document.getElementById('pv-map')
  if (!el) return

  map = new maplibregl.Map({
    container: el,
    style: CONFIG.map.styleUrl,
    center: [parcelBounds.center[0], parcelBounds.center[1]],
    zoom: 15,
    minZoom: CONFIG.map.minZoom,
    maxZoom: CONFIG.map.maxZoom,
    attributionControl: false,
  })
  map.addControl(new CompactAttributionControl(), 'bottom-right')
  map.touchZoomRotate.disableRotation()

  const feature = {
    type: 'Feature',
    properties: { id },
    geometry: getParcelGeometry(id),
  }

  map.on('style.load', () => {
    map.addSource('p', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [feature] },
    })
    map.addLayer({
      id: 'p-fill',
      type: 'fill',
      source: 'p',
      paint: { 'fill-color': '#815a35', 'fill-opacity': 0.18 },
    })
    map.addLayer({
      id: 'p-line',
      type: 'line',
      source: 'p',
      paint: { 'line-color': '#7a5538', 'line-width': 3, 'line-opacity': 0.95 },
    })
    const center = map.getSource('p') ? parcelBounds.center : [0, 0]
    map.flyTo({ center, zoom: 15, duration: 0 })
  })

  resizeHandler = () => map.resize()
  window.addEventListener('resize', resizeHandler)
  map.on('load', () => map.resize())
}

/** Return the parcel bounding box and center, or null if absent. */
function getParcelBounds(id) {
  const geom = getParcelGeometry(id)
  if (!geom) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  walk(geom.coordinates, (lon, lat) => {
    if (lon < minX) minX = lon
    if (lat < minY) minY = lat
    if (lon > maxX) maxX = lon
    if (lat > maxY) maxY = lat
  })
  if (minX === Infinity) return null
  return { bbox: [minX, minY, maxX, maxY], center: [(minX + maxX) / 2, (minY + maxY) / 2] }
}

function documentTitle(id, meta) {
  const size = meta?.size
  const area = size ? ` (${size})` : ''
  return `${id}${area} — ${meta?.status === 'available' ? 'Land for sale' : 'Sold land'} | ${CONFIG.site.name}`
}

function setPropertySeo(id, meta) {
  const price = formatPrice(meta?.price, meta?.currency)
  const statusLabel = formatStatus(meta?.status)
  const desc = [
    id,
    statusLabel,
    meta?.size ? `(${meta.size})` : null,
    price ? `at ${price}` : null,
    meta?.description || null,
  ]
    .filter(Boolean)
    .join(' - ')
    .slice(0, 200)
  setSeo({
    title: documentTitle(id, meta),
    description: desc,
    url: `${CONFIG.site.domain.replace(/\/$/, '')}/plot/${id}`,
    image: heroPhoto(id, meta?.photos),
  })
}
function walk(coords, fn) {
  if (typeof coords[0] === 'number') {
    fn(coords[0], coords[1])
    return
  }
  for (const c of coords) walk(c, fn)
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  )
}

function icon(name) {
  const paths = {
    pin: '<path d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="11" r="2.2" fill="currentColor"/>',
    call: '<path d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    wa: '<path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 9c-.5 0-.9.5-.7 1 .9 2.4 2.8 4.3 5.2 5.2.5.2 1-.2 1-.7l.8-1.7c.2-.5-.4-1-.8-.8l-1.4.6a9 9 0 01-2.4-2.4l.6-1.4c.2-.4-.3-1-.8-.8z" fill="currentColor"/>',
  }
  const d = paths[name] || paths.pin
  return `<svg class="pv-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${d}</svg>`
}

/** Clean up the detail map when leaving the view. */
export function teardownPropertyView() {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  resizeHandler = null
  if (map) {
    map.remove()
    map = null
  }
}
