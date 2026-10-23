import { Actor, Color, Graphic, ImageFiltering, ImageSource, vec, type ExcaliburGraphicsContext } from "excalibur";
import { FOOTPRINT_RATIO } from "../../../scenes/HeavenOrHell/art/atlas.ts";
import type { AtlasRect, GlowRect } from "../../../scenes/HeavenOrHell/art/types.ts";
import { facing8, InputBuffer, type Intent, type Vec2 } from "../../../scenes/HeavenOrHell/input.ts";
import { LIGHT } from "../../../scenes/HeavenOrHell/palette.ts";
import { additive, type LiveLight } from "../../../scenes/HeavenOrHell/render/lighting.ts";
import type { Rect } from "../../../scenes/HeavenOrHell/world/chunks.ts";
import { depthOf, resolve } from "../../../scenes/HeavenOrHell/world/collide.ts";
import type { Footprint } from "../../../scenes/HeavenOrHell/world/map.ts";
import { HERO_EXTRAS, HERO_PARTS, HERO_SCALE } from "./Auriel.atlas.ts";
import { canDash, freshMotion, RADIUS, startDash, stepMotion, type Motion } from "./Auriel.motion.ts";
import AurielImage from "./Auriel.png";
import { AurielRig, type PartDraw } from "./Auriel.rig.ts";

const Resources = {
    Image: new ImageSource(AurielImage, { filtering: ImageFiltering.Blended }),
};

export { Resources };

const BOX_W = 260;
const BOX_H = 280;
/** where the hero's feet sit in the drawing box */
const FEET_Y = 230;

const GLOW_TINT = additive(LIGHT.halo, 1.15);
const HALO_TINT = additive(LIGHT.halo, 1.6);
const AURA_TINT = additive(LIGHT.holy, 0.8);
const GHOST_TINT = additive(LIGHT.halo, 0.8);

interface Ghost {
    x: number;
    y: number;
    parts: PartDraw[];
    age: number;
}

const GHOST_LIFE = 0.2;
const GHOST_EVERY = 0.028;

function frameOf(d: PartDraw): (AtlasRect & { glow?: GlowRect }) | undefined {
    return (HERO_PARTS as Record<string, AtlasRect & { glow?: GlowRect }>)[d.frame] ?? (HERO_EXTRAS as Record<string, AtlasRect & { glow?: GlowRect }>)[d.frame];
}

/** Draws the rig's parts: each under its root then local transform, with its glow pass added on top. */
class PuppetGraphic extends Graphic {
    constructor(private readonly hero: Auriel) {
        super({ width: BOX_W, height: BOX_H });
    }

    protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
        const img = Resources.Image.image;
        const ox = x + BOX_W / 2;
        const oy = y + FEET_Y;
        const base = ex.opacity;
        const hero = this.hero;

        for (const g of hero.ghosts) {
            const a = 1 - g.age / GHOST_LIFE;
            if (a <= 0) continue;
            for (const d of g.parts) {
                if (d.part === "shadow" || d.part === "halo") continue;
                this.drawPart(ex, img, d, ox + g.x - hero.pos.x, oy + g.y - hero.pos.y, GHOST_TINT, base * a * 0.55, false);
            }
        }

        const aura = HERO_EXTRAS.glow;
        for (const d of hero.parts) {
            if (d.part === "halo") {
                // a soft bloom seed behind the ring, then the ring, then the ring again as pure light
                this.drawPart(ex, img, { ...d, frame: "glow", dx: -aura.ax * HERO_SCALE, dy: -aura.ay * HERO_SCALE, w: aura.w * HERO_SCALE * 1.4, h: aura.h * HERO_SCALE * 0.9 }, ox, oy, AURA_TINT, base * 0.55, false);
                this.drawPart(ex, img, d, ox, oy, Color.White, base, false);
                this.drawPart(ex, img, d, ox, oy, HALO_TINT, base, false);
                continue;
            }
            this.drawPart(ex, img, d, ox, oy, Color.White, base * d.alpha, true);
        }
        ex.opacity = base;
        ex.tint = Color.White;
    }

    private drawPart(ex: ExcaliburGraphicsContext, img: HTMLImageElement, d: PartDraw, ox: number, oy: number, tint: Color, opacity: number, withGlow: boolean): void {
        const f = frameOf(d);
        if (!f) return;
        const r = d.root;
        const l = d.local;
        ex.save();
        ex.translate(ox + r.x, oy + r.y);
        if (r.rot) ex.rotate(r.rot);
        ex.scale(r.sx, r.sy);
        ex.translate(l.x, l.y);
        if (l.rot) ex.rotate(l.rot);
        if (l.sx !== 1 || l.sy !== 1) ex.scale(l.sx, l.sy);
        ex.tint = tint;
        ex.opacity = opacity;
        ex.drawImage(img, f.x, f.y, f.w, f.h, d.dx, d.dy, d.w, d.h);
        const g = f.glow;
        if (withGlow && g) {
            ex.tint = GLOW_TINT;
            ex.drawImage(img, g.x, g.y, g.w, g.h, d.dx + g.ox * HERO_SCALE, d.dy + g.oy * HERO_SCALE, g.w * HERO_SCALE, g.h * HERO_SCALE);
        }
        ex.restore();
    }

    clone(): PuppetGraphic {
        return new PuppetGraphic(this.hero);
    }
}

export interface StepResult {
    dashed: boolean;
}

/**
 * Auriel, a fallen angel: dark robes, gold halo and wing edges. The scene
 * feeds an Intent each frame; Auriel owns movement, facing, the puppet and
 * the buffered actions. Moves and aims in ground space, so walking up the
 * screen is foreshortened like everything else under this camera.
 */
export default class Auriel extends Actor {
    mover: Motion;
    readonly rig = new AurielRig();
    readonly buffer = new InputBuffer();
    facing = 1;
    parts: PartDraw[] = [];
    ghosts: Ghost[] = [];
    light: LiveLight | null = null;
    private ghostClock = 0;

    constructor(x: number, y: number) {
        super({ x, y, anchor: vec(0, 0), z: depthOf(y) });
        this.mover = freshMotion(x, y);
        this.graphics.use(new PuppetGraphic(this));
        this.graphics.offset = vec(-BOX_W / 2, -FEET_Y);
        this.parts = this.rig.update(0, { vx: 0, vy: 0, dashing: false, aim: null, facing: this.facing });
    }

    /** Advance one frame. `now` is game time in milliseconds, the clock the input buffer runs on. */
    step(intent: Intent, now: number, dt: number, colliders: readonly Footprint[], bounds: Rect): StepResult {
        const move: Vec2 = { x: intent.move.x, y: intent.move.y * FOOTPRINT_RATIO };
        const aimGround = intent.aim ? { x: intent.aim.x, y: intent.aim.y * FOOTPRINT_RATIO } : null;
        let dashed = false;
        if (this.buffer.peek("dash", now) && canDash(this.mover)) {
            this.buffer.consume("dash", now);
            this.mover = startDash(this.mover, move, aimGround);
            this.rig.kick(2.6);
            dashed = true;
        }
        const { motion, events } = stepMotion(this.mover, move, dt);
        if (events.dashEnded) this.rig.kick(-1.8);
        const fixed = resolve({ x: motion.x, y: motion.y }, RADIUS, colliders, bounds);
        this.mover = { ...motion, x: fixed.x, y: fixed.y };
        this.buffer.prune(now);

        if (intent.aim) this.facing = facing8(intent.aim.x, intent.aim.y / FOOTPRINT_RATIO);
        else if (Math.hypot(motion.vx, motion.vy) > 20) this.facing = facing8(motion.vx, motion.vy / FOOTPRINT_RATIO);

        this.pos.x = this.mover.x;
        this.pos.y = this.mover.y;
        this.z = depthOf(this.mover.y);
        const aimAngle = intent.aim ? Math.atan2(intent.aim.y, intent.aim.x) : null;
        this.parts = this.rig.update(dt, { vx: motion.vx, vy: motion.vy, dashing: motion.dash > 0, aim: aimAngle, facing: this.facing });

        for (const g of this.ghosts) g.age += dt;
        this.ghosts = this.ghosts.filter((g) => g.age < GHOST_LIFE);
        if (motion.dash > 0) {
            this.ghostClock -= dt;
            if (this.ghostClock <= 0) {
                this.ghostClock = GHOST_EVERY;
                this.ghosts.push({ x: this.pos.x, y: this.pos.y, parts: this.parts, age: 0 });
            }
        } else {
            this.ghostClock = 0;
        }

        if (this.light) {
            this.light.x = this.pos.x;
            this.light.y = this.pos.y - 60;
        }
        return { dashed };
    }
}
