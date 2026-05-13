// Headless render test: inline hallmark.js into index.html so JSDOM can
// run everything without needing a network/file loader for the module.

import fs from "node:fs";
import path from "node:path";
import jsdomPkg from "jsdom";
const { JSDOM, VirtualConsole } = jsdomPkg;

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js   = fs.readFileSync(path.join(root, "hallmark.js"), "utf8");

// Convert the external module import into an inline module by rewriting
// the import line to use a global. Easier path: just inline the module
// source before the page script.
// JSDOM doesn't execute `<script type="module">`. Inline the JS, strip
// `export` keywords, and convert the page script to a plain script.
html = html.replace(
  /<script type="module">\s*import\s*\{[^}]+\}\s*from\s*"\.\/hallmark\.js";/,
  () => {
    const stripped = js
      .replace(/^export\s+/gm, "")
      .replace(/\bexport\s*\{[^}]*\};?/g, "");
    return `<script>\n${stripped}\n` +
           "// --- inlined hallmark module above ---\n";
  }
);

const vc = new VirtualConsole();
vc.on("error", (err) => console.error("[console error]", err?.message || err));
vc.on("warn", (msg) => console.warn("[console warn]", msg));
vc.on("log", (msg) => console.log("[console log]", msg));
vc.on("jsdomError", (err) => console.error("[jsdom error]", err?.message || err));

const dom = new JSDOM(html, {
  url: "file://" + root + "/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: vc,
});

await new Promise((r) => dom.window.addEventListener("load", r, { once: true }));
await new Promise((r) => setTimeout(r, 500));

const doc = dom.window.document;

const checks = [];
function ok(name, cond, extra = "") {
  checks.push({ name, pass: !!cond, extra });
}

const hmA = doc.getElementById("hm-a");
const hmB = doc.getElementById("hm-b");
ok("hm-a has SVG child", hmA && hmA.querySelector("svg"));
ok("hm-b has SVG child", hmB && hmB.querySelector("svg"));

const ci = doc.getElementById("compare-indicator");
ok("compare-indicator initial = no-match", ci && !ci.classList.contains("match"));

if (hmA && hmB) {
  const aSrc = hmA.querySelector("svg")?.outerHTML;
  const bSrc = hmB.querySelector("svg")?.outerHTML;
  ok("typo demo: A and B differ", aSrc && bSrc && aSrc !== bSrc);
}

const wordsA = doc.getElementById("words-a")?.textContent;
const wordsB = doc.getElementById("words-b")?.textContent;
ok("words-a non-empty", wordsA && wordsA.split(" ").length === 3);
ok("words-b non-empty", wordsB && wordsB.split(" ").length === 3);
ok("words-a and words-b differ", wordsA !== wordsB);

ok("3 cards rendered", doc.querySelectorAll("#cards .card").length === 3);
ok("3 industry vignettes", doc.querySelectorAll("#industries-list .industry").length === 3);
ok("each vignette has 2 matching hallmarks (6 total)",
   doc.querySelectorAll("#industries-list .ind-panel-body svg").length === 6);
ok("IBAN typo button present", !!doc.getElementById("btn-iban-typo"));

const compareCells = doc.querySelectorAll("#compare-table .cell");
ok("4 compare cells", compareCells.length === 4);
ok("4th compare cell is Hallmark", compareCells[3]?.classList.contains("hallmark-cell"));

ok("3 style cells", doc.querySelectorAll("#styles-row .style-cell").length === 3);
ok("borders stage mounts 4 hallmarks (2 frames × 2)",
   doc.querySelectorAll("#borders-stage .hm-wrap svg").length === 4);
// One of the bordered hallmarks should contain a stroked rect (the border).
{
  const borderedWraps = doc.querySelectorAll("#borders-stage .hm-wrap[data-border='1'] svg");
  let hasStroke = false;
  for (const svg of borderedWraps) {
    if (svg.querySelector('rect[stroke]')) { hasStroke = true; break; }
  }
  ok("bordered hallmark SVGs contain a stroked rect", hasStroke);
}
ok("24 gallery items", doc.querySelectorAll("#gallery .g-item").length === 24);
ok("4 size rows", doc.querySelectorAll("#sizes-row .row").length === 4);
ok("9 lowres canvases (3 styles × 3 scales)", doc.querySelectorAll("#lowres-grid canvas").length === 9);
ok("3 lowres style labels",                  doc.querySelectorAll("#lowres-grid .lr-style-label").length === 3);

const verbalWords = doc.getElementById("verbal-words")?.textContent;
ok("verbal words = 3 words", verbalWords && verbalWords.split(" ").length === 3);

// Background section mounted with link to Arké.
{
  const bg = doc.querySelector("section.background");
  const arkeLink = bg?.querySelector('a[href*="arke.cash"]');
  const substackLink = bg?.querySelector('a[href*="gbks.substack.com"]');
  ok("background section present", !!bg);
  ok("background links to Arké",     !!arkeLink);
  ok("background links to Substack", !!substackLink);
}

let pass = 0, fail = 0;
for (const c of checks) {
  console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.extra ? "  " + c.extra : ""}`);
  c.pass ? pass++ : fail++;
}
console.log(`\n${pass}/${checks.length} checks passed.`);
console.log("A words:", wordsA);
console.log("B words:", wordsB);
console.log("verbal :", verbalWords);

process.exit(fail === 0 ? 0 : 1);
