/**
 * Small DOM helpers for the chrome UI (app shell, brand header, status).
 */
import { CONFIG } from './config.js'

/** Mount the top-letf brand header into `container` and return its element. */
export function mountBrand(container = document.getElementById('app')) {
  const header = document.createElement('header')
  header.className = 'brand'
  header.innerHTML = `
    <a class="brand-link" href="/" aria-label="${CONFIG.site.name} home">
      <img src="/icons/favicon.svg" alt="" class="brand-mark" />
      <span class="brand-name">${CONFIG.site.name}</span>
    </a>
  `
  container.appendChild(header)
  return header
}

/** Mount the status message bar into `container` and return its element. */
export function mountStatus(container = document.getElementById('app')) {
  const status = document.createElement('div')
  status.className = 'status'
  status.setAttribute('role', 'status')
  container.appendChild(status)
  return status
}
