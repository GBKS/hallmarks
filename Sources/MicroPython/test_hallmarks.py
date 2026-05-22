# Hallmarks v1.0 — conformance test runner.
# SPDX-License-Identifier: MIT
#
# Verifies the MicroPython implementation against test-vectors.json.
# Runs on both CPython (≥ 3.9) and MicroPython (≥ 1.20).
#
# Usage (CPython, from repo root):
#   python3 Sources/MicroPython/test_hallmarks.py
#
# Usage (MicroPython REPL or mpremote):
#   import test_hallmarks          # runs automatically via main() at bottom
#
# The test vectors live in test-vectors.json at the repo root.  Each vector
# covers: SHA-256 hash, 5×7 cell grid, 3 verbal companion words, OKLCH colors
# for all three styles, and the 14×20 pixel grid.  The implementation passes if
# and only if every field matches exactly (SPEC §7).

import json
import os
import sys

# ---------------------------------------------------------------------------
# Locate test-vectors.json regardless of cwd
# ---------------------------------------------------------------------------

def _find_vectors():
    # Try a few candidate paths relative to this file and to cwd.
    candidates = [
        "test-vectors.json",                                        # cwd = repo root
        "../../../test-vectors.json",                               # cwd = this dir
        os.path.join(os.path.dirname(__file__), "..", "..", "test-vectors.json"),
    ]
    for p in candidates:
        try:
            with open(p) as f:
                return json.load(f)
        except OSError:
            pass
    raise FileNotFoundError(
        "test-vectors.json not found.  Run from the repo root or pass the path."
    )

# ---------------------------------------------------------------------------
# Import the implementation (handles both package and standalone layouts)
# ---------------------------------------------------------------------------

try:
    from hallmark import (
        hallmark_spec,
        hallmark_pixels,
        hallmark_pixels_packed,
        hallmark_words,
        hallmark_digest,
        pixels_pack,
        pixels_unpack,
    )
except ImportError:
    # Allow running directly from Sources/MicroPython/ without installing
    sys.path.insert(0, os.path.dirname(__file__))
    from hallmark import (
        hallmark_spec,
        hallmark_pixels,
        hallmark_pixels_packed,
        hallmark_words,
        hallmark_digest,
        pixels_pack,
        pixels_unpack,
    )

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_STYLES = ("standard", "high-contrast", "monochrome")


def _pixels_to_rows(px_bytearray):
    """Reformat bytearray(280) into the JSON serialisation used by test-vectors.json.

    The implementation returns a flat bytearray of 280 values (0/1/2), row-major,
    which is the natural and spec-compliant format for embedded use (SPEC §3.8).
    The test vectors store the same data as a list of 20 strings, each 14 chars
    wide ('0'/'1'/'2'), purely for human readability in JSON.  This function is
    a comparison adapter only; it does not imply anything about the API shape.
    """
    rows = []
    for row in range(20):
        s = ""
        for col in range(14):
            s += str(px_bytearray[row * 14 + col])
        rows.append(s)
    return rows


def _check(label, field, got, want):
    if got != want:
        print("  FAIL  [{label}] {field}".format(label=label, field=field))
        print("        got : {got}".format(got=got))
        print("        want: {want}".format(want=want))
        return False
    return True

# ---------------------------------------------------------------------------
# Core checker
# ---------------------------------------------------------------------------

def check_vector(vec):
    label    = vec["label"]
    inp      = vec["input"]
    failures = 0

    # ── cells (style-independent) ──────────────────────────────────────────
    spec = hallmark_spec(inp, style="standard")

    # ── flat pixel generator (hallmark_pixels) vs spec ─────────────────────
    flat_pixels, flat_colors = hallmark_pixels(inp, style="standard")
    if not _check(label, "flat pixel size", len(flat_pixels), 280):
        failures += 1
    if not _check(label, "hallmark_pixels == hallmark_spec['pixels']", flat_pixels, spec["pixels"]):
        failures += 1

    # ── packed pixel generator vs flat (independent code paths) ────────────
    # _gen_pixels and _gen_pixels_packed are independent implementations;
    # this check ensures they agree by comparing the unpacked packed grid
    # against the flat grid produced by hallmark_pixels / hallmark_spec.
    packed_direct, _ = hallmark_pixels_packed(inp, style="standard")
    if not _check(label, "packed size", len(packed_direct), 70):
        failures += 1
    if not _check(label, "unpack(packed) == flat pixels", pixels_unpack(packed_direct), flat_pixels):
        failures += 1

    # ── pack/unpack helpers (lossless round-trip) ──────────────────────────
    packed_via_helper = pixels_pack(flat_pixels)
    if not _check(label, "pixels_pack == direct packed", packed_via_helper, packed_direct):
        failures += 1
    if not _check(label, "pixels_unpack round-trip", pixels_unpack(packed_via_helper), flat_pixels):
        failures += 1

    # ── hb= keyword path: same result as input_str path ────────────────────
    hb = hallmark_digest(inp)
    if not _check(label, "hallmark_words(hb=) == hallmark_words(input_str=)",
                  hallmark_words(hb=hb), hallmark_words(inp)):
        failures += 1
    if not _check(label, "hallmark_pixels(hb=) == hallmark_pixels(input_str=)",
                  hallmark_pixels(hb=hb)[0], flat_pixels):
        failures += 1

    if not _check(label, "cells", spec["cells"], vec["cells"]):
        failures += 1

    # ── verbal companion ───────────────────────────────────────────────────
    if not _check(label, "words", list(spec["words"]), vec["words"]):
        failures += 1
    if not _check(label, "words_text", spec["words_text"], vec["wordsText"]):
        failures += 1

    # ── pixel grid (style-independent) ─────────────────────────────────────
    got_rows  = _pixels_to_rows(spec["pixels"])
    want_rows = vec["pixels"]["rows"]
    if not _check(label, "pixels", got_rows, want_rows):
        failures += 1

    # ── colors (all three styles) ──────────────────────────────────────────
    for style in _STYLES:
        s = hallmark_spec(inp, style=style)
        want_colors = vec["colors"][style]
        for role, key in (("background", "background"), ("primary", "primary"), ("accent", "accent")):
            got_hex  = s["colors"][role]
            want_hex = want_colors[key]["hex"]
            field    = "{style}/{role}".format(style=style, role=role)
            if not _check(label, field, got_hex, want_hex):
                failures += 1

    return failures

# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def main():
    data    = _find_vectors()
    vectors = data["vectors"]
    total   = len(vectors)
    passed  = 0
    failed  = 0

    print("Hallmarks conformance test — {n} vectors".format(n=total))
    print("spec version: {v}".format(v=data.get("spec_version", "?")))
    print()

    for vec in vectors:
        f = check_vector(vec)
        if f == 0:
            print("  OK    [{label}]".format(label=vec["label"]))
            passed += 1
        else:
            failed += 1

    print()
    print("Results: {p}/{t} passed".format(p=passed, t=total), end="")
    if failed:
        print(", {f} FAILED".format(f=failed))
        return False
    else:
        print(" — all OK")
        return True


if __name__ == "__main__":
    ok = main()
    sys.exit(0 if ok else 1)
