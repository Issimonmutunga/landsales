/**
 * Minimal history-based router (no framework). Parses location paths
 * into a view descriptor and coordinates client-side navigation so a
 * property can be linked/shared directly (e.g. /plot/P04).
 *
 * Routes:
 *   /          -> map view
 *   /plot/:id  -> property detail view
 */

export function matchRoute(path) {
  const p = path.replace(/\/+$/, '') || '/'
  if (p === '/') return { name: 'map' }

  const m = p.match(/^\/plot\/([A-Za-z0-9-]+)$/)
  if (m) return { name: 'property', id: m[1] }

  return null
}

/** Render the current route using the provided view renderer map. */
export function renderRoute(views, state) {
  const route = matchRoute(state.path)
  const render = route && views[route.name]
  if (!render) {
    return views.notFound ? views.notFound() : null
  }
  return render(route, state)
}
