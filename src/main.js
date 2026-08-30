import './styles.css'
import { matchRoute } from './router.js'
import { mapView, teardownMapView } from './views/map.view.js'

/** Teardown for the view that is currently displayed. */
let currentTeardown = null

async function dispatch() {
  const raw = window.location.pathname.replace(/\/+$/, '') || '/'
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
        <a class="notfound-back" href="/">Back to the map</a>
      </div>
    `
    return
  }

  if (route.name === 'property') {
    const { propertyView, teardownPropertyView } = await import('./views/property.view.js')
    currentTeardown = teardownPropertyView
    await propertyView(route.id, app)
  } else {
    currentTeardown = teardownMapView
    await mapView()
  }
}

async function init() {
  await dispatch()
  window.addEventListener('popstate', () => dispatch())
}

init()
