/**
 * Mobile bottom sheet for parcel details. On small screens an anchored
 * MapLibre popup is fiddly, so we slide a panel up from the bottom of the
 * screen containing the same parcel content (built by buildPopupNode).
 * Tapping a new parcel replaces the sheet content; the sheet can be closed
 * via the handle, the backdrop, or the close button.
 */
import { buildPopupNode } from './popup.js'

let sheetEl = null
let backdropEl = null
let currentId = null

/** True when the viewport is small enough to prefer the bottom sheet. */
export function isMobile() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
}

/** Open (or refresh) the bottom sheet for a parcel. @param {string} id */
export function openBottomSheet(id) {
  ensureDom()
  currentId = id
  const body = sheetEl.querySelector('.mbs-body')
  const content = buildPopupNode(id)
  body.replaceChildren(content)
  backdropEl.classList.add('is-visible')
  sheetEl.classList.add('is-open')
}

/** Close the bottom sheet if it is open. */
export function closeBottomSheet() {
  if (backdropEl) backdropEl.classList.remove('is-visible')
  if (sheetEl) sheetEl.classList.remove('is-open')
  currentId = null
}

function ensureDom() {
  if (sheetEl && sheetEl.isConnected) return

  backdropEl = document.createElement('div')
  backdropEl.className = 'mbs-backdrop'
  backdropEl.setAttribute('aria-hidden', 'true')
  backdropEl.addEventListener('click', closeBottomSheet)

  sheetEl = document.createElement('div')
  sheetEl.className = 'mbs'
  sheetEl.setAttribute('role', 'dialog')
  sheetEl.setAttribute('aria-label', 'Property details')
  sheetEl.innerHTML = `
    <div class="mbs-grip" aria-hidden="true"></div>
    <button class="mbs-close" type="button" aria-label="Close">×</button>
    <div class="mbs-body"></div>
  `
  sheetEl.querySelector('.mbs-close').addEventListener('click', closeBottomSheet)

  document.body.appendChild(backdropEl)
  document.body.appendChild(sheetEl)
}

/** Remove the sheet from the DOM (call when leaving the map view). */
export function teardownBottomSheet() {
  if (backdropEl && backdropEl.isConnected) backdropEl.remove()
  if (sheetEl && sheetEl.isConnected) sheetEl.remove()
  backdropEl = null
  sheetEl = null
  currentId = null
}

export { currentId }
