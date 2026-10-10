/**
 * Role switcher chrome. A small segmented control mounted into each view's
 * header; selecting a role persists it and navigates to that role's home.
 * Shared across the map, property and dashboard views.
 */
import { ROLES, getRole, setRole, roleHome } from './roles.js'

/**
 * Mount a role switcher into `container`.
 * @param {HTMLElement} container
 * @returns {HTMLElement}
 */
export function mountRoleSwitcher(container) {
  if (!container) return null
  const active = getRole()

  const wrap = document.createElement('div')
  wrap.className = 'role-switch'
  wrap.setAttribute('role', 'group')
  wrap.setAttribute('aria-label', 'Switch role')

  wrap.innerHTML = ROLES.map(
    (role) => `
      <button
        type="button"
        class="role-switch-btn${role.id === active ? ' is-active' : ''}"
        data-role="${role.id}"
        aria-pressed="${role.id === active}"
        title="${escapeAttr(role.description)}"
      >${escapeHtml(role.label)}</button>`,
  ).join('')

  wrap.addEventListener('click', (event) => {
    const btn = event.target.closest('.role-switch-btn')
    if (!btn) return
    const id = btn.dataset.role
    if (id === getRole()) return
    setRole(id)
    window.location.href = roleHome(id)
  })

  container.appendChild(wrap)
  return wrap
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  )
}

function escapeAttr(str) {
  return escapeHtml(str)
}
