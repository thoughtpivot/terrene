import {
    Animation,
    AnimationStrategy,
    ImageFiltering,
    ImageSource,
    Sprite,
    SpriteFont,
    SpriteSheet,
    vec,
} from "excalibur";
import sheetUrl from "./art/spritesheet.png";
import { FONT_ALPHABET, frames, Frame } from "./art/atlas";

const Resources = {
    Image: new ImageSource(sheetUrl, false, ImageFiltering.Pixel),
};

export { Resources };

export function sprite(name: string): Sprite {
    const frame: Frame = frames[name];
    if (!frame) {
        throw new Error(`Missing sprite frame: ${name}`);
    }
    return new Sprite({
        image: Resources.Image,
        sourceView: { x: frame.x, y: frame.y, width: frame.w, height: frame.h },
    });
}

export function loop(names: string[], ms: number): Animation {
    return new Animation({
        strategy: AnimationStrategy.Loop,
        frames: names.map((name) => ({ graphic: sprite(name), duration: ms })),
    });
}

let cachedFont: SpriteFont | null = null;

export function getFont(): SpriteFont {
    if (!cachedFont) {
        const font = frames.font;
        const sheet = SpriteSheet.fromImageSource({
            image: Resources.Image,
            grid: {
                rows: 1,
                columns: FONT_ALPHABET.length,
                spriteWidth: 8,
                spriteHeight: 8,
            },
            spacing: {
                originOffset: { x: font.x, y: font.y },
            },
        });
        cachedFont = new SpriteFont({
            alphabet: FONT_ALPHABET,
            spriteSheet: sheet,
            spacing: 0,
            caseInsensitive: true,
            shadow: { offset: vec(1, 1) },
        });
    }
    return cachedFont;
}
