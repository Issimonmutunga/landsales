import './styles.css'
import { CONFIG } from './config.js'
import { createMap } from './map.js'
import { loadProperties } from './properties.js'
import { mountApp, mountHeader, mountStatus } from './ui.js'
import { showPopup } from './popup.js'

let currentPopup = null
let map = null

async function init() {
  mountApp()
  mountHeader()
  const status = mountStatus()

  try {
    await loadProperties()

    const ctx = await createMap(document.getElementById('map'), {
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
      // Only close the popup when clicking on empty map, not on a parcel.
      const onParcel = map.queryRenderedFeatures(e.point, { layers: ['parcels-fill'] }).length > 0
      if (currentPopup && !onParcel) {
        currentPopup.remove()
        currentPopup = null
      }
    })

    window.addEventListener('resize', () => map.resize())
  } catch (err) {
    console.error(err)
    status.textContent = err.message || 'Unable to load the map.'
    status.classList.add('status--error')
  }
}

function openPopup(id, feature) {
  if (currentPopup) {
    currentPopup.remove()
    currentPopup = null
  }
  currentPopup = showPopup(map, id, feature, () => {})
}

init()
