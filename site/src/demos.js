// Live demo engine — ported verbatim from the original index.html <script> block.
// The only change: the library import now resolves through the '@hallmark' Vite alias
// (the built hallmark.js at the repo root), and the two dark-mode toggle buttons are
// wired here instead of via inline onclick attributes.
import { hallmark, hallmarkSpec, hallmarkSVG, hallmarkPixels, hallmarkWords } from '@hallmark';

export function initDemos() {

// =========================================================================
// Helpers
// =========================================================================

function makeHallmark(input, opts = {}) {
  // hallmarkSVG returns a string — parse it.
  const svgStr = hallmarkSVG(input, opts);
  const tpl = document.createElement("template");
  tpl.innerHTML = svgStr.trim();
  return tpl.content.firstChild;
}

function setHallmark(container, input, opts = {}) {
  container.replaceChildren(makeHallmark(input, opts));
}

function randomString(len = 34) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const SAMPLE_ADDRESSES = [
  "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  "bc1q5shngj24323nsrmxv99st02na6srekfctt30ch",
  "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "bc1prp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
  "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
  "tark1pemq45fepe2dcc3vp43xq8c4yywvn8m5kvkx0evf3jc8efg2hxsqkuw3xv",
  "tark1wp3suf7e5q8c4yywvn8m5kvkx0evf3jc8efg2hxsqkuw3xvm9k4z7p",
  "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8",
  "9d2c5e85e9b9f5e7b0a0c0d4f1a2b3c4d5e6f7a8",
  "550e8400-e29b-41d4-a716-446655440000",
  "sk-proj-aB12cD34eF56gH78iJ90",
];

function pick(arr, n) {
  const copy = arr.slice();
  const out = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

// NOTE: The wordmark, favicon, hero verification, "what it's for" cards, and
// the industry vignettes are now reactive Vue components (SiteHeader.vue,
// App.vue, HeroSection.vue, WhatForSection.vue, IndustriesSection.vue, all
// using Hallmark.vue) and were removed from this engine.

// =========================================================================
// History row
//
// Lightweight in-page approximations for each era's visual style,
// included for context rather than byte-faithful reproduction.
// =========================================================================

const COMPARE_INPUT = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

// Mulberry-like PRNG seeded from a string hash (for the recreations).
function strHash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function rng(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = t ^ (t + Math.imul(t ^ (t >>> 7), t | 61));
    return ((t ^ (t >>> 14)) >>> 0) / 0xFFFFFFFF;
  };
}

// Blockies-style: 8×8 grid, vivid HSL colors, square pixels.
function blockiesLike(input, size = 96) {
  const r = rng(strHash(input + ":bg"));
  const grid = 8;
  const cell = size / grid;
  const bg  = `hsl(${Math.floor(r() * 360)} 75% 60%)`;
  const fg  = `hsl(${Math.floor(r() * 360)} 65% 45%)`;
  const sp  = `hsl(${Math.floor(r() * 360)} 80% 50%)`;
  const cells = [];
  const r2 = rng(strHash(input + ":cells"));
  for (let y = 0; y < grid; y++) {
    const row = [];
    for (let x = 0; x < grid / 2; x++) {
      const v = r2();
      row.push(v < 0.5 ? 0 : v < 0.85 ? 1 : 2);
    }
    for (let x = grid / 2 - 1; x >= 0; x--) row.push(row[x]);
    cells.push(row);
  }
  let parts = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`];
  parts.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="${bg}"/>`);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (cells[y][x] === 0) continue;
      const fill = cells[y][x] === 2 ? sp : fg;
      parts.push(`<rect x="${x*cell}" y="${y*cell}" width="${cell}" height="${cell}" fill="${fill}"/>`);
    }
  }
  parts.push("</svg>");
  return parts.join("");
}

// Jdenticon-style: rotated triangles in a 5-region layout, soft pastel.
function jdenticonLike(input, size = 96) {
  const r = rng(strHash(input + ":j"));
  const baseHue = Math.floor(r() * 360);
  const colors = [
    `hsl(${baseHue} 50% 50%)`,
    `hsl(${(baseHue + 120) % 360} 45% 55%)`,
    `hsl(${(baseHue + 240) % 360} 40% 65%)`,
  ];
  const bg = "#f0f0ee";
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`];
  parts.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="${bg}"/>`);
  // Five shapes at the corners and center, each a rotated triangle.
  const positions = [
    [size*0.18, size*0.18],
    [size*0.82, size*0.18],
    [size*0.18, size*0.82],
    [size*0.82, size*0.82],
    [size*0.50, size*0.50],
  ];
  for (let i = 0; i < positions.length; i++) {
    const [cx, cy] = positions[i];
    const sz = size * (0.12 + r() * 0.06);
    const rot = Math.floor(r() * 4) * 90;
    const color = colors[Math.floor(r() * colors.length)];
    parts.push(`<g transform="translate(${cx} ${cy}) rotate(${rot})"><polygon points="${-sz},${-sz} ${sz},${-sz} ${-sz},${sz}" fill="${color}"/></g>`);
  }
  parts.push("</svg>");
  return parts.join("");
}

// GitHub-style: 5×5 symmetric grid, single color, big square cells.
function githubLike(input, size = 96) {
  const r = rng(strHash(input + ":gh"));
  const hue = Math.floor(r() * 360);
  const fg = `hsl(${hue} 35% 45%)`;
  const bg = "#ededec";
  const grid = 5;
  const margin = size * 0.10;
  const cell = (size - 2 * margin) / grid;
  const cells = [];
  for (let y = 0; y < grid; y++) {
    const row = [];
    for (let x = 0; x < 3; x++) row.push(r() < 0.5 ? 1 : 0);
    for (let x = 1; x >= 0; x--) row.push(row[x]);
    cells.push(row);
  }
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`];
  parts.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="${bg}"/>`);
  for (let y = 0; y < grid; y++)
    for (let x = 0; x < grid; x++)
      if (cells[y][x])
        parts.push(`<rect x="${margin + x*cell}" y="${margin + y*cell}" width="${cell}" height="${cell}" fill="${fg}"/>`);
  parts.push("</svg>");
  return parts.join("");
}

function sshRandomartLike(input) {
  const r = rng(strHash(input + ":ssh-randomart"));
  const chars = " .o+=*BOX@%&#/^";
  const width = 17;
  const height = 9;
  const rows = [];
  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      line += chars[Math.floor(r() * chars.length)];
    }
    rows.push(line);
  }
  return `<pre class="randomart" aria-label="SSH randomart-style fingerprint">+-----------------+\n|${rows.join("|\n|")}|\n+-----------------+</pre>`;
}

const compareEntries = [
  {
    name: "SSH randomart",
    note: "Key fingerprints in terminal UIs (2008)",
    html: sshRandomartLike(COMPARE_INPUT),
  },
  {
    name: "Web identicons",
    note: "Deterministic account visuals for avatars",
    svg: githubLike(COMPARE_INPUT),
  },
  {
    name: "Wallet-era marks",
    note: "Address checks where mismatch costs are immediate",
    svg: blockiesLike(COMPARE_INPUT),
  },
  {
    name: "Hallmarks",
    note: "Standard-first: cross-platform, accessible, low-res",
    isHallmark: true,
  },
];

const ct = document.getElementById("compare-table");
for (const e of compareEntries) {
  const el = document.createElement("div");
  el.className = "cell" + (e.isHallmark ? " hallmark-cell" : "");
  el.innerHTML = `<div class="frame"></div><div class="name">${e.name}</div><span class="note">${e.note}</span>`;
  const frame = el.querySelector(".frame");
  if (e.isHallmark) {
    const wrap = document.createElement("div");
    wrap.style.width = "82px";
    wrap.appendChild(makeHallmark(COMPARE_INPUT));
    wrap.querySelector("svg").style.width = "82px";
    wrap.querySelector("svg").style.height = "auto";
    frame.appendChild(wrap);
  } else if (e.html) {
    frame.innerHTML = e.html;
  } else {
    frame.innerHTML = e.svg;
    const svg = frame.querySelector("svg");
    svg.setAttribute("width", "82");
    svg.setAttribute("height", "82");
  }
  ct.appendChild(el);
}

// (Styles row is now StylesSection.vue.)

// =========================================================================
// Dark mode demo
// =========================================================================

const DM_INPUTS = [
  "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8",
  "9d2c5e85e9b9f5e7b0a0c0d4f1a2b3c4d5e6f7a8",
];
const DM_STYLES = ["standard", "high-contrast", "monochrome"];

let currentDemoMode = "light";

const dmGrid = document.getElementById("dark-mode-grid");
const dmCompare = document.getElementById("dark-mode-compare");

function buildDarkModeGrid(mode) {
  dmGrid.replaceChildren();
  for (const style of DM_STYLES) {
    const el = document.createElement("div");
    el.className = "dm-cell";
    el.innerHTML = `<div class="hm-wrap"></div><div class="dm-label">${style.replace("-", " ")}</div>`;
    setHallmark(el.querySelector(".hm-wrap"), DM_INPUTS[0], { style, mode });
    dmGrid.appendChild(el);
  }
}

function buildDarkModeCompare() {
  dmCompare.replaceChildren();
  for (const mode of ["light", "dark"]) {
    const band = document.createElement("div");
    band.className = `dmc-band ${mode}`;
    const lbl = document.createElement("div");
    lbl.className = "dmc-band-label";
    lbl.textContent = mode;
    band.appendChild(lbl);
    for (const input of DM_INPUTS) {
      const row = document.createElement("div");
      row.className = "dmc-row";
      row.innerHTML = `<div class="hm-wrap"></div>`;
      setHallmark(row.querySelector(".hm-wrap"), input, { mode });
      band.appendChild(row);
    }
    dmCompare.appendChild(band);
  }
}

window.setDemoMode = function(mode) {
  currentDemoMode = mode;
  document.getElementById("dm-light-btn").classList.toggle("active", mode === "light");
  document.getElementById("dm-dark-btn").classList.toggle("active", mode === "dark");
  buildDarkModeGrid(mode);
};

buildDarkModeGrid("light");
buildDarkModeCompare();

// (Borders stage is now BordersSection.vue.)
// (Gallery is now GallerySection.vue.)
// (Sizes row is now SizesSection.vue.)

// =========================================================================
// Low-res pixel mode
// =========================================================================

const LOWRES_INPUT = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const LOWRES_STYLES = [
  { style: "standard",      sub: "OKLCH color pair" },
  { style: "high-contrast", sub: "For sunlight & e-ink" },
  { style: "monochrome",    sub: "1-bit displays" },
];
const LOWRES_SCALES = [
  { px: 1, label: "Native 14×20" },
  { px: 4, label: "4×" },
  { px: 8, label: "8×" },
];

function buildLowres() {
  const grid = document.getElementById("lowres-grid");
  grid.replaceChildren();

  for (const s of LOWRES_STYLES) {
    const labelEl = document.createElement("div");
    labelEl.className = "lr-style-label";
    labelEl.innerHTML = `${s.style.replace("-", " ")}<span class="lr-style-sub">${s.sub}</span>`;
    grid.appendChild(labelEl);

    const styleRow = document.createElement("div");
    styleRow.className = "lr-style-row";
    grid.appendChild(styleRow);

    const lr = hallmarkPixels(LOWRES_INPUT, { style: s.style });
    for (const scale of LOWRES_SCALES) {
      const cell = document.createElement("div");
      cell.className = "lr-cell";
      const c = document.createElement("canvas");
      c.width = 14 * scale.px;
      c.height = 20 * scale.px;
      c.style.width = (14 * scale.px) + "px";
      c.style.height = (20 * scale.px) + "px";
      cell.appendChild(c);
      const cap = document.createElement("div");
      cap.className = "lr-label";
      cap.textContent = scale.label;
      cell.appendChild(cap);
      styleRow.appendChild(cell);

      const ctx = c.getContext("2d");
      if (!ctx) continue; // canvas unavailable in test env
      // Paint background.
      ctx.fillStyle = lr.colors.background.hex;
      ctx.fillRect(0, 0, c.width, c.height);
      // Paint each pixel per its value (0/1/2).
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 14; x++) {
          const v = lr.pixels[y * 14 + x];
          if (v === 0) continue;
          // Monochrome: collapse value 2 → primary color.
          const color = (s.style === "monochrome" || v === 1)
            ? lr.colors.primary.hex
            : lr.colors.accent.hex;
          ctx.fillStyle = color;
          ctx.fillRect(x * scale.px, y * scale.px, scale.px, scale.px);
        }
      }
    }
  }
}
try { buildLowres(); } catch (e) { console.error("lowres failed:", e); }

// (Verbal companion is now VerbalSection.vue.)

  // Dark-mode toggle (migrated from inline onclick="setDemoMode(...)")
  document.getElementById('dm-light-btn')?.addEventListener('click', () => window.setDemoMode('light'));
  document.getElementById('dm-dark-btn')?.addEventListener('click', () => window.setDemoMode('dark'));
}
