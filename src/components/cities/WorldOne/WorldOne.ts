import {
    Actor,
    BodyComponent,
    Color,
    Engine,
    Physics,
    CollisionType,
    Rectangle,
    Scene,
    ScreenElement,
    Text,
    TileMap,
    vec,
} from "excalibur";
import { LEVEL_ROWS } from "./levelMap";
import { getFont, Resources, sprite } from "./sprites";
import Player from "./Player";
import {
    BonusCoin,
    BumpBlock,
    Floater,
    Groups,
    Pickup,
    Shard,
    Walker,
    WorldApi,
} from "./Actors";
import { Critter, type CritterKind } from "./Creatures";
import {
    sfxClear,
    sfxDie,
    sfxHurt,
    sfxOneUp,
    startMusic,
    stopMusic,
    unlockAudio,
} from "./audio";

const TILE = 16;
const VIEW_W = 256;
const VIEW_H = 240;
const GROUND_ROW = 13;
const MAP_COLS = LEVEL_ROWS[0].length;
const COLS = MAP_COLS + 14;
const ROWS = 15;
const BONUS_Y = 400;

const BLOCK_LOOT: Record<string, "fruit" | "coins" | "star"> = {
    "21,9": "fruit",
    "77,9": "coins",
    "101,9": "star",
};

/**
 * World 1-1, the default Terrene stage.
 * Original artwork and music. Layout follows the familiar first-stage rhythm:
 * question blocks, pipes, pits, a stair climb, and a flagpole.
 */
export default class WorldOne extends Scene implements WorldApi {
    private player!: Player;
    private maps: TileMap[] = [];
    private worldActors: Actor[] = [];
    private blocks = new Set<string>();
    private points = 0;
    private coins = 0;
    private lives = 3;
    private time = 400;
    private timeAcc = 0;
    private mode: "play" | "bonus" | "flag" | "walk" | "clear" | "dead" | "over" = "play";
    private modeTime = 0;
    private pipeTimer = 0;
    private comboCount = 0;
    private comboTime = 0;
    private musicStarted = false;
    private hintTime = 6;
    private flagX = 0;
    private flagTop = 0;
    private flagCloth: Actor | null = null;
    private warp = { x: 0, top: 0 };
    private exitPipe = { x: 0, top: 0 };
    private bonusExit = { x: 0, top: 0 };
    private doorX = 0;
    private clearAcc = 0;
    private scoreLabel!: Text;
    private coinLabel!: Text;
    private timeLabel!: Text;
    private lifeLabel!: Text;
    private message!: Text;
    private hint!: Text;
    private shade!: ScreenElement;
    private readonly onKey = (event: KeyboardEvent): void => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
            event.preventDefault();
        }
        if (!this.musicStarted) {
            unlockAudio();
            startMusic();
            this.musicStarted = true;
        }
        if (this.mode === "over" && (event.code === "KeyZ" || event.code === "Space")) {
            this.points = 0;
            this.coins = 0;
            this.lives = 3;
            this.restart();
        }
    };

    onInitialize(engine: Engine): void {
        console.log("🏰 World 1-1 initializing");
        this.backgroundColor = Color.fromHex("#5c94fc");
        this.buildHud();
        this.spawnWorld();
        window.addEventListener("keydown", this.onKey);
        (window as unknown as { __world?: WorldOne }).__world = this;
        console.log("🏰 World 1-1 ready");
        void engine;
    }

    onActivate(): void {
        setGravity(1700);
        this.camera.pos = vec(VIEW_W / 2, VIEW_H / 2);
    }

    onDeactivate(): void {
        window.removeEventListener("keydown", this.onKey);
        setGravity(0);
        stopMusic();
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
        const sec = delta / 1000;
        this.comboTime = Math.max(0, this.comboTime - sec);
        this.hintTime = Math.max(0, this.hintTime - sec);
        this.modeTime += sec;

        if (this.mode === "play" || this.mode === "bonus") {
            this.timeAcc += delta;
            while (this.timeAcc > 400 && this.time > 0) {
                this.timeAcc -= 400;
                this.time -= 1;
            }
            if (this.time <= 0) this.die();
        }

        this.collectPickups();

        if (this.mode === "play") {
            this.watchPits(260);
            this.watchPipe(sec);
            this.watchFlag();
        } else if (this.mode === "bonus") {
            this.watchPits(BONUS_Y + 250);
            this.watchBonusExit();
        } else if (this.mode === "flag") {
            this.slideDownFlag(sec);
        } else if (this.mode === "walk") {
            this.lowerFlag(sec);
            this.player.vel.x = 70;
            this.player.facing = 1;
            if (this.player.pos.x > this.doorX) {
                this.player.graphics.opacity = 0;
                this.player.locked = true;
                this.player.vel.x = 0;
                this.mode = "clear";
                this.modeTime = 0;
                this.clearAcc = 0;
            }
        } else if (this.mode === "clear") {
            this.tickTimeBonus(delta);
            if (this.time <= 0 && this.modeTime > 2.2) this.restart();
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

        this.refreshHud();
        void engine;
    }

    onPostUpdate(engine: Engine): void {
        if (!this.player || this.player.isKilled()) return;
        const halfW = VIEW_W / 2;
        if (this.mode === "bonus") {
            const minX = halfW;
            const maxX = 20 * TILE - halfW;
            const x = clamp(this.player.pos.x, minX, Math.max(minX, maxX));
            this.camera.pos = vec(x, BONUS_Y + VIEW_H / 2);
            return;
        }
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
        make("1-1", 160, 12);
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
        this.message = make("", 48, 96);
        this.hint = make("ARROWS MOVE  Z JUMP  X RUN", 16, 220);
    }

    private spawnWorld(): void {
        setGravity(1700);
        this.mode = "play";
        this.modeTime = 0;
        this.time = 400;
        this.timeAcc = 0;
        this.pipeTimer = 0;
        this.backgroundColor = Color.fromHex("#5c94fc");
        this.shade.graphics.opacity = 0;
        this.message.text = "";
        this.hint.text = "ARROWS MOVE  Z JUMP  X RUN";
        this.hintTime = 6;

        const map = this.makeMap(0, 0, COLS, ROWS);
        const pipeTops: { col: number; row: number }[] = [];

        for (let row = 0; row < LEVEL_ROWS.length; row++) {
            const line = LEVEL_ROWS[row];
            for (let col = 0; col < line.length; col++) {
                const ch = line[col];
                if (ch === "-" || ch === "E" || ch === "S" || ch === "?" || ch === "Q") continue;
                if (ch === "X" && row !== GROUND_ROW) {
                    // The lone end block in the annotation is the flagpole, not a stair.
                    if (row === 12 && col === 198) continue;
                    this.paint(map, col, row, "hard", true);
                    continue;
                }
                if (ch === "X" && row === GROUND_ROW) {
                    this.paint(map, col, row, "ground", true);
                    this.paint(map, col, row + 1, "dirt", true);
                    continue;
                }
                if (ch === "<") {
                    this.paint(map, col, row, "pipe-tl", true);
                    pipeTops.push({ col, row });
                } else if (ch === ">") this.paint(map, col, row, "pipe-tr", true);
                else if (ch === "[") this.paint(map, col, row, "pipe-bl", true);
                else if (ch === "]") this.paint(map, col, row, "pipe-br", true);
            }
        }

        for (let col = MAP_COLS; col < COLS; col++) {
            this.paint(map, col, GROUND_ROW, "ground", true);
            this.paint(map, col, GROUND_ROW + 1, "dirt", true);
        }

        pipeTops.sort((a, b) => a.col - b.col);
        const warp = pipeTops[3];
        const exit = pipeTops[4];
        this.warp = { x: warp.col * TILE, top: warp.row * TILE };
        this.exitPipe = { x: exit.col * TILE, top: exit.row * TILE };

        for (let row = 0; row < LEVEL_ROWS.length; row++) {
            const line = LEVEL_ROWS[row];
            for (let col = 0; col < line.length; col++) {
                const ch = line[col];
                const key = `${col},${row}`;
                if (ch === "S" || ch === "?" || ch === "Q") {
                    const loot = BLOCK_LOOT[key] ?? (ch === "S" ? "none" : "coin");
                    const kind = ch === "S" ? "brick" : "question";
                    this.addBlock(col, row, kind, loot as "coin" | "coins" | "fruit" | "star" | "none");
                } else if (ch === "E") {
                    const kind = col === 106 && row === 12 ? "shellkin" : "sprout";
                    const enemy = new Walker(col * TILE + 8, row * TILE + 8, kind, this, (x, y) => this.solidAt(x, y));
                    this.track(enemy);
                }
            }
        }

        this.spawnCritters();

        this.addBlock(64, 9, "hidden", "life");
        this.addScenery();
        this.addFinale();
        this.addBonusRoom();

        const startY = GROUND_ROW * TILE - 8;
        this.player = new Player(48, startY);
        this.player.body.group = Groups.player;
        this.player.bind({
            solidAt: (x, y) => this.solidAt(x, y),
            isPlayable: () => this.mode === "play" || this.mode === "bonus",
            onFlag: () => undefined,
        });
        this.track(this.player);
        this.camera.pos = vec(VIEW_W / 2, VIEW_H / 2);
    }

    /**
     * New critters stay off the opening screen. Each one gets a leash so its
     * job is readable before the next animal shows up.
     */
    private spawnCritters(): void {
        const gy = 12 * TILE + 8;
        const add = (col: number, y: number, kind: CritterKind, minCol: number, maxCol: number) => {
            this.track(
                new Critter(col * TILE + 8, y, kind, this, (x, yPos) => this.solidAt(x, yPos), {
                    minX: minCol * TILE,
                    maxX: maxCol * TILE + TILE,
                })
            );
        };
        add(34, gy, "bink", 30, 37);
        add(52, 152, "birdie", 49, 55);
        add(64, gy, "flick", 60, 68);
        add(74, gy, "rusk", 71, 84);
        add(92, 108, "vesper", 89, 96);
        add(116, gy, "mog", 112, 120);
        add(138, 96, "sable", 132, 146);
        add(145, gy, "rollo", 144, 147);
        add(160, gy, "brunt", 156, 162);
        add(168, gy, "puff", 166, 172);
        add(193, gy, "bram", 190, 196);
    }

    private addBlock(
        col: number,
        row: number,
        kind: "question" | "brick" | "hidden",
        content: "coin" | "coins" | "fruit" | "star" | "life" | "none"
    ): void {
        this.blocks.add(`${col},${row}`);
        this.track(new BumpBlock(col, row, kind, content, this));
    }

    private addScenery(): void {
        const groundY = GROUND_ROW * TILE;
        const hillCols = [0, 48, 96, 144, 192];
        for (const col of hillCols) {
            const name = col % 96 === 0 ? "hill-lg" : "hill-sm";
            this.decor(name, col * TILE, groundY, -12);
        }
        const bushCols = [12, 24, 41, 72, 93, 112, 130, 150, 172, 190];
        for (const col of bushCols) {
            if (this.nearPipe(col)) continue;
            this.decor(col % 2 === 0 ? "bush-a" : "bush-b", col * TILE, groundY + 2, -6);
        }
        const clouds: [number, number, string][] = [
            [6, 2, "cloud-b"],
            [19, 3, "cloud-a"],
            [36, 2, "cloud-b"],
            [54, 1, "cloud-a"],
            [78, 3, "cloud-b"],
            [100, 2, "cloud-a"],
            [126, 1, "cloud-b"],
            [148, 3, "cloud-a"],
            [170, 2, "cloud-b"],
            [190, 1, "cloud-a"],
        ];
        for (const [col, row, name] of clouds) {
            this.decorTop(name, col * TILE, row * TILE, -18);
        }
    }

    private nearPipe(col: number): boolean {
        const pipes = [28, 38, 46, 57, 163, 179];
        return pipes.some((pipe) => Math.abs(col - pipe) < 4);
    }

    private addFinale(): void {
        const groundY = GROUND_ROW * TILE;
        this.flagX = 198 * TILE + 8;
        this.flagTop = GROUND_ROW * TILE - 10 * TILE;
        for (let i = 0; i < 10; i++) {
            const pole = new Actor({
                pos: vec(this.flagX, this.flagTop + i * TILE + 8),
                collisionType: CollisionType.PreventCollision,
                anchor: vec(0.5, 0.5),
                z: 3,
            });
            pole.graphics.use(sprite("pole"));
            this.track(pole);
        }
        this.flagCloth = new Actor({
            pos: vec(this.flagX + 8, this.flagTop + 4),
            collisionType: CollisionType.PreventCollision,
            anchor: vec(0, 0),
            z: 4,
        });
        this.flagCloth.graphics.use(sprite("flag"));
        this.track(this.flagCloth);

        this.doorX = 208 * TILE + 28;
        this.decor("castle", 206 * TILE, groundY, 2);
    }

    private addBonusRoom(): void {
        const map = this.makeMap(0, BONUS_Y, 20, 14);
        for (let col = 0; col < 20; col++) {
            for (const row of [0, 1, 12, 13]) this.paint(map, col, row, "brick-blue", true);
        }
        for (let row = 0; row < 14; row++) {
            this.paint(map, 0, row, "brick-blue", true);
            this.paint(map, 19, row, "brick-blue", true);
        }
        // Exit pipe on the right.
        this.paint(map, 16, 10, "pipe-tl", true);
        this.paint(map, 17, 10, "pipe-tr", true);
        this.paint(map, 16, 11, "pipe-bl", true);
        this.paint(map, 17, 11, "pipe-br", true);
        this.bonusExit = { x: 16 * TILE, top: BONUS_Y + 10 * TILE };

        for (const row of [4, 6, 8]) {
            for (let col = 2; col <= 14; col++) {
                this.track(new BonusCoin(col * TILE + 8, BONUS_Y + row * TILE + 8, this));
            }
        }
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

    private paint(map: TileMap, col: number, row: number, frame: string, solid: boolean): void {
        const tile = map.getTile(col, row);
        if (!tile) return;
        tile.solid = solid;
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

    private watchPits(limit: number): void {
        if (this.player.dead) return;
        if (this.player.pos.y > limit) this.die();
    }

    private watchPipe(sec: number): void {
        const feet = this.player.pos.y + (this.player.big ? 16 : 8);
        const onWarp =
            this.player.pos.x > this.warp.x &&
            this.player.pos.x < this.warp.x + 32 &&
            Math.abs(feet - this.warp.top) < 8 &&
            this.player.onGround &&
            this.player.pressingDown;
        this.pipeTimer = onWarp ? this.pipeTimer + sec : 0;
        if (this.pipeTimer > 0.28) this.enterBonus();
    }

    private watchBonusExit(): void {
        const feet = this.player.pos.y + (this.player.big ? 16 : 8);
        const onExit =
            this.player.pos.x > this.bonusExit.x &&
            this.player.pos.x < this.bonusExit.x + 32 &&
            Math.abs(feet - this.bonusExit.top) < 8 &&
            this.player.onGround &&
            this.player.pressingDown;
        if (!onExit) return;
        this.mode = "play";
        this.backgroundColor = Color.fromHex("#5c94fc");
        const half = this.player.big ? 16 : 8;
        this.player.pos = vec(this.exitPipe.x + 16, this.exitPipe.top - half);
        this.player.vel = vec(0, 0);
        this.camera.pos = vec(clamp(this.player.pos.x, VIEW_W / 2, COLS * TILE - VIEW_W / 2), VIEW_H / 2);
    }

    private enterBonus(): void {
        this.mode = "bonus";
        this.pipeTimer = 0;
        this.backgroundColor = Color.fromHex("#0c1024");
        const half = this.player.big ? 16 : 8;
        this.player.pos = vec(3 * TILE, BONUS_Y + 12 * TILE - half);
        this.player.vel = vec(0, 0);
        this.camera.pos = vec(VIEW_W / 2, BONUS_Y + VIEW_H / 2);
    }

    private watchFlag(): void {
        if (this.player.dead) return;
        if (Math.abs(this.player.pos.x - this.flagX) < 12 && this.player.pos.y < GROUND_ROW * TILE) {
            this.beginFlag();
        }
    }

    private beginFlag(): void {
        this.mode = "flag";
        this.modeTime = 0;
        this.player.locked = true;
        this.player.body.useGravity = false;
        this.player.vel = vec(0, 60);
        this.player.pos.x = this.flagX - 6;
        const span = GROUND_ROW * TILE - this.flagTop;
        const climbed = clamp((this.player.pos.y - this.flagTop) / span, 0, 1);
        const points = climbed < 0.12 ? 5000 : climbed < 0.35 ? 2000 : climbed < 0.6 ? 800 : climbed < 0.85 ? 400 : 100;
        this.score(points, this.flagX, this.player.pos.y);
        stopMusic();
        sfxClear();
    }

    private slideDownFlag(sec: number): void {
        const half = this.player.big ? 16 : 8;
        const floorY = GROUND_ROW * TILE - half;
        this.player.vel.y = 90;
        this.player.pos.x = this.flagX - 6;
        this.lowerFlag(sec);
        if (this.player.pos.y >= floorY) {
            this.player.pos.y = floorY;
            this.player.body.useGravity = true;
            this.player.vel = vec(70, 0);
            this.mode = "walk";
            this.modeTime = 0;
        }
    }

    private lowerFlag(sec: number): void {
        if (!this.flagCloth) return;
        const target = GROUND_ROW * TILE - 8;
        this.flagCloth.pos.y = Math.min(target, this.flagCloth.pos.y + 120 * sec);
    }

    private tickTimeBonus(delta: number): void {
        this.clearAcc += delta;
        this.message.text = "COURSE CLEAR";
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
        this.flagCloth = null;
        this.spawnWorld();
        if (this.musicStarted) startMusic();
    }

    private refreshHud(): void {
        this.scoreLabel.text = String(this.points).padStart(6, "0");
        this.coinLabel.text = `x${String(this.coins).padStart(2, "0")}`;
        this.lifeLabel.text = `x${this.lives}`;
        this.timeLabel.text = String(Math.max(0, this.time)).padStart(3, "0");
        this.hint.opacity = this.hintTime > 0 && this.mode === "play" ? 1 : 0;
        if (this.mode === "over") {
            this.message.text = "GAME OVER";
            this.shade.graphics.opacity = 1;
        }
    }
}

function setGravity(y: number): void {
    // Excalibur 0.28 applies gravity through the global acceleration vector.
    Physics.acc = vec(0, y);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export { Resources };
