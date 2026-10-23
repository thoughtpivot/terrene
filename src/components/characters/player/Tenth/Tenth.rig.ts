/**
 * The Tenth's puppet: painted parts (hood, torso, hem, two wings, the sword arm,
 * halo and shadow), the clips that move them, and the springs that make the
 * robe, wings, head and halo lag behind the body. `TenthRig.update` returns
 * every part's transform for the frame in draw order; the actor draws them.
 * Pure, so the motion can be tested without a browser.
 */
import {
    ClipPlayer, spring, squashScale, stepSpring,
    type Clip, type Pose, type Spring,
} from "../../../scenes/HeavenOrHell/anim/puppet.ts";
import { viewFor, type View } from "../../../scenes/HeavenOrHell/input.ts";
import { HERO_CUTS, HERO_EXTRAS, HERO_HEIGHT, HERO_PARTS, HERO_SCALE } from "./Tenth.atlas.ts";
import { WALK_SPEED } from "./Tenth.motion.ts";

export type PartName = "shadow" | "wingL" | "wingR" | "hem" | "torso" | "head" | "arm" | "halo";

export interface Xform {
    x: number;
    y: number;
    rot: number;
    sx: number;
    sy: number;
}

/** One part to draw: a frame from the atlas under two transforms, root then local. */
export interface PartDraw {
    part: PartName;
    /** key into HERO_PARTS or HERO_EXTRAS */
    frame: string;
    root: Xform;
    local: Xform;
    /** the frame's top-left relative to the local origin, and its size, in screen pixels */
    dx: number;
    dy: number;
    w: number;
    h: number;
    alpha: number;
}

/** How high the hero hovers above its shadow. */
export const HOVER = 12;
const H = HERO_HEIGHT;
/** From the hem's bottom up to the waist and the neck, on screen. */
const WAIST_UP = (1 - HERO_CUTS.waist) * H;
const NECK_UP = (1 - HERO_CUTS.neck) * H;

const k = (t: number, v: number, ease?: Clip["channels"][string][number]["ease"]) => ({ t, v, ease });

export const CLIPS: Record<"idle" | "walk" | "dash", Clip> = {
    idle: {
        name: "idle",
        duration: 2.4,
        loop: true,
        channels: {
            "body.y": [k(0, 0), k(1.2, -3.5), k(2.4, 0)],
            "head.rot": [k(0, 0), k(1.3, 0.025), k(2.4, 0)],
            "wing.rot": [k(0, 0.04), k(1.2, -0.06), k(2.4, 0.04)],
            "wing.sx": [k(0, 1), k(1.2, 1.05), k(2.4, 1)],
            "hem.rot": [k(0, -0.015), k(1.2, 0.015), k(2.4, -0.015)],
            "arm.rot": [k(0, 0.03), k(1.2, -0.03), k(2.4, 0.03)],
        },
    },
    walk: {
        name: "walk",
        duration: 0.56,
        loop: true,
        channels: {
            "body.y": [k(0, 0), k(0.14, -4.5, "outSine"), k(0.28, 0, "inSine"), k(0.42, -4.5, "outSine"), k(0.56, 0, "inSine")],
            "head.y": [k(0, -1), k(0.18, 0.8), k(0.32, -1), k(0.46, 0.8), k(0.56, -1)],
            "wing.rot": [k(0, -0.14), k(0.2, 0.1, "outCubic"), k(0.56, -0.14, "inOutSine")],
            "wing.sx": [k(0, 0.96), k(0.2, 1.08), k(0.56, 0.96)],
            "hem.rot": [k(0, -0.05), k(0.28, 0.05), k(0.56, -0.05)],
            "arm.rot": [k(0, -0.05), k(0.28, 0.05), k(0.56, -0.05)],
        },
    },
    dash: {
        name: "dash",
        duration: 0.22,
        loop: false,
        channels: {
            "body.y": [k(0, -2), k(0.08, -7, "outCubic"), k(0.22, -2, "inOutSine")],
            "wing.rot": [k(0, -0.1), k(0.06, -0.55, "outBack"), k(0.22, -0.3)],
            "wing.sx": [k(0, 1.1), k(0.06, 1.22, "outBack"), k(0.22, 1.05)],
            "hem.rot": [k(0, 0), k(0.22, 0)],
        },
    },
};

export interface RigInput {
    vx: number;
    vy: number;
    dashing: boolean;
    /** aim angle in radians on screen (0 east, y down), or null */
    aim: number | null;
    facing: number;
}

function pick(pose: Pose, channel: string, rest = 0): number {
    return pose[channel] ?? rest;
}

/** The nearest equivalent of angle `a` to `ref`, so a spring never spins the long way round. */
function unwrapNear(a: number, ref: number): number {
    let d = a - ref;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return ref + d;
}

export class TenthRig {
    readonly player = new ClipPlayer(CLIPS.idle);
    private lean: Spring = spring();
    private hemLag: Spring = spring();
    private wingLag: Spring = spring();
    private headX: Spring = spring();
    private haloX: Spring = spring();
    private haloY: Spring = spring();
    private squash: Spring = spring();
    private arm: Spring = spring(0);
    private time = 0;
    private lastFacing = -1;
    view: View = "s";
    flip = false;

    /** Kick the squash spring: positive stretches tall, negative squashes wide. */
    kick(amount: number): void {
        this.squash = { x: this.squash.x, v: this.squash.v + amount };
    }

    update(dt: number, input: RigInput): PartDraw[] {
        this.time += dt;
        const speed = Math.hypot(input.vx, input.vy);
        const moving = speed > 8;
        const target = input.dashing ? CLIPS.dash : moving ? CLIPS.walk : CLIPS.idle;
        this.player.play(target, input.dashing ? 0.04 : 0.14);
        const pose = this.player.update(dt, moving && !input.dashing ? Math.max(0.6, Math.min(1.4, speed / WALK_SPEED)) : 1);

        if (input.facing !== this.lastFacing) {
            // a small pop sells the snap between painted views
            if (this.lastFacing >= 0) this.kick(1.6);
            this.lastFacing = input.facing;
            const v = viewFor(input.facing);
            this.view = v.view;
            this.flip = v.flip;
        }

        const flipSign = this.flip ? -1 : 1;
        // in canonical (unmirrored) space, so leaning follows the mirror
        const cvx = (input.vx / WALK_SPEED) * flipSign;
        const along = Math.min(1.6, speed / WALK_SPEED);
        this.lean = stepSpring(this.lean, cvx * 0.13, 3.2, 0.55, dt);
        this.hemLag = stepSpring(this.hemLag, -cvx * 0.2 - (input.vy / WALK_SPEED) * 0.03, 2.3, 0.42, dt);
        this.wingLag = stepSpring(this.wingLag, -along * 0.22, 2.6, 0.5, dt);
        this.headX = stepSpring(this.headX, -cvx * 2.2, 4.2, 0.5, dt);
        this.squash = stepSpring(this.squash, 0, 4.5, 0.32, dt);

        const bodyY = pick(pose, "body.y");
        const neckY = -(NECK_UP - WAIST_UP);
        const headOffX = this.headX.x;
        const headOffY = pick(pose, "head.y");
        // the halo trails the head through its own springs, and bobs on its own clock
        this.haloX = stepSpring(this.haloX, headOffX, 2.8, 0.38, dt);
        this.haloY = stepSpring(this.haloY, bodyY + headOffY, 3.2, 0.36, dt);
        const haloBob = Math.sin(this.time * 2.3) * 1.6;

        const sq = squashScale(this.squash);
        const root: Xform = { x: 0, y: -HOVER - WAIST_UP + bodyY, rot: this.lean.x, sx: sq.sx * flipSign, sy: sq.sy };
        const flat: Xform = { x: 0, y: 0, rot: 0, sx: 1, sy: 1 };
        const out: PartDraw[] = [];

        const hover = HOVER - bodyY;
        const shadow = HERO_EXTRAS.shadow;
        const shrink = 1 - Math.min(0.35, (hover - HOVER) / 40);
        out.push(this.extra("shadow", "shadow", flat, { x: 0, y: 0, rot: 0, sx: shrink, sy: shrink }, shadow, 0.9));

        const front = this.view === "n" || this.view === "ne";
        const wingRot = -0.12 + pick(pose, "wing.rot") + this.wingLag.x;
        const wingSx = pick(pose, "wing.sx", 1);
        const shift = this.view === "s" ? 0 : this.view === "n" ? 0 : -6;
        const wingY = -WAIST_UP * 0.15 - 14;
        const wings = [
            this.extra("wingR", "wing", root, { x: 7 + shift, y: wingY, rot: wingRot, sx: wingSx, sy: 1 }, HERO_EXTRAS.wing, 1),
            this.extra("wingL", "wing", root, { x: -7 + shift, y: wingY, rot: -wingRot, sx: -wingSx, sy: 1 }, HERO_EXTRAS.wing, 1),
        ];

        // the sword arm points at the mouse; in canonical space, mirrored with the body
        let aimCanon = input.aim === null ? (this.view === "n" || this.view === "ne" ? -0.6 : 0.5) : input.aim;
        if (this.flip) aimCanon = Math.PI - aimCanon;
        this.arm = stepSpring({ x: this.arm.x, v: this.arm.v }, unwrapNear(aimCanon, this.arm.x), 7.5, 0.72, dt);
        const armAngle = this.arm.x + pick(pose, "arm.rot");
        const pointsLeft = Math.cos(armAngle) < 0;
        const armRoot: Xform = { ...root, rot: 0 };
        const arm = this.extra("arm", "arm", armRoot, { x: pointsLeft ? -11 : 11, y: -14 + this.lean.x * 10, rot: armAngle, sx: 1, sy: pointsLeft ? -1 : 1 }, HERO_EXTRAS.arm, 1);
        const armInFront = Math.sin(armAngle) > -0.15 && !(front && Math.sin(armAngle) < 0.6);

        if (!front) out.push(...wings);
        if (!armInFront) out.push(arm);
        const v = this.view;
        out.push(this.part("hem", `${v}-hem`, root, { x: 0, y: 0, rot: pick(pose, "hem.rot") + this.hemLag.x, sx: 1, sy: 1 }, WAIST_UP));
        out.push(this.part("torso", `${v}-torso`, root, flat, WAIST_UP));
        out.push(this.part("head", `${v}-head`, root, { x: headOffX, y: neckY + headOffY, rot: pick(pose, "head.rot") + this.lean.x * 0.4, sx: 1, sy: 1 }, NECK_UP));
        if (front) out.push(...wings);
        if (armInFront) out.push(arm);

        const haloRoot: Xform = { x: 0, y: -HOVER - WAIST_UP, rot: 0, sx: flipSign, sy: 1 };
        out.push(this.extra("halo", "halo", haloRoot, { x: this.haloX.x, y: -(H - WAIST_UP) - 9 + this.haloY.x + haloBob, rot: this.lean.x * 0.5, sx: 1, sy: 1 }, HERO_EXTRAS.halo, 1));
        return out;
    }

    /** A body part, positioned so its local origin is `up` pixels above the hem's bottom. */
    private part(part: PartName, frame: string, root: Xform, local: Xform, up: number): PartDraw {
        const f = HERO_PARTS[frame as keyof typeof HERO_PARTS];
        return {
            part,
            frame,
            root,
            local,
            dx: f.ox * HERO_SCALE,
            dy: f.oy * HERO_SCALE + up,
            w: f.w * HERO_SCALE,
            h: f.h * HERO_SCALE,
            alpha: 1,
        };
    }

    private extra(part: PartName, frame: keyof typeof HERO_EXTRAS, root: Xform, local: Xform, f: { ax: number; ay: number; w: number; h: number }, alpha: number): PartDraw {
        return { part, frame, root, local, dx: -f.ax * HERO_SCALE, dy: -f.ay * HERO_SCALE, w: f.w * HERO_SCALE, h: f.h * HERO_SCALE, alpha };
    }
}
