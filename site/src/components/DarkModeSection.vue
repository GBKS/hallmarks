<script setup lang="ts">
import { ref } from 'vue'
import Hallmark from './Hallmark.vue'

type Mode = 'light' | 'dark'

const INPUTS = [
  'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  'SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8',
  '9d2c5e85e9b9f5e7b0a0c0d4f1a2b3c4d5e6f7a8',
]
const STYLES = ['standard', 'high-contrast', 'monochrome'] as const

const mode = ref<Mode>('light')
</script>

<template>
  <section>
    <div class="section-intro">
      <h2>Light and dark mode</h2>
      <p>Mode is orthogonal to style — every style renders in both light and dark. The pattern and hues are identical; only the palette changes. The three-word companion is fully mode-invariant, making it the clearest anchor when comparing across a light-mode phone and a dark hardware wallet.</p>
    </div>

    <div class="dark-mode-toggle">
      <button class="dm-btn" :class="{ active: mode === 'light' }" id="dm-light-btn" @click="mode = 'light'">Light</button>
      <button class="dm-btn" :class="{ active: mode === 'dark' }" id="dm-dark-btn" @click="mode = 'dark'">Dark</button>
    </div>

    <div class="dark-mode-grid" id="dark-mode-grid">
      <div class="dm-cell" v-for="style in STYLES" :key="style">
        <Hallmark :input="INPUTS[0]" :style-name="style" :mode="mode" />
        <div class="dm-label">{{ style.replace('-', ' ') }}</div>
      </div>
    </div>

    <p class="dark-mode-compare-label">Light and dark side by side, each on its own background:</p>
    <div class="dark-mode-compare" id="dark-mode-compare">
      <div class="dmc-band" :class="band" v-for="band in (['light', 'dark'] as Mode[])" :key="band">
        <div class="dmc-band-label">{{ band }}</div>
        <div class="dmc-row" v-for="input in INPUTS" :key="input">
          <Hallmark :input="input" :mode="band" />
        </div>
      </div>
    </div>
  </section>
</template>
