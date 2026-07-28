// Headless render test for the website's live-demo engine.
//
// Runs against the *built* site: it takes the prerendered dist/index.html
// (which contains all the section markup with empty demo containers), strips
// the SPA's module bundle so it doesn't try to hydrate under JSDOM, then
// inlines the library (hallmark.js) and the demo engine (src/demos.js) as a
// plain script and calls initDemos() — reproducing what the browser does on
// mount. Asserts every demo section populated correctly.
//
// Prerequisite: `npm run build` (produces dist/index.html) must have run first.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jsdomPkg from 'jsdom'

const { JSDOM, VirtualConsole } = jsdomPkg
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(siteRoot, '..')

const distIndex = path.join(siteRoot, 'dist', 'index.html')
if (!fs.existsSync(distIndex)) {
  console.error('render-test: dist/index.html not found — run `npm run build` first.')
  process.exit(1)
}

let html = fs.readFileSync(distIndex, 'utf8')
const libJs = fs.readFileSync(path.join(repoRoot, 'hallmark.js'), 'utf8')
let demoJs = fs.readFileSync(path.join(siteRoot, 'src', 'demos.js'), 'utf8')

// Remove the SPA's module bundle + preloads so JSDOM doesn't try to run them.
html = html.replace(/<script\b[^>]*type="module"[^>]*><\/script>/g, '')
html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')

// Prepare the demo engine for inline (non-module) execution:
//  - drop the `@hallmark` import (we inline the library instead)
//  - turn the exported function into a plain declaration
demoJs = demoJs
  .replace(/^import\s[\s\S]*?from\s+['"]@hallmark['"];?\s*$/m, '')
  .replace(/export\s+function\s+initDemos/, 'function initDemos')

// Strip ESM export syntax from the library bundle.
const libInline = libJs
  .replace(/^export\s+/gm, '')
  .replace(/\bexport\s*\{[^}]*\};?/g, '')

const inlined =
  '<script>\n' + libInline + '\n' + demoJs + '\ninitDemos();\n</script>\n'
html = html.replace('</body>', inlined + '</body>')

const vc = new VirtualConsole()
vc.on('error', (err) => console.error('[console error]', err?.message || err))
vc.on('jsdomError', (err) => console.error('[jsdom error]', err?.message || err))

const dom = new JSDOM(html, {
  url: 'https://hallmarks.info/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    // hallmark.js hashes input via TextEncoder, which JSDOM's realm lacks.
    window.TextEncoder = TextEncoder
    window.TextDecoder = TextDecoder
  },
})

await new Promise((r) => dom.window.addEventListener('load', r, { once: true }))
await new Promise((r) => setTimeout(r, 500))

const doc = dom.window.document

const checks = []
function ok(name, cond, extra = '') {
  checks.push({ name, pass: !!cond, extra })
}

const hmA = doc.getElementById('hm-a')
const hmB = doc.getElementById('hm-b')
ok('hm-a has SVG child', hmA && hmA.querySelector('svg'))
ok('hm-b has SVG child', hmB && hmB.querySelector('svg'))

const ci = doc.getElementById('compare-indicator')
ok('compare-indicator initial = no-match', ci && !ci.classList.contains('match'))

if (hmA && hmB) {
  const aSrc = hmA.querySelector('svg')?.outerHTML
  const bSrc = hmB.querySelector('svg')?.outerHTML
  ok('typo demo: A and B differ', aSrc && bSrc && aSrc !== bSrc)
}

const wordsA = doc.getElementById('words-a')?.textContent
const wordsB = doc.getElementById('words-b')?.textContent
ok('words-a non-empty', wordsA && wordsA.split(' ').length === 3)
ok('words-b non-empty', wordsB && wordsB.split(' ').length === 3)
ok('words-a and words-b differ', wordsA !== wordsB)

ok('3 cards rendered', doc.querySelectorAll('#cards .card').length === 3)
ok('3 industry vignettes', doc.querySelectorAll('#industries-list .industry').length === 3)
ok('each vignette has 2 matching hallmarks (6 total)',
   doc.querySelectorAll('#industries-list .ind-panel-body svg').length === 6)
ok('IBAN typo button present', !!doc.getElementById('btn-iban-typo'))

const compareCells = doc.querySelectorAll('#compare-table .cell')
ok('4 compare cells', compareCells.length === 4)
ok('4th compare cell is Hallmark', compareCells[3]?.classList.contains('hallmark-cell'))

ok('3 style cells', doc.querySelectorAll('#styles-row .style-cell').length === 3)
ok('borders stage mounts 4 hallmarks (2 frames × 2)',
   doc.querySelectorAll('#borders-stage .hm-wrap svg').length === 4)
{
  const borderedWraps = doc.querySelectorAll("#borders-stage .hm-wrap[data-border='1'] svg")
  let hasStroke = false
  for (const svg of borderedWraps) {
    if (svg.querySelector('rect[stroke]')) { hasStroke = true; break }
  }
  ok('bordered hallmark SVGs contain a stroked rect', hasStroke)
}
ok('24 gallery items', doc.querySelectorAll('#gallery .g-item').length === 24)
ok('4 size rows', doc.querySelectorAll('#sizes-row .row').length === 4)
ok('9 lowres canvases (3 styles × 3 scales)', doc.querySelectorAll('#lowres-grid canvas').length === 9)
ok('3 lowres style labels', doc.querySelectorAll('#lowres-grid .lr-style-label').length === 3)

const verbalWords = doc.getElementById('verbal-words')?.textContent
ok('verbal words = 3 words', verbalWords && verbalWords.split(' ').length === 3)

{
  const bg = doc.querySelector('section.background')
  ok('background section present', !!bg)
  ok('background links to Arké', !!bg?.querySelector('a[href*="arke.cash"]'))
  ok('background links to Substack', !!bg?.querySelector('a[href*="gbks.substack.com"]'))
}

let pass = 0, fail = 0
for (const c of checks) {
  console.log(`${c.pass ? '✓' : '✗'} ${c.name}${c.extra ? '  ' + c.extra : ''}`)
  c.pass ? pass++ : fail++
}
console.log(`\n${pass}/${checks.length} checks passed.`)
console.log('A words:', wordsA)
console.log('B words:', wordsB)
console.log('verbal :', verbalWords)

process.exit(fail === 0 ? 0 : 1)
