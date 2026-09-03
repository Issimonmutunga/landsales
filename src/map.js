/**
 * MapLibre map module — creates the basemap and the authoritative
 * parcel layers, and exposes interaction hooks used by the rest of
 * the application.
 */
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CONFIG } from './config.js'
import { loadParcels } from './parcels.js'

const SOURCE_ID = 'parcels'
const LAYERS = {
  fill: 'parcels-fill',
  line: 'parcels-line',
  hoverFill: 'parcels-hover-fill',
  selectedFill: 'parcels-selected-fill',
  selectedLine: 'parcels-selected-line',
  labels: 'parcels-labels',
}

/* Earth-tone palette (mirrors the design tokens in styles.css).
   MapLibre paint props need literal colours, so keep them in sync here. */
const PALETTE = {
  primary: '#7a5538',
  primaryHover: '#513825',
  sold: '#673515',
  availableTint: '#815a35',
  ink: '#2e2015',
}

/**
 * Create the map, load the parcel GeoJSON, draw it and fit to it.
 * @param {HTMLElement} container
 * @param {{onReady?: Function, onSelect?: Function, onHover?: Function}} callbacks
 * @returns {Promise<{map: object, fitToParcels: Function, selectParcel: Function, clearSelection: Function, flyToId: Function}>}
 */
export async function createMap(container, { onReady, onSelect, onHover } = {}) {
  const geojson = await loadParcels()

  const map = new maplibregl.Map({
    container,
    style: CONFIG.map.styleUrl,
    center: CONFIG.map.startCenter,
    zoom: CONFIG.map.startZoom,
    minZoom: CONFIG.map.minZoom,
    maxZoom: CONFIG.map.maxZoom,
    attributionControl: false,
  })

  // Exactly one attribution control (compact) so credits appear once.
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
  // Zoom control: bottom-right on small screens so it never competes with
  // the top filter/search panel; top-right otherwise.
  const navPosition =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
      ? 'bottom-right'
      : 'top-right'
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), navPosition)
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')
  map.touchZoomRotate.disableRotation()

  map.on('style.load', () => {
    addParcelSource(map, geojson)
    addParcelLayers(map)
    setupInteractions(map, { onSelect, onHover })

    // Fit to parcels once tiles are laid out, keeping reasonable context.
    fitToParcels(map)
    if (onReady) onReady(map)
  })

  const selectedFillFilter = ['==', ['get', 'id'], '']

  function selectParcel(id) {
    map.setFilter(LAYERS.selectedFill, ['==', ['get', 'id'], id])
    map.setFilter(LAYERS.selectedLine, ['==', ['get', 'id'], id])
  }

  function clearSelection() {
    map.setFilter(LAYERS.selectedFill, ['==', ['get', 'id'], ''])
    map.setFilter(LAYERS.selectedLine, ['==', ['get', 'id'], ''])
  }

  /** Smoothly fly to a parcel while keeping geographic context. */
  function flyToId(id, feature) {
    const geom = feature
      ? feature.geometry
      : geojson.features.find((f) => f.properties.id === id)?.geometry
    if (!geom) return
    const bounds = getBoundsFromGeometry(geom)
    const padding = 90
    map.fitBounds(bounds, {
      padding: { top: padding, bottom: padding, left: padding, right: padding },
      maxZoom: 16,
      duration: 900,
    })
  }

  return {
    map,
    fitToParcels: () => fitToParcels(map),
    selectParcel,
    clearSelection,
    flyToId,
  }
}

function addParcelSource(map, geojson) {
  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: geojson,
  })
}

function addParcelLayers(map) {
  // Base fill is data-driven: available parcels get a warm tint,
  // sold parcels get the deep sold accent. Keep both low-opacity so
  // the grid reads as data rather than solid blocks.
  const fillColor = [
    'match',
    ['get', 'status'],
    'sold',
    PALETTE.sold,
    PALETTE.availableTint,
  ]
  map.addLayer({
    id: LAYERS.fill,
    type: 'fill',
    source: SOURCE_ID,
    paint: {
      'fill-color': fillColor,
      'fill-opacity': [
        'case',
        ['==', ['get', 'status'], 'sold'],
        0.14,
        0.11,
      ],
    },
  })
  map.addLayer({
    id: LAYERS.line,
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-color': PALETTE.primary,
      'line-width': 1.6,
      'line-opacity': 0.85,
    },
  })
  // Hover highlight layer (empty by default, filled via filter).
  map.addLayer({
    id: LAYERS.hoverFill,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'fill-color': PALETTE.primaryHover,
      'fill-opacity': 0.16,
    },
  })
  // Selected overlay drawn on top (visually distinct from sold).
  map.addLayer({
    id: LAYERS.selectedFill,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'fill-color': PALETTE.primaryHover,
      'fill-opacity': 0.32,
    },
  })
  map.addLayer({
    id: LAYERS.selectedLine,
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'line-color': PALETTE.primaryHover,
      'line-width': 4,
      'line-opacity': 0.95,
    },
  })
  map.addLayer({
    id: LAYERS.labels,
    type: 'symbol',
    source: SOURCE_ID,
    layout: {
      'text-field': ['get', 'id'],
      'text-size': 12,
      'text-font': ['Noto Sans Bold'],
      'text-anchor': 'center',
      'symbol-placement': 'point',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': PALETTE.primary,
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.6,
    },
    minzoom: 12,
  })
}

function setupInteractions(map, { onSelect, onHover }) {
  let hoveredId = null

  map.on('mousemove', LAYERS.fill, (e) => {
    const id = e.features[0]?.properties?.id
    map.getCanvas().style.cursor = id ? 'pointer' : ''
    if (hoveredId === id) return
    hoveredId = id
    if (hoveredId) {
      map.setFilter(LAYERS.hoverFill, ['==', ['get', 'id'], hoveredId])
    } else {
      map.setFilter(LAYERS.hoverFill, ['==', ['get', 'id'], ''])
    }
    if (onHover) onHover(id)
  })

  map.on('mouseleave', LAYERS.fill, () => {
    map.getCanvas().style.cursor = ''
    if (hoveredId === null) return
    hoveredId = null
    map.setFilter(LAYERS.hoverFill, ['==', ['get', 'id'], ''])
    if (onHover) onHover(null)
  })

  map.on('click', LAYERS.fill, (e) => {
    const id = e.features[0]?.properties?.id
    const feature = e.features[0]
    if (id && onSelect) onSelect(id, feature, e)
  })
}

function fitToParcels(map) {
  if (!map.getSource(SOURCE_ID)) return
  const data = map.getSource(SOURCE_ID)._data || map.getSource(SOURCE_ID).data
  if (!data || !data.features || data.features.length === 0) return
  const bounds = new maplibregl.LngLatBounds()
  for (const feature of data.features) {
    extendBounds(feature.geometry, bounds)
  }
  map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 0 })
}

function getBoundsFromGeometry(geometry) {
  const bounds = new maplibregl.LngLatBounds()
  extendBounds(geometry, bounds)
  return bounds
}

function extendBounds(geometry, bounds) {
  walkCoords(geometry.coordinates, (lon, lat) => bounds.extend([lon, lat]))
}

function walkCoords(coords, fn) {
  if (typeof coords[0] === 'number') {
    fn(coords[0], coords[1])
    return
  }
  for (const c of coords) walkCoords(c, fn)
}
