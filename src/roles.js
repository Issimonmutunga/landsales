/**
 * Client-side role model. Purely front-end for now: the active role is
 * remembered in localStorage and drives which distinct view the app renders.
 * There is no authentication yet — this is the seam where one would later
 * plug in real identity/permissions.
 */
import { BASE } from './config.js'

export const ROLES = [
  { id: 'buyer', label: 'Buyer', description: 'Browse parcels on the map and enquire.' },
  { id: 'seller', label: 'Seller', description: 'Manage your listed parcels.' },
  { id: 'admin', label: 'Admin', description: 'Oversee every listing and role.' },
]

export const DEFAULT_ROLE = 'buyer'

const STORAGE_KEY = 'ls.role'

/** Whether `id` is a known role. */
export function isRole(id) {
  return ROLES.some((r) => r.id === id)
}

/** The active role, falling back to the default. */
export function getRole() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isRole(stored) ? stored : DEFAULT_ROLE
  } catch {
    return DEFAULT_ROLE
  }
}

/** Persist the active role. */
export function setRole(id) {
  if (!isRole(id)) return
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* storage unavailable — role simply won't persist */
  }
}

/** Home path for a role, respecting the deployment base. */
export function roleHome(id) {
  if (id === 'seller') return `${BASE}/seller`
  if (id === 'admin') return `${BASE}/admin`
  return `${BASE}/`
}

/** Display label for a role id. */
export function roleLabel(id) {
  const role = ROLES.find((r) => r.id === id)
  return role ? role.label : id
}

/** The role a given route belongs to, or null for shared routes. */
export function roleFor(routeName) {
  if (routeName === 'seller') return 'seller'
  if (routeName === 'admin') return 'admin'
  if (routeName === 'map') return 'buyer'
  return null
}
