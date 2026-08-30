# LandSales

A GIS-first, map-first land-sales web application. Prospective buyers explore available
parcels of land on an interactive map, zoom from the wider area into individual plots,
click a parcel to see a polished property popup with photographs, and open a shareable
dedicated property page.

> **Concept: Map → Parcel → Evidence.** The map shows *where*, the parcel shows *what*,
> the photographs show *what it looks like*, and the property information shows *why it matters*.

## Tech stack

- Vite (JavaScript, ES modules)
- MapLibre GL JS (vector map)
- GeoJSON (static parcel geometry)
- OpenFreeMap "liberty" vector style (free for commercial use, no API key)
- Cloudflare Pages (deployment)

## Development

```bash
npm install
npm run dev        # start dev server at http://localhost:5173
npm run build      # production build to dist/
npm run preview    # preview the production build locally
```

Demo images are generated once with sharp:

```bash
node scripts/generate-images.mjs   # writes public/images/<ID>/*.webp + -thumb.webp
```

## Data

- `public/data/plots.geojson` — authoritative parcel geometry (EPSG:4326 / WGS84), id + status.
- `public/data/plots.json` — descriptive property metadata keyed by parcel ID
  (name, status, price KES, size, description, road access, water, landmarks, photos).

> All data is synthetic demo data for the Nanyuki, Kenya area (parcels P01–P12).

## Features

- Full-screen interactive map with parcel selection, hover highlight, and auto-fit to data.
- Status filter (All / Available / Sold) and live parcel search.
- Responsive parcel detail sheet: bottom sheet on mobile, floating panel on desktop.
- Spatial photo markers with click-to-view photographs.
- Shareable property pages at `/plot/:id` (desktop + mobile).
- SEO & social sharing: Open Graph / Twitter cards, canonical URLs, JSON-LD, sitemap, robots.

## Deployment — Cloudflare Pages

LandSales is designed to be deployed to Cloudflare Pages (static output in `dist/`).

1. Push the repository to a Git provider (GitHub / GitLab), or connect it directly.
2. In the Cloudflare dashboard, **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository and configure the build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy.

The repo includes `public/_redirects` with the SPA fallback rule so deep links such as
`/plot/P01` serve `index.html` (200) instead of 404. This file is copied into the build
output automatically.

Subsequent pushes to the configured branch trigger automatic redeployments.

## Project structure

```
src/
  main.js               entry + router dispatch (lazy-loads the property view)
  map.js                MapLibre map, parcel layers, hover/selection, fly-to
  properties.js         loads + validates plots.json metadata
  parcels.js            loads + validates plots.geojson geometry
  filters.js            filter/search state + visible parcel IDs
  filterBar.js          status chips + search UI
  popup.js              premium parcel content (reused by the sheet)
  bottomSheet.js        responsive parcel detail sheet
  photoMarkers.js       spatial photo markers
  photos.js             thumbnail-first photo helpers
  seo.js                runtime metadata (title, OG, canonical)
  views/map.view.js     home map view
  views/property.view.js  /plot/:id detail page (lazy-loaded)
  views/*.css           stylesheet
public/
  data/                 plots.geojson + plots.json
  images/<ID>/          parcel photographs (webp)
  _redirects            SPA fallback for Cloudflare Pages
  sitemap.xml, robots.txt
```
