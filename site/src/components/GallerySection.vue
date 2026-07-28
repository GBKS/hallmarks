<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Hallmark from './Hallmark.vue'
import { randomString } from '../utils'

const COUNT = 24

// Deterministic initial set so the prerendered HTML matches the first client
// render (no hydration mismatch). Reshuffled to fresh randoms on mount, so
// each visit still gets an arbitrary grid.
const inputs = ref(Array.from({ length: COUNT }, (_, i) => `hallmark-sample-${i}`))

function regenerate() {
  inputs.value = Array.from({ length: COUNT }, () => randomString(34))
}

onMounted(regenerate)
</script>

<template>
  <section>
    <div class="section-intro">
      <h2>Visual variety</h2>
      <p>Twenty-four arbitrary inputs. The point of the grid isn't beauty — it's that no two look the same at a glance. Hover any tile to see its source string.</p>
    </div>
    <div class="gallery-grid" id="gallery">
      <div class="g-item" v-for="input in inputs" :key="input" :title="input">
        <Hallmark :input="input" />
      </div>
    </div>
    <div style="margin-top: 22px;">
      <button class="action" id="btn-regen-gallery" @click="regenerate">Generate new set</button>
    </div>
  </section>
</template>
