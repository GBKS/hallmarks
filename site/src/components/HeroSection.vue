<template>
  <section class="hero">
    <h1>Spot it<br>before you read it.</h1>
    <p class="lead">
      Hallmarks turn long, opaque identifiers — crypto addresses, key fingerprints, commit SHAs, anything you'd otherwise read character by character — into small, distinct visual marks. A mismatch jumps out before you've finished reading the string. The careful read is still yours when it matters.
    </p>

    <div class="verify" id="verify">
      <div class="pane">
        <div class="hm-wrap" id="hm-a"></div>
        <div class="words" id="words-a"></div>
        <input type="text" id="input-a" spellcheck="false" autocomplete="off">
      </div>
      <div class="compare-indicator" id="compare-indicator">
        <div class="symbol" id="compare-symbol">≠</div>
        <div class="label" id="compare-label">No match</div>
      </div>
      <div class="pane">
        <div class="hm-wrap" id="hm-b"></div>
        <div class="words" id="words-b"></div>
        <input type="text" id="input-b" spellcheck="false" autocomplete="off">
      </div>
    </div>

    <div class="below">
      <button class="action" id="btn-typo">Try a crypto-address typo</button>
      <button class="action" id="btn-iban-typo">Try an IBAN typo</button>
      <button class="action subtle" id="btn-randomize">Randomize both</button>
      <button class="action subtle" id="btn-copy-a">Copy A to B</button>
    </div>
  </section>
</template>
