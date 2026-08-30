import './styles.css'
import { CONFIG } from './config.js'
import { createMap } from './map.js'
import { loadProperties } from './properties.js'
import { mountApp, mountStatus } from './ui.js'

async function init() {
  mountApp()
  const status = mountStatus()

  try {
    await loadProperties()

    const { map } = await createMap(document.getElementById('map'), {
      onReady: () => {
        status.textContent = `${CONFIG.site.tagline} — click a parcel to explore it.`
        setTimeout(() => status.remove(), 4000)
      },
    })

    window.addEventListener('resize', () => map.resize())
  } catch (err) {
    console.error(err)
    status.textContent = err.message || 'Unable to load the map.'
    status.classList.add('status--error')
  }
}

init()
