<template>
  <section>
    <div class="section-intro">
      <h2>Borders for busy backgrounds</h2>
      <p>An optional 1-unit stroke in the primary color. Useful when the hallmark sits against a tinted surface, a photograph, or other hallmarks in a dense list — anywhere its own light background would otherwise blur into the surroundings. <code>bordered: true</code>.</p>
    </div>
    <div class="borders-stage" id="borders-stage">
      <div class="bs-frame tinted">
        <div class="bs-tag">Tinted card</div>
        <div class="bs-pair">
          <div class="bs-cell">
            <div class="hm-wrap" data-input="borders" data-border="0"></div>
            <div class="bs-label">No border</div>
          </div>
          <div class="bs-cell">
            <div class="hm-wrap" data-input="borders" data-border="1"></div>
            <div class="bs-label">With border</div>
          </div>
        </div>
      </div>
      <div class="bs-frame photographic">
        <div class="bs-tag">Photo / pattern</div>
        <div class="bs-pair">
          <div class="bs-cell">
            <div class="hm-wrap" data-input="borders" data-border="0"></div>
            <div class="bs-label">No border</div>
          </div>
          <div class="bs-cell">
            <div class="hm-wrap" data-input="borders" data-border="1"></div>
            <div class="bs-label">With border</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
