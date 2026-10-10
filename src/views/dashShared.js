/**
 * Shared chrome + small building blocks for the role dashboards
 * (seller / admin). Keeps the header, stat cards and listing rows in
 * one place so the two dashboards stay visually consistent.
 */
import { CONFIG, BASE } from '../config.js'
import { getRole, roleLabel } from '../roles.js'
import { mountRoleSwitcher } from '../roleSwitcher.js'
import { formatPrice, formatSize, formatStatus } from '../format.js'
import { heroPhoto, photoImgAttrs } from '../photos.js'

/** Render the dashboard shell (header + titled main) and mount the switcher. */
export function dashShell(app, { title, subtitle }) {
  app.innerHTML = ''
  const root = document.createElement('div')
  root.className = 'dash'
  root.innerHTML = `
    <header class="dash-topbar">
      <a class="brand-link dash-brand" href="${BASE}/" aria-label="${CONFIG.site.name} home">
        <span class="brand-name">${CONFIG.site.name}</span>
      </a>
      <div class="dash-role-host"></div>
    </header>
    <main class="dash-main">
      <div class="dash-head">
        <span class="dash-rolechip"><span class="dash-rolechip-dot"></span>${roleLabel(getRole())}</span>
        <h1 class="dash-title">${title}</h1>
        <p class="dash-sub">${subtitle}</p>
      </div>
      <div class="dash-content"></div>
    </main>
  `
  app.appendChild(root)
  mountRoleSwitcher(root.querySelector('.dash-role-host'))
  return { root, content: root.querySelector('.dash-content') }
}

/** A single stat tile. */
export function statCard(label, value) {
  return `
    <div class="dash-stat">
      <span class="dash-stat-value">${value}</span>
      <span class="dash-stat-label">${label}</span>
    </div>`
}

/** Status badge markup. */
export function statusBadge(status) {
  const label = formatStatus(status)
  if (!label) return ''
  const cls = status === 'sold' ? 'dash-badge--sold' : 'dash-badge--available'
  return `<span class="dash-badge ${cls}">${label}</span>`
}

/**
 * A listing row/card shared by the dashboards. `actionsHtml` is rendered
 * into the trailing action column (view link, status toggle, …).
 */
export function plotRow(id, meta, actionsHtml = '') {
  const price = formatPrice(meta?.price, meta?.currency)
  const size = formatSize(meta?.size)
  const facts = []
  if (meta?.road_access != null) facts.push(meta.road_access ? 'Road access' : 'No road access')
  if (meta?.water != null) facts.push(meta.water ? 'Water nearby' : 'No water')

  const attrs = photoImgAttrs(heroPhoto(id, meta?.photos))

  return `
    <article class="dash-plot">
      <img class="dash-thumb" src="${attrs.src}" srcset="${attrs.srcset}" sizes="120px"
        loading="${attrs.loading}" decoding="${attrs.decoding}" alt="${id} photograph" />
      <div class="dash-plot-body">
        <div class="dash-plot-row">
          <span class="dash-plot-id">${id}</span>
          ${statusBadge(meta?.status)}
        </div>
        <div class="dash-plot-meta">${[size, price].filter(Boolean).join(' · ')}</div>
        ${facts.length ? `<div class="dash-plot-facts">${facts.join(' · ')}</div>` : ''}
      </div>
      ${actionsHtml ? `<div class="dash-plot-actions">${actionsHtml}</div>` : ''}
    </article>`
}
