<script setup lang="ts">
import Hallmark from './Hallmark.vue'

const CARDS = [
  {
    input: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    title: 'Crypto addresses',
    label: 'bc1qar0srrr7xfkv…wf5mdq',
    desc: "Sender's screen vs. recipient's screen. Wallet vs. hardware-wallet display. The two should match before you sign.",
  },
  {
    input: 'SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8',
    title: 'Key fingerprints',
    label: 'SHA256:nThbg6kXUpJWG…',
    desc: "SSH host keys, PGP fingerprints, certificate hashes — the things you're supposed to verify out-of-band but rarely do.",
  },
  {
    input: '9d2c5e85e9b9f5e7b0a0c0d4f1a2b3c4d5e6f7a8',
    title: 'Commit SHAs',
    label: '9d2c5e85e9b9…',
    desc: "What CI is building, what's deployed in prod, what the reviewer is looking at. Visual confirmation across systems.",
  },
]
</script>

<template>
  <section>
    <div class="section-intro">
      <h2>For anything you compare character by character</h2>
      <p>Hallmarks aren't avatars and they're not memory aids — you don't need to remember what your hallmark looked like yesterday. You only need to compare what's on the screen with what's somewhere else: another screen, a printed receipt, a hardware wallet, a teammate's terminal.</p>
    </div>
    <div class="cards" id="cards">
      <div class="card" v-for="card in CARDS" :key="card.title">
        <div class="hm-row">
          <Hallmark :input="card.input" />
          <code>{{ card.label }}</code>
        </div>
        <h3>{{ card.title }}</h3>
        <p>{{ card.desc }}</p>
      </div>
    </div>
  </section>
</template>
