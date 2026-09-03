/**
 * Filter + search bar UI. Renders a compact segmented status control and
 * a search field, and notifies a callback whenever the filter changes.
 */
import { STATUS_OPTIONS, setFilter } from './filters.js'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

/**
 * Build the filter bar DOM and wire its events.
 * @param {HTMLElement} container
 * @param {()=>void} onChange
 * @param {{onGeocode?: (lat:number, lon:number, label:string)=>void}} opts
 * @returns {HTMLElement} the bar element
 */
export function buildFilterBar(container, onChange, opts = {}) {
  const bar = document.createElement('div')
  bar.className = 'filterbar'
  bar.setAttribute('role', 'group')
  bar.setAttribute('aria-label', 'Property filters')

  const seg = document.createElement('div')
  seg.className = 'filterbar-seg'
  seg.setAttribute('role', 'radiogroup')

  const buttons = STATUS_OPTIONS.map((opt, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'filterbar-chip' + (i === 0 ? ' is-active' : '')
    b.dataset.value = opt.value
    b.setAttribute('role', 'radio')
    b.setAttribute('aria-checked', i === 0 ? 'true' : 'false')
    b.textContent = opt.label
    return b
  })

  buttons.forEach((b) => {
    b.addEventListener('click', () => {
      buttons.forEach((x) => {
        x.classList.toggle('is-active', x === b)
        x.setAttribute('aria-checked', x === b ? 'true' : 'false')
      })
      if (setFilter('status', b.dataset.value)) onChange()
    })
    seg.appendChild(b)
  })

  const search = document.createElement('div')
  search.className = 'filterbar-search'
  const input = document.createElement('input')
  input.type = 'search'
  input.placeholder = 'Search plot or place…'
  input.setAttribute('aria-label', 'Search properties or places')
  const hint = document.createElement('span')
  hint.className = 'filterbar-geo-hint'
  hint.textContent = ''
  let debounce
  let match = false

  function runSearch() {
    const value = input.value
    const changed = setFilter('query', value)
    if (match && value !== match) match = false
    return changed
  }

  async function geocode(value) {
    if (!value.trim() || match) return
    hint.textContent = 'Locating…'
    try {
      const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&countrycodes=ke&q=${encodeURIComponent(value.trim())}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const results = await res.json()
      if (results && results[0]) {
        const r = results[0]
        const lat = parseFloat(r.lat)
        const lon = parseFloat(r.lon)
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          match = input.value
          if (opts.onGeocode) opts.onGeocode(lat, lon, r.display_name || r.name || input.value)
          hint.textContent = ''
          return
        }
      }
      hint.textContent = 'No location found'
    } catch {
      hint.textContent = ''
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(debounce)
    hint.textContent = ''
    debounce = setTimeout(async () => {
      runSearch()
      if (onChange) onChange()
      // Only geocode place names that don't match a plot.
      const q = input.value.trim().toLowerCase()
      const isPlot = /^p?\d{1,2}$/i.test(q) || !input.value.trim()
      if (!isPlot) await geocode(input.value)
    }, 220)
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runSearch()
      if (onChange) onChange()
      geocode(input.value)
    }
  })

  const clear = document.createElement('button')
  clear.type = 'button'
  clear.className = 'filterbar-clear'
  clear.setAttribute('aria-label', 'Clear search')
  clear.textContent = '×'
  clear.addEventListener('click', () => {
    input.value = ''
    hint.textContent = ''
    match = false
    setFilter('query', '')
    if (onChange) onChange()
  })
  search.appendChild(input)
  search.appendChild(hint)
  search.appendChild(clear)

  bar.appendChild(seg)
  bar.appendChild(search)
  container.appendChild(bar)
  return bar
}
