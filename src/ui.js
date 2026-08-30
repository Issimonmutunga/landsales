/**
 * Small DOM helpers for the chrome UI (app shell, brand header, status).
 */
import { CONFIG } from './config.js'

/** Mount the app shell: map root + map container. */
export function mountApp() {
  const app = document.getElementById('app')
  const root = document.createElement('div')
  root.className = 'map-root'
  const map = document.createElement('div')
  map.id = 'map'
  root.appendChild(map)
  app.appendChild(root)
}

/** Mount the top-left brand header and return its element. */
export function mountHeader() {
  const app = document.getElementById('app')
  const header = document.createElement('header')
  header.className = 'brand'
  header.innerHTML = `
    <a class="brand-link" href="/" aria-label="${CONFIG.site.name} home">
      <img src="/icons/favicon.svg" alt="" class="brand-mark" />
      <span class="brand-name">${CONFIG.site.name}</span>
    </a>
  `
  app.appendChild(header)
  return header
}

/** Mount the status message bar and return its text node holder. */
export function mountStatus() {
  const app = document.getElementById('app')
  const status = document.createElement('div')
  status.className = 'status'
  status.setAttribute('role', 'status')
  app.appendChild(status)
  return status
}
