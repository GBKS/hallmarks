<template>
  <section>
    <div class="section-intro">
      <h2>Light and dark mode</h2>
      <p>Mode is orthogonal to style — every style renders in both light and dark. The pattern and hues are identical; only the palette changes. The three-word companion is fully mode-invariant, making it the clearest anchor when comparing across a light-mode phone and a dark hardware wallet.</p>
    </div>
    <div class="dark-mode-toggle">
      <button class="dm-btn active" id="dm-light-btn">Light</button>
      <button class="dm-btn" id="dm-dark-btn">Dark</button>
    </div>
    <div class="dark-mode-grid" id="dark-mode-grid"></div>
    <p class="dark-mode-compare-label">Light and dark side by side, each on its own background:</p>
    <div class="dark-mode-compare" id="dark-mode-compare"></div>
  </section>
</template>
