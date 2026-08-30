/**
 * Map view — the primary landing experience. Renders the full-screen
 * map shell, mounts the brand UI, and wires parcel selection to fly-to
 * and the property popup. Delegates to /plot/:id for full property views.
 */
import { CONFIG } from '../config.js'
import { createMap } from '../map.js'
import { loadProperties } from '../properties.js'
import { mountBrand, mountStatus } from '../ui.js'
import { showPopup } from '../popup.js'

let currentPopup = null
let map = null
let ctx = null

/** Render the map view into #app. */
export async function mapView() {
  const app = document.getElementById('app')
  app.innerHTML = ''

  const root = document.createElement('div')
  root.className = 'map-root'
  const mapEl = document.createElement('div')
  mapEl.id = 'map'
  root.appendChild(mapEl)
  app.appendChild(root)

  mountBrand(root)
  const status = mountStatus(root)

  try {
    await loadProperties()

    ctx = await createMap(mapEl, {
      onSelect: (id, feature) => {
        ctx.selectParcel(id)
        ctx.flyToId(id, feature)
        openPopup(id, feature)
      },
      onReady: () => {
        status.textContent = `${CONFIG.site.tagline} — click a parcel to explore it.`
        setTimeout(() => status.remove(), 4000)
      },
    })
    map = ctx.map

    map.on('click', (e) => {
      const onParcel = map.queryRenderedFeatures(e.point, { layers: ['parcels-fill'] }).length > 0
      if (currentPopup && !onParcel) {
        currentPopup.remove()
        currentPopup = null
      }
    })

    window.addEventListener('resize', onResize)
  } catch (err) {
    console.error(err)
    status.textContent = err.message || 'Unable to load the map.'
    status.appendChild(document.createTextNode(''))
    status.classList.add('status--error')
  }
}

function onResize() {
  if (map) map.resize()
}

function openPopup(id, feature) {
  if (currentPopup) {
    currentPopup.remove()
    currentPopup = null
  }
  currentPopup = showPopup(map, id, feature, () => {})
}

/** Clean up listeners when leaving the view. */
export function teardownMapView() {
  window.removeEventListener('resize', onResize)
  if (currentPopup) {
    currentPopup.remove()
    currentPopup = null
  }
  map = null
  ctx = null
}
