<script setup lang="ts">
import Hallmark from './Hallmark.vue'

const INPUT = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
const FRAMES = [
  { klass: 'tinted', tag: 'Tinted card' },
  { klass: 'photographic', tag: 'Photo / pattern' },
]
</script>

<template>
  <section>
    <div class="section-intro">
      <h2>Borders for busy backgrounds</h2>
      <p>An optional 1-unit stroke in the primary color. Useful when the hallmark sits against a tinted surface, a photograph, or other hallmarks in a dense list — anywhere its own light background would otherwise blur into the surroundings. <code>bordered: true</code>.</p>
    </div>
    <div class="borders-stage" id="borders-stage">
      <div class="bs-frame" :class="frame.klass" v-for="frame in FRAMES" :key="frame.klass">
        <div class="bs-tag">{{ frame.tag }}</div>
        <div class="bs-pair">
          <div class="bs-cell">
            <Hallmark :input="INPUT" />
            <div class="bs-label">No border</div>
          </div>
          <div class="bs-cell">
            <Hallmark :input="INPUT" :bordered="true" />
            <div class="bs-label">With border</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
