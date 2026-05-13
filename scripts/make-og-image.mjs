// Generate og-image.png at 1200×630 — a tight grid of Hallmarks behind
// the wordmark and tagline. Uses the reference implementation so the
// image stays in sync with the algorithm.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const mod = await import(path.join(root, "hallmark.js"));
const { hallmarkSpec } = mod;

const W = 1200, H = 630;

// Use the standard style. Background of the card matches the site.
const PAGE_BG  = "#fafaf6";
const INK      = "#1c1b18";
const INK_SOFT = "#4a4843";
const ACCENT   = "#c5572b";

function hallmarkInlineSVG(input, sizeW, x, y, opacity = 1) {
  const spec = hallmarkSpec(input, { style: "standard" });
  // Render at viewBox 100×132. Place at (x, y) scaled to sizeW wide.
  const sizeH = sizeW * 132 / 100;
  let parts = [`<g transform="translate(${x} ${y}) scale(${sizeW / 100})" opacity="${opacity}">`];
  parts.push(`<rect x="0" y="0" width="100" height="132" rx="16" ry="16" fill="${spec.background.hex}"/>`);
  // Cells
  const padding = 10;
  const cell = (100 - 20) / 5;
  const dotR = cell * 0.40;
  const accR = cell * 0.46;
  for (let yy = 0; yy < 7; yy++) {
    for (let xx = 0; xx < 5; xx++) {
      const v = spec.cells[yy][xx];
      if (v === 0) continue;
      const cx = padding + xx * cell + cell / 2;
      const cy = padding + yy * cell + cell / 2;
      const r = v === 2 ? accR : dotR;
      const fill = v === 2 ? spec.accent.hex : spec.primary.hex;
      parts.push(`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}"/>`);
    }
  }
  parts.push("</g>");
  return { svg: parts.join(""), w: sizeW, h: sizeH };
}

// Build a background grid of hallmarks, then a foreground "card" with
// the wordmark and tagline.
const layers = [];

// Background grid. 10 columns × 6 rows of hallmarks, slightly fading
// toward the center where the text sits.
const GRID_TILE = 130; // px width per hallmark inc. its taller height
const COLS = 10;
const ROWS = 5;
const totalW = COLS * GRID_TILE;
const totalH = ROWS * (GRID_TILE * 132 / 100);
const offX = (W - totalW) / 2;
const offY = (H - totalH) / 2;

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const seed = `og-${r}-${c}-${Math.random().toString(36).slice(2)}`;
    const x = offX + c * GRID_TILE;
    const y = offY + r * (GRID_TILE * 132 / 100);
    // Distance from center for fade.
    const cx = W / 2, cy = H / 2;
    const tileCx = x + GRID_TILE / 2;
    const tileCy = y + (GRID_TILE * 132 / 100) / 2;
    const dx = (tileCx - cx) / (W / 2);
    const dy = (tileCy - cy) / (H / 2);
    const dist = Math.min(1, Math.sqrt(dx*dx + dy*dy));
    const opacity = 0.35 + 0.55 * dist;          // center 0.35, edges 0.90
    layers.push(hallmarkInlineSVG(seed, GRID_TILE - 14, x, y, opacity));
  }
}

// Foreground "card" — semi-transparent panel behind the wordmark.
const cardW = 720;
const cardH = 340;
const cardX = (W - cardW) / 2;
const cardY = (H - cardH) / 2;

const cardSvg = `
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="22" ry="22"
        fill="${PAGE_BG}" opacity="0.94"/>
`;

// Wordmark hallmark + brand name + tagline
const wordmarkSize = 92;
const wmX = cardX + 60;
const wmY = cardY + 64;
const wordmark = hallmarkInlineSVG("hallmarks", wordmarkSize, wmX, wmY);

const text = `
  <text x="${wmX + wordmarkSize + 24}" y="${wmY + 72}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        font-size="56" font-weight="600" fill="${INK}" letter-spacing="-1.5">Hallmarks</text>
  <text x="${cardX + 60}" y="${cardY + 230}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        font-size="34" font-weight="500" fill="${INK}" letter-spacing="-0.6">Spot it before you read it.</text>
  <text x="${cardX + 60}" y="${cardY + 280}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        font-size="20" font-weight="400" fill="${INK_SOFT}">Deterministic visual marks for verifying identifiers.</text>
`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${PAGE_BG}"/>
  ${layers.map(l => l.svg).join("\n  ")}
  ${cardSvg}
  ${wordmark.svg}
  ${text}
</svg>`;

const outPath = path.join(root, "og-image.png");
await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(outPath);

const stat = fs.statSync(outPath);
console.log("Wrote", outPath, `(${(stat.size / 1024).toFixed(1)} kB)`);

// Also save the SVG for reference / future edits.
fs.writeFileSync(path.join(root, "og-image.svg"), svg);
console.log("Also wrote og-image.svg");
