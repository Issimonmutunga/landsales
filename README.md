# LandSales

A GIS-first, map-first land-sales web application. Prospective buyers explore available
parcels of land on an interactive map, zoom from the wider area into individual plots,
click a parcel to see a polished property popup with photographs, and open a shareable
dedicated property page.

> **Concept: Map → Parcel → Evidence.** The map shows *where*, the parcel shows *what*,
> the photographs show *what it looks like*, and the property information shows *why it matters*.

## Tech stack

- Vite (JavaScript)
- MapLibre GL JS
- GeoJSON (static data)
- Cloudflare Pages (deployment)

## Development

```bash
npm install
npm run dev        # start dev server at http://localhost:5173
npm run build      # production build to dist/
npm run preview    # preview the production build
```

## Data

- `public/data/plots.geojson` — authoritative parcel geometry (EPSG:4326 / WGS84).
- `public/data/plots.json` — descriptive property metadata keyed by parcel ID.

> **Full documentation is completed in the README at the end of development.**
