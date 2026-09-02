/**
 * Spatial photo markers. Where photographs have coordinates, represent
 * them on the map so a user sees where the photo was taken while keeping
 * geographic context. Clicking a marker shows the photograph.
 */
import maplibregl from 'maplibre-gl'
import { loadProperties, getProperty, getAllProperties } from './properties.js'
import { photoImgAttrs } from './photos.js'

const SOURCE = 'photo-marks'
const LAYER = 'photo-marks-layer'
const cameraIcon =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26">
      <circle cx="12" cy="12" r="12" fill="#ffffff" stroke="#7a5538" stroke-width="1.4"/>
      <path d="M9 7h2l1.2-1.4h3.6A1.2 1.2 0 0117 6.8v7.4a1.2 1.2 0 01-1.2 1.2H8.2A1.2 1.2 0 017 14.2V8.2A1.2 1.2 0 018.2 7H9z" fill="#7a5538"/>
      <circle cx="12" cy="11" r="2.6" fill="#ffffff"/>
    </svg>`,
  )

/**
 * Add photo marker layer (if any parcel has coordinate-tagged photos)
 * and wire click handling that shows the photograph.
 * @param {maplibregl.Map} map
 * @returns {Promise<boolean>} whether markers were added.
 */
export async function addPhotoMarkers(map, { onShowPhoto } = {}) {
  await loadProperties()

  const features = collectMarkerFeatures()
  if (!features.length) return false

  try {
    const image = await map.loadImage(cameraIcon)
    if (!map.hasImage('camera-mark')) map.addImage('camera-mark', image.data)
  } catch {
    // icon load failure -> fall back to a glyph-less marker (skip silently)
  }

  map.addSource(SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features },
  })

  if (map.hasImage('camera-mark')) {
    map.addLayer({
      id: LAYER,
      type: 'symbol',
      source: SOURCE,
      layout: {
        'icon-image': 'camera-mark',
        'icon-size': 0.7,
        'icon-allow-overlap': false,
        'icon-anchor': 'bottom',
      },
    })
  }

  map.on('click', LAYER, (e) => {
    const props = e.features && e.features[0] && e.features[0].properties
    if (!props) return
    const photo = props.photoSrc
    if (onShowPhoto) onShowPhoto(props.id, photo, props.coords)
  })
  map.on('mouseenter', LAYER, () => (map.getCanvas().style.cursor = 'pointer'))
  map.on('mouseleave', LAYER, () => (map.getCanvas().style.cursor = ''))

  return true
}

function collectMarkerFeatures() {
  const features = []
  for (const [id, meta] of Object.entries(getAllProperties())) {
    const coords = Array.isArray(meta.photo_coords) ? meta.photo_coords : []
    const photos = Array.isArray(meta.photos) ? meta.photos : []
    coords.forEach((c, i) => {
      const photo = photos[i]
      if (!photo || !Array.isArray(c)) return
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c[0], c[1]] },
        properties: { id, photoSrc: photo, coords: c },
      })
    })
  }
  return features
}
