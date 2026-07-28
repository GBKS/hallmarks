<script setup lang="ts">
import { onMounted } from 'vue'
import SiteHeader from './components/SiteHeader.vue'
import HeroSection from './components/HeroSection.vue'
import WhatForSection from './components/WhatForSection.vue'
import IndustriesSection from './components/IndustriesSection.vue'
import HistorySection from './components/HistorySection.vue'
import StylesSection from './components/StylesSection.vue'
import DarkModeSection from './components/DarkModeSection.vue'
import BordersSection from './components/BordersSection.vue'
import GallerySection from './components/GallerySection.vue'
import SizesSection from './components/SizesSection.vue'
import LowResSection from './components/LowResSection.vue'
import VerbalSection from './components/VerbalSection.vue'
import UseItSection from './components/UseItSection.vue'
import BackgroundSection from './components/BackgroundSection.vue'
import SiteFooter from './components/SiteFooter.vue'
// The live-demo engine, ported from the original inline <script>. It wires up
// the interactive demos imperatively after the static markup has mounted.
import { initDemos } from './demos.js'

onMounted(() => {
  initDemos()
})
</script>

<template>
  <SiteHeader />
  <main>
    <HeroSection />
    <WhatForSection />
    <IndustriesSection />
    <HistorySection />
    <StylesSection />
    <DarkModeSection />
    <BordersSection />
    <GallerySection />
    <SizesSection />
    <LowResSection />
    <VerbalSection />
    <UseItSection />
    <BackgroundSection />
  </main>
  <SiteFooter />
</template>
