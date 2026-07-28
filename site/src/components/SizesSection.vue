<script setup lang="ts">
import Hallmark from './Hallmark.vue'

const SIZE_PX = [22, 28, 34, 48, 64]
const ADDRESSES = [
  'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  'bc1q5shngj24323nsrmxv99st02na6srekfctt30ch',
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  'bc1prp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
]
</script>

<template>
  <section>
    <div class="section-intro">
      <h2>Designed to work small</h2>
      <p>Hallmarks were tuned for the 22–34 px range — small enough to sit inline next to an address line, large enough to distinguish without squinting. Below 18 px, switch to the 14×20 pixel-art variant.</p>
    </div>
    <div class="sizes-row" id="sizes-row">
      <div class="row" v-for="addr in ADDRESSES" :key="addr">
        <div class="hm-set">
          <Hallmark
            v-for="px in SIZE_PX"
            :key="px"
            :input="addr"
            :style="{ width: px + 'px' }"
          />
        </div>
        <div class="addr">{{ addr }}</div>
      </div>
    </div>
  </section>
</template>
