import { Color, Engine } from "excalibur";

interface SavedScreen {
    width: number;
    height: number;
    pixelRatio: number | undefined;
    antialiasing: boolean;
    snap: boolean;
    background: Color;
}

/** Shared with OkaScene's switch, so both scenes reuse one stylesheet. */
const HD_CANVAS_CLASS = "terrene-hd";

function smoothCanvas(canvas: HTMLCanvasElement, smooth: boolean): void {
    if (smooth && !document.getElementById(HD_CANVAS_CLASS)) {
        const style = document.createElement("style");
        style.id = HD_CANVAS_CLASS;
        style.textContent = `canvas.${HD_CANVAS_CLASS} { image-rendering: auto !important; }`;
        document.head.appendChild(style);
    }
    canvas.classList.toggle(HD_CANVAS_CLASS, smooth);
}

/**
 * Terrene runs at 256x240 pixel art. This switches the screen to a 16:9
 * resolution with antialiasing and a pixel ratio that matches the display,
 * and puts everything back afterwards, the way OkaScene does.
 */
export class HdScreen {
    private saved: SavedScreen | null = null;
    pixelRatio = 1;

    constructor(readonly width: number, readonly height: number) {}

    /** Enough backing pixels for the fitted canvas on this display, in steps of a half. */
    pickPixelRatio(): number {
        const dpr = window.devicePixelRatio || 1;
        const fit = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
        const want = Math.ceil(dpr * fit * 2) / 2;
        return Math.max(1, Math.min(3, want));
    }

    enter(engine: Engine, background: Color): void {
        const screen = engine.screen;
        if (!this.saved) {
            this.saved = {
                width: screen.resolution.width,
                height: screen.resolution.height,
                pixelRatio: screen.pixelRatioOverride,
                antialiasing: screen.antialiasing,
                snap: engine.snapToPixel,
                background: engine.backgroundColor,
            };
        }
        this.pixelRatio = this.pickPixelRatio();
        screen.resolution = { width: this.width, height: this.height };
        screen.pixelRatioOverride = this.pixelRatio;
        screen.antialiasing = true;
        engine.snapToPixel = false;
        engine.backgroundColor = background;
        smoothCanvas(engine.canvas, true);
        window.dispatchEvent(new Event("resize"));
    }

    leave(engine: Engine): void {
        const s = this.saved;
        if (!s) return;
        const screen = engine.screen;
        screen.resolution = { width: s.width, height: s.height };
        screen.pixelRatioOverride = s.pixelRatio;
        screen.antialiasing = s.antialiasing;
        engine.snapToPixel = s.snap;
        engine.backgroundColor = s.background;
        smoothCanvas(engine.canvas, false);
        window.dispatchEvent(new Event("resize"));
        this.saved = null;
    }
}
