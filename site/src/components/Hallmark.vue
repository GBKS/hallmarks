<script setup lang="ts">
import { computed } from 'vue'
import { hallmarkSVG } from '@hallmark'

// A single hallmark, rendered reactively as inline SVG. hallmarkSVG returns a
// string and needs no DOM, so this renders correctly during SSG prerender too
// (the mark ends up in the static HTML instead of being drawn on the client).
const props = withDefaults(
  defineProps<{
    input: string
    styleName?: 'standard' | 'high-contrast' | 'monochrome'
    mode?: 'light' | 'dark'
    bordered?: boolean
    /** Class on the wrapping element. Defaults to the shared `hm-wrap` hook the CSS targets. */
    wrapClass?: string
  }>(),
  { wrapClass: 'hm-wrap' },
)

const svg = computed(() =>
  hallmarkSVG(props.input, {
    style: props.styleName,
    mode: props.mode,
    bordered: props.bordered,
  }),
)
</script>

<template>
  <div :class="wrapClass" v-html="svg"></div>
</template>
