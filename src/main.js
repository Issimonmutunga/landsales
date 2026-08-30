import './styles.css'
import { CONFIG } from './config.js'

document.querySelector('#app').innerHTML = `
  <div class="map-root">
    <div id="map"></div>
    <header class="brand">
      <img src="/icons/favicon.svg" alt="LandSales" class="brand-mark" />
      <span class="brand-name">${CONFIG.site.name}</span>
    </header>
    <div class="status">
      <span>Loading map…</span>
    </div>
  </div>
`
