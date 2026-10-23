import { Color, Font, FontSource, FontUnit, TextAlign, BaseAlign, vec } from "excalibur";

/**
 * The UI's fonts, all SIL Open Font License (see the OFL-*.txt files beside
 * them): Cinzel for headings, Cormorant Garamond for dialogue and card text,
 * and Inter for numbers and small labels.
 *
 * FontSource registers each file as its own family. FontSource gives a face
 * no weight, so each weight gets its own family name rather than sharing one.
 * The paths are relative to the page: CopyPlugin copies src/** into the
 * build, so they resolve on the dev server and on GitHub Pages alike.
 */
const DIR = "./src/components/scenes/HeavenOrHell/ui/fonts/";

export const FontSources = {
    display: new FontSource(`${DIR}cinzel-latin-500-normal.woff2`, "HoH Cinzel"),
    displayBold: new FontSource(`${DIR}cinzel-latin-700-normal.woff2`, "HoH Cinzel Bold"),
    body: new FontSource(`${DIR}cormorant-garamond-latin-500-normal.woff2`, "HoH Cormorant"),
    bodyItalic: new FontSource(`${DIR}cormorant-garamond-latin-500-italic.woff2`, "HoH Cormorant Italic"),
    ui: new FontSource(`${DIR}inter-latin-500-normal.woff2`, "HoH Inter"),
    uiBold: new FontSource(`${DIR}inter-latin-600-normal.woff2`, "HoH Inter SemiBold"),
};

let loading: Promise<void> | null = null;

/**
 * Load every UI font once. A font that fails falls back to the next family in
 * its stack (see `FAMILY` in paint.ts), so the UI still draws.
 */
export function loadUiFonts(): Promise<void> {
    if (!loading) {
        loading = Promise.allSettled(Object.values(FontSources).map((f) => f.load())).then((results) => {
            const failed = results.filter((r) => r.status === "rejected");
            if (failed.length) console.error("❌ Heaven Or Hell UI fonts failed to load:", failed);
            else console.log("🎨 Heaven Or Hell UI fonts loaded");
        });
    }
    return loading;
}

/** An Excalibur Font in a UI family, for `Text` graphics. */
export function uiFont(source: FontSource, size: number, color: Color, quality: number, align = TextAlign.Left): Font {
    return source.toFont({
        size,
        unit: FontUnit.Px,
        color,
        textAlign: align,
        baseAlign: BaseAlign.Alphabetic,
        quality,
        shadow: { blur: 4, offset: vec(0, 1), color: Color.fromRGB(0, 0, 0, 0.9) },
    });
}
