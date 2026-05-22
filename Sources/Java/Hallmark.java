// Hallmarks v1.0 — Java reference implementation.
// SPDX-License-Identifier: MIT
//
// Spec:    SPEC.md  (CC0 1.0)  — https://hallmarks.info
// Licence: MIT      — see LICENSE at the repo root

package hallmarks;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Hallmarks v1.0 — produces a visual identity token from any UTF-8 string.
 *
 * <p>All public methods are thread-safe (no shared mutable state).
 *
 * <h2>Quick start</h2>
 * <pre>{@code
 * HallmarkSpec      spec  = Hallmark.hallmarkSpec("bc1q...");
 * String[]          words = Hallmark.hallmarkWords("bc1q...");
 * HallmarkPixelGrid grid  = Hallmark.hallmarkPixels("bc1q...", HallmarkStyle.HIGH_CONTRAST);
 * String            svg   = Hallmark.hallmarkSVG("bc1q...");
 * }</pre>
 */
public final class Hallmark {

    private Hallmark() {}

    // =========================================================================
    // Public types
    // =========================================================================

    /** Visual-theme variant (mirrors {@code HallmarkStyle} in the TypeScript reference). */
    public enum HallmarkStyle { STANDARD, HIGH_CONTRAST, MONOCHROME }

    /**
     * A colour expressed in OKLCH space together with its sRGB hex string.
     * Mirrors {@code OklchColor} in the TypeScript reference.
     */
    public record OklchColor(double L, double C, double h, String hex) {}

    /**
     * The three paint colours for a rendered Hallmark.
     * Used as the {@code colors} field inside {@link HallmarkPixelGrid}.
     */
    public record HallmarkColors(
            OklchColor background,
            OklchColor primary,
            OklchColor accent) {}

    /**
     * Full Hallmark specification for one style.
     * Mirrors {@code HallmarkSpec} in the TypeScript reference.
     *
     * <p>{@code cells} is a 7-row x 5-col grid; values are
     * 0 = background, 1 = primary, 2 = accent.
     */
    public record HallmarkSpec(
            int[][] cells,
            OklchColor background,
            OklchColor primary,
            OklchColor accent,
            String[] words,
            String wordsText,
            HallmarkStyle style,
            boolean bordered) {}

    /**
     * 14x20 low-resolution pixel grid together with the resolved paint colours.
     * Mirrors {@code HallmarkPixelGrid} in the TypeScript reference.
     *
     * <p>{@code pixels} is a 280-element row-major array; values are
     * 0 = background, 1 = primary, 2 = accent.
     */
    public record HallmarkPixelGrid(
            int width,
            int height,
            byte[] pixels,
            HallmarkColors colors,
            HallmarkStyle style) {}

    /** ViewBox dimensions for an SVG Hallmark (mirrors {@code HALLMARK_VIEWBOX} in TypeScript). */
    public record HallmarkViewBox(int width, int height) {}

    /** The aspect ratio of a Hallmark tile, width : height (mirrors {@code HALLMARK_ASPECT} in TypeScript). */
    public static final double HALLMARK_ASPECT = 100.0 / 132.0;

    /** Fixed SVG viewBox (mirrors {@code HALLMARK_VIEWBOX} in TypeScript). */
    public static final HallmarkViewBox HALLMARK_VIEWBOX = new HallmarkViewBox(100, 132);

    // =========================================================================
    // Style parameters — OKLCH [L, C] per role  (SPEC §4)
    // =========================================================================

    // Order: bg_L, bg_C, fg_L, fg_C, ac_L, ac_C
    private static final double[] STYLE_STANDARD      = {0.96, 0.025, 0.52, 0.16, 0.66, 0.18};
    private static final double[] STYLE_HIGH_CONTRAST = {0.98, 0.04,  0.28, 0.32, 0.15, 0.40};
    private static final double[] STYLE_MONOCHROME    = {0.96, 0.0,   0.30, 0.0,  0.30, 0.0 };

    private static double[] styleParams(HallmarkStyle style) {
        return switch (style) {
            case STANDARD      -> STYLE_STANDARD;
            case HIGH_CONTRAST -> STYLE_HIGH_CONTRAST;
            case MONOCHROME    -> STYLE_MONOCHROME;
        };
    }

    // =========================================================================
    // Mulberry32 PRNG  (SPEC §3.6)
    // Java's int is signed 32-bit; use long + masking for unsigned arithmetic.
    // =========================================================================

    private static final long M32_INC = 0x6D2B79F5L;

    private static long[] m32Seed(byte[] hb, int off) {
        long s = ((hb[off]     & 0xFFL) << 24)
               | ((hb[off + 1] & 0xFFL) << 16)
               | ((hb[off + 2] & 0xFFL) <<  8)
               |  (hb[off + 3] & 0xFFL);
        return new long[]{s & 0xFFFFFFFFL};
    }

    private static double m32Next(long[] st) {
        long s = (st[0] + M32_INC) & 0xFFFFFFFFL;
        st[0] = s;
        long t = ((s ^ (s >> 15)) * (s | 1)) & 0xFFFFFFFFL;
        long t0  = t;
        long mul = ((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFFL;
        t = ((t + mul) & 0xFFFFFFFFL) ^ t0;
        long result = (t ^ (t >> 14)) & 0xFFFFFFFFL;
        return result / (double) 0xFFFFFFFFL;
    }

    // =========================================================================
    // OKLCH -> sRGB  (SPEC §3.7)
    // =========================================================================

    private static double srgbEncode(double v) {
        v = Math.max(0.0, Math.min(1.0, v));
        if (v <= 0.0031308) return 12.92 * v;
        return 1.055 * Math.pow(v, 1.0 / 2.4) - 0.055;
    }

    /** Mirrors {@code makeColor()} in the TypeScript reference. */
    private static OklchColor makeColor(double L, double C, double h) {
        double hr = h * Math.PI / 180.0;
        double a  = C * Math.cos(hr);
        double b  = C * Math.sin(hr);

        double l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        double m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        double s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        double l3 = l_ * l_ * l_;
        double m3 = m_ * m_ * m_;
        double s3 = s_ * s_ * s_;

        double r  = srgbEncode( 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3);
        double g  = srgbEncode(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3);
        double bv = srgbEncode(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3);

        int ri = Math.max(0, Math.min(255, (int) Math.round(r  * 255)));
        int gi = Math.max(0, Math.min(255, (int) Math.round(g  * 255)));
        int bi = Math.max(0, Math.min(255, (int) Math.round(bv * 255)));
        return new OklchColor(L, C, h, String.format("#%02x%02x%02x", ri, gi, bi));
    }

    // =========================================================================
    // Color derivation  (SPEC §3.2)
    // =========================================================================

    private static OklchColor[] deriveColors(byte[] hb, HallmarkStyle style) {
        double h1 = (((hb[0] & 0xFF) << 8) | (hb[1] & 0xFF)) / 65536.0 * 360.0;
        double offsetRaw = (((hb[2] & 0xFF) << 8) | (hb[3] & 0xFF)) / 65536.0;
        double h2 = (h1 + 100.0 + offsetRaw * 160.0) % 360.0;

        double[] p = styleParams(style);
        double hueA = (style == HallmarkStyle.MONOCHROME) ? 0.0 : h1;
        double hueB = (style == HallmarkStyle.MONOCHROME) ? 0.0 : h2;

        return new OklchColor[]{
            makeColor(p[0], p[1], hueA),   // background
            makeColor(p[2], p[3], hueA),   // primary
            makeColor(p[4], p[5], hueB),   // accent
        };
    }

    // =========================================================================
    // Pattern generation  (SPEC §3.3)
    // Returns int[7][5], values 0=background, 1=primary, 2=accent.
    // =========================================================================

    private static int[][] genPattern(byte[] hb) {
        for (int attempt = 0; attempt < 8; attempt++) {
            int off = (4 + attempt * 4) % 28;
            long[] st = m32Seed(hb, off);
            int[][] cells = new int[7][5];
            int filled = 0;
            for (int row = 0; row < 7; row++) {
                int[] half = new int[3];
                for (int col = 0; col < 3; col++) {
                    double v = m32Next(st);
                    int c;
                    if (v < 0.50)      c = 0;
                    else if (v < 0.85) { c = 1; filled++; }
                    else               { c = 2; filled++; }
                    half[col] = c;
                }
                cells[row] = new int[]{half[0], half[1], half[2], half[1], half[0]};
            }
            if (filled >= (int) Math.ceil(21 * 0.45) && filled / 21.0 <= 0.75) {
                return cells;
            }
        }
        // Fallback: use attempt 0 unconditionally  (SPEC §3.3, last paragraph)
        long[] st = m32Seed(hb, 4);
        int[][] cells = new int[7][5];
        for (int row = 0; row < 7; row++) {
            int[] half = new int[3];
            for (int col = 0; col < 3; col++) {
                double v = m32Next(st);
                half[col] = (v < 0.50) ? 0 : (v < 0.85 ? 1 : 2);
            }
            cells[row] = new int[]{half[0], half[1], half[2], half[1], half[0]};
        }
        return cells;
    }

    // =========================================================================
    // Verbal companion  (SPEC §3.4)
    // Three BIP-39 words from the low 33 bits of bytes 27..31.
    // =========================================================================

    private static String[] deriveWords(byte[] hb) {
        long hi = hb[27] & 0x7FL;
        long lo = ((hb[28] & 0xFFL) << 24)
                | ((hb[29] & 0xFFL) << 16)
                | ((hb[30] & 0xFFL) <<  8)
                |  (hb[31] & 0xFFL);
        int i1 = (int) (((hi << 5) | (lo >> 27)) & 0x7FFL);
        int i2 = (int) ((lo >> 11) & 0x7FFL);
        int i3 = (int) (lo & 0x7FFL);
        String[] w = Bip39English.WORDS;
        return new String[]{w[i1], w[i2], w[i3]};
    }

    // =========================================================================
    // 14x20 pixel grid  (SPEC §3.8)
    // =========================================================================

    private static byte[] genPixels(int[][] cells) {
        byte[] px = new byte[280];
        for (int y = 0; y < 7; y++) {
            for (int x = 0; x < 5; x++) {
                int v = cells[y][x];
                if (v == 0) continue;
                int bx = x * 3;
                int by = y * 3;
                if (v == 1) {
                    px[by * 14 + bx]           = 1;
                    px[by * 14 + bx + 1]       = 1;
                    px[(by + 1) * 14 + bx]     = 1;
                    px[(by + 1) * 14 + bx + 1] = 1;
                } else {
                    px[by * 14 + bx]           = 2;
                    px[(by + 1) * 14 + bx + 1] = 2;
                }
            }
        }
        return px;
    }

    // =========================================================================
    // Internal SHA-256
    // =========================================================================

    private static byte[] sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(input.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    // =========================================================================
    // Public API
    // =========================================================================

    /**
     * Returns the full Hallmark specification for the given input, style, and border option.
     * Mirrors {@code hallmarkSpec()} in the TypeScript reference.
     *
     * @param input    any UTF-8 string (address, fingerprint, hash, ...)
     * @param style    visual theme
     * @param bordered whether to draw a 1-unit border in the primary colour (SVG only)
     */
    public static HallmarkSpec hallmarkSpec(String input, HallmarkStyle style, boolean bordered) {
        byte[] hb = sha256(input);
        int[][] cells = genPattern(hb);
        String[] words = deriveWords(hb);
        OklchColor[] c = deriveColors(hb, style);
        return new HallmarkSpec(cells, c[0], c[1], c[2], words, String.join(" ", words), style, bordered);
    }

    /** {@link #hallmarkSpec(String, HallmarkStyle, boolean)} with {@code bordered=false}. */
    public static HallmarkSpec hallmarkSpec(String input, HallmarkStyle style) {
        return hallmarkSpec(input, style, false);
    }

    /** {@link #hallmarkSpec(String, HallmarkStyle, boolean)} defaulting to {@link HallmarkStyle#STANDARD} and {@code bordered=false}. */
    public static HallmarkSpec hallmarkSpec(String input) {
        return hallmarkSpec(input, HallmarkStyle.STANDARD, false);
    }

    /**
     * Returns the three BIP-39 verbal companion words.
     * Mirrors {@code hallmarkWords()} in the TypeScript reference.
     */
    public static String[] hallmarkWords(String input) {
        return deriveWords(sha256(input));
    }

    /**
     * Returns the 14x20 pixel grid and resolved colours for the given style.
     * Mirrors {@code hallmarkPixels()} in the TypeScript reference.
     *
     * <p>Pixel values: 0 = background, 1 = primary, 2 = accent.
     * The grid is style-independent; only {@code colors} changes with style.
     *
     * @param input any UTF-8 string
     * @param style visual theme; defaults to {@link HallmarkStyle#STANDARD} when omitted
     */
    public static HallmarkPixelGrid hallmarkPixels(String input, HallmarkStyle style) {
        byte[] hb = sha256(input);
        int[][] cells = genPattern(hb);
        OklchColor[] c = deriveColors(hb, style);
        return new HallmarkPixelGrid(14, 20, genPixels(cells),
                new HallmarkColors(c[0], c[1], c[2]), style);
    }

    /** {@link #hallmarkPixels(String, HallmarkStyle)} defaulting to {@link HallmarkStyle#STANDARD}. */
    public static HallmarkPixelGrid hallmarkPixels(String input) {
        return hallmarkPixels(input, HallmarkStyle.STANDARD);
    }

    /**
     * Returns an SVG string for the given input, style, and border option.
     * ViewBox is {@code "0 0 100 132"}; apply width/height via CSS or attributes.
     * Mirrors {@code hallmarkSVG()} in the TypeScript reference.
     *
     * @param input    any UTF-8 string
     * @param style    visual theme
     * @param bordered whether to draw a 1-unit border in the primary colour
     */
    public static String hallmarkSVG(String input, HallmarkStyle style, boolean bordered) {
        return renderSVGString(hallmarkSpec(input, style, bordered));
    }

    /** {@link #hallmarkSVG(String, HallmarkStyle, boolean)} with {@code bordered=false}. */
    public static String hallmarkSVG(String input, HallmarkStyle style) {
        return hallmarkSVG(input, style, false);
    }

    /** {@link #hallmarkSVG(String, HallmarkStyle, boolean)} defaulting to {@link HallmarkStyle#STANDARD} and {@code bordered=false}. */
    public static String hallmarkSVG(String input) {
        return hallmarkSVG(input, HallmarkStyle.STANDARD, false);
    }

    // =========================================================================
    // SVG rendering  (mirrors renderSVGString / escapeAttr in TypeScript)
    // =========================================================================

    private static final int    SVG_W = 100;
    private static final int    SVG_H = 132;
    private static final double SVG_PADDING_FRACTION       = 0.10;
    private static final double SVG_CORNER_RADIUS_FRACTION = 0.16;
    private static final double SVG_DOT_RADIUS_FRACTION    = 0.40;
    private static final double SVG_ACCENT_RADIUS_FRACTION = 0.46;

    private static String renderSVGString(HallmarkSpec spec) {
        final double padding      = SVG_PADDING_FRACTION       * SVG_W;          // 10
        final double cell         = (SVG_W - 2 * padding) / 5.0;                 // 16
        final double cornerRadius = SVG_CORNER_RADIUS_FRACTION * SVG_W;          // 16
        final double dotR         = cell * SVG_DOT_RADIUS_FRACTION;              // 6.4
        final double accR         = cell * SVG_ACCENT_RADIUS_FRACTION;           // 7.36

        StringBuilder sb = new StringBuilder();
        sb.append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ")
          .append(SVG_W).append(' ').append(SVG_H)
          .append("\" role=\"img\" aria-label=\"Hallmark: ")
          .append(escapeAttr(spec.wordsText()))
          .append("\">");

        // background rect
        sb.append(String.format(java.util.Locale.ROOT,
            "<rect x=\"0\" y=\"0\" width=\"%d\" height=\"%d\" rx=\"%.3f\" ry=\"%.3f\" fill=\"%s\"/>",
            SVG_W, SVG_H, cornerRadius, cornerRadius, spec.background().hex()));

        // optional border
        if (spec.bordered()) {
            final double inset = 0.5;
            sb.append(String.format(java.util.Locale.ROOT,
                "<rect x=\"%.3f\" y=\"%.3f\" width=\"%.3f\" height=\"%.3f\" rx=\"%.3f\" ry=\"%.3f\" fill=\"none\" stroke=\"%s\" stroke-width=\"1\"/>",
                inset, inset, SVG_W - 2 * inset, SVG_H - 2 * inset,
                cornerRadius - inset, cornerRadius - inset, spec.primary().hex()));
        }

        // cells
        for (int y = 0; y < 7; y++) {
            for (int x = 0; x < 5; x++) {
                int value = spec.cells()[y][x];
                if (value == 0) continue;
                double cx = padding + x * cell + cell / 2.0;
                double cy = padding + y * cell + cell / 2.0;
                if (spec.style() == HallmarkStyle.MONOCHROME && value == 2) {
                    double side = accR * 2;
                    sb.append(String.format(java.util.Locale.ROOT,
                        "<rect x=\"%.3f\" y=\"%.3f\" width=\"%.3f\" height=\"%.3f\" rx=\"%.3f\" ry=\"%.3f\" fill=\"%s\"/>",
                        cx - accR, cy - accR, side, side, side * 0.15, side * 0.15,
                        spec.accent().hex()));
                } else {
                    double r     = (value == 2) ? accR : dotR;
                    String color = (value == 2) ? spec.accent().hex() : spec.primary().hex();
                    sb.append(String.format(java.util.Locale.ROOT,
                        "<circle cx=\"%.3f\" cy=\"%.3f\" r=\"%.3f\" fill=\"%s\"/>",
                        cx, cy, r, color));
                }
            }
        }

        sb.append("</svg>");
        return sb.toString();
    }

    private static String escapeAttr(String s) {
        return s.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;");
    }
}
