import {
    Actor,
    CollisionGroup,
    CollisionType,
    Side,
    vec,
    Vector,
} from "excalibur";
import { getFont, loop, sprite } from "./sprites";
import { sfxBreak, sfxBump, sfxKick, sfxPower, sfxStomp } from "./audio";
import type Player from "./Player";
import { Text } from "excalibur";

// Hand-built masks so Pip passes through walkers and pickups, while those
// still land on terrain. Shells still bump other walkers.
const terrain = new CollisionGroup("terrain", 0b00001, 0b11110);
const player = new CollisionGroup("player", 0b00010, 0b00001);
const enemy = new CollisionGroup("enemy", 0b00100, 0b01001);
const shell = new CollisionGroup("shell", 0b01000, 0b00101);
const item = new CollisionGroup("item", 0b10000, 0b00001);

export const Groups = { terrain, player, enemy, shell, item };

export interface WorldApi {
    score(points: number, x: number, y: number): void;
    coin(x: number, y: number): void;
    hurtPlayer(): void;
    spawnPickup(kind: "fruit" | "life" | "star", x: number, y: number): void;
    spawnShards(x: number, y: number): void;
    forgetBlock(col: number, row: number): void;
    combo(): number;
    extraLife(x: number, y: number): void;
}

export class BumpBlock extends Actor {
    private used = false;
    private bump = 0;
    private baseY: number;
    private anim = 0;
    private hidden: boolean;
    coinsLeft: number;

    constructor(
        public col: number,
        public row: number,
        private kind: "question" | "brick" | "hidden",
        private content: "coin" | "coins" | "fruit" | "star" | "life" | "none",
        private world: WorldApi
    ) {
        super({
            pos: vec(col * 16 + 8, row * 16 + 8),
            width: 16,
            height: 16,
            collisionType: CollisionType.Fixed,
            anchor: vec(0.5, 0.5),
            z: 4,
        });
        this.baseY = this.pos.y;
        this.coinsLeft = content === "coins" ? 10 : content === "coin" ? 1 : 0;
        this.hidden = kind === "hidden";
        this.body.group = Groups.terrain;
        this.body.friction = 0;
        this.body.bounciness = 0;
        this.addTag("block");
        if (this.hidden) {
            this.graphics.opacity = 0;
        } else if (kind === "question") {
            this.graphics.use(sprite("question-0"));
        } else {
            this.graphics.use(sprite("brick"));
        }
    }

    hit(player: Player): void {
        if (this.bump > 0) return;
        if (this.used && this.content !== "coins") {
            sfxBump();
            this.bump = 0.001;
            return;
        }
        if (this.kind === "brick" && this.content === "none") {
            if (player.big) {
                this.breakApart();
                return;
            }
            sfxBump();
            this.bump = 0.001;
            return;
        }
        this.bump = 0.001;
        this.hidden = false;
        this.graphics.opacity = 1;
        if (this.content === "coin" || this.content === "coins") {
            this.coinsLeft--;
            this.world.coin(this.pos.x, this.pos.y - 18);
            this.spawnRisingCoin();
            if (this.coinsLeft <= 0) this.becomeUsed();
            return;
        }
        if (this.content === "fruit" || this.content === "star" || this.content === "life") {
            this.world.spawnPickup(this.content, this.pos.x, this.pos.y - 16);
            this.becomeUsed();
            sfxBump();
        }
    }

    private becomeUsed(): void {
        this.used = true;
        this.content = "none";
        this.graphics.use(sprite("used"));
        this.graphics.opacity = 1;
    }

    private breakApart(): void {
        sfxBreak();
        this.world.score(50, this.pos.x, this.pos.y - 12);
        this.world.spawnShards(this.pos.x, this.pos.y);
        this.world.forgetBlock(this.col, this.row);
        this.kill();
    }

    private spawnRisingCoin(): void {
        const coin = new RisingCoin(this.pos.x, this.pos.y - 8);
        this.scene?.add(coin);
    }

    onPreUpdate(_engine: unknown, delta: number): void {
        this.anim += delta;
        if (!this.used && !this.hidden && this.kind === "question") {
            const frame = Math.floor(this.anim / 140) % 3;
            this.graphics.use(sprite(`question-${frame}`));
        }
        if (this.bump > 0) {
            this.bump += delta / 1000;
            const t = Math.min(1, this.bump / 0.14);
            this.pos.y = this.baseY - Math.sin(t * Math.PI) * 7;
            if (t >= 1) {
                this.bump = 0;
                this.pos.y = this.baseY;
            }
        }
    }
}

class RisingCoin extends Actor {
    private life = 0;
    constructor(x: number, y: number) {
        super({
            pos: vec(x, y),
            collisionType: CollisionType.PreventCollision,
            anchor: vec(0.5, 0.5),
            z: 6,
        });
        this.graphics.use(sprite("coin-0"));
        this.vel = vec(0, -140);
    }
    onPreUpdate(_e: unknown, delta: number): void {
        this.life += delta;
        this.vel.y += 420 * (delta / 1000);
        const frame = Math.floor(this.life / 70) % 3;
        this.graphics.use(sprite(`coin-${frame}`));
        if (this.life > 450) this.kill();
    }
}

export class Walker extends Actor {
    private dir = -1;
    private alive = true;
    private shelled = false;
    kicked = false;
    private awake = false;
    private squash = 0;
    private anim = 0;
    private grace = 0;

    constructor(
        x: number,
        y: number,
        private kind: "sprout" | "shellkin",
        private world: WorldApi,
        private solidAt: (x: number, y: number) => boolean
    ) {
        super({
            pos: vec(x, y),
            width: 14,
            height: 14,
            collisionType: CollisionType.PreventCollision,
            anchor: vec(0.5, 0.5),
            z: 8,
        });
        this.addTag("enemy");
        this.body.friction = 0;
        this.body.bounciness = 0;
        this.body.useGravity = false;
        this.graphics.use(sprite(kind === "sprout" ? "sprout-0" : "shellkin-0"));
    }

    private wake(): void {
        if (this.awake) return;
        this.awake = true;
        this.body.collisionType = CollisionType.Active;
        this.body.group = Groups.enemy;
        this.body.useGravity = true;
        this.on("postcollision", (evt) => this.onHit(evt.other as Actor, evt.side));
    }

    receivePlayer(player: Player, stomp: boolean): void {
        if (!this.alive) return;
        if (this.grace > 0 && !stomp) return;
        if (player.star > 0) {
            this.squashOut(player);
            return;
        }
        if (stomp) {
            player.bounce();
            sfxStomp();
            if (this.kind === "sprout") {
                this.squashOut(player);
                return;
            }
            if (!this.shelled) {
                this.becomeShell();
                this.world.score(100, this.pos.x, this.pos.y - 16);
                return;
            }
            if (this.kicked) {
                this.kicked = false;
                this.vel.x = 0;
                this.body.group = Groups.enemy;
                return;
            }
            return;
        }
        if (this.shelled && !this.kicked) {
            this.kicked = true;
            this.dir = player.pos.x < this.pos.x ? 1 : -1;
            this.body.group = Groups.shell;
            this.grace = 0.3;
            sfxKick();
            return;
        }
        this.world.hurtPlayer();
    }

    private becomeShell(): void {
        this.shelled = true;
        this.kicked = false;
        this.graphics.use(sprite("shellkin-shell"));
        this.vel.x = 0;
        this.collider.useBoxCollider(14, 12);
    }

    private squashOut(player: Player): void {
        this.alive = false;
        this.body.collisionType = CollisionType.PreventCollision;
        this.body.useGravity = false;
        this.vel = vec(0, 0);
        const chain = this.world.combo();
        const points = Math.min(800, 100 * Math.pow(2, chain));
        this.world.score(points, this.pos.x, this.pos.y - 16);
        if (this.kind === "sprout" && player.star <= 0) {
            this.graphics.use(sprite("sprout-flat"));
            this.squash = 0.35;
        } else {
            this.graphics.flipHorizontal = false;
            this.vel = vec(this.dir * -40, -180);
            this.body.useGravity = true;
            this.squash = 0.8;
        }
    }

    private onHit(other: Actor, side: Side): void {
        if (!this.alive) return;
        if (side === Side.Left || side === Side.Right) {
            if (other.hasTag("enemy") && this.kicked) {
                if (typeof (other as Walker).squashOut === "function") {
                    (other as Walker).squashOut({ star: 1 } as Player);
                }
                return;
            }
            if (!other.hasTag("player") && !this.kicked) this.dir *= -1;
            if (this.kicked && !other.hasTag("player") && !other.hasTag("enemy")) this.dir *= -1;
        }
    }

    onPreUpdate(engine: { currentScene: { camera: { pos: Vector } } }, delta: number): void {
        const sec = delta / 1000;
        this.anim += delta;
        if (this.grace > 0) this.grace -= sec;
        if (!this.awake) {
            const viewRight = engine.currentScene.camera.pos.x + 140;
            if (viewRight > this.pos.x - 8) this.wake();
            return;
        }
        if (!this.alive) {
            this.squash -= sec;
            if (this.squash <= 0) this.kill();
            return;
        }
        if (this.kicked) this.vel.x = this.dir * 150;
        else if (this.shelled) this.vel.x = 0;
        else {
            this.vel.x = this.dir * 30;
            const aheadX = this.pos.x + this.dir * 10;
            const footY = this.pos.y + 12;
            if (!this.solidAt(aheadX, footY) && Math.abs(this.vel.y) < 30) this.dir *= -1;
            const frame = Math.floor(this.anim / 160) % 2;
            this.graphics.use(sprite(this.kind === "sprout" ? `sprout-${frame}` : `shellkin-${frame}`));
            this.graphics.flipHorizontal = this.dir > 0;
        }
        if (this.vel.y > 420) this.vel.y = 420;
    }
}

export class Pickup extends Actor {
    private dir = 1;
    constructor(x: number, y: number, private kind: "fruit" | "life" | "star") {
        super({
            pos: vec(x, y),
            width: 14,
            height: 14,
            collisionType: CollisionType.Active,
            anchor: vec(0.5, 0.5),
            z: 7,
        });
        this.addTag("pickup");
        this.body.group = Groups.item;
        this.body.friction = 0;
        this.body.bounciness = 0;
        this.body.useGravity = true;
        if (kind === "star") {
            this.graphics.use(loop(["star-0", "star-1"], 100));
            this.vel = vec(50, -160);
        } else {
            this.graphics.use(sprite(kind === "life" ? "fruit-life" : "fruit"));
            this.vel = vec(42, -80);
        }
        this.on("postcollision", (evt) => {
            if (evt.side === Side.Left || evt.side === Side.Right) this.dir *= -1;
            if (this.kind === "star" && evt.side === Side.Bottom) this.vel.y = -170;
        });
    }

    onPreUpdate(): void {
        if (this.kind !== "star") this.vel.x = 42 * this.dir;
        else this.vel.x = 56 * this.dir;
        if (this.vel.y > 400) this.vel.y = 400;
    }

    collect(player: Player, world: WorldApi): void {
        if (this.kind === "fruit") {
            if (player.big) world.score(1000, this.pos.x, this.pos.y);
            else {
                player.grow();
                world.score(1000, this.pos.x, this.pos.y);
            }
            sfxPower();
        } else if (this.kind === "life") {
            world.extraLife(this.pos.x, this.pos.y - 12);
        } else {
            player.star = 10;
            world.score(1000, this.pos.x, this.pos.y);
            sfxPower();
        }
        this.kill();
    }
}

export class BonusCoin extends Actor {
    private anim = 0;
    constructor(x: number, y: number, private world: WorldApi) {
        super({
            pos: vec(x, y),
            width: 12,
            height: 14,
            collisionType: CollisionType.Passive,
            anchor: vec(0.5, 0.5),
            z: 6,
        });
        this.addTag("coin");
        this.graphics.use(sprite("coin-0"));
        this.on("collisionstart", (evt) => {
            const other = evt.other as Actor;
            if (!other.hasTag("player")) return;
            this.world.coin(this.pos.x, this.pos.y);
            this.kill();
        });
    }
    onPreUpdate(_e: unknown, delta: number): void {
        this.anim += delta;
        this.graphics.use(sprite(`coin-${Math.floor(this.anim / 120) % 3}`));
    }
}

export class Shard extends Actor {
    private life = 0.45;
    constructor(x: number, y: number, velocity: Vector) {
        super({
            pos: vec(x, y),
            collisionType: CollisionType.PreventCollision,
            z: 9,
        });
        this.graphics.use(sprite("shard"));
        this.vel = velocity;
        this.body.useGravity = false;
    }
    onPreUpdate(_e: unknown, delta: number): void {
        const sec = delta / 1000;
        this.life -= sec;
        this.vel.y += 900 * sec;
        this.rotation += sec * 8;
        if (this.life <= 0) this.kill();
    }
}

export class Floater extends Actor {
    constructor(x: number, y: number, text: string) {
        super({
            pos: vec(x, y),
            collisionType: CollisionType.PreventCollision,
            anchor: vec(0.5, 1),
            z: 20,
        });
        this.graphics.use(new Text({ text, font: getFont() }));
    }

    onInitialize(): void {
        this.actions.moveBy(0, -22, 36).callMethod(() => this.kill());
    }
}

export function terrainGroup(): CollisionGroup {
    return Groups.terrain;
}
