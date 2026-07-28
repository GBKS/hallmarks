<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { hallmarkPixels } from '@hallmark'

const INPUT = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'

const STYLES = [
  { style: 'standard', sub: 'OKLCH color pair' },
  { style: 'high-contrast', sub: 'For sunlight & e-ink' },
  { style: 'monochrome', sub: '1-bit displays' },
] as const
const SCALES = [
  { px: 1, label: 'Native 14×20' },
  { px: 4, label: '4×' },
  { px: 8, label: '8×' },
]

const grid = ref<HTMLElement | null>(null)

// Canvas is a client-only paint (getContext isn't available during SSG
// prerender), so the <canvas> elements render empty in the static HTML and get
// painted here on mount.
onMounted(() => {
  if (!grid.value) return
  for (const s of STYLES) {
    const lr = hallmarkPixels(INPUT, { style: s.style })
    const canvases = grid.value.querySelectorAll<HTMLCanvasElement>(
      `canvas[data-style="${s.style}"]`,
    )
    for (const c of canvases) {
      const px = Number(c.dataset.px)
      const ctx = c.getContext('2d')
      if (!ctx) continue
      ctx.fillStyle = lr.colors.background.hex
      ctx.fillRect(0, 0, c.width, c.height)
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 14; x++) {
          const v = lr.pixels[y * 14 + x]
          if (v === 0) continue
          // Monochrome collapses value 2 → primary color.
          ctx.fillStyle =
            s.style === 'monochrome' || v === 1
              ? lr.colors.primary.hex
              : lr.colors.accent.hex
          ctx.fillRect(x * px, y * px, px, px)
        }
      }
    }
  }
})
</script>

<template>
  <section>
    <div class="section-intro">
      <h2>14×20 pixel-art mode</h2>
      <p>For hardware wallets, e-ink readers, embedded LCDs, and any display where sub-pixel rendering isn't available. Each cell becomes a 2×2 block; accent cells take a diagonal two-pixel form so the three-value distinction survives. Render once, upscale with nearest-neighbor — never anti-aliasing.</p>
    </div>
    <div class="lowres-grid" id="lowres-grid" ref="grid">
      <template v-for="s in STYLES" :key="s.style">
        <div class="lr-style-label">{{ s.style.replace('-', ' ') }}<span class="lr-style-sub">{{ s.sub }}</span></div>
        <div class="lr-style-row">
          <div class="lr-cell" v-for="scale in SCALES" :key="scale.px">
            <canvas
              :data-style="s.style"
              :data-px="scale.px"
              :width="14 * scale.px"
              :height="20 * scale.px"
              :style="{ width: 14 * scale.px + 'px', height: 20 * scale.px + 'px' }"
            ></canvas>
            <div class="lr-label">{{ scale.label }}</div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
