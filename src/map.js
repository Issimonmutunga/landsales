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
  selectedFill: 'parcels-selected-fill',
  selectedLine: 'parcels-selected-line',
  labels: 'parcels-labels',
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
    style: {
      version: 8,
      sources: {
        basemap: {
          type: 'raster',
          tiles: [CONFIG.map.tileUrl + '/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: CONFIG.map.attribution,
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: 'basemap',
          type: 'raster',
          source: 'basemap',
        },
      ],
    },
    center: CONFIG.map.startCenter,
    zoom: CONFIG.map.startZoom,
    minZoom: CONFIG.map.minZoom,
    maxZoom: CONFIG.map.maxZoom,
    attributionControl: true,
  })

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
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

  const selectedFillFilter = ['all', ['==', ['get', 'id'], '']]

  function selectParcel(id) {
    map.setFilter(LAYERS.selectedFill, ['all', ['==', ['get', 'id'], id]])
    map.setFilter(LAYERS.selectedLine, ['all', ['==', ['get', 'id'], id]])
  }

  function clearSelection() {
    map.setFilter(LAYERS.selectedFill, ['all', ['==', ['get', 'id'], '']])
    map.setFilter(LAYERS.selectedLine, ['all', ['==', ['get', 'id'], '']])
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
  map.addLayer({
    id: LAYERS.fill,
    type: 'fill',
    source: SOURCE_ID,
    paint: {
      'fill-color': '#ffffff',
      'fill-opacity': 0.25,
    },
  })
  map.addLayer({
    id: LAYERS.line,
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-color': '#14532d',
      'line-width': 1.6,
      'line-opacity': 0.9,
    },
  })
  // Selected overlay drawn on top.
  map.addLayer({
    id: LAYERS.selectedFill,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['all', ['==', ['get', 'id'], '']],
    paint: {
      'fill-color': '#b45309',
      'fill-opacity': 0.35,
    },
  })
  map.addLayer({
    id: LAYERS.selectedLine,
    type: 'line',
    source: SOURCE_ID,
    filter: ['all', ['==', ['get', 'id'], '']],
    paint: {
      'line-color': '#b45309',
      'line-width': 4,
      'line-opacity': 0.95,
    },
  })
}

function setupInteractions(map, { onSelect, onHover }) {
  let hoveredId = null
  const fillLayer = map.getLayer('parcels-fill')

  map.on('mousemove', 'parcels-fill', (e) => {
    const id = e.features[0]?.properties?.id
    map.getCanvas().style.cursor = id ? 'pointer' : ''
    if (hoveredId === id) return
    hoveredId = id
    if (onHover) onHover(id)
  })

  map.on('mouseleave', 'parcels-fill', () => {
    map.getCanvas().style.cursor = ''
    if (hoveredId === null) return
    hoveredId = null
    if (onHover) onHover(null)
  })

  map.on('click', 'parcels-fill', (e) => {
    const id = e.features[0]?.properties?.id
    if (id && onSelect) onSelect(id, e.features[0], e)
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
