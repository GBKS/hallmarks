<script setup lang="ts">
import Hallmark from './Hallmark.vue'

// Lightweight in-page approximations of each era's visual style, included for
// context rather than byte-faithful reproduction. All are seeded from a fixed
// input, so they're deterministic (identical on server prerender and client).
const COMPARE_INPUT = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'

function strHash(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

function rng(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t = t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))
    return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff
  }
}

// Blockies-style: 8×8 grid, vivid HSL colors, square pixels.
function blockiesLike(input: string, size = 82): string {
  const r = rng(strHash(input + ':bg'))
  const grid = 8
  const cell = size / grid
  const bg = `hsl(${Math.floor(r() * 360)} 75% 60%)`
  const fg = `hsl(${Math.floor(r() * 360)} 65% 45%)`
  const sp = `hsl(${Math.floor(r() * 360)} 80% 50%)`
  const cells: number[][] = []
  const r2 = rng(strHash(input + ':cells'))
  for (let y = 0; y < grid; y++) {
    const row: number[] = []
    for (let x = 0; x < grid / 2; x++) {
      const v = r2()
      row.push(v < 0.5 ? 0 : v < 0.85 ? 1 : 2)
    }
    for (let x = grid / 2 - 1; x >= 0; x--) row.push(row[x])
    cells.push(row)
  }
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`]
  parts.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="${bg}"/>`)
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (cells[y][x] === 0) continue
      const fill = cells[y][x] === 2 ? sp : fg
      parts.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fill}"/>`)
    }
  }
  parts.push('</svg>')
  return parts.join('')
}

// GitHub-style: 5×5 symmetric grid, single color, big square cells.
function githubLike(input: string, size = 82): string {
  const r = rng(strHash(input + ':gh'))
  const hue = Math.floor(r() * 360)
  const fg = `hsl(${hue} 35% 45%)`
  const bg = '#ededec'
  const grid = 5
  const margin = size * 0.1
  const cell = (size - 2 * margin) / grid
  const cells: number[][] = []
  for (let y = 0; y < grid; y++) {
    const row: number[] = []
    for (let x = 0; x < 3; x++) row.push(r() < 0.5 ? 1 : 0)
    for (let x = 1; x >= 0; x--) row.push(row[x])
    cells.push(row)
  }
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`]
  parts.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="${bg}"/>`)
  for (let y = 0; y < grid; y++)
    for (let x = 0; x < grid; x++)
      if (cells[y][x])
        parts.push(`<rect x="${margin + x * cell}" y="${margin + y * cell}" width="${cell}" height="${cell}" fill="${fg}"/>`)
  parts.push('</svg>')
  return parts.join('')
}

function sshRandomartLike(input: string): string {
  const r = rng(strHash(input + ':ssh-randomart'))
  const chars = ' .o+=*BOX@%&#/^'
  const width = 17
  const height = 9
  const rows: string[] = []
  for (let y = 0; y < height; y++) {
    let line = ''
    for (let x = 0; x < width; x++) line += chars[Math.floor(r() * chars.length)]
    rows.push(line)
  }
  return `<pre class="randomart" aria-label="SSH randomart-style fingerprint">+-----------------+\n|${rows.join('|\n|')}|\n+-----------------+</pre>`
}

const entries = [
  { name: 'SSH randomart', note: 'Key fingerprints in terminal UIs (2008)', markup: sshRandomartLike(COMPARE_INPUT) },
  { name: 'Web identicons', note: 'Deterministic account visuals for avatars', markup: githubLike(COMPARE_INPUT) },
  { name: 'Wallet-era marks', note: 'Address checks where mismatch costs are immediate', markup: blockiesLike(COMPARE_INPUT) },
  { name: 'Hallmarks', note: 'Standard-first: cross-platform, accessible, low-res', isHallmark: true },
]
</script>

<template>
  <section>
    <div class="section-intro">
      <h2>A short history of visual fingerprints</h2>
      <p>Long before crypto wallets, people needed a quick way to compare long opaque strings without reading every character. The tools changed across eras, but the goal stayed the same: reduce human error when two systems must agree.</p>
    </div>
    <div class="compare-table" id="compare-table">
      <div
        class="cell"
        :class="{ 'hallmark-cell': entry.isHallmark }"
        v-for="entry in entries"
        :key="entry.name"
      >
        <div class="frame">
          <Hallmark v-if="entry.isHallmark" :input="COMPARE_INPUT" />
          <div v-else v-html="entry.markup"></div>
        </div>
        <div class="name">{{ entry.name }}</div>
        <span class="note">{{ entry.note }}</span>
      </div>
    </div>
  </section>
</template>
