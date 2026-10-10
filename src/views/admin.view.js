/**
 * Admin dashboard — a distinct, role-specific view (/admin). Read-only
 * oversight of every listed parcel plus a summary of the (client-side)
 * role model. No authentication yet.
 */
import { CONFIG, BASE } from '../config.js'
import { loadProperties, getAllProperties } from '../properties.js'
import { ROLES } from '../roles.js'
import { setSeo } from '../seo.js'
import { dashShell, statCard, statusBadge } from './dashShared.js'
import { formatPrice, formatSize } from '../format.js'
import {
  clearStatusOverrides,
  clearDrafts,
  readStatusOverrides,
} from '../statusStore.js'

let contentEl = null

/** Render the admin dashboard into #app. */
export async function adminView(app) {
  setSeo({
    title: `Admin | ${CONFIG.site.name}`,
    description: 'Oversee every land listing and manage roles.',
    url: `${CONFIG.site.domain.replace(/\/$/, '')}/admin`,
  })
  const { content } = dashShell(app, {
    title: 'Admin',
    subtitle: 'Every listing on the platform, and the roles that can see it.',
  })
  contentEl = content
  contentEl.classList.add('dash-admin')

  try {
    await loadProperties()
  } catch (err) {
    console.error(err)
    contentEl.innerHTML = `<p class="dash-empty dash-empty--error">Unable to load listings.</p>`
    return
  }

  render()
  contentEl.addEventListener('click', onClick)
}

function render() {
  const entries = Object.entries(getAllProperties())
  const total = entries.length
  const available = entries.filter(([, m]) => m?.status === 'available').length
  const sold = total - available
  const road = entries.filter(([, m]) => m?.road_access).length
  const water = entries.filter(([, m]) => m?.water).length
  const overrideCount = Object.keys(readStatusOverrides()).length

  contentEl.innerHTML = `
    <section class="dash-stats">
      ${statCard('Total parcels', total)}
      ${statCard('Available', available)}
      ${statCard('Sold', sold)}
      ${statCard('Road access', road)}
      ${statCard('Water nearby', water)}
    </section>

    <section class="dash-panel">
      <div class="dash-panel-head">
        <h2 class="dash-h2">All listings</h2>
        <button type="button" class="dash-btn" data-action="reset-demo">
          Reset demo changes${overrideCount ? ` (${overrideCount})` : ''}
        </button>
      </div>
      <div class="dash-table-wrap">
        <table class="dash-table">
          <thead>
            <tr>
              <th>ID</th><th>Status</th><th>Size</th><th>Price</th>
              <th>Road</th><th>Water</th><th>Photos</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${entries.map(([id, m]) => tableRow(id, m)).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="dash-panel">
      <h2 class="dash-h2">Roles</h2>
      <p class="dash-note">
        Role switching is currently client-side only (remembered per browser).
        Authentication and permissions are not wired up yet.
      </p>
      <div class="dash-roles">
        ${ROLES.map(
          (r) => `
          <div class="dash-role">
            <span class="dash-role-name">${r.label}</span>
            <span class="dash-role-desc">${r.description}</span>
          </div>`,
        ).join('')}
      </div>
    </section>
  `
}

function tableRow(id, m) {
  const photos = Array.isArray(m?.photos) ? m.photos.length : 0
  const price = formatPrice(m?.price, m?.currency)
  return `
    <tr>
      <td class="dash-td-id">${id}</td>
      <td>${statusBadge(m?.status)}</td>
      <td>${formatSize(m?.size) || '—'}</td>
      <td>${price || '—'}</td>
      <td>${yesNo(m?.road_access)}</td>
      <td>${yesNo(m?.water)}</td>
      <td>${photos || '—'}</td>
      <td class="dash-td-action"><a href="${BASE}/plot/${id}">View</a></td>
    </tr>`
}

function yesNo(value) {
  if (value == null) return '—'
  return value ? 'Yes' : 'No'
}

function onClick(event) {
  if (event.target.closest('[data-action="reset-demo"]')) {
    clearStatusOverrides()
    clearDrafts()
    render()
  }
}

/** Clean up when leaving the admin view. */
export function teardownAdminView() {
  if (contentEl) contentEl.removeEventListener('click', onClick)
  contentEl = null
}
