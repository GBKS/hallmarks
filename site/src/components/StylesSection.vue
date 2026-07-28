<script setup lang="ts">
import Hallmark from './Hallmark.vue'

const INPUT = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
const STYLE_DEMOS = [
  { style: 'standard', desc: 'OKLCH-tuned color pair.' },
  { style: 'high-contrast', desc: 'For sunlight, low-quality displays, vision impairment.' },
  { style: 'monochrome', desc: 'Shape replaces color for the third value.' },
] as const
</script>

<template>
  <section>
    <div class="section-intro">
      <h2>Three styles, one algorithm</h2>
      <p>The same pattern, rendered for different display environments. Monochrome uses shape (circle vs. rounded square) to carry the third value when color isn't available.</p>
    </div>
    <div class="styles-row" id="styles-row">
      <div class="style-cell" v-for="d in STYLE_DEMOS" :key="d.style">
        <Hallmark :input="INPUT" :style-name="d.style" />
        <div class="style-name">{{ d.style.replace('-', ' ') }}</div>
        <div class="style-desc">{{ d.desc }}</div>
      </div>
    </div>
  </section>
</template>
