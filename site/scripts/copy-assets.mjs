// Copies the shared static assets from the repo root into site/public so Vite
// can serve them. These files live at the repo root because they're also part
// of the published package / spec; the site treats the root as the single
// source of truth and copies them in at dev/build time.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url)) // site/scripts
const repoRoot = join(here, '..', '..')
const publicDir = join(here, '..', 'public')

mkdirSync(publicDir, { recursive: true })

// Copied verbatim from the repo root (the single source of truth) into the
// public dir, which Vite serves at the site root. CNAME keeps the custom
// domain (hallmarks.info) bound to the deployed artifact.
const assets = [
  'favicon.svg',
  'og-image.png',
  'SPEC.md',
  'test-vectors.json',
  'CNAME',
]

for (const file of assets) {
  copyFileSync(join(repoRoot, file), join(publicDir, file))
  console.log('copy-assets: copied', file)
}

// Serve files as-is (no Jekyll processing of _-prefixed / dotfiles).
writeFileSync(join(publicDir, '.nojekyll'), '')
console.log('copy-assets: wrote .nojekyll')
