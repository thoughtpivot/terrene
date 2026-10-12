import { Canvas, ImageFiltering, ImageSource, Sprite } from "excalibur";
import { STORE } from "./art/atlas";

/** Painted art is smoothed, never pixel-snapped. */
export function paintedImage(path: string): ImageSource {
    return new ImageSource(path, false, ImageFiltering.Blended);
}

/** Whole image as a sprite at scene size (art is stored at STORE x). */
export function paintedSprite(image: ImageSource): Sprite {
    return new Sprite({
        image,
        destSize: { width: image.width / STORE, height: image.height / STORE },
    });
}

/** Frames of a horizontal strip, each scaled to scene size. */
export function paintedFrames(image: ImageSource, fw: number, fh: number, count: number): Sprite[] {
    const frames: Sprite[] = [];
    for (let i = 0; i < count; i++) {
        frames.push(new Sprite({
            image,
            sourceView: { x: i * fw, y: 0, width: fw, height: fh },
            destSize: { width: fw / STORE, height: fh / STORE },
        }));
    }
    return frames;
}

/** A soft radial glow, cached once. */
export function glow(radius: number, rgb: string, strength = 0.6, quality = 1): Canvas {
    const size = Math.ceil(radius * 2);
    return new Canvas({
        width: size,
        height: size,
        cache: true,
        quality,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
            g.addColorStop(0, `rgba(${rgb},${strength})`);
            g.addColorStop(0.35, `rgba(${rgb},${strength * 0.45})`);
            g.addColorStop(1, `rgba(${rgb},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, size, size);
        },
    });
}
