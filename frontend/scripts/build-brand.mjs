// Generates the Training Up logo SVGs with the wordmark converted to outlines.
// Run: npm run brand  (writes to ../docs/brand and ./src/assets/brand)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fontPath = resolve(
  root,
  'node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-italic.woff',
)
const buf = readFileSync(fontPath)
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))

const COLORS = {
  dark: { primary: '#FF5A1F', secondary: '#FFB020', text: '#F4F2EF' },
  light: { primary: '#C93D08', secondary: '#B56E00', text: '#17181C' },
}

const symbol = (c) => `<g transform="skewX(-10) translate(6 0)">
    <path d="M10 56 L32 36 L54 56" fill="none" stroke="${c.secondary}" stroke-width="9" stroke-linejoin="miter" stroke-linecap="square" opacity=".9"/>
    <path d="M10 34 L32 14 L54 34" fill="none" stroke="${c.primary}" stroke-width="9" stroke-linejoin="miter" stroke-linecap="square"/>
  </g>`

const SIZE = 46
const BASELINE = 52
const X0 = 80

// Serializes glyph commands ourselves: opentype.js toPathData() can emit NaN when rounding.
function pathData(path) {
  const n = (v) => {
    if (!Number.isFinite(v)) throw new Error('Invalid coordinate in glyph path')
    return +v.toFixed(2)
  }
  return path.commands
    .map((c) => {
      switch (c.type) {
        case 'M':
        case 'L':
          return `${c.type}${n(c.x)} ${n(c.y)}`
        case 'Q':
          return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
        case 'C':
          return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
        case 'Z':
          return 'Z'
        default:
          throw new Error(`Unknown path command ${c.type}`)
      }
    })
    .join('')
}

function wordmark(c) {
  const first = 'TRAINING '
  const second = 'UP'
  const p1 = font.getPath(first, X0, BASELINE, SIZE)
  const w1 = font.getAdvanceWidth(first, SIZE)
  const p2 = font.getPath(second, X0 + w1, BASELINE, SIZE)
  const w2 = font.getAdvanceWidth(second, SIZE)
  return {
    svg: `<path fill="${c.text}" d="${pathData(p1)}"/>
  <path fill="${c.primary}" d="${pathData(p2)}"/>`,
    width: Math.ceil(X0 + w1 + w2 + 6),
  }
}

const outDirs = [resolve(root, '../docs/brand'), resolve(root, 'src/assets/brand')]
outDirs.forEach((d) => mkdirSync(d, { recursive: true }))

for (const [variant, c] of Object.entries(COLORS)) {
  const wm = wordmark(c)
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wm.width} 72" role="img" aria-label="Training Up">
  <svg x="0" y="4" width="64" height="64" viewBox="0 0 64 64">
  ${symbol(c)}
  </svg>
  ${wm.svg}
</svg>
`
  const sym = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Training Up">
  ${symbol(c)}
</svg>
`
  for (const d of outDirs) {
    writeFileSync(resolve(d, `logo-${variant}.svg`), logo)
    writeFileSync(resolve(d, `symbol-${variant}.svg`), sym)
  }
}

// App icon source (full-bleed background, symbol inside the maskable safe zone).
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Training Up">
  <rect width="512" height="512" fill="#121316"/>
  <svg x="106" y="106" width="300" height="300" viewBox="0 0 64 64">
  ${symbol(COLORS.dark)}
  </svg>
</svg>
`
writeFileSync(resolve(root, '../docs/brand/app-icon.svg'), icon)
writeFileSync(resolve(root, 'public/app-icon.svg'), icon)
writeFileSync(
  resolve(root, 'public/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#121316"/>
  <svg x="8" y="8" width="48" height="48" viewBox="0 0 64 64">
  ${symbol(COLORS.dark)}
  </svg>
</svg>
`,
)
console.log('Brand assets generated.')
