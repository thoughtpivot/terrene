import { Actor, CollisionType, vec } from "excalibur";
import { sfxBump, sfxStomp } from "../WorldOne/audio";
import type { WorldApi } from "../WorldOne/Actors";
import { Groups } from "../WorldOne/Actors";
import type Player from "../WorldOne/Player";
import { sprite } from "../WorldOne/sprites";

/**
 * Crypt creatures for World 1-2. Pip does not physically resolve against them.
 * WorldOneTwo decides stomps and side bumps, same as World 1-1.
 *
 * Gloam drifts, flares, then glides in a straight line. It does not home.
 * Marrow is a bone pile. The pile and the rattle are harmless. The crawl is not.
 * Wick clings to the ceiling, swells, then drops a bright column. Stomp the body.
 * The column hurts from the side and bounces a landing.
 */

export type DungeonKind = "gloam" | "marrow" | "wick";

export interface DungeonOptions {
    minX?: number;
    maxX?: number;
}

const NAMES: Record<DungeonKind, string> = {
    gloam: "Gloam",
    marrow: "Marrow",
    wick: "Wick",
};

const BOX: Record<DungeonKind, { w: number; h: number }> = {
    gloam: { w: 14, h: 12 },
    marrow: { w: 14, h: 12 },
    wick: { w: 12, h: 12 },
};

export class DungeonCritter extends Actor {
    halfW: number;
    halfH: number;
    state = "idle";
    private alive = true;
    private awake = false;
    private dir: -1 | 1 = -1;
    private anim = 0;
    private stateTime = 0;
    private grace = 0;
    private stompLock = 0;
    private squash = 0;
    private homeX: number;
    private homeY: number;
    private glideDir: -1 | 1 = -1;
    private drip: EmberColumn | null = null;
    private readonly minX: number;
    private readonly maxX: number;

    constructor(
        x: number,
        y: number,
        private kind: DungeonKind,
        private world: WorldApi,
        private solidAt: (x: number, y: number) => boolean,
        options: DungeonOptions = {}
    ) {
        const box = BOX[kind];
        super({
            name: NAMES[kind],
            pos: vec(x, y),
            width: box.w,
            height: box.h,
            collisionType: CollisionType.PreventCollision,
            anchor: vec(0.5, 0.5),
            z: 8,
        });
        this.halfW = box.w / 2;
        this.halfH = box.h / 2;
        this.homeX = x;
        this.homeY = y;
        this.minX = options.minX ?? x - 32;
        this.maxX = options.maxX ?? x + 32;
        this.addTag("enemy");
        this.body.group = Groups.enemy;
        this.body.friction = 0;
        this.body.bounciness = 0;
        this.body.useGravity = false;
        this.state = kind === "marrow" ? "pile" : kind === "wick" ? "cling" : "drift";
        this.show(kind === "marrow" ? "marrow-pile" : kind === "wick" ? "wick-0" : "gloam-0");
    }

    receivePlayer(player: Player, stomp: boolean): void {
        if (!this.alive) return;
        if (player.star > 0) {
            this.defeat();
            return;
        }
        if (this.kind === "marrow" && (this.state === "pile" || this.state === "shake" || this.state === "collapse")) {
            return;
        }
        if (stomp && this.stompLock > 0) {
            player.bounce();
            return;
        }
        if (!stomp && this.grace > 0) return;
        if (stomp) this.onStomp(player);
        else this.onSide(player);
    }

    defeat(): void {
        if (!this.alive) return;
        this.alive = false;
        this.dropColumn();
        sfxStomp();
        this.pay();
        this.launch();
    }

    private onStomp(player: Player): void {
        const flat = this.kind === "marrow" ? "marrow-flat" : this.kind === "wick" ? "wick-flat" : "";
        this.fell(player, flat ? "flat" : "launch", flat);
    }

    private onSide(player: Player): void {
        this.grace = 0.35;
        this.world.hurtPlayer();
    }

    private fell(player: Player, style: "flat" | "launch", flat: string): void {
        if (!this.alive) return;
        this.alive = false;
        this.dropColumn();
        player.bounce();
        sfxStomp();
        this.pay();
        if (style === "flat" && flat) {
            this.graphics.use(sprite(flat));
            this.body.collisionType = CollisionType.PreventCollision;
            this.body.useGravity = false;
            this.vel = vec(0, 0);
            this.squash = 0.4;
            return;
        }
        this.launch();
    }

    private launch(): void {
        this.body.collisionType = CollisionType.PreventCollision;
        this.body.useGravity = true;
        this.vel = vec(this.dir * -40, -180);
        this.squash = 0.75;
    }

    private pay(): void {
        const chain = this.world.combo();
        const points = Math.min(800, 100 * Math.pow(2, chain));
        this.world.score(points, this.pos.x, this.pos.y - 16);
    }

    private wake(cameraX: number): void {
        if (this.awake) return;
        if (cameraX + 140 <= this.pos.x - 8) return;
        this.awake = true;
    }

    onPreUpdate(engine: { currentScene: { camera: { pos: { x: number } } } }, delta: number): void {
        const sec = delta / 1000;
        this.anim += delta;
        if (this.grace > 0) this.grace -= sec;
        if (this.stompLock > 0) this.stompLock -= sec;
        if (!this.awake) {
            this.wake(engine.currentScene.camera.pos.x);
            return;
        }
        if (!this.alive) {
            this.squash -= sec;
            if (this.squash <= 0) this.kill();
            return;
        }
        this.stateTime += sec;
        if (this.kind === "gloam") this.tickGloam();
        else if (this.kind === "marrow") this.tickMarrow();
        else this.tickWick();
        if (this.vel.y > 420) this.vel.y = 420;
    }

    onPostUpdate(): void {
        if (!this.alive || !this.awake) return;
        if (this.kind === "gloam") {
            const bob = Math.sin(this.anim / 200) * 3;
            this.pos.y = this.homeY + bob;
            this.vel.y = 0;
        }
        if (this.kind === "wick") {
            this.pos.x = this.homeX;
            this.pos.y = this.homeY;
            this.vel = vec(0, 0);
        }
        if (this.kind === "marrow" && (this.state === "pile" || this.state === "shake" || this.state === "collapse")) {
            this.pos.x = this.homeX;
            this.pos.y = this.homeY;
            this.vel = vec(0, 0);
        }
    }

    /** Slow air patrol. The flare is the tell, then one straight glide. */
    private tickGloam(): void {
        if (this.state === "drift") {
            if (this.pos.x <= this.minX) this.dir = 1;
            else if (this.pos.x >= this.maxX) this.dir = -1;
            this.vel.x = this.dir * 28;
            this.show(this.frame(["gloam-0", "gloam-1"], 160));
            const player = this.pilot();
            const under =
                !!player &&
                Math.abs(player.x - this.pos.x) < 78 &&
                player.y > this.pos.y + 12 &&
                Math.abs(player.y - this.pos.y) < 150;
            if (under && player && this.stateTime > 0.8) {
                this.glideDir = player.x < this.pos.x ? -1 : 1;
                this.dir = this.glideDir;
                this.goto("gutter");
            }
            return;
        }
        if (this.state === "gutter") {
            this.vel.x = 0;
            this.show("gloam-flare");
            if (this.stateTime > 0.42) this.goto("glide");
            return;
        }
        if (this.state === "glide") {
            this.vel.x = this.glideDir * 92;
            this.dir = this.glideDir;
            this.show("gloam-glide");
            const blocked = this.aheadSolid() || this.outOfLeash() || this.stateTime > 0.55;
            if (blocked) this.goto("recover");
            return;
        }
        this.vel.x = 0;
        this.show("gloam-0");
        if (this.stateTime > 0.36) this.goto("drift");
    }

    /** Eyes in the pile, then a rattle, then a short crawl, then it collapses. */
    private tickMarrow(): void {
        if (this.state === "pile") {
            this.pin();
            this.show("marrow-pile");
            if (this.stateTime > 1.25) this.goto("shake");
            return;
        }
        if (this.state === "shake") {
            this.pin();
            this.show("marrow-shake");
            if (this.stateTime > 0.42) {
                this.goto("crawl");
                this.body.collisionType = CollisionType.Active;
                this.body.useGravity = true;
                const player = this.pilot();
                if (player) this.dir = player.x < this.pos.x ? -1 : 1;
            }
            return;
        }
        if (this.state === "crawl") {
            if (this.shouldTurn()) this.flip();
            this.vel.x = this.dir * 36;
            this.show(this.frame(["marrow-0", "marrow-1"], 140));
            if (this.stateTime > 1.7) this.goto("collapse");
            return;
        }
        this.vel.x = 0;
        this.show("marrow-pile");
        this.body.collisionType = CollisionType.PreventCollision;
        this.body.useGravity = false;
        if (this.stateTime > 0.28) {
            this.homeX = this.pos.x;
            this.homeY = this.pos.y;
            this.goto("pile");
        }
    }

    /** The swell is the tell. The column is the hazard. The body is the stomp. */
    private tickWick(): void {
        this.vel = vec(0, 0);
        if (this.state === "cling") {
            this.show("wick-0");
            if (this.stateTime > 1.15) this.goto("swell");
            return;
        }
        if (this.state === "swell") {
            this.show("wick-swell");
            if (this.stateTime > 0.48) {
                this.goto("drip");
                this.raiseColumn();
                sfxBump();
            }
            return;
        }
        if (this.state === "drip") {
            this.show("wick-swell");
            if (this.stateTime > 0.72) {
                this.dropColumn();
                this.goto("retract");
            }
            return;
        }
        this.show("wick-0");
        if (this.stateTime > 0.28) this.goto("cling");
    }

    private raiseColumn(): void {
        this.dropColumn();
        const column = new EmberColumn(this.pos.x, this.pos.y + this.halfH + 48, this.world);
        this.drip = column;
        this.world.adopt(column);
    }

    private dropColumn(): void {
        if (!this.drip) return;
        this.drip.kill();
        this.drip = null;
    }

    private pin(): void {
        this.body.collisionType = CollisionType.PreventCollision;
        this.body.useGravity = false;
        this.vel = vec(0, 0);
        this.pos.x = this.homeX;
        this.pos.y = this.homeY;
    }

    private pilot(): { x: number; y: number } | null {
        const player = this.scene?.actors.find((actor) => actor.hasTag("player"));
        if (!player) return null;
        return { x: player.pos.x, y: player.pos.y };
    }

    private goto(state: string): void {
        this.state = state;
        this.stateTime = 0;
    }

    private flip(): void {
        this.dir = this.dir === 1 ? -1 : 1;
    }

    private show(name: string): void {
        this.graphics.use(sprite(name));
        this.graphics.flipHorizontal = this.kind !== "wick" && this.dir > 0;
    }

    private frame(names: string[], ms: number): string {
        return names[Math.floor(this.anim / ms) % names.length];
    }

    private grounded(): boolean {
        return this.solidAt(this.pos.x, this.pos.y + this.halfH + 4) && Math.abs(this.vel.y) < 50;
    }

    private aheadSolid(): boolean {
        return this.solidAt(this.pos.x + this.dir * (this.halfW + 3), this.pos.y);
    }

    private ledge(): boolean {
        return !this.solidAt(this.pos.x + this.dir * (this.halfW + 1), this.pos.y + this.halfH + 6);
    }

    private outOfLeash(): boolean {
        return (this.dir < 0 && this.pos.x <= this.minX) || (this.dir > 0 && this.pos.x >= this.maxX);
    }

    private shouldTurn(): boolean {
        return this.outOfLeash() || this.aheadSolid() || (this.grounded() && this.ledge());
    }
}

/** Bright ember column under Wick. A landing bounces. A side touch hurts. */
class EmberColumn extends Actor {
    halfW = 3;
    halfH = 48;

    constructor(
        x: number,
        y: number,
        private world: WorldApi
    ) {
        super({
            name: "WickDrip",
            pos: vec(x, y),
            width: 6,
            height: 96,
            collisionType: CollisionType.PreventCollision,
            anchor: vec(0.5, 0.5),
            z: 7,
        });
        this.addTag("enemy");
        this.body.group = Groups.enemy;
        this.body.useGravity = false;
        this.graphics.use(sprite("wick-drip"));
    }

    receivePlayer(player: Player, stomp: boolean): void {
        if (player.star > 0) {
            this.kill();
            return;
        }
        if (stomp) {
            player.bounce();
            return;
        }
        this.world.hurtPlayer();
    }
}
