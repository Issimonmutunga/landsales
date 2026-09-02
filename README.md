# Properties

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
- Cloudflare Workers with static assets (deployment)

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

## Deployment — Cloudflare Workers (static assets)

The site is deployed to Cloudflare Workers using the static-assets binding
(see `wrangler.toml`). `not_found_handling = "single-page-application"` serves
`index.html` for unknown paths, so deep links such as `/plot/P01` resolve correctly.

Production URL: https://landsales.besimonmutunga.workers.dev

```bash
npm run build          # -> dist/
npx wrangler deploy    # uploads the worker + dist/ assets
```

For git-connected deploys, configure the build command `npm run build` and keep the
worker deploy (`wrangler.toml` + `src/worker.js`) as-is. Subsequent pushes trigger
automatic redeployments.

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
  worker.js             Cloudflare static-assets worker entry
  views/map.view.js     home map view
  views/property.view.js  /plot/:id detail page (lazy-loaded)
  styles.css            design tokens + stylesheet
public/
  data/                 plots.geojson + plots.json
  images/<ID>/          parcel photographs (webp)
  sitemap.xml, robots.txt
```
