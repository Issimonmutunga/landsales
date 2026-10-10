import './styles.css'
import { matchRoute } from './router.js'
import { BASE } from './config.js'
import { getRole, setRole, roleHome, roleFor } from './roles.js'
import { mapView, teardownMapView } from './views/map.view.js'

/** Teardown for the view that is currently displayed. */
let currentTeardown = null

/** Current pathname with the deployment base stripped. */
function rawPath() {
  const pathname = window.location.pathname
  return (
    pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname
  ).replace(/\/+$/, '') || '/'
}

async function dispatch() {
  const raw = rawPath()

  const route = matchRoute(raw)

  // Clean up the previous view before rendering the new one.
  if (currentTeardown) {
    currentTeardown()
    currentTeardown = null
  }

  const app = document.getElementById('app')

  if (!route) {
    app.innerHTML = `
      <div class="notfound">
        <h1>Not found</h1>
        <p>The page you're looking for does not exist.</p>
        <a class="notfound-back" href="${BASE}/">Back to the map</a>
      </div>
    `
    return
  }

  // Keep the remembered role in sync with role-owned routes.
  const routeRole = roleFor(route.name)
  if (routeRole) setRole(routeRole)

  if (route.name === 'property') {
    const { propertyView, teardownPropertyView } = await import('./views/property.view.js')
    currentTeardown = teardownPropertyView
    await propertyView(route.id, app)
  } else if (route.name === 'seller') {
    const { sellerView, teardownSellerView } = await import('./views/seller.view.js')
    currentTeardown = teardownSellerView
    await sellerView(app)
  } else if (route.name === 'admin') {
    const { adminView, teardownAdminView } = await import('./views/admin.view.js')
    currentTeardown = teardownAdminView
    await adminView(app)
  } else {
    currentTeardown = teardownMapView
    await mapView()
  }
}

async function init() {
  // Honour the remembered role when landing on the home page.
  const role = getRole()
  if (rawPath() === '/' && role !== 'buyer') {
    window.location.replace(roleHome(role))
    return
  }
  await dispatch()
  window.addEventListener('popstate', () => dispatch())
}

init()
