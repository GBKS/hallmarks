// Hallmarks — deterministic visual marks for verifying identifiers.
// TypeScript reference implementation of Hallmarks v1.0.
//
// Spec: SPEC.md (CC0 1.0)
// Code: MIT — see LICENSE
//
// SPDX-License-Identifier: MIT

import { BIP39_ENGLISH } from "./bip39-english";

// =============================================================================
// Public types
// =============================================================================

export type HallmarkStyle = "standard" | "high-contrast" | "monochrome";

export interface HallmarkOptions {
  /** Visual style. Defaults to "standard". */
  style?: HallmarkStyle;
  /** Draw a 1-unit border in the primary color. Defaults to false. */
  bordered?: boolean;
}

export interface OklchColor {
  /** OKLCH lightness, 0..1 */
  L: number;
  /** OKLCH chroma, typically 0..0.4 */
  C: number;
  /** OKLCH hue, 0..360 (degrees) */
  h: number;
  /** sRGB hex string, e.g. "#7fa3c9" */
  hex: string;
}

export interface HallmarkSpec {
  /** 7-row × 5-col grid. 0 = background, 1 = primary, 2 = accent. */
  cells: number[][];
  background: OklchColor;
  primary: OklchColor;
  accent: OklchColor;
  /** Three BIP-39 words (the verbal companion). */
  words: [string, string, string];
  /** Single-string form, space-separated. */
  wordsText: string;
  style: HallmarkStyle;
  bordered: boolean;
}

// =============================================================================
// Constants (mirror SPEC §3, §4)
// =============================================================================

const COLUMNS = 5;
const ROWS = 7;
const HALF_COLUMNS = 3; // generated per row before mirroring

const PADDING_FRACTION = 0.10;
const CORNER_RADIUS_FRACTION = 0.16;
const DOT_RADIUS_FRACTION = 0.40;
const ACCENT_RADIUS_FRACTION = 0.46;

const MIN_FILL_RATIO = 0.45;
const MAX_FILL_RATIO = 0.75;
const FOREGROUND_THRESHOLD = 0.50;
const ACCENT_THRESHOLD = 0.85;

const MAX_PATTERN_ATTEMPTS = 8;

// OKLCH parameters per style. Order: [L, C].
const STYLE_PARAMS: Record<HallmarkStyle, { bg: [number, number]; fg: [number, number]; ac: [number, number] }> = {
  "standard": {
    bg: [0.96, 0.025],
    fg: [0.52, 0.16],
    ac: [0.66, 0.18],
  },
  "high-contrast": {
    bg: [0.98, 0.04],
    fg: [0.28, 0.32],
    ac: [0.15, 0.40],
  },
  "monochrome": {
    bg: [0.96, 0.0],
    fg: [0.30, 0.0],
    ac: [0.30, 0.0],
  },
};

// =============================================================================
// SHA-256 (synchronous, pure JS)
// =============================================================================

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function sha256(bytes: Uint8Array): Uint8Array {
  // 1. Pad message.
  const bitLen = bytes.length * 8;
  // Append 0x80, then zeros, then 64-bit big-endian length.
  const padLen = (((bytes.length + 9 + 63) >>> 6) << 6) - bytes.length;
  const padded = new Uint8Array(bytes.length + padLen);
  padded.set(bytes, 0);
  padded[bytes.length] = 0x80;
  // 64-bit big-endian length goes in the last 8 bytes. JS numbers are 53-bit
  // safe ints; we split high/low 32-bit halves.
  const lenHi = Math.floor(bitLen / 0x100000000) >>> 0;
  const lenLo = (bitLen >>> 0);
  const lenOff = padded.length - 8;
  padded[lenOff]     = (lenHi >>> 24) & 0xff;
  padded[lenOff + 1] = (lenHi >>> 16) & 0xff;
  padded[lenOff + 2] = (lenHi >>>  8) & 0xff;
  padded[lenOff + 3] = (lenHi >>>  0) & 0xff;
  padded[lenOff + 4] = (lenLo >>> 24) & 0xff;
  padded[lenOff + 5] = (lenLo >>> 16) & 0xff;
  padded[lenOff + 6] = (lenLo >>>  8) & 0xff;
  padded[lenOff + 7] = (lenLo >>>  0) & 0xff;

  // 2. Initial hash values.
  let h0 = 0x6a09e667 >>> 0;
  let h1 = 0xbb67ae85 >>> 0;
  let h2 = 0x3c6ef372 >>> 0;
  let h3 = 0xa54ff53a >>> 0;
  let h4 = 0x510e527f >>> 0;
  let h5 = 0x9b05688c >>> 0;
  let h6 = 0x1f83d9ab >>> 0;
  let h7 = 0x5be0cd19 >>> 0;

  const W = new Uint32Array(64);

  // 3. Process each 512-bit (64-byte) block.
  for (let block = 0; block < padded.length; block += 64) {
    // Load 16 32-bit words, big-endian.
    for (let i = 0; i < 16; i++) {
      const j = block + i * 4;
      W[i] = ((padded[j] << 24) | (padded[j + 1] << 16) | (padded[j + 2] << 8) | padded[j + 3]) >>> 0;
    }
    // Extend to 64 words.
    for (let i = 16; i < 64; i++) {
      const w15 = W[i - 15];
      const w2  = W[i -  2];
      const s0 = (rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3)) >>> 0;
      const s1 = (rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10)) >>> 0;
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, hh = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ ((~e >>> 0) & g)) >>> 0;
      const temp1 = (hh + S1 + ch + SHA256_K[i] + W[i]) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const mj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + mj) >>> 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + hh) >>> 0;
  }

  // 4. Output (big-endian).
  const out = new Uint8Array(32);
  const finals = [h0, h1, h2, h3, h4, h5, h6, h7];
  for (let i = 0; i < 8; i++) {
    out[i * 4]     = (finals[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (finals[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (finals[i] >>>  8) & 0xff;
    out[i * 4 + 3] = (finals[i] >>>  0) & 0xff;
  }
  return out;
}

// =============================================================================
// Mulberry32 PRNG (mirrors SPEC §3.6)
// =============================================================================

interface PrngState { v: number }

function mulberry32Init(bytes: Uint8Array, offset: number): PrngState {
  const v = ((bytes[offset] << 24)
    | (bytes[offset + 1] << 16)
    | (bytes[offset + 2] << 8)
    | bytes[offset + 3]) >>> 0;
  return { v };
}

function mulberry32Next(state: PrngState): number {
  state.v = (state.v + 0x6D2B79F5) >>> 0;
  let t = state.v;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t = t ^ (t + Math.imul(t ^ (t >>> 7), t | 61));
  const result = (t ^ (t >>> 14)) >>> 0;
  return result / 0xFFFFFFFF;
}

// =============================================================================
// OKLCH → sRGB (mirrors SPEC §3.7)
// =============================================================================

function srgbEncode(v: number): number {
  const clamped = Math.max(0, Math.min(1, v));
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function oklchToRgb(L: number, C: number, h: number): [number, number, number] {
  const hRad = h * Math.PI / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const rLin =  4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  return [srgbEncode(rLin), srgbEncode(gLin), srgbEncode(bLin)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c2 = (x: number) => {
    const i = Math.max(0, Math.min(255, Math.round(x * 255)));
    return i.toString(16).padStart(2, "0");
  };
  return `#${c2(r)}${c2(g)}${c2(b)}`;
}

function makeColor(L: number, C: number, h: number): OklchColor {
  const [r, g, b] = oklchToRgb(L, C, h);
  return { L, C, h, hex: rgbToHex(r, g, b) };
}

// =============================================================================
// Pattern generation (mirrors SPEC §3.3)
// =============================================================================

function generateHalfRow(prng: PrngState): { row: number[]; filled: number } {
  let filled = 0;
  const row: number[] = [];
  for (let i = 0; i < HALF_COLUMNS; i++) {
    const v = mulberry32Next(prng);
    let value: number;
    if (v < FOREGROUND_THRESHOLD) value = 0;
    else if (v < ACCENT_THRESHOLD) value = 1;
    else value = 2;
    if (value !== 0) filled++;
    row.push(value);
  }
  return { row, filled };
}

function mirrorRow(half: number[]): number[] {
  const full = half.slice();
  for (let i = HALF_COLUMNS - 2; i >= 0; i--) full.push(half[i]);
  return full;
}

function generatePattern(bytes: Uint8Array): number[][] {
  const totalHalfCells = ROWS * HALF_COLUMNS;

  for (let attempt = 0; attempt < MAX_PATTERN_ATTEMPTS; attempt++) {
    const offset = (4 + attempt * 4) % 28;
    const prng = mulberry32Init(bytes, offset);
    const cells: number[][] = [];
    let filled = 0;
    for (let r = 0; r < ROWS; r++) {
      const { row, filled: f } = generateHalfRow(prng);
      filled += f;
      cells.push(mirrorRow(row));
    }
    const ratio = filled / totalHalfCells;
    if (ratio >= MIN_FILL_RATIO && ratio <= MAX_FILL_RATIO) return cells;
  }

  // Fallback: attempt 0 unconditionally.
  const prng = mulberry32Init(bytes, 4);
  const cells: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const { row } = generateHalfRow(prng);
    cells.push(mirrorRow(row));
  }
  return cells;
}

// =============================================================================
// Hash → spec
// =============================================================================

function utf8Bytes(s: string): Uint8Array {
  // Node 16+ and modern browsers have TextEncoder.
  return new TextEncoder().encode(s);
}

function deriveHashHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function deriveColors(bytes: Uint8Array, style: HallmarkStyle): { bg: OklchColor; fg: OklchColor; ac: OklchColor } {
  // Primary hue (bytes 0..1)
  const h1 = ((bytes[0] << 8) | bytes[1]) / 65536 * 360;
  // Accent offset (bytes 2..3) → 100..260°
  const offsetRaw = ((bytes[2] << 8) | bytes[3]) / 65536;
  const h2 = (h1 + 100 + offsetRaw * 160) % 360;

  const params = STYLE_PARAMS[style];
  const hueA = style === "monochrome" ? 0 : h1;
  const hueB = style === "monochrome" ? 0 : h2;

  return {
    bg: makeColor(params.bg[0], params.bg[1], hueA),
    fg: makeColor(params.fg[0], params.fg[1], hueA),
    ac: makeColor(params.ac[0], params.ac[1], hueB),
  };
}

function deriveWords(bytes: Uint8Array): [string, string, string] {
  // Low 33 bits of bytes 27..31 — see SPEC §3.4.
  // To stay within JS-safe integer range we keep the high 7 bits separate.
  const hi = bytes[27] & 0x7F;                       // 7 bits
  const lo = (
    (bytes[28] << 24) |
    (bytes[29] << 16) |
    (bytes[30] << 8)  |
     bytes[31]
  ) >>> 0;                                            // 32 bits

  // Word indices (most significant first):
  //   bits 32..22  (top 11 bits)   → i1
  //   bits 21..11  (middle 11)     → i2
  //   bits 10..0   (bottom 11)     → i3
  //
  // Combined 33-bit field: [hi(7) | lo(32)]  = 39 bits, low 33 used.
  // i1 = bits 32..22  =  (hi << 5) | (lo >>> 27)         (7 + 4 hi-of-lo)
  //      Actually: take low 33 of (hi<<32)|lo as v.
  //   v = (hi * 2^32) + lo
  //   i1 = floor(v / 2^22) mod 2048
  //   i2 = floor(v / 2^11) mod 2048
  //   i3 = v mod 2048
  //
  // Equivalent bitwise (avoiding 64-bit arithmetic):
  //   i1 = ((hi << 5) | (lo >>> 27)) & 0x7FF   ← top 7 of hi + top 4 of lo = 11 bits
  //   i2 = (lo >>> 11) & 0x7FF
  //   i3 = lo & 0x7FF
  const i1 = (((hi << 5) | (lo >>> 27)) & 0x7FF) >>> 0;
  const i2 = (lo >>> 11) & 0x7FF;
  const i3 = lo & 0x7FF;

  return [BIP39_ENGLISH[i1], BIP39_ENGLISH[i2], BIP39_ENGLISH[i3]];
}

export function hallmarkSpec(input: string, opts: HallmarkOptions = {}): HallmarkSpec {
  const style: HallmarkStyle = opts.style ?? "standard";
  const bordered = opts.bordered ?? false;

  const bytes = sha256(utf8Bytes(input));
  const cells = generatePattern(bytes);
  const { bg, fg, ac } = deriveColors(bytes, style);
  const words = deriveWords(bytes);

  return {
    cells,
    background: bg,
    primary: fg,
    accent: ac,
    words,
    wordsText: words.join(" "),
    style,
    bordered,
  };
}

// =============================================================================
// Verbal companion (top-level convenience)
// =============================================================================

export function hallmarkWords(input: string): [string, string, string] {
  return deriveWords(sha256(utf8Bytes(input)));
}

// =============================================================================
// 14×20 low-resolution rendering (mirrors SPEC §3.8)
// =============================================================================

/**
 * A 14×20 raster plus the per-style colors needed to paint it.
 * Pixel values: 0 = off, 1 = primary cell, 2 = accent cell (see SPEC §3.8).
 * The pixel grid is style-independent; only `colors` changes with style.
 */
export interface HallmarkPixelGrid {
  width: 14;
  height: 20;
  /** 14×20 = 280 values, row-major. Each value is 0, 1, or 2. */
  pixels: Uint8Array;
  /** Resolved per the selected style (default: "standard"). */
  colors: { background: OklchColor; primary: OklchColor; accent: OklchColor };
  style: HallmarkStyle;
}

/**
 * Returns the 14×20 pixel grid for the input. Pixel values encode the cell
 * type (0 = off, 1 = primary, 2 = accent) so renderers can paint each pixel
 * appropriately for the selected style.
 *
 * The pixel layout is style-independent — every style emits the same grid.
 * The `style` option only affects the returned `colors`. For monochrome
 * rendering, treat values 1 and 2 identically; the diagonal pattern of
 * accent cells carries the value-2 distinction through shape alone.
 *
 * See SPEC §3.8.
 */
export function hallmarkPixels(input: string, opts: HallmarkOptions = {}): HallmarkPixelGrid {
  const style: HallmarkStyle = opts.style ?? "standard";
  const spec = hallmarkSpec(input, { style });
  const pixels = new Uint8Array(14 * 20);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLUMNS; x++) {
      const value = spec.cells[y][x];
      if (value === 0) continue;
      const px = x * 3;
      const py = y * 3;
      const idx = (yy: number, xx: number) => yy * 14 + xx;
      if (value === 1) {
        // primary: 2×2 solid
        pixels[idx(py,     px    )] = 1;
        pixels[idx(py,     px + 1)] = 1;
        pixels[idx(py + 1, px    )] = 1;
        pixels[idx(py + 1, px + 1)] = 1;
      } else {
        // accent: top-left + bottom-right (diagonal)
        pixels[idx(py,     px    )] = 2;
        pixels[idx(py + 1, px + 1)] = 2;
      }
    }
  }
  return {
    width: 14,
    height: 20,
    pixels,
    colors: { background: spec.background, primary: spec.primary, accent: spec.accent },
    style,
  };
}

// =============================================================================
// SVG rendering
// =============================================================================

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Builds an SVG string. Useful for SSR or when no DOM is available.
 * The viewBox is "0 0 100 132" — apply width/height via CSS or attributes.
 */
export function hallmarkSVG(input: string, opts: HallmarkOptions = {}): string {
  const spec = hallmarkSpec(input, opts);
  return renderSVGString(spec);
}

/**
 * Builds an SVGSVGElement. Requires a DOM (browser or jsdom).
 */
export function hallmark(input: string, opts: HallmarkOptions = {}): SVGSVGElement {
  const spec = hallmarkSpec(input, opts);
  return renderSVGElement(spec);
}

/**
 * The aspect ratio of a hallmark tile, width : height.
 * Equal to 100 : 132 (1 : 1.32).
 */
export const HALLMARK_ASPECT = 100 / 132;
export const HALLMARK_VIEWBOX = { width: 100, height: 132 };

function renderSVGString(spec: HallmarkSpec): string {
  const parts: string[] = [];
  const W = 100, H = 132;
  const padding = PADDING_FRACTION * W;
  const cell = (W - 2 * padding) / COLUMNS;
  const cornerRadius = CORNER_RADIUS_FRACTION * W;
  const dotR = cell * DOT_RADIUS_FRACTION;
  const accR = cell * ACCENT_RADIUS_FRACTION;

  parts.push(
    `<svg xmlns="${SVG_NS}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hallmark: ${escapeAttr(spec.wordsText)}">`
  );
  parts.push(
    `<rect x="0" y="0" width="${W}" height="${H}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${spec.background.hex}"/>`
  );
  if (spec.bordered) {
    const inset = 0.5;
    parts.push(
      `<rect x="${inset}" y="${inset}" width="${W - 2 * inset}" height="${H - 2 * inset}" rx="${cornerRadius - inset}" ry="${cornerRadius - inset}" fill="none" stroke="${spec.primary.hex}" stroke-width="1"/>`
    );
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLUMNS; x++) {
      const value = spec.cells[y][x];
      if (value === 0) continue;
      const cx = padding + x * cell + cell / 2;
      const cy = padding + y * cell + cell / 2;
      if (spec.style === "monochrome" && value === 2) {
        const side = accR * 2;
        const sx = cx - accR;
        const sy = cy - accR;
        parts.push(
          `<rect x="${sx.toFixed(3)}" y="${sy.toFixed(3)}" width="${side.toFixed(3)}" height="${side.toFixed(3)}" rx="${(side * 0.15).toFixed(3)}" ry="${(side * 0.15).toFixed(3)}" fill="${spec.accent.hex}"/>`
        );
      } else {
        const r = value === 2 ? accR : dotR;
        const color = value === 2 ? spec.accent.hex : spec.primary.hex;
        parts.push(
          `<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${r.toFixed(3)}" fill="${color}"/>`
        );
      }
    }
  }
  parts.push("</svg>");
  return parts.join("");
}

function renderSVGElement(spec: HallmarkSpec): SVGSVGElement {
  const tpl = document.createElement("template");
  tpl.innerHTML = renderSVGString(spec).trim();
  const node = tpl.content.firstChild as SVGSVGElement;
  return node;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// =============================================================================
// Exports for inspection / testing
// =============================================================================

export const _internals = {
  sha256,
  mulberry32Init,
  mulberry32Next,
  oklchToRgb,
  generatePattern,
  deriveColors,
  deriveWords,
};
