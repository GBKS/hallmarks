<script setup lang="ts">
import { computed, ref } from 'vue'
import { hallmarkWords } from '@hallmark'
import Hallmark from './Hallmark.vue'

const ADDR = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'

// Initialize with the one-character-typo demo (most visceral first impression).
const inputA = ref(ADDR)
const inputB = ref(ADDR.slice(0, -1) + 'r')

const wordsA = computed(() => hallmarkWords(inputA.value).join(' '))
const wordsB = computed(() => hallmarkWords(inputB.value).join(' '))

const isMatch = computed(
  () => inputA.value === inputB.value && inputA.value.length > 0,
)
const symbol = computed(() => (isMatch.value ? '=' : '≠'))
const label = computed(() => {
  if (isMatch.value) return 'Match'
  return inputA.value.length === 0 || inputB.value.length === 0 ? 'Empty' : 'No match'
})

function tryTypo() {
  inputA.value = ADDR
  inputB.value = ADDR.slice(0, -1) + (ADDR.slice(-1) === 'q' ? 'r' : 'q')
}

function tryIbanTypo() {
  // Two plausibly-similar German IBANs that differ by a single digit.
  inputA.value = 'DE89370400440532013000'
  inputB.value = 'DE89370400440532013009'
}

function randomString(len = 34) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function randomize() {
  inputA.value = randomString(34)
  inputB.value = randomString(34)
}

function copyAToB() {
  inputB.value = inputA.value
}
</script>

<template>
  <section class="hero">
    <h1>Spot it<br>before you read it.</h1>
    <p class="lead">
      Hallmarks turn long, opaque identifiers — crypto addresses, key fingerprints, commit SHAs, anything you'd otherwise read character by character — into small, distinct visual marks. A mismatch jumps out before you've finished reading the string. The careful read is still yours when it matters.
    </p>

    <div class="verify" id="verify">
      <div class="pane">
        <Hallmark id="hm-a" :input="inputA" />
        <div class="words" id="words-a">{{ wordsA }}</div>
        <input type="text" id="input-a" spellcheck="false" autocomplete="off" v-model="inputA">
      </div>
      <div class="compare-indicator" id="compare-indicator" :class="{ match: isMatch }">
        <div class="symbol" id="compare-symbol">{{ symbol }}</div>
        <div class="label" id="compare-label">{{ label }}</div>
      </div>
      <div class="pane">
        <Hallmark id="hm-b" :input="inputB" />
        <div class="words" id="words-b">{{ wordsB }}</div>
        <input type="text" id="input-b" spellcheck="false" autocomplete="off" v-model="inputB">
      </div>
    </div>

    <div class="below">
      <button class="action" id="btn-typo" @click="tryTypo">Try a crypto-address typo</button>
      <button class="action" id="btn-iban-typo" @click="tryIbanTypo">Try an IBAN typo</button>
      <button class="action subtle" id="btn-randomize" @click="randomize">Randomize both</button>
      <button class="action subtle" id="btn-copy-a" @click="copyAToB">Copy A to B</button>
    </div>
  </section>
</template>
