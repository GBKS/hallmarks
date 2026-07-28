<script setup lang="ts">
import { computed } from 'vue'
import { hallmarkSVG } from '@hallmark'

// The wordmark is itself a hallmark of the brand name.
const wordmarkSvg = computed(() => hallmarkSVG('hallmarks', { style: 'standard' }))
</script>

<template>
  <header class="site">
    <a class="wordmark" href="#" aria-label="Hallmarks home">
      <span class="wordmark-mark" v-html="wordmarkSvg"></span>
      <span>Hallmarks</span>
    </a>
    <nav class="site">
      <a href="#use-it">Use it</a>
      <a href="/SPEC.md">Spec</a>
      <a href="https://github.com/GBKS/hallmarks">GitHub</a>
    </nav>
  </header>
</template>
