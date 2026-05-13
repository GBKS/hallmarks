// Renders a preview PNG of the hero verification demo, so we can
// visually confirm the dramatic difference produced by a one-character typo.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const { hallmarkSpec, hallmarkSVG } = await import(path.join(root, "hallmark.js"));

const A = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
const B = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdr"; // last char q→r

const W = 1100, H = 540;
const PAGE_BG  = "#fafaf6";
const INK      = "#1c1b18";
const INK_SOFT = "#4a4843";
const INK_MUTE = "#7a7872";
const GOOD     = "#2c7a47";
const BAD      = "#b13428";

function inlineHallmark(input, sizeW, x, y) {
  const spec = hallmarkSpec(input);
  const sizeH = sizeW * 132 / 100;
  const parts = [`<g transform="translate(${x} ${y}) scale(${sizeW / 100})">`];
  parts.push(`<rect x="0" y="0" width="100" height="132" rx="16" ry="16" fill="${spec.background.hex}"/>`);
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

function wordsOf(input) {
  return hallmarkSpec(input).wordsText;
}

const hmW = 200;
const hmAX = 90;
const hmBX = W - 90 - hmW;
const hmY = 80;

const aHm = inlineHallmark(A, hmW, hmAX, hmY);
const bHm = inlineHallmark(B, hmW, hmBX, hmY);

const wordsAY = hmY + (hmW * 132 / 100) + 28;
const inputAY = wordsAY + 56;

const centerX = W / 2;
const indicatorY = hmY + (hmW * 132 / 100) / 2;

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Monaco, monospace";

const inputBox = (x, w, value) => `
  <rect x="${x}" y="${inputAY - 18}" width="${w}" height="40" rx="8" ry="8" fill="#fff" stroke="#e6e2d9" stroke-width="1"/>
  <text x="${x + 14}" y="${inputAY + 8}" font-family="${MONO}" font-size="13" fill="${INK}">${value}</text>
`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${PAGE_BG}"/>

  <!-- title -->
  <text x="${W/2}" y="46" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="600" fill="${INK}" letter-spacing="-0.5">Spot it before you read it</text>

  <!-- left hallmark + words + input -->
  ${aHm.svg}
  <text x="${hmAX + hmW/2}" y="${wordsAY}" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${INK_MUTE}">${wordsOf(A)}</text>
  ${inputBox(hmAX - 30, hmW + 60, A)}

  <!-- right hallmark + words + input -->
  ${bHm.svg}
  <text x="${hmBX + hmW/2}" y="${wordsAY}" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${INK_MUTE}">${wordsOf(B)}</text>
  ${inputBox(hmBX - 30, hmW + 60, B)}

  <!-- center indicator (no-match) -->
  <circle cx="${centerX}" cy="${indicatorY}" r="32" fill="${BAD}"/>
  <text x="${centerX}" y="${indicatorY + 12}" text-anchor="middle" font-family="${FONT}" font-size="36" font-weight="600" fill="white">≠</text>
  <text x="${centerX}" y="${indicatorY + 64}" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="500" fill="${BAD}" letter-spacing="1.5">NO MATCH</text>

  <!-- footer caption -->
  <text x="${W/2}" y="${H - 36}" text-anchor="middle" font-family="${FONT}" font-size="14" fill="${INK_SOFT}">One character of difference (q → r), and the entire visual mark changes.</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(path.join(root, "preview.png"));
fs.writeFileSync(path.join(root, "preview.svg"), svg);
console.log("Wrote preview.png and preview.svg");
console.log("A words:", wordsOf(A));
console.log("B words:", wordsOf(B));
