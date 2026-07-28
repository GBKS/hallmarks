// Smoke test for the built site's static output.
//
// Every demo section is now a reactive Vue component that renders through
// hallmarkSVG during SSG prerender, so the built dist/index.html already
// contains all the marks, words, and structure. This test parses that static
// HTML (no scripts run) and asserts the expected content is present — i.e. that
// the library rendered correctly at build time and every section is in place.
//
// Client-only behavior (typing, toggles, canvas painting, gallery reshuffle)
// is verified interactively in a browser, not here.
//
// Prerequisite: `npm run build` (produces dist/index.html) must have run first.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jsdomPkg from 'jsdom'

const { JSDOM } = jsdomPkg
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distIndex = path.join(siteRoot, 'dist', 'index.html')

if (!fs.existsSync(distIndex)) {
  console.error('render-test: dist/index.html not found — run `npm run build` first.')
  process.exit(1)
}

const dom = new JSDOM(fs.readFileSync(distIndex, 'utf8'))
const doc = dom.window.document

const checks = []
function ok(name, cond) {
  checks.push({ name, pass: !!cond })
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
  ok('hero A and B marks differ (typo pair)', aSrc && bSrc && aSrc !== bSrc)
}

const wordsA = doc.getElementById('words-a')?.textContent?.trim()
const wordsB = doc.getElementById('words-b')?.textContent?.trim()
ok('words-a = 3 words', wordsA && wordsA.split(/\s+/).length === 3)
ok('words-b = 3 words', wordsB && wordsB.split(/\s+/).length === 3)
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
  // Two of the four marks in the borders stage are bordered; at least one
  // should carry a stroked rect (the border).
  let hasStroke = false
  for (const svg of doc.querySelectorAll('#borders-stage .hm-wrap svg')) {
    if (svg.querySelector('rect[stroke]')) { hasStroke = true; break }
  }
  ok('a bordered hallmark SVG contains a stroked rect', hasStroke)
}
ok('24 gallery items', doc.querySelectorAll('#gallery .g-item').length === 24)
ok('4 size rows', doc.querySelectorAll('#sizes-row .row').length === 4)
ok('9 lowres canvases (3 styles × 3 scales)', doc.querySelectorAll('#lowres-grid canvas').length === 9)
ok('3 lowres style labels', doc.querySelectorAll('#lowres-grid .lr-style-label').length === 3)

const verbalWords = doc.getElementById('verbal-words')?.textContent?.trim()
ok('verbal words = 3 words', verbalWords && verbalWords.split(/\s+/).length === 3)

{
  const bg = doc.querySelector('section.background')
  ok('background section present', !!bg)
  ok('background links to Arké', !!bg?.querySelector('a[href*="arke.cash"]'))
  ok('background links to Substack', !!bg?.querySelector('a[href*="gbks.substack.com"]'))
}

let pass = 0, fail = 0
for (const c of checks) {
  console.log(`${c.pass ? '✓' : '✗'} ${c.name}`)
  c.pass ? pass++ : fail++
}
console.log(`\n${pass}/${checks.length} checks passed.`)

process.exit(fail === 0 ? 0 : 1)
