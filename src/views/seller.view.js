/**
 * Seller dashboard — a distinct, role-specific view (/seller). Lets a
 * seller review their parcels, toggle availability and draft new listings.
 * Entirely client-side: changes live in localStorage via statusStore.
 */
import { CONFIG, BASE } from '../config.js'
import { loadProperties, getAllProperties, applyStatusOverride } from '../properties.js'
import { setSeo } from '../seo.js'
import { dashShell, statCard, plotRow } from './dashShared.js'
import { listDrafts, addDraft, removeDraft } from '../statusStore.js'

let contentEl = null
let listingFilter = 'all'

/** Render the seller dashboard into #app. */
export async function sellerView(app) {
  setSeo({
    title: `Seller dashboard | ${CONFIG.site.name}`,
    description: 'Review and manage the parcels you have listed for sale.',
    url: `${CONFIG.site.domain.replace(/\/$/, '')}/seller`,
  })
  const { content } = dashShell(app, {
    title: 'Seller dashboard',
    subtitle: 'Review your parcels, keep availability up to date, and draft new listings.',
  })
  contentEl = content
  contentEl.classList.add('dash-seller')

  try {
    await loadProperties()
  } catch (err) {
    console.error(err)
    contentEl.innerHTML = `<p class="dash-empty dash-empty--error">Unable to load your listings.</p>`
    return
  }

  render()
  contentEl.addEventListener('click', onClick)
  contentEl.addEventListener('submit', onSubmit)
}

function render() {
  const entries = Object.entries(getAllProperties())
  const total = entries.length
  const available = entries.filter(([, m]) => m?.status === 'available').length
  const sold = total - available

  const listings = entries.filter(([, m]) => listingFilter === 'all' || m?.status === listingFilter)
  const drafts = listDrafts()

  contentEl.innerHTML = `
    <section class="dash-stats">
      ${statCard('Total listings', total)}
      ${statCard('Available', available)}
      ${statCard('Sold', sold)}
    </section>

    <section class="dash-panel">
      <div class="dash-panel-head">
        <h2 class="dash-h2">Your listings</h2>
        <div class="dash-tabs" role="tablist">
          ${tab('all', 'All', listingFilter)}
          ${tab('available', 'Available', listingFilter)}
          ${tab('sold', 'Sold', listingFilter)}
        </div>
      </div>
      <div class="dash-list">
        ${
          listings.length
            ? listings.map(([id, meta]) => sellerRow(id, meta)).join('')
            : `<p class="dash-empty">No ${listingFilter === 'all' ? '' : listingFilter} listings.</p>`
        }
      </div>
    </section>

    <section class="dash-panel">
      <div class="dash-panel-head">
        <h2 class="dash-h2">Draft listings</h2>
        <button type="button" class="dash-btn dash-btn--primary" data-action="open-add">
          + Add listing
        </button>
      </div>
      <p class="dash-note">
        Drafts are saved in this browser only. Publishing a parcel to the map
        will require the listings backend.
      </p>
      <div class="dash-list">
        ${
          drafts.length
            ? drafts.map(draftRow).join('')
            : `<p class="dash-empty">No drafts yet.</p>`
        }
      </div>
    </section>

    <div class="dash-modal" data-open="false">
      <div class="dash-modal-card" role="dialog" aria-modal="true" aria-label="Add a draft listing">
        <h3 class="dash-modal-title">Add a draft listing</h3>
        <form class="dash-form" data-form="add-draft">
          <label class="dash-field">
            <span>Parcel name / ID</span>
            <input name="name" type="text" required placeholder="e.g. Riverside Plot" />
          </label>
          <label class="dash-field">
            <span>Size</span>
            <input name="size" type="text" placeholder="e.g. 0.50 acre" />
          </label>
          <label class="dash-field">
            <span>Asking price (KES)</span>
            <input name="price" type="number" min="0" step="1000" placeholder="e.g. 3200000" />
          </label>
          <label class="dash-field">
            <span>Notes</span>
            <textarea name="notes" rows="3" placeholder="Access, water, landmarks…"></textarea>
          </label>
          <div class="dash-modal-actions">
            <button type="button" class="dash-btn" data-action="close-add">Cancel</button>
            <button type="submit" class="dash-btn dash-btn--primary">Save draft</button>
          </div>
        </form>
      </div>
    </div>
  `
}

function sellerRow(id, meta) {
  const isAvailable = meta?.status !== 'sold'
  const toggleLabel = isAvailable ? 'Mark sold' : 'Mark available'
  const actions = `
    <a class="dash-btn" href="${BASE}/plot/${id}">View</a>
    <button type="button" class="dash-btn dash-btn--toggle"
      data-action="toggle" data-id="${id}" data-next="${isAvailable ? 'sold' : 'available'}">
      ${toggleLabel}
    </button>`
  return plotRow(id, meta, actions)
}

function draftRow(draft) {
  const price = draft.price ? `KES ${Number(draft.price).toLocaleString('en-KE')}` : null
  const meta = [draft.size, price].filter(Boolean).join(' · ')
  return `
    <article class="dash-plot dash-plot--draft">
      <div class="dash-plot-body">
        <div class="dash-plot-row">
          <span class="dash-plot-id">${escapeHtml(draft.name)}</span>
          <span class="dash-badge dash-badge--draft">Draft</span>
        </div>
        ${meta ? `<div class="dash-plot-meta">${escapeHtml(meta)}</div>` : ''}
        ${draft.notes ? `<div class="dash-plot-facts">${escapeHtml(draft.notes)}</div>` : ''}
      </div>
      <div class="dash-plot-actions">
        <button type="button" class="dash-btn" data-action="remove-draft" data-id="${escapeHtml(draft.id)}">
          Remove
        </button>
      </div>
    </article>`
}

function tab(value, label, active) {
  return `<button type="button" class="dash-tab${value === active ? ' is-active' : ''}"
    role="tab" aria-selected="${value === active}" data-tab="${value}">${label}</button>`
}

function onClick(event) {
  const tabBtn = event.target.closest('[data-tab]')
  if (tabBtn) {
    listingFilter = tabBtn.dataset.tab
    render()
    return
  }

  const toggle = event.target.closest('[data-action="toggle"]')
  if (toggle) {
    applyStatusOverride(toggle.dataset.id, toggle.dataset.next)
    render()
    return
  }

  const remove = event.target.closest('[data-action="remove-draft"]')
  if (remove) {
    removeDraft(remove.dataset.id)
    render()
    return
  }

  if (event.target.closest('[data-action="open-add"]')) {
    openModal(true)
    return
  }
  if (event.target.closest('[data-action="close-add"]')) {
    openModal(false)
  }
}

function onSubmit(event) {
  const form = event.target.closest('[data-form="add-draft"]')
  if (!form) return
  event.preventDefault()
  const data = new FormData(form)
  const name = String(data.get('name') || '').trim()
  if (!name) return
  addDraft({
    id: `draft-${Date.now().toString(36)}`,
    name,
    size: String(data.get('size') || '').trim(),
    price: String(data.get('price') || '').trim(),
    notes: String(data.get('notes') || '').trim(),
    createdAt: new Date().toISOString(),
  })
  render()
}

function openModal(open) {
  const modal = contentEl?.querySelector('.dash-modal')
  if (!modal) return
  modal.dataset.open = open ? 'true' : 'false'
  if (open) {
    const input = modal.querySelector('input[name="name"]')
    if (input) setTimeout(() => input.focus(), 0)
  } else {
    const form = modal.querySelector('form')
    if (form) form.reset()
  }
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  )
}

/** Clean up when leaving the seller view. */
export function teardownSellerView() {
  if (contentEl) {
    contentEl.removeEventListener('click', onClick)
    contentEl.removeEventListener('submit', onSubmit)
  }
  contentEl = null
}
