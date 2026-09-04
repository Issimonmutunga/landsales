/**
 * Central application configuration.
 * All site-wide configurable values live here.
 */

/** Base URL of the application (Vite <base>), without a trailing slash. */
export const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '')

export const CONFIG = {
  site: {
    name: 'Properties',
    tagline: 'Land for sale',
    description:
      'Explore available parcels of land on an interactive map. Zoom into individual plots, view photographs and surrounding geography, and share properties directly.',
    domain: 'https://landsales.besimonmutunga.workers.dev',
  },

  seller: {
    name: 'Properties Agency',
    contactNumber: '+254 700 000 000',
    whatsappNumber: '254700000000',
    email: 'sales@property.site',
  },

  currency: 'KES',
  currencySymbol: 'KSh',

  map: {
    startCenter: [36.9, -1.0],
    startZoom: 12,
    minZoom: 6,
    maxZoom: 19,
    // OpenFreeMap "liberty" vector style. Free for commercial use, no API key.
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    tileProvider:
      'OpenFreeMap (styles/liberty) — free vector basemap for commercial use, no API key required. Data &copy; OpenStreetMap contributors.',
  },

  filters: {
    statuses: ['all', 'available', 'sold'],
  },
}
