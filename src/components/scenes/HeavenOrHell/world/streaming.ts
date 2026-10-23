/**
 * Streams the map's chunks in and out around the hero. A chunk's ChunkDef
 * becomes actors (floor, decals, props split into sortable strips, glow
 * layers, particle fields), lights in the LightField, colliders and one
 * painted canvas of floor wear. Unloading kills the actors, takes the lights
 * out and deletes the canvas's GPU texture, so walking the whole map leaves
 * nothing behind.
 */
import { Actor, ExcaliburGraphicsContextWebGL, Sprite, vec, type Engine, type ImageSource, type Material, type Scene } from "excalibur";
import { FLOOR_TILE, PROP_FRAMES, type PropName } from "../art/atlas.ts";
import type { AtlasFrame } from "../art/types.ts";
import { LIGHT } from "../palette.ts";
import { additive, flickerAt, type LightField, type LiveLight } from "../render/lighting.ts";
import { CanvasGraphic } from "../render/overlay.ts";
import { ParticleField, ParticleGraphic } from "../render/particles.ts";
import { chunkRect, chunkSeed, planStreaming, seeded, type Grid, type Rect } from "./chunks.ts";
import { depthOf, Z } from "./collide.ts";
import { chunkDef, type ChunkDef, type Footprint, type Placement } from "./map.ts";

export interface StreamAssets {
    props: ImageSource;
    floor: ImageSource;
}

interface Glow {
    actor: Actor;
    base: number;
    flicker: number;
    phase: number;
}

export interface LoadedChunk {
    def: ChunkDef;
    actors: Actor[];
    lights: LiveLight[];
    glows: Glow[];
    fields: ParticleField[];
    wear: HTMLCanvasElement | null;
    age: number;
}

const WEAR_SIZE = 768;
const LIGHT_FADE_IN = 0.5;

/** What glows on each emissive prop, and how hot. */
const GLOW_GAIN: Partial<Record<PropName, { color: readonly [number, number, number]; gain: number; flicker: number }>> = {
    brazier: { color: LIGHT.holy, gain: 1.25, flicker: 0.35 },
    altar: { color: LIGHT.white, gain: 1.1, flicker: 0.08 },
    "hell-spikes": { color: LIGHT.hellfire, gain: 1.35, flicker: 0.3 },
    breach: { color: LIGHT.ember, gain: 1.5, flicker: 0.25 },
};

const DECAL_Z: Partial<Record<PropName, number>> = {
    "floor-plaza": Z.floorDetail,
    breach: Z.decal,
};

/** Soot, scuffs and hairline cracks over the marble, and Hell's red veins where it has crept in. */
export function paintWear(def: ChunkDef, size = WEAR_SIZE): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const g = canvas.getContext("2d");
    if (!g) return canvas;
    const rand = seeded(chunkSeed(def.cx, def.cy, 31));
    const blots = 26 + Math.floor(rand() * 14);
    for (let i = 0; i < blots; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 30 + rand() * 120;
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(6,7,10,${0.35 + rand() * 0.35})`);
        grad.addColorStop(1, "rgba(6,7,10,0)");
        g.fillStyle = grad;
        g.beginPath();
        g.ellipse(x, y, r, r * 0.72, 0, 0, Math.PI * 2);
        g.fill();
    }
    const crack = (color: string, width: number, count: number, len: number) => {
        g.strokeStyle = color;
        g.lineWidth = width;
        g.lineCap = "round";
        for (let i = 0; i < count; i++) {
            let x = rand() * size;
            let y = rand() * size;
            let a = rand() * Math.PI * 2;
            g.beginPath();
            g.moveTo(x, y);
            const steps = 5 + Math.floor(rand() * 7);
            for (let s = 0; s < steps; s++) {
                a += (rand() - 0.5) * 1.3;
                x += Math.cos(a) * len * (0.5 + rand());
                y += Math.sin(a) * len * 0.72 * (0.5 + rand());
                g.lineTo(x, y);
            }
            g.stroke();
        }
    };
    crack("rgba(4,4,6,0.75)", 2.2, 14, 26);
    if (def.corruption > 0.15) crack(`rgba(190,30,10,${Math.min(0.9, def.corruption + 0.2)})`, 2.6, Math.round(def.corruption * 26), 34);
    return canvas;
}

function frameSprite(image: ImageSource, f: AtlasFrame | { x: number; y: number; w: number; h: number }, scale: number, flip: boolean): Sprite {
    const sprite = new Sprite({
        image,
        sourceView: { x: f.x, y: f.y, width: f.w, height: f.h },
        destSize: { width: f.w * scale, height: f.h * scale },
    });
    sprite.flipHorizontal = flip;
    return sprite;
}

export class ChunkStreamer {
    readonly loaded = new Map<string, LoadedChunk>();
    colliders: Footprint[] = [];
    loads = 0;
    unloads = 0;
    /** chunks the plan wants but that have not been built yet, nearest first */
    pending: string[] = [];
    private time = 0;

    constructor(
        private readonly scene: Scene,
        private readonly engine: Engine,
        readonly grid: Grid,
        private readonly assets: StreamAssets,
        private readonly lit: Material,
        private readonly lights: LightField,
    ) {}

    /** Plan around (x, y); build at most one chunk per frame so a load never hitches. */
    update(x: number, y: number, dt: number): void {
        this.time += dt;
        const plan = planStreaming(this.grid, this.loaded.keys(), x, y);
        for (const key of plan.unload) this.unload(key);
        this.pending = plan.load;
        const next = plan.load[0];
        if (next) this.load(next);
        for (const chunk of this.loaded.values()) this.animate(chunk, dt);
    }

    /** Load every chunk near (x, y) at once, for the first frame. */
    warm(x: number, y: number): void {
        const plan = planStreaming(this.grid, this.loaded.keys(), x, y);
        for (const key of plan.load) this.load(key);
        for (const chunk of this.loaded.values()) {
            chunk.age = LIGHT_FADE_IN;
            for (const l of chunk.lights) l.fade = 1;
        }
    }

    unloadAll(): void {
        for (const key of [...this.loaded.keys()]) this.unload(key);
        this.pending = [];
    }

    get actorCount(): number {
        let n = 0;
        for (const c of this.loaded.values()) n += c.actors.length;
        return n;
    }

    private load(key: string): void {
        if (this.loaded.has(key)) return;
        const [cx, cy] = key.split(",").map(Number);
        const def = chunkDef(cx, cy);
        const rect = chunkRect(this.grid, cx, cy);
        const chunk: LoadedChunk = { def, actors: [], lights: [], glows: [], fields: [], wear: null, age: 0 };

        chunk.actors.push(this.floor(rect));
        const wear = paintWear(def);
        chunk.wear = wear;
        const wearActor = new Actor({ x: rect.x, y: rect.y, z: Z.floorDetail - 1, anchor: vec(0, 0) });
        wearActor.graphics.use(new CanvasGraphic(wear, rect.w, rect.h));
        wearActor.graphics.material = this.lit;
        chunk.actors.push(wearActor);

        for (const d of def.decals) this.placeProp(chunk, d, true);
        for (const p of def.props) this.placeProp(chunk, p, false);
        for (const l of def.lights) {
            const live = this.lights.add(l, (l.x * 0.013 + l.y * 0.007) % 100);
            live.fade = 0;
            chunk.lights.push(live);
        }
        def.emitters.forEach((e, i) => {
            const field = new ParticleField(e.kind, e.rate, e.kind === "embers" ? 300 : 120, chunkSeed(cx, cy, 50 + i));
            const actor = new Actor({ x: e.x, y: e.y, z: depthOf(e.y + 80) });
            actor.graphics.use(new ParticleGraphic(field, this.assets.props, PROP_FRAMES["glow-dot"], e.kind === "embers" ? 1.6 : 1.3));
            actor.graphics.anchor = vec(0.5, 0.8);
            chunk.actors.push(actor);
            chunk.fields.push(field);
        });

        for (const a of chunk.actors) this.scene.add(a);
        this.loaded.set(key, chunk);
        this.loads++;
        this.rebuildColliders();
        console.log(`🧱 Chunk ${key} streamed in (${def.dressed ? "dressed" : "plain"}, ${chunk.actors.length} actors)`);
    }

    private unload(key: string): void {
        const chunk = this.loaded.get(key);
        if (!chunk) return;
        for (const a of chunk.actors) a.kill();
        for (const l of chunk.lights) this.lights.remove(l);
        if (chunk.wear) {
            const ctx = this.engine.graphicsContext;
            if (ctx instanceof ExcaliburGraphicsContextWebGL) ctx.textureLoader.delete(chunk.wear);
            chunk.wear.width = 0;
            chunk.wear.height = 0;
        }
        chunk.actors.length = 0;
        chunk.lights.length = 0;
        chunk.glows.length = 0;
        chunk.fields.length = 0;
        chunk.wear = null;
        this.loaded.delete(key);
        this.unloads++;
        this.rebuildColliders();
        console.log(`🧱 Chunk ${key} streamed out`);
    }

    private floor(rect: Rect): Actor {
        const s = FLOOR_TILE.scale;
        const sprite = new Sprite({
            image: this.assets.floor,
            sourceView: { x: rect.x / s, y: rect.y / s, width: rect.w / s, height: rect.h / s },
            destSize: { width: rect.w, height: rect.h },
        });
        const actor = new Actor({ x: rect.x, y: rect.y, z: Z.floor, anchor: vec(0, 0) });
        actor.graphics.use(sprite);
        actor.graphics.material = this.lit;
        return actor;
    }

    private placeProp(chunk: LoadedChunk, p: Placement, decal: boolean): void {
        const f: AtlasFrame = PROP_FRAMES[p.kind];
        const s = f.scale;
        const flip = !!p.flip;
        const z = decal ? (DECAL_Z[p.kind] ?? Z.decal) : depthOf(p.y);
        const actor = new Actor({ x: p.x, y: p.y, z, anchor: vec(0, 0) });
        actor.graphics.use(frameSprite(this.assets.props, f, s, flip));
        actor.graphics.offset = vec(flip ? -(f.w - f.ax) * s : -f.ax * s, -f.ay * s);
        actor.graphics.material = this.lit;
        chunk.actors.push(actor);

        const glow = f.glow;
        const look = GLOW_GAIN[p.kind];
        if (glow && look) {
            const g = new Actor({ x: p.x, y: p.y, z: decal ? Z.decalGlow : z + 0.1, anchor: vec(0, 0) });
            const sprite = frameSprite(this.assets.props, glow, s, flip);
            sprite.tint = additive(look.color, look.gain);
            g.graphics.use(sprite);
            const left = flip ? -(glow.ox + glow.w - f.ax) * s : (glow.ox - f.ax) * s;
            g.graphics.offset = vec(left, (glow.oy - f.ay) * s);
            chunk.actors.push(g);
            chunk.glows.push({ actor: g, base: 1, flicker: look.flicker, phase: p.x * 0.01 + p.y * 0.02 });
        }
    }

    private animate(chunk: LoadedChunk, dt: number): void {
        chunk.age += dt;
        const fade = Math.min(1, chunk.age / LIGHT_FADE_IN);
        for (const l of chunk.lights) l.fade = fade;
        for (const g of chunk.glows) g.actor.graphics.opacity = g.base * fade * Math.min(1.15, flickerAt(this.time, g.phase, g.flicker));
        for (const f of chunk.fields) f.update(dt);
    }

    private rebuildColliders(): void {
        const all: Footprint[] = [];
        for (const c of this.loaded.values()) all.push(...c.def.colliders);
        this.colliders = all;
    }
}
