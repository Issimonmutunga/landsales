/**
 * Regenerates the parcels shapefile (plots.geojson) as a clean, non-overlapping
 * 4-row x 3-column grid with sequential row-major IDs (P01..P12).
 * Preserves each plot's status from plots.json.
 *
 * Usage: node scripts/regenerate-grid.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const meta = JSON.parse(readFileSync(join(root, 'public', 'data', 'plots.json'), 'utf8'))

const LNG0 = 37.02
const LAT0 = -0.12
const W = 0.0018
const H = 0.0018
// Status per ID so the grid keeps each plot's available/sold state.
const statusById = Object.fromEntries(Object.entries(meta).map(([id, p]) => [id, p.status]))

// Row-major sequential layout: [id, col, row]
const CELLS = [
  ['P01', 0, 0], ['P02', 1, 0], ['P03', 2, 0],
  ['P04', 0, 1], ['P05', 1, 1], ['P06', 2, 1],
  ['P07', 0, 2], ['P08', 1, 2], ['P09', 2, 2],
  ['P10', 0, 3], ['P11', 1, 3], ['P12', 2, 3],
]

const features = CELLS.map(([id, col, row]) => {
  const x0 = LNG0 + col * W
  const y0 = LAT0 + row * H
  const x1 = x0 + W
  const y1 = y0 + H
  return {
    type: 'Feature',
    properties: {
      id,
      status: statusById[id] || 'available',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0],
        ],
      ],
    },
  }
})

const fc = { type: 'FeatureCollection', features }
writeFileSync(join(root, 'public', 'data', 'plots.geojson'), JSON.stringify(fc, null, 2) + '\n')
console.log('regenerated', features.length, 'parcels as clean grid')
