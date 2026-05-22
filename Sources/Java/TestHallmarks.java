// Hallmarks v1.0 — Java conformance test against test-vectors.json.
// SPDX-License-Identifier: MIT
//
// Run from the repo root:
//   javac -d out Sources/Java/*.java && java -cp out hallmarks.TestHallmarks

package hallmarks;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Reads test-vectors.json and verifies all vectors against the Java implementation.
 * Uses a hand-rolled JSON parser sufficient for the test-vector schema.
 * Prints a summary line per vector and exits 1 if any assertion fails.
 */
public final class TestHallmarks {

    private TestHallmarks() {}

    // =========================================================================
    // Minimal recursive-descent JSON parser
    // =========================================================================

    private static final class Parser {
        private final String src;
        private int pos;

        Parser(String src) { this.src = src; }

        Object parse() {
            skipWs();
            char c = src.charAt(pos);
            if (c == '{') return parseObject();
            if (c == '[') return parseArray();
            if (c == '"') return parseString();
            if (c == 't') { pos += 4; return Boolean.TRUE; }
            if (c == 'f') { pos += 5; return Boolean.FALSE; }
            if (c == 'n') { pos += 4; return null; }
            return parseNumber();
        }

        @SuppressWarnings("unchecked")
        private java.util.Map<String, Object> parseObject() {
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
            pos++; // {
            skipWs();
            while (src.charAt(pos) != '}') {
                String key = parseString();
                skipWs(); pos++; skipWs(); // colon
                Object val = parse();
                map.put(key, val);
                skipWs();
                if (src.charAt(pos) == ',') { pos++; skipWs(); }
            }
            pos++; // }
            return map;
        }

        private List<Object> parseArray() {
            List<Object> list = new ArrayList<>();
            pos++; // [
            skipWs();
            while (src.charAt(pos) != ']') {
                list.add(parse());
                skipWs();
                if (src.charAt(pos) == ',') { pos++; skipWs(); }
            }
            pos++; // ]
            return list;
        }

        private String parseString() {
            pos++; // opening "
            StringBuilder sb = new StringBuilder();
            while (pos < src.length()) {
                char c = src.charAt(pos++);
                if (c == '"') break;
                if (c == '\\') {
                    char e = src.charAt(pos++);
                    switch (e) {
                        case '"': sb.append('"'); break;
                        case '\\': sb.append('\\'); break;
                        case 'n': sb.append('\n'); break;
                        case 'r': sb.append('\r'); break;
                        case 't': sb.append('\t'); break;
                        case 'u': {
                            int cp = Integer.parseInt(src.substring(pos, pos + 4), 16);
                            sb.append((char) cp);
                            pos += 4;
                            break;
                        }
                        default: sb.append(e);
                    }
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }

        private Number parseNumber() {
            int start = pos;
            while (pos < src.length() && "-+0123456789.eE".indexOf(src.charAt(pos)) >= 0) pos++;
            String s = src.substring(start, pos);
            return s.contains(".") || s.contains("e") || s.contains("E")
                    ? Double.parseDouble(s) : Long.parseLong(s);
        }

        private void skipWs() {
            while (pos < src.length() && src.charAt(pos) <= ' ') pos++;
        }
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    @SuppressWarnings("unchecked")
    private static java.util.Map<String, Object> map(Object o) {
        return (java.util.Map<String, Object>) o;
    }

    @SuppressWarnings("unchecked")
    private static List<Object> list(Object o) {
        return (List<Object>) o;
    }

    private static String str(Object o) { return (String) o; }

    private static int asInt(Object o) {
        if (o instanceof Long)   return ((Long) o).intValue();
        if (o instanceof Double) return ((Double) o).intValue();
        return ((Number) o).intValue();
    }

    // =========================================================================
    // Test runner
    // =========================================================================

    public static void main(String[] args) throws IOException, java.security.NoSuchAlgorithmException {
        String json = Files.readString(Paths.get("test-vectors.json"));
        Parser p = new Parser(json);
        java.util.Map<String, Object> root = map(p.parse());
        List<Object> vectors = list(root.get("vectors"));

        int passed = 0;
        int failed = 0;
        List<String> failures = new ArrayList<>();

        for (Object vObj : vectors) {
            java.util.Map<String, Object> v = map(vObj);
            String label = str(v.get("label"));
            String input = str(v.get("input"));

            List<String> errs = new ArrayList<>();

            // -- SHA-256 hex
            Hallmark.HallmarkSpec spec = Hallmark.hallmarkSpec(input);
            byte[] hb = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexSb = new StringBuilder(64);
            for (byte b : hb) hexSb.append(String.format("%02x", b & 0xFF));
            String gotSha256 = hexSb.toString();
            String expectedSha256 = str(v.get("sha256"));
            if (!gotSha256.equals(expectedSha256)) {
                errs.add("sha256: expected " + expectedSha256 + " got " + gotSha256);
            }

            // -- Cells
            List<Object> expectedCells = list(v.get("cells"));
            int[][] gotCells = spec.cells();
            for (int row = 0; row < 7; row++) {
                List<Object> eRow = list(expectedCells.get(row));
                for (int col = 0; col < 5; col++) {
                    int e = asInt(eRow.get(col));
                    int g = gotCells[row][col];
                    if (e != g) errs.add("cells[" + row + "][" + col + "]: expected " + e + " got " + g);
                }
            }

            // -- Words (from spec and from standalone hallmarkWords)
            List<Object> expectedWords = list(v.get("words"));
            String[] gotWords = spec.words();
            for (int i = 0; i < 3; i++) {
                if (!str(expectedWords.get(i)).equals(gotWords[i])) {
                    errs.add("words[" + i + "]: expected " + expectedWords.get(i) + " got " + gotWords[i]);
                }
            }
            String expectedWordsText = str(v.get("wordsText"));
            if (!expectedWordsText.equals(spec.wordsText())) {
                errs.add("wordsText: expected " + expectedWordsText + " got " + spec.wordsText());
            }
            // hallmarkWords() should agree
            String[] standaloneWords = Hallmark.hallmarkWords(input);
            for (int i = 0; i < 3; i++) {
                if (!gotWords[i].equals(standaloneWords[i])) {
                    errs.add("hallmarkWords[" + i + "] disagrees with spec.words()");
                }
            }

            // -- Colors — three styles
            java.util.Map<String, Object> colorsJson = map(v.get("colors"));
            for (Hallmark.HallmarkStyle style : Hallmark.HallmarkStyle.values()) {
                String styleKey = switch (style) {
                    case STANDARD      -> "standard";
                    case HIGH_CONTRAST -> "high-contrast";
                    case MONOCHROME    -> "monochrome";
                };
                java.util.Map<String, Object> sc = map(colorsJson.get(styleKey));
                Hallmark.HallmarkSpec sv = Hallmark.hallmarkSpec(input, style);

                String eBg = str(map(sc.get("background")).get("hex"));
                String eFg = str(map(sc.get("primary")).get("hex"));
                String eAc = str(map(sc.get("accent")).get("hex"));

                if (!eBg.equals(sv.background().hex()))
                    errs.add(styleKey + " bg: expected " + eBg + " got " + sv.background().hex());
                if (!eFg.equals(sv.primary().hex()))
                    errs.add(styleKey + " fg: expected " + eFg + " got " + sv.primary().hex());
                if (!eAc.equals(sv.accent().hex()))
                    errs.add(styleKey + " ac: expected " + eAc + " got " + sv.accent().hex());
            }

            // -- Pixels (flat, via hallmarkPixels)
            java.util.Map<String, Object> pixelsJson = map(v.get("pixels"));
            List<Object> rows = list(pixelsJson.get("rows"));
            Hallmark.HallmarkPixelGrid grid = Hallmark.hallmarkPixels(input);
            byte[] gotFlat = grid.pixels();
            if (grid.width() != 14)  errs.add("pixels.width: expected 14 got " + grid.width());
            if (grid.height() != 20) errs.add("pixels.height: expected 20 got " + grid.height());
            for (int row = 0; row < 20; row++) {
                String rowStr = str(rows.get(row));
                for (int col = 0; col < 14; col++) {
                    int expected = rowStr.charAt(col) - '0';
                    int got = gotFlat[row * 14 + col] & 0xFF;
                    if (expected != got) {
                        errs.add("pixels[" + row + "][" + col + "]: expected " + expected + " got " + got);
                    }
                }
            }

            // -- hallmarkPixels colors agree with hallmarkSpec colors
            Hallmark.HallmarkColors gc = grid.colors();
            if (!gc.background().hex().equals(spec.background().hex()))
                errs.add("hallmarkPixels background color disagrees with hallmarkSpec");
            if (!gc.primary().hex().equals(spec.primary().hex()))
                errs.add("hallmarkPixels primary color disagrees with hallmarkSpec");
            if (!gc.accent().hex().equals(spec.accent().hex()))
                errs.add("hallmarkPixels accent color disagrees with hallmarkSpec");

            if (errs.isEmpty()) {
                System.out.println("  PASS  " + label);
                passed++;
            } else {
                System.out.println("  FAIL  " + label);
                for (String e : errs) System.out.println("         " + e);
                failures.addAll(errs.stream().map(e -> label + ": " + e).toList());
                failed++;
            }
        }

        System.out.println();
        System.out.println((passed + failed) + " vectors | " + passed + " passed | " + failed + " failed");

        if (failed > 0) System.exit(1);
    }
}
