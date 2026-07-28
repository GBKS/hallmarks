<template>
  <section>
    <div class="section-intro">
      <h2>Three words for ears, screen readers, and phone calls</h2>
      <p>Every hallmark has a three-word companion drawn from the BIP-39 English wordlist, derived from the same hash. It's the natural <code>aria-label</code> for the image, the natural thing to read aloud over a phone call ("does your screen say <em>violin orbit tangerine</em>?"), and the natural thing to show below the visual when you want a second channel.</p>
    </div>
    <div class="verbal-box">
      <div class="hm-wrap" id="verbal-hm"></div>
      <div class="v-text">
        <div class="words" id="verbal-words"></div>
        <div class="caption" id="verbal-caption">From: <span class="mono" id="verbal-input"></span></div>
      </div>
    </div>
    <div style="margin-top: 18px;">
      <button class="action subtle" id="btn-verbal-randomize">Try another</button>
    </div>
  </section>
</template>
