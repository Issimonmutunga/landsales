/**
 * Central application configuration.
 * All site-wide configurable values live here.
 */
export const CONFIG = {
  site: {
    name: 'LandSales',
    tagline: 'Land for sale',
    description:
      'Explore available parcels of land on an interactive map. Zoom into individual plots, view photographs and surrounding geography, and share properties directly.',
    domain: 'https://landsales.pages.dev',
  },

  seller: {
    name: 'LandSales Agency',
    contactNumber: '+254 700 000 000',
    whatsappNumber: '254700000000',
    email: 'sales@landsales.example',
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
