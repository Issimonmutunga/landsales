/**
 * Filter + search bar UI. Renders a compact segmented status control and
 * a search field, and notifies a callback whenever the filter changes.
 */
import { STATUS_OPTIONS, setFilter } from './filters.js'

/**
 * Build the filter bar DOM and wire its events.
 * @param {HTMLElement} container
 * @param {()=>void} onChange
 * @returns {HTMLElement} the bar element
 */
export function buildFilterBar(container, onChange) {
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
  input.placeholder = 'Search plot, size…'
  input.setAttribute('aria-label', 'Search properties')
  let debounce
  input.addEventListener('input', () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => {
      if (setFilter('query', input.value)) onChange()
    }, 180)
  })
  const clear = document.createElement('button')
  clear.type = 'button'
  clear.className = 'filterbar-clear'
  clear.setAttribute('aria-label', 'Clear search')
  clear.textContent = '×'
  clear.addEventListener('click', () => {
    input.value = ''
    setFilter('query', '')
    onChange()
  })
  search.appendChild(input)
  search.appendChild(clear)

  bar.appendChild(seg)
  bar.appendChild(search)
  container.appendChild(bar)
  return bar
}
