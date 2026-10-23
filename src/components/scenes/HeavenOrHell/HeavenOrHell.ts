import {
    Actor, Color, Engine, Font, FontUnit, ImageFiltering, ImageSource, ImageWrapping, Keys, Scene, ScreenElement, Text, TextAlign, vec,
    type ExcaliburGraphicsContext, type Material, type Subscription,
} from "excalibur";
import Tenth, { Resources as TenthResources } from "../../characters/player/Tenth/Tenth.ts";
import { PROP_FRAMES } from "./art/atlas.ts";
import FloorImage from "./art/floor-tile.png";
import PropsImage from "./art/heaven-props-0.png";
import { KEY_ACTIONS, MOUSE_ACTIONS, readIntent, type RawInput } from "./input.ts";
import { LIGHT, VOID } from "./palette.ts";
import { BloomPostProcessor } from "./render/bloom.ts";
import { createLitMaterial, LightField } from "./render/lighting.ts";
import { CanvasGraphic, FogGraphic, vignetteCanvas } from "./render/overlay.ts";
import { worldRect } from "./world/chunks.ts";
import { Z } from "./world/collide.ts";
import { StreamingDebug, textureCount } from "./world/debug.ts";
import { GRID, spawnPoint } from "./world/map.ts";
import { ChunkStreamer } from "./world/streaming.ts";

export const HEAVEN_OR_HELL_SCENE = "heavenorhell";

const TITLE = "Heaven Or Hell";
const VIEW_W = 1280;
const VIEW_H = 720;
/** how far the camera leans toward the mouse, and the most it leans */
const LOOK_AHEAD = 0.12;
const LOOK_MAX = 80;
const CAMERA_FOLLOW = 9;
const HINT_TIME = 9;

const Resources = {
    Props: new ImageSource(PropsImage, { filtering: ImageFiltering.Blended }),
    Floor: new ImageSource(FloorImage, { filtering: ImageFiltering.Blended, wrapping: ImageWrapping.Repeat }),
    Hero: TenthResources.Image,
};

export { Resources };

interface SavedScreen {
    width: number;
    height: number;
    pixelRatio: number | undefined;
    antialiasing: boolean;
    snap: boolean;
    background: Color;
}

/** Excalibur rewrites the canvas `image-rendering` on resize, so smoothing is forced from a stylesheet. */
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

function pickPixelRatio(): number {
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    return Math.max(1, Math.min(2, Math.ceil(dpr * fit * 2) / 2));
}

/**
 * Heaven Or Hell, M1: the Tenth, a lesser angel, defends the dark ruins of
 * Heaven while Hell breaks through at the edge. A fixed three-quarter camera over painted
 * sprites, lit per pixel and bloomed. The map streams in chunks around the
 * hero. Terrene runs at 256x240; this scene switches to 1280x720 with
 * smoothing while it is active and puts the screen back after.
 */
export default class HeavenOrHell extends Scene {
    private engineRef: Engine | null = null;
    private saved: SavedScreen | null = null;
    private hostTitle: string | null = null;
    private loading: Promise<void> | null = null;
    private lit: Material | null = null;
    private bloom: BloomPostProcessor | null = null;
    private lights = new LightField();
    private streamer: ChunkStreamer | null = null;
    private debug: StreamingDebug | null = null;
    private hero: Tenth | null = null;
    private overlays: Actor[] = [];
    /** made once per scene, so re-entering never uploads another copy */
    private vignette: CanvasGraphic | null = null;
    private fog: FogGraphic | null = null;
    private hint: ScreenElement | null = null;
    private subs: Subscription[] = [];
    private domListeners: [EventTarget, string, EventListener][] = [];
    /** the mouse in page pixels, or null when it is off the canvas */
    private mouse: { x: number; y: number } | null = null;
    private time = 0;
    private camX = 0;
    private camY = 0;
    private fps = 60;
    private lastDraw = 0;
    private active = false;

    onInitialize(engine: Engine): void {
        this.engineRef = engine;
    }

    onActivate(): void {
        const engine = this.engineRef ?? this.engine;
        this.engineRef = engine;
        this.active = true;
        document.getElementById("loading")?.remove();
        this.hostTitle = this.hostTitle ?? document.title;
        document.title = TITLE;
        this.enterHd(engine);
        (window as unknown as { __hoh?: HeavenOrHell }).__hoh = this;
        console.log("🏰 Heaven Or Hell activated");
        void this.prefetch().then(() => {
            if (!this.active || (engine.currentScene as Scene) !== this) return;
            try {
                this.build(engine);
            } catch (error) {
                console.error("❌ Heaven Or Hell failed to build", error);
            }
        });
    }

    onDeactivate(): void {
        this.active = false;
        this.teardown();
        if (this.engineRef) this.leaveHd(this.engineRef);
        if (this.hostTitle !== null) {
            document.title = this.hostTitle;
            this.hostTitle = null;
        }
        const w = window as unknown as { __hoh?: HeavenOrHell };
        if (w.__hoh === this) delete w.__hoh;
        console.log("🏰 Heaven Or Hell deactivated");
    }

    /** Start loading the art (once). */
    prefetch(): Promise<void> {
        this.loading = this.loading ?? Promise.all(
            Object.values(Resources).map((r) => (r.isLoaded() ? Promise.resolve() : r.load().then(() => undefined))),
        ).then(() => {
            console.log("🎨 Heaven Or Hell art loaded");
        }).catch((error: unknown) => {
            console.error("❌ Heaven Or Hell art failed to load", error);
            this.loading = null;
        });
        return this.loading;
    }

    // ------------------------------------------------------------- screen

    private enterHd(engine: Engine): void {
        const screen = engine.screen;
        this.saved = {
            width: screen.resolution.width,
            height: screen.resolution.height,
            pixelRatio: screen.pixelRatioOverride,
            antialiasing: screen.antialiasing,
            snap: engine.snapToPixel,
            background: engine.backgroundColor,
        };
        screen.resolution = { width: VIEW_W, height: VIEW_H };
        screen.pixelRatioOverride = pickPixelRatio();
        screen.antialiasing = true;
        engine.snapToPixel = false;
        engine.backgroundColor = Color.fromHex(VOID);
        smoothCanvas(engine.canvas, true);
        window.dispatchEvent(new Event("resize"));
    }

    private leaveHd(engine: Engine): void {
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

    // ------------------------------------------------------------- world

    private build(engine: Engine): void {
        this.teardown();
        const bounds = worldRect(GRID);
        this.lit = this.lit ?? createLitMaterial(engine, bounds);
        this.bloom = new BloomPostProcessor();
        engine.graphicsContext.addPostProcessor(this.bloom);

        this.streamer = new ChunkStreamer(this, engine, GRID, { props: Resources.Props, floor: Resources.Floor }, this.lit, this.lights);
        const spawn = spawnPoint();
        const hero = new Tenth(spawn.x, spawn.y);
        hero.light = this.lights.add({ x: spawn.x, y: spawn.y - 60, r: 280, color: LIGHT.halo, intensity: 0.55, flicker: 0.04 });
        this.hero = hero;
        this.add(hero);
        this.streamer.warm(spawn.x, spawn.y);
        this.camX = spawn.x;
        this.camY = spawn.y - 40;
        this.camera.pos = vec(this.camX, this.camY);

        const fog = new FogGraphic(Resources.Props, PROP_FRAMES["glow-dot"], VIEW_W, VIEW_H);
        this.fog = fog;
        const fogEl = new ScreenElement({ x: 0, y: 0, z: Z.overlay - 1 });
        fogEl.graphics.use(fog);
        const vignette = new ScreenElement({ x: 0, y: 0, z: Z.overlay });
        this.vignette = this.vignette ?? new CanvasGraphic(vignetteCanvas(VIEW_W, VIEW_H), VIEW_W, VIEW_H);
        vignette.graphics.use(this.vignette);
        this.overlays = [fogEl, vignette];
        for (const o of this.overlays) this.add(o);

        const hint = new ScreenElement({ x: 24, y: VIEW_H - 28, z: Z.hud });
        hint.graphics.use(new Text({
            text: "WASD move   ·   mouse aim   ·   Space dash   ·   G streaming debug   ·   B bloom",
            font: new Font({ family: "Georgia, serif", size: 15, unit: FontUnit.Px, color: Color.fromHex("#CDBF9A"), textAlign: TextAlign.Left, shadow: { blur: 3, offset: vec(0, 1), color: Color.Black } }),
        }));
        hint.graphics.anchor = vec(0, 1);
        this.hint = hint;
        this.add(hint);

        this.debug = new StreamingDebug(engine, {
            streamer: this.streamer,
            hero: () => ({ x: hero.pos.x, y: hero.pos.y }),
            fps: () => this.fps,
            lightsUsed: () => this.lights.used,
            lightsTotal: () => this.lights.size,
            bloom: () => (this.bloom?.enabled ? `on, ${this.bloom.format}` : "off"),
        });
        this.bindInput(engine);
        this.time = 0;
        console.log(`✅ Heaven Or Hell built: ${this.streamer.loaded.size} chunks around the temple`);
    }

    private teardown(): void {
        const engine = this.engineRef;
        this.unbindInput();
        this.debug?.dispose(this);
        this.debug = null;
        this.streamer?.unloadAll();
        this.streamer = null;
        this.lights.clear();
        if (this.hero) {
            this.hero.kill();
            this.hero = null;
        }
        for (const o of this.overlays) o.kill();
        this.overlays = [];
        this.fog = null;
        this.hint?.kill();
        this.hint = null;
        if (this.bloom && engine) {
            engine.graphicsContext.removePostProcessor(this.bloom);
            this.bloom.dispose();
        }
        this.bloom = null;
    }

    // ------------------------------------------------------------- input

    private bindInput(engine: Engine): void {
        this.unbindInput();
        const kb = engine.input.keyboard;
        this.subs.push(kb.on("press", (evt) => {
            const hero = this.hero;
            if (!hero) return;
            if (evt.key === Keys.G) this.debug?.toggle(this);
            if (evt.key === Keys.B && this.bloom) this.bloom.enabled = !this.bloom.enabled;
            const action = KEY_ACTIONS[evt.key];
            if (action) hero.buffer.press(action, this.time * 1000);
        }));
        const canvas = engine.canvas;
        const listen = (target: EventTarget, type: string, fn: EventListener) => {
            target.addEventListener(type, fn);
            this.domListeners.push([target, type, fn]);
        };
        listen(canvas, "contextmenu", (e) => e.preventDefault());
        const track = (e: Event) => {
            const p = e as PointerEvent;
            this.mouse = { x: p.pageX, y: p.pageY };
        };
        listen(canvas, "pointermove", track);
        listen(canvas, "pointerdown", (e) => {
            track(e);
            const action = MOUSE_ACTIONS[(e as PointerEvent).button];
            if (action) this.hero?.buffer.press(action, this.time * 1000);
        });
        listen(canvas, "pointerleave", () => {
            this.mouse = null;
        });
    }

    private unbindInput(): void {
        for (const s of this.subs) s.close();
        this.subs = [];
        for (const [t, type, fn] of this.domListeners) t.removeEventListener(type, fn);
        this.domListeners = [];
    }

    private readRaw(engine: Engine): RawInput {
        const kb = engine.input.keyboard;
        const held = (...keys: Keys[]) => keys.some((k) => kb.isHeld(k));
        let aim = null;
        if (this.mouse) {
            // re-projected every frame, so the aim holds while the camera moves under a still mouse
            const screen = engine.screen.pageToScreenCoordinates(vec(this.mouse.x, this.mouse.y));
            const p = engine.screen.screenToWorldCoordinates(screen);
            aim = { x: p.x, y: p.y };
        }
        return {
            up: held(Keys.W, Keys.Up),
            down: held(Keys.S, Keys.Down),
            left: held(Keys.A, Keys.Left),
            right: held(Keys.D, Keys.Right),
            aim,
            pressed: [],
            held: kb.isHeld(Keys.F) ? ["block"] : [],
        };
    }

    // ------------------------------------------------------------- loop

    override onPreUpdate(engine: Engine, elapsed: number): void {
        const hero = this.hero;
        const streamer = this.streamer;
        if (!hero || !streamer) return;
        const dt = Math.min(0.05, elapsed / 1000);
        this.time += dt;
        const raw = this.readRaw(engine);
        const intent = readIntent(raw, { x: hero.pos.x, y: hero.pos.y - 50 });
        const bounds = worldRect(GRID);
        const inset = { x: bounds.x + 120, y: bounds.y + 120, w: bounds.w - 240, h: bounds.h - 240 };
        const result = hero.step(intent, this.time * 1000, dt, streamer.colliders, inset);
        if (result.dashed) this.camera.shake(3, 3, 120);
        streamer.update(hero.pos.x, hero.pos.y, dt);

        let lx = 0;
        let ly = 0;
        if (intent.aim && raw.aim) {
            lx = (raw.aim.x - hero.pos.x) * LOOK_AHEAD;
            ly = (raw.aim.y - hero.pos.y) * LOOK_AHEAD;
            const len = Math.hypot(lx, ly);
            if (len > LOOK_MAX) {
                lx *= LOOK_MAX / len;
                ly *= LOOK_MAX / len;
            }
        }
        const k = 1 - Math.exp(-CAMERA_FOLLOW * dt);
        this.camX += (hero.pos.x + lx - this.camX) * k;
        this.camY += (hero.pos.y - 40 + ly - this.camY) * k;
        // land the camera on whole device pixels so painted edges do not shimmer
        const pr = engine.screen.pixelRatio;
        this.camera.pos = vec(Math.round(this.camX * pr) / pr, Math.round(this.camY * pr) / pr);

        if (this.fog) {
            this.fog.time = this.time;
            this.fog.camera = this.camera.pos;
        }
        if (this.hint) this.hint.graphics.opacity = Math.max(0, Math.min(1, (HINT_TIME - this.time) / 2));
        this.debug?.update(dt);
    }

    override onPreDraw(ctx: ExcaliburGraphicsContext, elapsed: number): void {
        void ctx;
        void elapsed;
        const now = performance.now();
        if (this.lastDraw) {
            const frame = now - this.lastDraw;
            if (frame > 0) this.fps += (1000 / frame - this.fps) * 0.08;
        }
        this.lastDraw = now;
        if (!this.lit || !this.hero) return;
        const cam = this.camera;
        const zoom = cam.zoom;
        const topLeft = vec(cam.drawPos.x - VIEW_W / 2 / zoom, cam.drawPos.y - VIEW_H / 2 / zoom);
        this.lights.upload(this.lit, this.time, topLeft, VIEW_W / zoom, VIEW_H / zoom, zoom);
    }

    // ------------------------------------------------------------- dev handle

    /** Move the hero, for testing and screenshots. */
    teleport(x: number, y: number): void {
        const hero = this.hero;
        if (!hero) return;
        hero.mover = { ...hero.mover, x, y, vx: 0, vy: 0 };
        hero.pos = vec(x, y);
        this.camX = x;
        this.camY = y - 40;
    }

    get state() {
        return {
            hero: this.hero ? { x: this.hero.pos.x, y: this.hero.pos.y, facing: this.hero.facing, view: this.hero.rig.view } : null,
            loaded: this.streamer ? [...this.streamer.loaded.keys()] : [],
            actors: this.actors.length,
            lights: this.lights.size,
            textures: this.engineRef ? textureCount(this.engineRef) : -1,
            fps: this.fps,
            bloom: this.bloom ? { enabled: this.bloom.enabled, format: this.bloom.format } : null,
            debug: this.debug?.visible ?? false,
        };
    }
}
