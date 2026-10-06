import { Actor, CollisionType, Side, vec } from "excalibur";
import { sfxBump, sfxStomp } from "./audio";
import type { WorldApi } from "./Actors";
import { Groups } from "./Actors";
import type Player from "./Player";
import { sprite } from "./sprites";

/**
 * Original World 1-1 critters. Pip does not physically resolve against them;
 * WorldOne.collectPickups decides stomps and side bumps.
 *
 * Each one has a different job so a small roster stays readable:
 * Birdie patrols the air, Bink hops, Rusk charges, Vesper drops from a ceiling,
 * Puff spits, Rollo rolls up armored, Sable dives, Mog burrows, Brunt guards
 * one side, Bram soaks a hit, Flick runs away.
 *
 * Defeat:
 * - Birdie, Bink, Rusk, Vesper, Puff, Sable: stomp, star, or a kicked shell.
 * - Rollo: stomp while walking, curling, or dizzy. A stomp on the roll only bounces.
 * - Mog: stomp while it is up. Buried and the emerge tell do not hurt.
 * - Brunt: land on the tail, or bump the tail. The claw bounces a stomp.
 * - Bram: two stomps. The first cracks the shell. Star and shells skip the crack.
 * - Flick: stomp anytime. Touch only hurts during the cornered nip.
 * - Puff's bubble: stomp or star pops it. Walking into it hurts, then it pops.
 */

export type CritterKind =
    | "birdie"
    | "bink"
    | "rusk"
    | "vesper"
    | "puff"
    | "rollo"
    | "sable"
    | "mog"
    | "brunt"
    | "bram"
    | "flick";

export interface CritterOptions {
    minX: number;
    maxX: number;
    dir?: -1 | 1;
}

const NAMES: Record<CritterKind, string> = {
    birdie: "Birdie",
    bink: "Bink",
    rusk: "Rusk",
    vesper: "Vesper",
    puff: "Puff",
    rollo: "Rollo",
    sable: "Sable",
    mog: "Mog",
    brunt: "Brunt",
    bram: "Bram",
    flick: "Flick",
};

const BOX: Record<CritterKind, { w: number; h: number }> = {
    birdie: { w: 14, h: 12 },
    bink: { w: 12, h: 12 },
    rusk: { w: 14, h: 12 },
    vesper: { w: 14, h: 10 },
    puff: { w: 12, h: 12 },
    rollo: { w: 12, h: 12 },
    sable: { w: 14, h: 10 },
    mog: { w: 12, h: 12 },
    brunt: { w: 14, h: 12 },
    bram: { w: 15, h: 13 },
    flick: { w: 10, h: 10 },
};

const FLAT: Partial<Record<CritterKind, string>> = {
    bink: "bink-flat",
    rusk: "rusk-flat",
    puff: "puff-flat",
    mog: "mog-flat",
    brunt: "brunt-flat",
    flick: "flick-flat",
};

const FIRST: Record<CritterKind, string> = {
    birdie: "birdie-0",
    bink: "bink-0",
    rusk: "rusk-0",
    vesper: "vesper-hang",
    puff: "puff-0",
    rollo: "rollo-0",
    sable: "sable-0",
    mog: "mog-dirt",
    brunt: "brunt-0",
    bram: "bram-0",
    flick: "flick-0",
};

export class Critter extends Actor {
    halfW: number;
    halfH: number;
    pose = "";
    state = "idle";
    private alive = true;
    private awake = false;
    private dir: -1 | 1;
    private anim = 0;
    private stateTime = 0;
    private grace = 0;
    private stompLock = 0;
    private squash = 0;
    private hp = 2;
    private homeX: number;
    private homeY: number;
    private aimX = 0;
    private diveVx = 0;
    private diveVy = 0;

    constructor(
        x: number,
        y: number,
        private kind: CritterKind,
        private world: WorldApi,
        private solidAt: (x: number, y: number) => boolean,
        options: CritterOptions
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
        this.dir = options.dir ?? -1;
        this.minX = options.minX;
        this.maxX = options.maxX;
        this.addTag("enemy");
        this.body.group = Groups.enemy;
        this.body.friction = 0;
        this.body.bounciness = 0;
        this.body.useGravity = false;
        this.state = this.openingState();
        this.show(FIRST[kind]);
    }

    private minX: number;
    private maxX: number;

    private openingState(): string {
        if (this.kind === "birdie") return "fly";
        if (this.kind === "bink") return "wait";
        if (this.kind === "vesper") return "hang";
        if (this.kind === "puff") return "idle";
        if (this.kind === "sable") return "hover";
        if (this.kind === "mog") return "buried";
        if (this.kind === "flick") return "run";
        return "walk";
    }

    receivePlayer(player: Player, stomp: boolean): void {
        if (!this.alive) return;
        if (player.star > 0) {
            this.defeat();
            return;
        }
        // Mog is safe underground. The rise pose is a tell, not a hitbox.
        if (this.kind === "mog" && this.state === "buried") return;
        if (this.kind === "mog" && this.state === "rise" && !stomp) return;
        if (stomp && this.stompLock > 0) {
            player.bounce();
            return;
        }
        if (!stomp && this.grace > 0) return;
        if (stomp) this.onStomp(player);
        else this.onSide(player);
    }

    /** Star power and kicked shells skip armor, shields, and burrow. */
    defeat(): void {
        if (!this.alive) return;
        this.alive = false;
        sfxStomp();
        this.pay();
        this.launch();
    }

    private onStomp(player: Player): void {
        if (this.kind === "rollo" && this.state === "roll") {
            player.bounce();
            sfxBump();
            this.grace = 0.16;
            this.stompLock = 0.16;
            return;
        }
        if (this.kind === "brunt" && !this.tailSide(player)) {
            player.bounce();
            sfxBump();
            this.grace = 0.16;
            this.stompLock = 0.16;
            return;
        }
        if (this.kind === "bram" && this.hp > 1) {
            this.hp = 1;
            this.stompLock = 0.3;
            this.grace = 0.3;
            player.bounce();
            sfxStomp();
            this.world.score(100, this.pos.x, this.pos.y - 16);
            this.goto("stun");
            this.show("bram-crack");
            return;
        }
        this.fell(player, FLAT[this.kind] ? "flat" : "launch");
    }

    private onSide(player: Player): void {
        if (this.kind === "flick" && this.state !== "nip") return;
        if (this.kind === "brunt" && this.tailSide(player)) {
            this.fell(player, "flat");
            return;
        }
        this.bite(player);
    }

    /** Claw faces dir. The tail is the opposite side. */
    private tailSide(player: Player): boolean {
        return this.dir === -1 ? player.pos.x > this.pos.x + 1 : player.pos.x < this.pos.x - 1;
    }

    private bite(player: Player): void {
        this.grace = 0.35;
        this.world.hurtPlayer();
    }

    private fell(player: Player, style: "flat" | "launch"): void {
        if (!this.alive) return;
        this.alive = false;
        player.bounce();
        sfxStomp();
        this.pay();
        if (style === "flat" && FLAT[this.kind]) {
            this.graphics.use(sprite(FLAT[this.kind] as string));
            this.pose = FLAT[this.kind] as string;
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
        const tucked =
            this.kind === "mog" ||
            (this.kind === "vesper" && (this.state === "hang" || this.state === "warn"));
        if (tucked) {
            this.body.useGravity = false;
            this.body.collisionType = CollisionType.PreventCollision;
            return;
        }
        this.body.group = Groups.enemy;
        this.body.collisionType = CollisionType.Active;
        this.body.useGravity = this.kind !== "birdie" && this.kind !== "sable";
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
        this.tick();
        if (this.vel.y > 420) this.vel.y = 420;
    }

    onPostUpdate(): void {
        if (!this.alive || !this.awake) return;
        if (this.kind === "birdie" || (this.kind === "sable" && (this.state === "hover" || this.state === "tuck"))) {
            const bob = this.kind === "birdie" ? Math.sin(this.anim / 180) * 4 : Math.sin(this.anim / 220) * 3;
            this.pos.y = this.homeY + bob;
            this.vel.y = 0;
        }
        if (this.kind === "vesper" && (this.state === "hang" || this.state === "warn")) {
            this.pos.x = this.homeX;
            this.pos.y = this.homeY;
            this.vel = vec(0, 0);
        }
    }

    private tick(): void {
        if (this.kind === "birdie") this.tickBirdie();
        else if (this.kind === "bink") this.tickBink();
        else if (this.kind === "rusk") this.tickRusk();
        else if (this.kind === "vesper") this.tickVesper();
        else if (this.kind === "puff") this.tickPuff();
        else if (this.kind === "rollo") this.tickRollo();
        else if (this.kind === "sable") this.tickSable();
        else if (this.kind === "mog") this.tickMog();
        else if (this.kind === "brunt") this.tickBrunt();
        else if (this.kind === "bram") this.tickBram();
        else this.tickFlick();
    }

    /** Horizontal patrol with a small bob. Wings swap every flap. */
    private tickBirdie(): void {
        if (this.pos.x <= this.minX) this.dir = 1;
        else if (this.pos.x >= this.maxX) this.dir = -1;
        else if (this.solidAt(this.pos.x + this.dir * (this.halfW + 2), this.homeY)) this.flip();
        this.vel.x = this.dir * 46;
        this.show(this.frame(["birdie-0", "birdie-1"], 140));
    }

    /** Crouch is the tell. Then a fixed hop. Stomp between hops or on the way down. */
    private tickBink(): void {
        if (this.state === "wait") {
            this.vel.x = 0;
            this.show("bink-0");
            if (this.grounded() && this.stateTime > 0.45) this.goto("crouch");
        } else if (this.state === "crouch") {
            this.vel.x = 0;
            this.show("bink-1");
            if (this.stateTime > 0.28) {
                if (this.shouldTurn()) this.flip();
                this.vel.y = -350;
                this.vel.x = this.dir * 58;
                this.goto("air");
            }
        } else {
            this.show("bink-2");
            if (this.grounded() && this.stateTime > 0.12) this.goto("wait");
        }
    }

    /** Slow walk, a still snort, then a straight charge that stops at walls and ledges. */
    private tickRusk(): void {
        if (this.state === "walk") {
            if (this.shouldTurn()) this.flip();
            this.vel.x = this.dir * 24;
            this.show(this.frame(["rusk-0", "rusk-1"], 160));
            const player = this.pilot();
            const ahead = !!player && (this.dir < 0 ? player.x < this.pos.x : player.x > this.pos.x);
            if (
                ahead &&
                player &&
                Math.abs(player.x - this.pos.x) < 104 &&
                Math.abs(player.y - this.pos.y) < 22 &&
                this.stateTime > 0.35
            ) {
                this.goto("windup");
            }
        } else if (this.state === "windup") {
            this.vel.x = 0;
            this.show("rusk-charge");
            if (this.stateTime > 0.4) this.goto("charge");
        } else if (this.state === "charge") {
            this.vel.x = this.dir * 124;
            this.show("rusk-charge");
            const blocked = this.aheadSolid() || this.outOfLeash() || (this.grounded() && this.ledge());
            if (this.stateTime > 0.62 || blocked) {
                this.flip();
                this.goto("recover");
            }
        } else {
            this.vel.x = 0;
            this.show("rusk-0");
            if (this.stateTime > 0.34) this.goto("walk");
        }
    }

    /** Hangs still, opens its wings, then drops. After landing it only flutters. */
    private tickVesper(): void {
        if (this.state === "hang" || this.state === "warn") {
            this.body.useGravity = false;
            this.vel = vec(0, 0);
            this.show(this.state === "hang" ? "vesper-hang" : "vesper-0");
            const player = this.pilot();
            if (
                this.state === "hang" &&
                player &&
                Math.abs(player.x - this.pos.x) < 24 &&
                player.y > this.pos.y + 10
            ) {
                this.goto("warn");
            }
            if (this.state === "warn" && this.stateTime > 0.32) {
                this.goto("drop");
                this.body.group = Groups.enemy;
                this.body.collisionType = CollisionType.Active;
                this.body.useGravity = true;
                this.vel.y = 30;
            }
            return;
        }
        if (this.state === "drop" && this.grounded()) this.goto("walk");
        if (this.state === "walk") {
            if (this.shouldTurn()) this.flip();
            this.vel.x = this.dir * 22;
        } else {
            this.vel.x = 0;
        }
        this.show(this.frame(["vesper-0", "vesper-1"], 120));
    }

    /** Stands and inflates, then lobs one slow bubble. The bubble itself is stompable. */
    private tickPuff(): void {
        this.vel.x = 0;
        const player = this.pilot();
        if (player && Math.abs(player.x - this.pos.x) > 8) {
            this.dir = player.x < this.pos.x ? -1 : 1;
        }
        if (this.state === "idle") {
            this.show("puff-0");
            if (this.stateTime > 1.45) this.goto("inflate");
            return;
        }
        this.show("puff-1");
        if (this.stateTime <= 0.38) return;
        const close = player && Math.abs(player.x - this.pos.x) < 16 && Math.abs(player.y - this.pos.y) < 14;
        if (!close) {
            this.world.adopt(new Bubble(this.pos.x + this.dir * 12, this.pos.y - 6, this.dir, this.world));
        }
        this.goto("idle");
    }

    /** Walks soft, curls, then rolls. The roll shrugs off stomps until a wall dizzies it. */
    private tickRollo(): void {
        if (this.state === "walk") {
            if (this.shouldTurn()) this.flip();
            this.vel.x = this.dir * 26;
            this.show(this.frame(["rollo-0", "rollo-1"], 160));
            const player = this.pilot();
            const ahead = !!player && (this.dir < 0 ? player.x < this.pos.x : player.x > this.pos.x);
            if ((ahead && player && Math.abs(player.x - this.pos.x) < 70) || this.stateTime > 2.2) {
                this.goto("curl");
            }
        } else if (this.state === "curl") {
            this.vel.x = 0;
            this.show("rollo-ball");
            if (this.stateTime > 0.28) this.goto("roll");
        } else if (this.state === "roll") {
            this.vel.x = this.dir * 116;
            this.show("rollo-ball");
            const stop = this.aheadSolid() || this.outOfLeash() || (this.grounded() && this.ledge()) || this.stateTime > 1.05;
            if (stop) this.goto("dizzy");
        } else {
            this.vel.x = 0;
            this.show("rollo-dizzy");
            if (this.stateTime > 0.85) {
                this.flip();
                this.goto("walk");
            }
        }
    }

    /** Hovers, tucks, then dives at the spot Pip occupied during the tuck. It does not home. */
    private tickSable(): void {
        const player = this.pilot();
        if (this.state === "hover") {
            if (this.pos.x <= this.minX) this.dir = 1;
            else if (this.pos.x >= this.maxX) this.dir = -1;
            this.vel.x = this.dir * 20;
            this.show(this.frame(["sable-0", "sable-1"], 150));
            if (
                player &&
                this.stateTime > 0.7 &&
                Math.abs(player.x - this.pos.x) < 40 &&
                player.y > this.pos.y + 24
            ) {
                this.aimX = player.x;
                this.goto("tuck");
            }
        } else if (this.state === "tuck") {
            this.vel.x = 0;
            this.show("sable-tuck");
            if (this.stateTime > 0.34) {
                const dx = this.aimX - this.pos.x;
                const dy = Math.max(36, this.homeY + 96 - this.pos.y);
                const len = Math.hypot(dx, dy) || 1;
                this.diveVx = (dx / len) * 145;
                this.diveVy = (dy / len) * 145;
                this.dir = this.diveVx < 0 ? -1 : 1;
                this.goto("dive");
            }
        } else if (this.state === "dive") {
            this.vel.x = this.diveVx;
            this.vel.y = this.diveVy;
            this.show("sable-dive");
            const ground = this.solidAt(this.pos.x, this.pos.y + this.halfH + 4);
            if (this.stateTime > 0.8 || ground || this.pos.y > this.homeY + 78) this.goto("climb");
        } else {
            this.vel.x = (this.homeX - this.pos.x) * 1.6;
            this.vel.y = -88;
            this.dir = this.vel.x < 0 ? -1 : 1;
            this.show(this.frame(["sable-0", "sable-1"], 110));
            if (this.pos.y <= this.homeY + 2) {
                this.pos.y = this.homeY;
                this.goto("hover");
            }
        }
    }

    /** A dirt mound is harmless. Eyes, then a short walk, then it sinks at home. */
    private tickMog(): void {
        if (this.state === "buried") {
            this.body.useGravity = false;
            this.body.collisionType = CollisionType.PreventCollision;
            this.vel = vec(0, 0);
            this.pos.x = this.homeX;
            this.show("mog-dirt");
            const player = this.pilot();
            const blocked = !!player && Math.abs(player.x - this.pos.x) < 12;
            if (this.stateTime > 1.1 && !blocked) this.goto("rise");
            return;
        }
        if (this.state === "rise") {
            this.vel = vec(0, 0);
            this.show("mog-rise");
            if (this.stateTime > 0.32) {
                this.goto("up");
                this.body.group = Groups.enemy;
                this.body.collisionType = CollisionType.Active;
                this.body.useGravity = true;
            }
            return;
        }
        if (this.state === "up") {
            if (this.shouldTurn()) this.flip();
            this.vel.x = this.dir * 26;
            this.show(this.frame(["mog-0", "mog-1"], 150));
            if (this.stateTime > 1.55) this.goto("sink");
            return;
        }
        this.vel.x = 0;
        this.show("mog-dirt");
        if (this.stateTime > 0.22) {
            this.homeX = this.pos.x;
            this.goto("buried");
        }
    }

    /** The big claw leads. Only the tail side accepts a stomp or a bump. */
    private tickBrunt(): void {
        if (this.shouldTurn()) this.flip();
        this.vel.x = this.dir * 22;
        this.show(this.frame(["brunt-0", "brunt-1"], 180));
    }

    /** Slow and wide. The cracked shell is the first-stomp tell. */
    private tickBram(): void {
        if (this.state === "stun") {
            this.vel.x = 0;
            this.show("bram-crack");
            if (this.stateTime > 0.28) this.goto("walk");
            return;
        }
        if (this.shouldTurn()) this.flip();
        this.vel.x = this.dir * (this.hp < 2 ? 14 : 18);
        const cycle = this.hp < 2 ? ["bram-crack", "bram-1"] : ["bram-0", "bram-1"];
        this.show(this.frame(cycle, 200));
    }

    /** Runs away. Cornered against a wall or a ledge, it telegraphs a short nip. */
    private tickFlick(): void {
        const player = this.pilot();
        const flee = !!player && Math.abs(player.x - this.pos.x) < 92 && Math.abs(player.y - this.pos.y) < 28;
        if (this.state === "nipwind") {
            this.vel.x = 0;
            this.show("flick-nip");
            if (this.stateTime > 0.2) this.goto("nip");
            return;
        }
        if (this.state === "nip") {
            this.vel.x = this.dir * 108;
            this.show("flick-nip");
            if (this.stateTime > 0.22 || this.aheadSolid()) this.goto("recover");
            return;
        }
        if (this.state === "recover") {
            this.vel.x = 0;
            this.show("flick-0");
            if (this.stateTime > 0.4) this.goto("run");
            return;
        }
        if (flee && player) this.dir = player.x < this.pos.x ? 1 : -1;
        if (this.shouldTurn()) {
            if (flee) {
                this.flip();
                this.goto("nipwind");
                this.vel.x = 0;
                return;
            }
            this.flip();
        }
        this.vel.x = this.dir * (flee ? 90 : 32);
        this.show(this.frame(["flick-0", "flick-1"], flee ? 90 : 150));
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
        this.pose = name;
        this.graphics.use(sprite(name));
        this.graphics.flipHorizontal = this.dir > 0;
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

/** Slow lob from Puff. Pops on a stomp, a star, a shell, or the ground. */
class Bubble extends Actor {
    halfW = 4;
    halfH = 4;
    pose = "bubble";
    private alive = true;
    private life = 1.7;

    constructor(
        x: number,
        y: number,
        dir: -1 | 1,
        private world: WorldApi
    ) {
        super({
            name: "Bubble",
            pos: vec(x, y),
            width: 8,
            height: 8,
            collisionType: CollisionType.Active,
            anchor: vec(0.5, 0.5),
            z: 8,
        });
        this.addTag("enemy");
        this.body.group = Groups.enemy;
        this.body.friction = 0;
        this.body.bounciness = 0;
        this.body.useGravity = true;
        this.vel = vec(dir * 76, -120);
        this.graphics.use(sprite("bubble"));
        this.on("postcollision", (evt) => {
            const other = evt.other;
            if (other.hasTag("player") || other.hasTag("enemy")) return;
            if (evt.side === Side.Bottom || evt.side === Side.Left || evt.side === Side.Right) this.pop(false);
        });
    }

    receivePlayer(player: Player, stomp: boolean): void {
        if (!this.alive) return;
        if (player.star > 0 || stomp) {
            if (stomp) player.bounce();
            this.pop(true);
            return;
        }
        this.world.hurtPlayer();
        this.pop(false);
    }

    defeat(): void {
        this.pop(true);
    }

    private pop(scored: boolean): void {
        if (!this.alive) return;
        this.alive = false;
        if (scored) {
            sfxStomp();
            this.world.score(100, this.pos.x, this.pos.y - 10);
        }
        this.kill();
    }

    onPreUpdate(_engine: unknown, delta: number): void {
        this.life -= delta / 1000;
        if (this.vel.y > 300) this.vel.y = 300;
        if (this.life <= 0) this.pop(false);
    }
}
