<script setup lang="ts">
import Hallmark from './Hallmark.vue'

const INDUSTRIES = [
  {
    title: 'Banking',
    desc: 'An invoice arrives by email with the supplier\'s IBAN. The clerk types it into the banking portal. Both the invoice and the portal display the hallmark next to the IBAN — a glance confirms the destination before the wire is signed off.',
    id: 'DE89370400440532013000',
    short: 'DE89 3704 0044 0532 0130 00',
    a: 'Invoice (PDF)',
    b: 'Banking app',
  },
  {
    title: 'Logistics & supply chain',
    desc: 'A truck arrives at the warehouse. The dock worker compares the manifest on the tablet against the printed container label. If the hallmarks match, sign for receipt; if not, hold the shipment.',
    id: 'MSCU5678123',
    short: 'MSCU 567 812 3',
    a: 'Shipping manifest',
    b: 'Container label',
  },
  {
    title: 'Software supply chain',
    desc: 'CI builds a Docker image, pushes it, records the digest. Production pulls the image and surfaces the digest on the deploy dashboard. Operators glance: hallmarks match → the right image shipped to the right cluster.',
    id: 'sha256:5e2c4ab87c3d1a9f6b04eed91c3aa28f51bf06d3e4a13a5b8efc1d92aa31e7d8',
    short: 'sha256:5e2c4ab8…aa31e7d8',
    a: 'CI build',
    b: 'Production deploy',
  },
]
</script>

<template>
  <section>
    <div class="section-intro">
      <h2>Where else this fits</h2>
      <p>Crypto popularized the need because the cost of getting it wrong is immediate and irreversible. But the same comparison problem shows up in any industry where humans are the bridge between two systems that need to agree on a long opaque string — banking, logistics, healthcare, software supply chains, legal, scientific records.</p>
    </div>
    <div class="industries-list" id="industries-list">
      <div class="industry" v-for="ind in INDUSTRIES" :key="ind.title">
        <div class="industry-header">
          <h3>{{ ind.title }}</h3>
          <p>{{ ind.desc }}</p>
        </div>
        <div class="industry-demo">
          <div class="ind-panel">
            <div class="ind-panel-label">{{ ind.a }}</div>
            <div class="ind-panel-body">
              <Hallmark :input="ind.id" />
              <div class="ind-id">{{ ind.short }}</div>
            </div>
          </div>
          <div class="ind-match"><div class="symbol">=</div></div>
          <div class="ind-panel">
            <div class="ind-panel-label">{{ ind.b }}</div>
            <div class="ind-panel-body">
              <Hallmark :input="ind.id" />
              <div class="ind-id">{{ ind.short }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
