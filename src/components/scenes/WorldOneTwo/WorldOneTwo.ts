import {
    Actor,
    BodyComponent,
    Canvas,
    Color,
    CollisionType,
    Engine,
    Physics,
    Rectangle,
    Scene,
    ScreenElement,
    Text,
    TileMap,
    vec,
} from "excalibur";
import {
    BumpBlock,
    Floater,
    Groups,
    Pickup,
    Shard,
    type WorldApi,
} from "../WorldOne/Actors";
import { sfxClear, sfxDie, sfxHurt, sfxOneUp, startDungeonMusic, stopMusic } from "../WorldOne/audio";
import Player from "../WorldOne/Player";
import { getFont, sprite } from "../WorldOne/sprites";
import { DungeonCritter } from "./Creatures";
import {
    COIN_BLOCKS,
    GATE_COL,
    GROUND_ROW,
    LEASH,
    LEVEL_COLS,
    LEVEL_ROWS,
    MARKERS,
    PROPS,
    TORCHES,
} from "./levelMap";

const TILE = 16;
const VIEW_W = 256;
const VIEW_H = 240;
const COLS = LEVEL_COLS;
const ROWS = LEVEL_ROWS.length;

export const WORLD_ONE_TWO_SCENE = "worldonetwo";

export interface RunCarry {
    points: number;
    coins: number;
    lives: number;
    big: boolean;
}

/**
 * World 1-2, the crypt after World 1-1.
 * Darkness is a cool ambient, warm torches, a light floor lip, and an edge vignette.
 * The path, the three creatures, and the gate stay in a brighter value band than the stone.
 *
 * Layout lessons, applied from dungeon-design writing:
 * - Warm torches mark the route. The wick chamber stays cold so the hazard reads as danger.
 * - Gameplay edges (floor lip, creature silhouettes, the gate slit) keep contrast. The rest falls off.
 * - One creature per beat, with a safe mouth, a squeeze, a breather, then the exit.
 * - Ceiling height and a short corridor change the pace without a second path.
 */
export default class WorldOneTwo extends Scene implements WorldApi {
    private player!: Player;
    private maps: TileMap[] = [];
    private worldActors: Actor[] = [];
    private blocks = new Set<string>();
    private points = 0;
    private coins = 0;
    private lives = 3;
    private time = 400;
    private timeAcc = 0;
    private mode: "play" | "clear" | "dead" | "over" = "play";
    private modeTime = 0;
    private comboCount = 0;
    private comboTime = 0;
    private musicStarted = false;
    private hintTime = 6;
    private clearAcc = 0;
    private booted = false;
    private spawnBig = false;
    private gateX = GATE_COL * TILE + 16;
    private scoreLabel!: Text;
    private coinLabel!: Text;
    private timeLabel!: Text;
    private lifeLabel!: Text;
    private message!: Text;
    private hint!: Text;
    private shade!: ScreenElement;
    private gestureTargets: Window[] = [];
    private readonly onPointer = (): void => {
        this.tryMusic();
    };
    private readonly onKey = (event: KeyboardEvent): void => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
            event.preventDefault();
        }
        this.tryMusic();
        if (this.mode === "over" && (event.code === "KeyZ" || event.code === "Space")) {
            this.points = 0;
            this.coins = 0;
            this.lives = 3;
            this.restart();
        }
    };

    onInitialize(engine: Engine): void {
        console.log("🏰 World 1-2 initializing");
        this.backgroundColor = Color.fromHex("#100e16");
        this.buildHud();
        this.addVignette();
        (window as unknown as { __worldTwo?: WorldOneTwo }).__worldTwo = this;
        console.log("🏰 World 1-2 ready");
        void engine;
    }

    onActivate(context: { data?: unknown; engine: Engine }): void {
        setGravity(1700);
        context.engine.backgroundColor = Color.fromHex("#100e16");
        this.bindMusicInput();
        this.tryMusic();
        if (this.booted) return;
        this.booted = true;
        const carry = readCarry(context.data);
        if (carry) {
            this.points = carry.points;
            this.coins = carry.coins;
            this.lives = Math.max(1, carry.lives);
            this.spawnBig = carry.big;
        }
        this.spawnWorld();
    }

    onDeactivate(): void {
        this.unbindMusicInput();
        setGravity(0);
        stopMusic();
        this.musicStarted = false;
    }

    score(points: number, x: number, y: number): void {
        if (points <= 0) return;
        this.points += points;
        this.track(new Floater(x, y, String(points)));
    }

    coin(x: number, y: number): void {
        this.coins += 1;
        this.points += 200;
        if (this.coins >= 100) {
            this.coins -= 100;
            this.extraLife(x, y - 10);
        } else {
            this.track(new Floater(x, y, "200"));
        }
    }

    extraLife(x: number, y: number): void {
        this.lives += 1;
        sfxOneUp();
        this.track(new Floater(x, y, "1UP"));
    }

    hurtPlayer(): void {
        if (this.player.dead || this.player.invuln > 0 || this.player.star > 0) return;
        if (this.player.big) {
            this.player.shrink();
            sfxHurt();
            return;
        }
        this.die();
    }

    spawnPickup(kind: "fruit" | "life" | "star", x: number, y: number): void {
        this.track(new Pickup(x, y, kind));
    }

    spawnShards(x: number, y: number): void {
        const kicks = [vec(-60, -160), vec(60, -180), vec(-30, -80), vec(40, -90)];
        for (const kick of kicks) this.track(new Shard(x, y, kick));
    }

    forgetBlock(col: number, row: number): void {
        this.blocks.delete(`${col},${row}`);
    }

    adopt(actor: Actor): void {
        this.track(actor);
    }

    combo(): number {
        if (this.comboTime <= 0) this.comboCount = 0;
        const value = this.comboCount;
        this.comboCount += 1;
        this.comboTime = 0.7;
        return value;
    }

    solidAt(x: number, y: number): boolean {
        for (const map of this.maps) {
            const tile = map.getTileByPoint(vec(x, y));
            if (tile?.solid) return true;
        }
        const key = `${Math.floor(x / TILE)},${Math.floor(y / TILE)}`;
        return this.blocks.has(key);
    }

    onPreUpdate(engine: Engine, delta: number): void {
        if (engine.input.keyboard.getKeys().length > 0) this.tryMusic();
        const sec = delta / 1000;
        this.comboTime = Math.max(0, this.comboTime - sec);
        this.hintTime = Math.max(0, this.hintTime - sec);
        this.modeTime += sec;

        if (this.mode === "play") {
            this.timeAcc += delta;
            while (this.timeAcc > 400 && this.time > 0) {
                this.timeAcc -= 400;
                this.time -= 1;
            }
            if (this.time <= 0) this.die();
            this.watchPits();
            this.watchGate();
        } else if (this.mode === "clear") {
            this.tickTimeBonus(delta);
        } else if (this.mode === "dead") {
            if (this.modeTime > 1.6) {
                this.lives -= 1;
                if (this.lives <= 0) {
                    this.mode = "over";
                    this.modeTime = 0;
                    this.message.text = "GAME OVER";
                    this.shade.graphics.opacity = 1;
                } else {
                    this.restart();
                }
            }
        }

        this.collectPickups();
        this.refreshHud();
        void engine;
    }

    onPostUpdate(engine: Engine): void {
        if (!this.player || this.player.isKilled()) return;
        const halfW = VIEW_W / 2;
        let x = this.camera.pos.x;
        if (this.player.pos.x > x) x = this.player.pos.x;
        const maxX = COLS * TILE - halfW;
        x = clamp(x, halfW, maxX);
        this.camera.pos = vec(x, VIEW_H / 2);
        if (this.mode === "play" && !this.player.dead) {
            const left = x - halfW + 8;
            if (this.player.pos.x < left) this.player.pos.x = left;
        }
        void engine;
    }

    private buildHud(): void {
        const font = getFont();
        const make = (text: string, x: number, y: number): Text => {
            const graphic = new Text({ text, font });
            const el = new ScreenElement({
                pos: vec(x, y),
                anchor: vec(0, 0),
                z: 100,
            });
            el.graphics.use(graphic);
            this.add(el);
            return graphic;
        };
        make("PIP", 8, 2);
        make("WORLD", 152, 2);
        make("TIME", 208, 2);
        this.scoreLabel = make("000000", 8, 12);
        this.lifeLabel = make("x3", 64, 12);
        this.coinLabel = make("x00", 104, 12);
        make("1-2", 160, 12);
        this.timeLabel = make("400", 208, 12);
        const coinIcon = new ScreenElement({
            pos: vec(96, 14),
            anchor: vec(0, 0),
            z: 100,
        });
        coinIcon.graphics.use(sprite("coin-icon"));
        this.add(coinIcon);

        this.shade = new ScreenElement({
            pos: vec(0, 0),
            anchor: vec(0, 0),
            z: 80,
        });
        this.shade.graphics.use(
            new Rectangle({
                width: VIEW_W,
                height: VIEW_H,
                color: Color.fromRGB(0, 0, 0, 0.55),
            })
        );
        this.shade.graphics.opacity = 0;
        this.add(this.shade);
        this.message = make("", 56, 96);
        this.hint = make("ARROWS MOVE  Z JUMP  X RUN", 16, 220);
    }

    private addVignette(): void {
        const graphic = new Canvas({
            width: VIEW_W,
            height: VIEW_H,
            cache: true,
            draw: (ctx) => {
                const glow = ctx.createRadialGradient(128, 108, 86, 128, 118, 210);
                glow.addColorStop(0, "rgba(0,0,0,0)");
                glow.addColorStop(0.68, "rgba(8,6,14,0.05)");
                glow.addColorStop(1, "rgba(0,0,0,0.48)");
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, VIEW_W, VIEW_H);
            },
        });
        const el = new ScreenElement({
            pos: vec(VIEW_W / 2, VIEW_H / 2),
            anchor: vec(0.5, 0.5),
            z: 40,
        });
        el.graphics.use(graphic);
        this.add(el);
    }

    private spawnWorld(): void {
        setGravity(1700);
        this.mode = "play";
        this.modeTime = 0;
        this.time = 400;
        this.timeAcc = 0;
        this.backgroundColor = Color.fromHex("#100e16");
        this.shade.graphics.opacity = 0;
        this.message.text = "";
        this.hint.text = "ARROWS MOVE  Z JUMP  X RUN";
        this.hintTime = 6;

        const map = this.makeMap(0, 0, COLS, ROWS);
        for (let row = 0; row < LEVEL_ROWS.length; row++) {
            const line = LEVEL_ROWS[row];
            const below = LEVEL_ROWS[row + 1] ?? "";
            for (let col = 0; col < line.length; col++) {
                const ch = line[col];
                if (ch !== "#" && ch !== "*") continue;
                const cold = ch === "*";
                if (row === GROUND_ROW + 1) {
                    this.paint(map, col, row, "crypt-deep", true);
                    continue;
                }
                const belowSolid = below[col] === "#" || below[col] === "*";
                const frame = !belowSolid
                    ? cold
                        ? "stone-cold-roof"
                        : "stone-roof"
                    : cold
                      ? "stone-cold"
                      : "stone";
                this.paint(map, col, row, frame, true);
            }
        }

        for (const coin of COIN_BLOCKS) {
            this.blocks.add(`${coin.col},${coin.row}`);
            this.track(new BumpBlock(coin.col, coin.row, "question", "coin", this));
        }

        for (const marker of MARKERS) {
            const leash = marker.kind === "wick" ? null : LEASH[marker.kind];
            this.track(
                new DungeonCritter(
                    marker.col * TILE + 8,
                    marker.row * TILE + 8,
                    marker.kind,
                    this,
                    (x, y) => this.solidAt(x, y),
                    leash
                        ? { minX: leash.minCol * TILE, maxX: leash.maxCol * TILE + TILE }
                        : { minX: marker.col * TILE, maxX: marker.col * TILE + TILE }
                )
            );
        }

        this.addDressing();

        const startY = GROUND_ROW * TILE - 8;
        this.player = new Player(3 * TILE + 8, startY);
        this.player.body.group = Groups.player;
        this.player.bind({
            solidAt: (x, y) => this.solidAt(x, y),
            isPlayable: () => this.mode === "play",
            onFlag: () => undefined,
        });
        this.track(this.player);
        if (this.spawnBig) {
            this.player.grow();
            this.spawnBig = false;
        }
        this.camera.pos = vec(VIEW_W / 2, VIEW_H / 2);
        this.gateX = GATE_COL * TILE + 16;
    }

    private addDressing(): void {
        const groundY = GROUND_ROW * TILE;
        for (const torch of TORCHES) {
            this.track(new Sconce(torch.col * TILE, torch.row * TILE));
        }
        for (const prop of PROPS) {
            if (prop.name === "chain") {
                this.decorTop(prop.name, prop.col * TILE + 4, prop.row * TILE, 2);
            } else {
                this.decor(prop.name, prop.col * TILE, groundY, 2);
            }
        }
        this.decor("crypt-gate", GATE_COL * TILE, groundY, 3);
    }

    private makeMap(x: number, y: number, columns: number, rows: number): TileMap {
        const map = new TileMap({
            pos: vec(x, y),
            tileWidth: TILE,
            tileHeight: TILE,
            columns,
            rows,
            renderFromTopOfGraphic: true,
        });
        const body = map.get(BodyComponent);
        if (body) {
            body.friction = 0;
            body.bounciness = 0;
            body.group = Groups.terrain;
        }
        this.add(map);
        this.maps.push(map);
        return map;
    }

    private paint(map: TileMap, col: number, row: number, frame: string, solidTile: boolean): void {
        const tile = map.getTile(col, row);
        if (!tile) return;
        tile.solid = solidTile;
        tile.addGraphic(sprite(frame));
    }

    private decor(name: string, x: number, y: number, z: number): void {
        const actor = new Actor({
            pos: vec(x, y),
            anchor: vec(0, 1),
            collisionType: CollisionType.PreventCollision,
            z,
        });
        actor.graphics.use(sprite(name));
        this.track(actor);
    }

    private decorTop(name: string, x: number, y: number, z: number): void {
        const actor = new Actor({
            pos: vec(x, y),
            anchor: vec(0, 0),
            collisionType: CollisionType.PreventCollision,
            z,
        });
        actor.graphics.use(sprite(name));
        this.track(actor);
    }

    private track(actor: Actor): Actor {
        this.add(actor);
        this.worldActors.push(actor);
        return actor;
    }

    private collectPickups(): void {
        if (!this.player || this.player.dead) return;
        const half = this.player.big ? 16 : 8;
        for (const actor of this.actors) {
            if (actor.isKilled()) continue;
            if (actor.hasTag("pickup") && actor.pos.distance(this.player.pos) < 16) {
                (actor as Pickup).collect(this.player, this);
            }
            if (actor.hasTag("enemy")) {
                const sized = actor as {
                    halfW?: number;
                    halfH?: number;
                    receivePlayer?: (player: Player, stomp: boolean) => void;
                };
                if (typeof sized.receivePlayer !== "function") continue;
                const halfW = sized.halfW ?? 6;
                const halfH = sized.halfH ?? 8;
                const dx = Math.abs(actor.pos.x - this.player.pos.x);
                const feet = this.player.pos.y + half;
                const head = actor.pos.y - halfH;
                if (dx < halfW + 6 && feet > head - 2 && this.player.pos.y < actor.pos.y + halfH + 4) {
                    const stomp = this.player.vel.y > 20 && feet < actor.pos.y + 4;
                    sized.receivePlayer(this.player, stomp);
                }
            }
        }
    }

    private watchPits(): void {
        if (this.player.dead) return;
        if (this.player.pos.y > 280) this.die();
    }

    private watchGate(): void {
        if (this.player.dead || !this.player.onGround) return;
        if (this.player.pos.x > this.gateX - 4 && this.player.pos.x < this.gateX + 22) {
            this.beginClear();
        }
    }

    private beginClear(): void {
        this.mode = "clear";
        this.modeTime = 0;
        this.clearAcc = 0;
        this.player.locked = true;
        this.player.vel = vec(0, 0);
        this.message.text = "CRYPT CLEAR";
        this.score(2000, this.player.pos.x, this.player.pos.y - 24);
        stopMusic();
        this.musicStarted = false;
        sfxClear();
    }

    private tickTimeBonus(delta: number): void {
        this.clearAcc += delta;
        this.message.text = "CRYPT CLEAR";
        this.shade.graphics.opacity = 1;
        while (this.clearAcc > 18 && this.time > 0) {
            this.clearAcc -= 18;
            this.time -= 1;
            this.points += 50;
        }
    }

    private die(): void {
        if (this.player.dead || this.mode === "dead" || this.mode === "over") return;
        this.mode = "dead";
        this.modeTime = 0;
        this.player.killPlayer();
        stopMusic();
        this.musicStarted = false;
        sfxDie();
    }

    private restart(): void {
        for (const actor of this.worldActors) actor.kill();
        this.worldActors = [];
        for (const map of this.maps) map.kill();
        this.maps = [];
        this.blocks.clear();
        this.spawnWorld();
        this.tryMusic();
    }

    private tryMusic(): void {
        if (this.musicStarted) return;
        if (startDungeonMusic()) this.musicStarted = true;
    }

    private bindMusicInput(): void {
        this.unbindMusicInput();
        this.gestureTargets = [window];
        try {
            if (window.top && window.top !== window) this.gestureTargets.push(window.top);
        } catch {
            // The parent frame is cross-origin, so this window still receives the keys.
        }
        for (const target of this.gestureTargets) {
            target.addEventListener("keydown", this.onKey, true);
            target.addEventListener("pointerdown", this.onPointer, true);
        }
    }

    private unbindMusicInput(): void {
        for (const target of this.gestureTargets) {
            target.removeEventListener("keydown", this.onKey, true);
            target.removeEventListener("pointerdown", this.onPointer, true);
        }
        this.gestureTargets = [];
    }

    private refreshHud(): void {
        this.scoreLabel.text = String(this.points).padStart(6, "0");
        this.coinLabel.text = `x${String(this.coins).padStart(2, "0")}`;
        this.timeLabel.text = String(Math.max(0, this.time)).padStart(3, "0");
        this.lifeLabel.text = `x${this.lives}`;
        this.hint.opacity = this.hintTime > 0 && this.mode === "play" ? 1 : 0;
        if (this.mode === "over") {
            this.message.text = "GAME OVER";
            this.shade.graphics.opacity = 1;
        }
    }
}

class Sconce extends Actor {
    private anim = 0;
    private frame = "";

    constructor(x: number, y: number) {
        super({
            pos: vec(x, y),
            anchor: vec(0, 1),
            collisionType: CollisionType.PreventCollision,
            z: 5,
        });
        this.useFrame("torch-0");
    }

    onPreUpdate(_engine: Engine, delta: number): void {
        this.anim += delta;
        this.useFrame(this.anim % 420 < 210 ? "torch-0" : "torch-1");
    }

    private useFrame(name: string): void {
        if (this.frame === name) return;
        this.frame = name;
        this.graphics.use(sprite(name));
    }
}

function readCarry(value: unknown): RunCarry | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Partial<RunCarry>;
    if (
        typeof row.points !== "number" ||
        typeof row.coins !== "number" ||
        typeof row.lives !== "number" ||
        typeof row.big !== "boolean"
    ) {
        return null;
    }
    return { points: row.points, coins: row.coins, lives: row.lives, big: row.big };
}

function setGravity(y: number): void {
    Physics.acc = vec(0, y);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
