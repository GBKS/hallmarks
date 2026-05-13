// Generates test-vectors.json from the reference TS implementation.
// Run with: npx tsx scripts/generate-test-vectors.ts

import * as fs from "node:fs";
import * as path from "node:path";
import { hallmarkSpec, hallmarkPixels, _internals } from "../hallmark";

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

// Canonical inputs. Covers Bitcoin address forms, Ark, SSH fingerprint, Git SHA,
// UUID, long random string, empty, and a few short strings.
const INPUTS: Array<{ label: string; input: string }> = [
  { label: "empty",           input: "" },
  { label: "single-char",     input: "a" },
  { label: "btc-p2pkh",       input: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" },
  { label: "btc-p2sh",        input: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy" },
  { label: "btc-segwit",      input: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  { label: "btc-taproot",     input: "bc1prp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3" },
  { label: "ark-vtxo",        input: "tark1pemq45fepe2dcc3vp43xq8c4yywvn8m5kvkx0evf3jc8efg2hxsqkuw3xv" },
  { label: "ssh-fingerprint", input: "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8" },
  { label: "git-sha1",        input: "9d2c5e85e9b9f5e7b0a0c0d4f1a2b3c4d5e6f7a8" },
  { label: "uuid",            input: "550e8400-e29b-41d4-a716-446655440000" },
  { label: "long-string",     input: "the quick brown fox jumps over the lazy dog 0123456789" },
  { label: "hallmarks",       input: "hallmarks" },
];

const STYLES = ["standard", "high-contrast", "monochrome"] as const;

const vectors = INPUTS.map(({ label, input }) => {
  const sha = bytesToHex(_internals.sha256(new TextEncoder().encode(input)));
  // Cells, pixels, words are style-independent (style only affects colors).
  const stdSpec = hallmarkSpec(input, { style: "standard" });
  const cells = stdSpec.cells;
  const words = stdSpec.words;
  const pixelsArray = Array.from(hallmarkPixels(input).pixels);

  // For each style, capture the three colors.
  const colors: Record<string, any> = {};
  for (const style of STYLES) {
    const spec = hallmarkSpec(input, { style });
    colors[style] = {
      background: {
        L: round(spec.background.L), C: round(spec.background.C), h: round(spec.background.h),
        hex: spec.background.hex,
      },
      primary: {
        L: round(spec.primary.L), C: round(spec.primary.C), h: round(spec.primary.h),
        hex: spec.primary.hex,
      },
      accent: {
        L: round(spec.accent.L), C: round(spec.accent.C), h: round(spec.accent.h),
        hex: spec.accent.hex,
      },
    };
  }

  return {
    label,
    input,
    sha256: sha,
    cells,
    words,
    wordsText: words.join(" "),
    colors,
    pixels: {
      width: 14,
      height: 20,
      // 20 strings of 14 characters each. Values: "0" = off, "1" = primary, "2" = accent.
      rows: chunkRows(pixelsArray, 14),
    },
  };
});

function round(v: number, places = 10): number {
  const f = 10 ** places;
  return Math.round(v * f) / f;
}

function chunkRows(arr: number[], width: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y * width < arr.length; y++) {
    let row = "";
    for (let x = 0; x < width; x++) row += String(arr[y * width + x]);
    rows.push(row);
  }
  return rows;
}

const out = {
  spec_version: "1.0",
  license: "CC0-1.0",
  license_note: "These test vectors are dedicated to the public domain under CC0 1.0 Universal. See LICENSE.",
  generator: "hallmark.ts reference implementation",
  note: "Each implementation conforms to Hallmarks v1.0 if and only if it reproduces every entry below exactly.",
  vectors,
};

const outPath = path.resolve(new URL("..", import.meta.url).pathname, "test-vectors.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log("Wrote", outPath, "(", vectors.length, "vectors )");

// Sanity: pretty-print one vector to stdout.
console.log("\nSample vector (segwit address):");
console.log(JSON.stringify(vectors[4], null, 2));
