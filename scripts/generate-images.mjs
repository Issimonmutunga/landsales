/**
 * Generates optimized demo photographs (WebP hero + thumbnails) for the
 * synthetic LandSales parcels. This is DEMO imagery only — real
 * photographs replace these files with no code changes.
 *
 * Usage: node scripts/generate-images.mjs
 */
import sharp from 'sharp'
import { mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const imgRoot = join(root, 'public', 'images')

// Theme per parcel -> list of scene kinds to generate.
const PLANS = {
  P01: ['field', 'view'],
  P02: ['field'],
  P04: ['field', 'road', 'view'],
  P06: ['field'],
  P07: ['field', 'view'],
  P08: ['field'],
  P10: ['field', 'road'],
  P11: ['field'],
  P12: ['field', 'view'],
  P03: ['field'],
  P05: ['field'],
  P09: ['field'],
}

const PALETTES = {
  field: ['#8fb573', '#4a7c3f', '#e8c87a'],
  view: ['#cfe6ef', '#7fa8c9', '#5b7f9e'],
  road: ['#b9b2a6', '#8a7f70', '#d8cbb0'],
}

function sceneSVG(kind, id, w, h) {
  const pal = PALETTES[kind] || PALETTES.field
  const [g1, g2, g3] = pal
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${g1}"/>
      <stop offset="1" stop-color="${g2}"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.35" r="0.5">
      <stop offset="0" stop-color="${g3}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${g3}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#sky)"/>
  <rect width="1200" height="800" fill="url(#sun)"/>
  <path d="M0 560 Q 300 500 600 560 T 1200 540 V 800 H 0 Z" fill="${g2}" opacity="0.85"/>
  <path d="M0 660 Q 400 600 800 660 T 1200 640 V 800 H 0 Z" fill="${g3}" opacity="0.7"/>
  <rect x="40" y="40" width="1120" height="120" rx="16" fill="#ffffff" opacity="0.85"/>
  <text x="60" y="122" font-family="Segoe UI, Arial, sans-serif" font-size="52" font-weight="700" fill="#1f2a20">${id} — ${kind} (demo)</text>
</svg>`
}

async function main() {
  for (const [id, kinds] of Object.entries(PLANS)) {
    const dir = join(imgRoot, id)
    mkdirSync(dir, { recursive: true })
    for (const kind of kinds) {
      const svg = sceneSVG(kind, id, 1200, 800)
      const name = kind === 'field' ? 'hero' : kind

      // Full-size WebP (2x retina-quality, capped ~1600 wide).
      await sharp(Buffer.from(svg))
        .resize(1600)
        .webp({ quality: 80, effort: 4 })
        .toFile(join(dir, `${name}.webp`))

      // Thumbnail WebP (~480px) for fast loading.
      await sharp(Buffer.from(svg))
        .resize(480)
        .webp({ quality: 72, effort: 2 })
        .toFile(join(dir, `${name}-thumb.webp`))
    }
    console.log('generated', id, kinds.join(','))
  }
  console.log('done ->', imgRoot)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
