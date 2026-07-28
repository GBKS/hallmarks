<template>
  <section>
    <div class="section-intro">
      <h2>14×20 pixel-art mode</h2>
      <p>For hardware wallets, e-ink readers, embedded LCDs, and any display where sub-pixel rendering isn't available. Each cell becomes a 2×2 block; accent cells take a diagonal two-pixel form so the three-value distinction survives. Render once, upscale with nearest-neighbor — never anti-aliasing.</p>
    </div>
    <div class="lowres-grid" id="lowres-grid"></div>
  </section>
</template>
