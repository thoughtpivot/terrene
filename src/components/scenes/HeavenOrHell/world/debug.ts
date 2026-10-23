/**
 * The streaming debug view (G): every chunk's border coloured by state, the
 * load and unload reach around the hero, the colliders, a minimap of the
 * grid and live counts of chunks, actors, lights and GPU textures.
 */
import {
    Actor, Color, ExcaliburGraphicsContextWebGL, Font, FontUnit, Graphic, GraphicsGroup, Rectangle, ScreenElement, Text, TextAlign, vec,
    type Engine, type ExcaliburGraphicsContext,
} from "excalibur";
import { FOOTPRINT_RATIO } from "../art/atlas.ts";
import { chunkKey, chunkRect, LOAD_DISTANCE, UNLOAD_DISTANCE, worldRect } from "./chunks.ts";
import { Z } from "./collide.ts";
import { HOME } from "./map.ts";
import type { ChunkStreamer } from "./streaming.ts";

const LOADED = Color.fromHex("#5BE37A");
const PENDING = Color.fromHex("#FFB23F");
const IDLE = Color.fromHex("#3A3F4E");
const REACH_IN = Color.fromRGB(91, 227, 122, 0.55);
const REACH_OUT = Color.fromRGB(255, 84, 60, 0.45);
const COLLIDER = Color.fromRGB(80, 200, 255, 0.7);

export interface DebugSource {
    streamer: ChunkStreamer;
    hero: () => { x: number; y: number };
    fps: () => number;
    lightsUsed: () => number;
    lightsTotal: () => number;
    bloom: () => string;
}

function ellipse(ex: ExcaliburGraphicsContext, cx: number, cy: number, rx: number, ry: number, color: Color, thickness: number, steps = 64): void {
    let px = cx + rx;
    let py = cy;
    for (let i = 1; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const x = cx + Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        ex.drawLine(vec(px, py), vec(x, y), color, thickness);
        px = x;
        py = y;
    }
}

class WorldDebugGraphic extends Graphic {
    constructor(private readonly src: DebugSource) {
        super({ width: 1, height: 1 });
    }

    protected _drawImage(ex: ExcaliburGraphicsContext): void {
        const s = this.src.streamer;
        const grid = s.grid;
        const pending = new Set(s.pending);
        for (let cy = 0; cy < grid.rows; cy++) {
            for (let cx = 0; cx < grid.cols; cx++) {
                const key = chunkKey(cx, cy);
                const r = chunkRect(grid, cx, cy);
                const color = s.loaded.has(key) ? LOADED : pending.has(key) ? PENDING : IDLE;
                const t = s.loaded.has(key) ? 4 : 2;
                ex.drawLine(vec(r.x, r.y), vec(r.x + r.w, r.y), color, t);
                ex.drawLine(vec(r.x, r.y), vec(r.x, r.y + r.h), color, t);
                ex.drawLine(vec(r.x + r.w, r.y), vec(r.x + r.w, r.y + r.h), color, t);
                ex.drawLine(vec(r.x, r.y + r.h), vec(r.x + r.w, r.y + r.h), color, t);
            }
        }
        const h = this.src.hero();
        for (const c of s.colliders) {
            if (Math.abs(c.x - h.x) > 900 || Math.abs(c.y - h.y) > 600) continue;
            ellipse(ex, c.x, c.y, c.rx, c.ry, COLLIDER, 1.5, 20);
        }
        // streaming measures plain distance in world pixels, so the reach is a circle on screen
        ellipse(ex, h.x, h.y, LOAD_DISTANCE, LOAD_DISTANCE, REACH_IN, 3);
        ellipse(ex, h.x, h.y, UNLOAD_DISTANCE, UNLOAD_DISTANCE, REACH_OUT, 3);
    }

    clone(): WorldDebugGraphic {
        return new WorldDebugGraphic(this.src);
    }
}

const MAP_CELL = 22;

class MinimapGraphic extends Graphic {
    constructor(private readonly src: DebugSource) {
        const g = src.streamer.grid;
        super({ width: g.cols * MAP_CELL + 4, height: g.rows * MAP_CELL + 4 });
    }

    protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
        const s = this.src.streamer;
        const grid = s.grid;
        const pending = new Set(s.pending);
        ex.drawRectangle(vec(x, y), this.width, this.height, Color.fromRGB(5, 6, 9, 0.85));
        for (let cy = 0; cy < grid.rows; cy++) {
            for (let cx = 0; cx < grid.cols; cx++) {
                const key = chunkKey(cx, cy);
                const fill = s.loaded.has(key) ? LOADED : pending.has(key) ? PENDING : IDLE;
                const home = cx === HOME.cx && cy === HOME.cy;
                ex.drawRectangle(vec(x + 2 + cx * MAP_CELL + 1, y + 2 + cy * MAP_CELL + 1), MAP_CELL - 2, MAP_CELL - 2, fill, home ? Color.White : undefined, home ? 2 : 0);
            }
        }
        const w = worldRect(grid);
        const h = this.src.hero();
        const hx = x + 2 + (h.x / w.w) * grid.cols * MAP_CELL;
        const hy = y + 2 + (h.y / w.h) * grid.rows * MAP_CELL;
        ex.drawCircle(vec(hx, hy), 3.5, Color.fromHex("#FFE08A"), Color.Black, 1);
    }

    clone(): MinimapGraphic {
        return new MinimapGraphic(this.src);
    }
}

/** GPU textures Excalibur holds right now. The loader keeps them in a private map, read here for the readout only. */
export function textureCount(engine: Engine): number {
    const ctx = engine.graphicsContext;
    if (!(ctx instanceof ExcaliburGraphicsContextWebGL)) return -1;
    const loader = ctx.textureLoader as unknown as { _textureMap?: Map<unknown, unknown> };
    return loader._textureMap?.size ?? -1;
}

export class StreamingDebug {
    private world: Actor;
    private minimap: ScreenElement;
    private readout: ScreenElement;
    private text: Text;
    private shown = false;
    private refresh = 0;

    constructor(private readonly engine: Engine, private readonly src: DebugSource) {
        this.world = new Actor({ x: 0, y: 0, z: Z.debug, anchor: vec(0, 0) });
        this.world.graphics.use(new WorldDebugGraphic(src));
        // never culled: it draws the whole map from a 1x1 box
        this.world.graphics.forceOnScreen = true;
        const res = engine.screen.resolution;
        this.minimap = new ScreenElement({ x: res.width - src.streamer.grid.cols * MAP_CELL - 20, y: 16, z: Z.hud });
        this.minimap.graphics.use(new MinimapGraphic(src));
        this.text = new Text({
            text: "",
            font: new Font({ family: "monospace", size: 13, unit: FontUnit.Px, color: Color.fromHex("#E8E4D8"), textAlign: TextAlign.Left, shadow: { blur: 2, offset: vec(1, 1), color: Color.Black } }),
        });
        this.readout = new ScreenElement({ x: 12, y: 12, z: Z.hud });
        const panel = new Rectangle({ width: 470, height: 196, color: Color.fromRGB(5, 6, 9, 0.82) });
        this.readout.graphics.use(new GraphicsGroup({
            useAnchor: false,
            members: [{ graphic: panel, offset: vec(0, 0) }, { graphic: this.text, offset: vec(12, 10) }],
        }));
    }

    get visible(): boolean {
        return this.shown;
    }

    toggle(scene: { add: (a: Actor) => void; remove: (a: Actor) => void }): void {
        this.shown = !this.shown;
        for (const a of [this.world, this.minimap, this.readout]) {
            if (this.shown) scene.add(a);
            else scene.remove(a);
        }
        console.log(`🔧 Streaming debug ${this.shown ? "on" : "off"}`);
    }

    update(dt: number): void {
        if (!this.shown) return;
        this.refresh -= dt;
        if (this.refresh > 0) return;
        this.refresh = 0.25;
        const s = this.src.streamer;
        const h = this.src.hero();
        const chunk = `${Math.floor(h.x / s.grid.size)},${Math.floor(h.y / s.grid.size)}`;
        this.text.text = [
            `fps        ${this.src.fps().toFixed(0)}`,
            `chunk      ${chunk}`,
            `loaded     ${s.loaded.size} / ${s.grid.cols * s.grid.rows}  [${[...s.loaded.keys()].join(" ")}]`,
            `pending    ${s.pending.length}`,
            `streamed   +${s.loads} / -${s.unloads}`,
            `actors     ${s.actorCount} in chunks, ${this.engine.currentScene.actors.length} in scene`,
            `lights     ${this.src.lightsUsed()} drawn / ${this.src.lightsTotal()} live`,
            `colliders  ${s.colliders.length}`,
            `textures   ${textureCount(this.engine)}`,
            `bloom      ${this.src.bloom()}`,
            `reach      load ${LOAD_DISTANCE}  unload ${UNLOAD_DISTANCE}  (ratio ${FOOTPRINT_RATIO})`,
        ].join("\n");
    }

    dispose(scene: { remove: (a: Actor) => void }): void {
        if (this.shown) for (const a of [this.world, this.minimap, this.readout]) scene.remove(a);
        this.shown = false;
    }
}
