/**
 * Map view — the primary landing experience. Renders the full-screen
 * map shell, mounts the brand UI, and wires parcel selection to fly-to
 * and the property popup. Delegates to /plot/:id for full property views.
 */
import { CONFIG } from '../config.js'
import maplibregl from 'maplibre-gl'
import { createMap } from '../map.js'
import { loadProperties } from '../properties.js'
import { mountBrand, mountStatus } from '../ui.js'
import { addPhotoMarkers } from '../photoMarkers.js'
import { photoImgAttrs } from '../photos.js'
import { buildFilterBar } from '../filterBar.js'
import { visibleIds, idFilterExpr, PARCEL_FILTER_LAYERS } from '../filters.js'
import { openBottomSheet, closeBottomSheet, teardownBottomSheet } from '../bottomSheet.js'
import { setSeo, homeSeo } from '../seo.js'

let currentPopup = null
let map = null
let ctx = null

/** Render the map view into #app. */
export async function mapView() {
  setSeo(homeSeo())
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
  const filtersHost = document.createElement('div')
  filtersHost.className = 'filters-host'
  root.appendChild(filtersHost)

  try {
    await loadProperties()

    ctx = await createMap(mapEl, {
      onSelect: (id, feature) => {
        ctx.selectParcel(id)
        ctx.flyToId(id, feature)
        openPopup(id, feature)
      },
      onReady: async () => {
        status.textContent = `${CONFIG.site.tagline} — click a parcel to explore it.`
        setTimeout(() => status.remove(), 4000)
        buildFilterBar(filtersHost, applyFilters, { onGeocode: flyToPlace })
        await addPhotoMarkers(map, { onShowPhoto: showPhotoPopup })
        applyFilters()
      },
    })
    map = ctx.map
    window.__LSMAP = map

    map.on('click', (e) => {
      const onParcel = map.queryRenderedFeatures(e.point, { layers: ['parcels-fill'] }).length > 0
      if (!onParcel) {
        closeBottomSheet()
        if (currentPopup) {
          currentPopup.remove()
          currentPopup = null
        }
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

/** Apply the current filters to the map parcel layers immediately. */
function applyFilters() {
  if (!map) return
  const ids = visibleIds()
  const expr = idFilterExpr(ids)
  for (const layer of PARCEL_FILTER_LAYERS) {
    if (map.getLayer(layer)) map.setFilter(layer, expr)
  }
}

/** Fly the map to a geocoded latitude/longitude (Nominatim lookups). */
function flyToPlace(lat, lon, label) {
  if (!map) return
  map.flyTo({
    center: [lon, lat],
    zoom: 14,
    duration: 1200,
  })
}

// Minimal test hook so automated browser checks can drive filtering.
window.__LSFILTERS = { applyFilters, visibleIds, getMap: () => map }

function openPopup(id, feature) {
  if (currentPopup) {
    currentPopup.remove()
    currentPopup = null
  }
  closeBottomSheet()
  openBottomSheet(id)
}

/** Show a photograph in a popup at its geographic location. */
function showPhotoPopup(id, photoSrc, coords) {
  if (currentPopup) {
    currentPopup.remove()
    currentPopup = null
  }
  const attrs = photoImgAttrs(photoSrc, { eager: true })
  const node = document.createElement('div')
  node.className = 'ph-popup'
  node.innerHTML = `
    <div class="ph-wrap">
      <img src="${attrs.src}" srcset="${attrs.srcset}" sizes="${attrs.sizes}" alt="Photograph near ${id}" class="ph-img" />
      <div class="ph-caption">${id} — location photo</div>
    </div>
  `
  const popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: '360px',
    offset: 14,
  })
    .setLngLat(coords)
    .setDOMContent(node)
    .addTo(map)
  currentPopup = popup
}

/** Clean up listeners when leaving the view. */
export function teardownMapView() {
  window.removeEventListener('resize', onResize)
  closeBottomSheet()
  teardownBottomSheet()
  if (currentPopup) {
    currentPopup.remove()
    currentPopup = null
  }
  map = null
  ctx = null
}
