import {
    Actor, Axes, Buttons, Color, Engine, Keys, Scene, ScreenElement, vec,
} from "excalibur";
import type { ImageSource } from "excalibur";
import BaseItem from "../../../common/BaseItem";
import Mori, { type MoriInput } from "../../characters/player/Mori/Mori";
import Glimmerfly from "../../creatures/Glimmerfly/Glimmerfly";
import Gloomfin from "../../creatures/Gloomfin/Gloomfin";
import Mossback from "../../creatures/Mossback/Mossback";
import BlueCrystal from "../../items/cave/BlueCrystal/BlueCrystal";
import BonsaiTree from "../../items/cave/BonsaiTree/BonsaiTree";
import Boulders from "../../items/cave/Boulders/Boulders";
import DeadTree from "../../items/cave/DeadTree/DeadTree";
import Fern from "../../items/cave/Fern/Fern";
import GlowShrooms from "../../items/cave/GlowShrooms/GlowShrooms";
import GrassTuft from "../../items/cave/GrassTuft/GrassTuft";
import HangingLantern from "../../items/cave/HangingLantern/HangingLantern";
import HeartMoss from "../../items/cave/HeartMoss/HeartMoss";
import Heartstone from "../../items/cave/Heartstone/Heartstone";
import Kelp from "../../items/cave/Kelp/Kelp";
import MossDrip from "../../items/cave/MossDrip/MossDrip";
import MossyBoulder from "../../items/cave/MossyBoulder/MossyBoulder";
import PaleShrooms from "../../items/cave/PaleShrooms/PaleShrooms";
import Stalagmite from "../../items/cave/Stalagmite/Stalagmite";
import type { ItemOptions } from "../../../common/BaseItem";
import {
    duckOkaMusic, fadeOkaMusic, playOkaSfx, preloadOkaAudio, startOkaMusic, stopOkaMusic, unlockOkaAudio,
    useOkaSoundtrack, type OkaSfx, type OkaSoundtrack,
} from "./audio";
import { Effects, type BurstPalette, type MoteStyle } from "./effects";
import { overlap, type BurstKind, type OkaHooks, type OkaVariant } from "./hooks";
import { chapterCard, loadingCard, OkaHud, touchPad, veil, type ChapterCard, type HudStyle } from "./hud";
import type { FixtureName, OkaLevel } from "./level";
import OkaCreature from "./OkaCreature";
import { CaveParallax, VIEW_H, VIEW_W, type ParallaxImage, type ParallaxStyle } from "./parallax";
import { OkaPhysics, type Water as WaterRegion } from "./physics";
import { placeGround, placePiece, placeWall } from "./terrain";
import Water, { type WaterStyle } from "./Water";

const FIXTURES: Record<FixtureName, new (o: ItemOptions) => BaseItem> = {
    BonsaiTree, Boulders, MossyBoulder, Stalagmite, Kelp, Fern, GrassTuft, MossDrip, GlowShrooms,
    DeadTree, PaleShrooms, HangingLantern,
};

/** Everything that makes one Oka World scene look, sound and play the way it does. */
export interface OkaSceneConfig {
    key: string;
    name: string;
    level: OkaLevel;
    variant: OkaVariant;
    background: string;
    /** the terrain atlas and the three parallax paintings */
    art: { atlas: ImageSource } & Record<ParallaxImage, ImageSource>;
    /** every other image the scene draws: hero, creatures, items */
    images: ImageSource[];
    crystalIcon: ImageSource;
    soundtrack: OkaSoundtrack;
    parallax: ParallaxStyle;
    water: WaterStyle;
    bursts: BurstPalette;
    motes: { count: number; style: MoteStyle }[];
    hud: HudStyle;
    text: {
        /** what the crystals are called on the win panel */
        crystals: string;
        allCrystals: string;
        checkpoint: string;
        rest: string;
        winTitle: string;
        winAll: string;
        winSome: string;
    };
    checkpointSfx: [OkaSfx, number];
    /** the scene to go on to after a win, and the card shown on the way */
    next?: { scene: string; card: ChapterCard; prompt: string };
    /** shown while loading, when this scene is reached from another */
    card?: ChapterCard;
}

interface SavedScreen {
    width: number;
    height: number;
    pixelRatio: number | null;
    antialiasing: boolean;
    snap: boolean;
    background: Color;
}

interface ScreenInternals {
    _pixelRatioOverride: number | null;
    _resizeHandler: () => void;
}

/** After a win with a next scene, go on by itself after this long. */
const AUTO_ADVANCE = 9;
const CARD_FADE = 1.4;
const CARD_HOLD = 1.3;

/**
 * Shared engine of the Oka World scenes: HD switch, loading, building a level
 * from data, input, the hero loop, checkpoints, the win and the hand-over to
 * the next scene. A scene supplies an `OkaSceneConfig` and can override the
 * protected hooks (`makeCheckpoint`, `makeGoal`, `decorate`, `frame`).
 *
 * The rest of Terrene runs at 256x240 pixel art. These scenes switch the
 * screen to 960x540 with smoothing while active and put it back after.
 */
export default class OkaScene extends Scene {
    protected engineRef: Engine | null = null;
    private saved: SavedScreen | null = null;
    private loaded = false;
    private loading: Promise<void> | null = null;
    private progress = 0;
    private loadingEl: ScreenElement | null = null;
    private built: Actor[] = [];
    protected cave = new OkaPhysics();
    protected mori: Mori | null = null;
    protected creatures: OkaCreature[] = [];
    protected items: BaseItem[] = [];
    protected waters: Water[] = [];
    protected parallax: CaveParallax | null = null;
    protected effects: Effects | null = null;
    protected hud: OkaHud | null = null;
    protected crystals = 0;
    protected checkpoint: { x: number; y: number };
    protected camX = VIEW_W / 2;
    private lastLeft = 0;
    protected won = false;
    protected winTime = 0;
    protected restingTime = 0;
    /** seconds since the hand-over to the next scene began, or -1 */
    protected leaving = -1;
    private cardEl: ScreenElement | null = null;
    private fadeEl: ScreenElement | null = null;
    private fadeTime = 0;
    private touch = { left: false, right: false, jump: false, jumpPressed: false };
    private touchEl: ScreenElement | null = null;
    private onKey = (event: KeyboardEvent) => this.gesture(event);
    private onPointer = (event: PointerEvent) => this.gesture(event);
    private onTouch = (event: TouchEvent) => this.readTouches(event);
    private gestureTargets: (Window | HTMLElement)[] = [];

    constructor(readonly config: OkaSceneConfig) {
        super();
        this.checkpoint = { ...config.level.start };
    }

    protected get level(): OkaLevel {
        return this.config.level;
    }

    onInitialize(engine: Engine): void {
        this.engineRef = engine;
    }

    onActivate(): void {
        const engine = this.engineRef ?? this.engine;
        this.engineRef = engine;
        this.enterHd(engine);
        this.bindInput(engine);
        useOkaSoundtrack(this.config.soundtrack);
        (window as unknown as { __oka?: OkaScene }).__oka = this;
        console.log(`🏰 ${this.config.name} activated`);
        if (this.loaded) {
            this.reset();
            return;
        }
        this.showLoading();
        void this.prefetch().then(() => {
            if ((this.engine.currentScene as Scene) !== this) return;
            this.hideLoading();
            this.reset();
        });
    }

    onDeactivate(): void {
        stopOkaMusic();
        this.unbindInput();
        this.teardown();
        if (this.engineRef) this.leaveHd(this.engineRef);
        console.log(`🏰 ${this.config.name} deactivated`);
    }

    // ------------------------------------------------------------- screen

    private pickPixelRatio(): number {
        const dpr = window.devicePixelRatio || 1;
        const fit = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
        const want = Math.ceil(dpr * fit * 2) / 2;
        return Math.max(1, Math.min(2, want));
    }

    private enterHd(engine: Engine): void {
        const screen = engine.screen as unknown as ScreenInternals;
        this.saved = {
            width: engine.screen.resolution.width,
            height: engine.screen.resolution.height,
            pixelRatio: screen._pixelRatioOverride,
            antialiasing: engine.screen.antialiasing,
            snap: engine.snapToPixel,
            background: engine.backgroundColor,
        };
        engine.screen.resolution = { width: VIEW_W, height: VIEW_H };
        screen._pixelRatioOverride = this.pickPixelRatio();
        engine.screen.antialiasing = true;
        engine.snapToPixel = false;
        engine.backgroundColor = Color.fromHex(this.config.background);
        screen._resizeHandler();
    }

    private leaveHd(engine: Engine): void {
        const s = this.saved;
        if (!s) return;
        const screen = engine.screen as unknown as ScreenInternals;
        engine.screen.resolution = { width: s.width, height: s.height };
        screen._pixelRatioOverride = s.pixelRatio;
        engine.screen.antialiasing = s.antialiasing;
        engine.snapToPixel = s.snap;
        engine.backgroundColor = s.background;
        screen._resizeHandler();
        this.saved = null;
    }

    // ------------------------------------------------------------- loading

    /** Start loading this scene's art and audio (once). Safe to call before the scene is active. */
    prefetch(): Promise<void> {
        this.loading = this.loading ?? this.loadAll();
        return this.loading;
    }

    private loadAll(): Promise<void> {
        const c = this.config;
        const images = [c.art.atlas, c.art.backdrop, c.art.mid, c.art.near, ...c.images];
        let done = 0;
        const total = images.length + 1;
        const tick = () => {
            done++;
            this.progress = done / total;
        };
        const jobs = images.map((img) => (img.isLoaded() ? Promise.resolve() : img.load().then(() => undefined)).then(tick));
        const sound = preloadOkaAudio(c.soundtrack).then(tick);
        return Promise.all([...jobs, sound]).then(() => {
            this.loaded = true;
            console.log(`🏰 ${c.name} art and music loaded`);
        }).catch((error) => {
            console.error(`❌ ${c.name} failed to load`, error);
        });
    }

    private showLoading(): void {
        this.loadingEl = new ScreenElement({ x: 0, y: 0, z: 200 });
        this.loadingEl.graphics.use(loadingCard(() => this.progress, this.config.hud, this.config.card));
        this.add(this.loadingEl);
    }

    private hideLoading(): void {
        this.loadingEl?.kill();
        this.loadingEl = null;
    }

    // ------------------------------------------------------------- input

    private bindInput(engine: Engine): void {
        const targets: (Window | HTMLElement)[] = [window, engine.canvas];
        try {
            if (window.top && window.top !== window) targets.push(window.top);
        } catch {
            // cross-origin parent
        }
        for (const t of targets) {
            t.addEventListener("keydown", this.onKey as EventListener);
            t.addEventListener("pointerdown", this.onPointer as EventListener);
        }
        engine.canvas.addEventListener("touchstart", this.onTouch, { passive: false });
        engine.canvas.addEventListener("touchmove", this.onTouch, { passive: false });
        engine.canvas.addEventListener("touchend", this.onTouch, { passive: false });
        engine.canvas.addEventListener("touchcancel", this.onTouch, { passive: false });
        this.gestureTargets = targets;
    }

    private unbindInput(): void {
        for (const t of this.gestureTargets) {
            t.removeEventListener("keydown", this.onKey as EventListener);
            t.removeEventListener("pointerdown", this.onPointer as EventListener);
        }
        this.gestureTargets = [];
        const canvas = this.engineRef?.canvas;
        if (canvas) {
            canvas.removeEventListener("touchstart", this.onTouch);
            canvas.removeEventListener("touchmove", this.onTouch);
            canvas.removeEventListener("touchend", this.onTouch);
            canvas.removeEventListener("touchcancel", this.onTouch);
        }
    }

    private gesture(_event: Event): void {
        unlockOkaAudio();
        if (this.leaving < 0) startOkaMusic();
        this.hud?.hideTitle();
    }

    private readTouches(event: TouchEvent): void {
        event.preventDefault();
        this.gesture(event);
        if (!this.touchEl) {
            this.touchEl = new ScreenElement({ x: 0, y: 0, z: 99 });
            this.touchEl.graphics.use(touchPad());
            this.touchEl.graphics.opacity = 0.9;
            this.add(this.touchEl);
        }
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        let left = false;
        let right = false;
        let jump = false;
        for (let i = 0; i < event.touches.length; i++) {
            const t = event.touches[i];
            const x = ((t.clientX - rect.left) / rect.width) * VIEW_W;
            if (x > VIEW_W * 0.6) jump = true;
            else if (x < 135) left = true;
            else if (x < VIEW_W * 0.4) right = true;
        }
        if (jump && !this.touch.jump) this.touch.jumpPressed = true;
        this.touch.left = left;
        this.touch.right = right;
        this.touch.jump = jump;
    }

    private readInput(engine: Engine): MoriInput {
        const k = engine.input.keyboard;
        const pad = engine.input.gamepads.at(0);
        const stick = pad ? pad.getAxes(Axes.LeftStickX) : 0;
        const stickY = pad ? pad.getAxes(Axes.LeftStickY) : 0;
        const padJumpHeld = pad ? pad.isButtonPressed(Buttons.Face1) : false;
        const padJumpPressed = pad ? pad.wasButtonPressed(Buttons.Face1) : false;
        const jumpKeys = [Keys.Space, Keys.Up, Keys.W, Keys.Z, Keys.K];
        const input: MoriInput = {
            left: k.isHeld(Keys.Left) || k.isHeld(Keys.A) || stick < -0.35 || (pad?.isButtonPressed(Buttons.DpadLeft) ?? false) || this.touch.left,
            right: k.isHeld(Keys.Right) || k.isHeld(Keys.D) || stick > 0.35 || (pad?.isButtonPressed(Buttons.DpadRight) ?? false) || this.touch.right,
            up: k.isHeld(Keys.Up) || k.isHeld(Keys.W) || stickY < -0.5,
            down: k.isHeld(Keys.Down) || k.isHeld(Keys.S) || stickY > 0.5 || (pad?.isButtonPressed(Buttons.DpadDown) ?? false),
            jumpHeld: jumpKeys.some((key) => k.isHeld(key)) || padJumpHeld || this.touch.jump,
            jumpPressed: jumpKeys.some((key) => k.wasPressed(key)) || padJumpPressed || this.touch.jumpPressed,
        };
        this.touch.jumpPressed = false;
        if (input.left || input.right || input.jumpPressed) {
            startOkaMusic();
            this.hud?.hideTitle();
        }
        return input;
    }

    private advancePressed(engine: Engine): boolean {
        const k = engine.input.keyboard;
        const pad = engine.input.gamepads.at(0);
        const pressed = k.wasPressed(Keys.Enter) || k.wasPressed(Keys.Space) || this.touch.jumpPressed
            || (pad?.wasButtonPressed(Buttons.Face1) ?? false);
        this.touch.jumpPressed = false;
        return pressed;
    }

    // ------------------------------------------------------------- world

    protected put<T extends Actor>(actor: T): T {
        this.add(actor);
        this.built.push(actor);
        return actor;
    }

    private teardown(): void {
        for (const a of this.built) a.kill();
        this.built = [];
        this.hud?.destroy();
        this.hud = null;
        this.touchEl?.kill();
        this.touchEl = null;
        this.cardEl = null;
        this.fadeEl = null;
        this.hideLoading();
        // parallax, effects and motes are plain actors in the scene
        for (const a of this.actors.slice()) a.kill();
        this.cave = new OkaPhysics();
        this.creatures = [];
        this.items = [];
        this.waters = [];
        this.mori = null;
        this.parallax = null;
        this.effects = null;
    }

    protected hooks(): OkaHooks {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const scene = this;
        return {
            get physics() {
                return scene.cave;
            },
            get hero() {
                return scene.mori as Mori;
            },
            sfx: (name: OkaSfx, x?: number, rate?: number, gain?: number) => scene.sfx(name, x, rate, gain),
            burst: (kind: BurstKind, x: number, y: number, count?: number) => scene.effects?.burst(kind, x, y, count),
            ripple: (water: WaterRegion, x: number, strength: number) => scene.ripple(water, x, strength),
        };
    }

    protected sfx(name: OkaSfx, x?: number, rate = 1, gain = 1): void {
        const pan = x === undefined ? 0 : Math.max(-0.8, Math.min(0.8, (x - this.camX) / (VIEW_W / 2)));
        playOkaSfx(name, pan, rate, gain);
    }

    private ripple(region: WaterRegion, x: number, strength: number): void {
        const w = this.waters.find((water) => water.region === region);
        w?.ripple(x, strength);
    }

    private reset(): void {
        this.teardown();
        this.won = false;
        this.winTime = 0;
        this.restingTime = 0;
        this.leaving = -1;
        this.crystals = 0;
        this.checkpoint = { ...this.level.start };
        this.build();
        startOkaMusic();
    }

    /** The item that marks a checkpoint. Its `onTouched` is wired by the scene. */
    protected makeCheckpoint(x: number, y: number): BaseItem {
        return new GlowShrooms({ x, y, z: 4 }, true);
    }

    /** The item that wins the level when touched. */
    protected makeGoal(x: number, y: number): BaseItem {
        return new Heartstone({ x, y, z: 4 });
    }

    /** Add scene-specific layers after the level is built. */
    protected decorate(): void {}

    /** Called every frame after the camera moves. `left` is the world x at the screen's left edge. */
    protected frame(_dt: number, _left: number): void {}

    private build(): void {
        const c = this.config;
        const L = this.level;
        const hooks = this.hooks();
        const atlas = c.art.atlas;
        const variant = c.variant;

        this.parallax = new CaveParallax(this, { backdrop: c.art.backdrop, mid: c.art.mid, near: c.art.near }, c.parallax);
        this.parallax.build();
        this.effects = new Effects(this, c.bursts);
        for (const m of c.motes) this.effects.seedMotes(m.count, m.style);

        for (const [x0, x1, top] of L.ground) {
            for (const a of placeGround(atlas, this.cave, x0, x1, top)) this.put(a);
        }
        for (const [x, top] of L.walls) this.put(placeWall(atlas, this.cave, x, top));
        for (const piece of L.pieces) this.put(placePiece(atlas, this.cave, piece));
        for (const pool of L.pools) {
            const region = this.cave.addWater(pool.x0 - 14, pool.surface, pool.x1 - pool.x0 + 28, pool.floor - pool.surface + 80);
            this.cave.addSolid(pool.x0, pool.floor, pool.x1 - pool.x0, 120);
            this.waters.push(this.put(new Water(region, pool.floor + 20, c.water)));
        }
        // level bounds
        this.cave.solids.push({ x: -100, y: -400, w: 100, h: 1200 });
        this.cave.solids.push({ x: L.width, y: -400, w: 100, h: 1200 });

        for (const f of L.fixtures) {
            const Ctor = FIXTURES[f.name];
            const item = new Ctor({ x: f.x, y: f.y, z: f.front ? 14 : 4, flip: f.flip, scale: f.scale, variant });
            this.items.push(this.put(item));
        }
        for (const [x, y] of L.checkpoints) {
            const mark = this.makeCheckpoint(x, y);
            mark.onTouched = () => this.reachCheckpoint(mark);
            this.items.push(this.put(mark));
        }
        for (const [x, y] of L.crystals) {
            const crystal = new BlueCrystal({ x, y, variant });
            crystal.onTouched = () => this.collectCrystal(crystal);
            this.items.push(this.put(crystal));
        }
        for (const [x, y] of L.hearts) {
            const heart = new HeartMoss({ x, y, variant });
            heart.onTouched = () => this.collectHeart(heart);
            this.items.push(this.put(heart));
        }
        const goal = this.makeGoal(L.heartstone.x, L.heartstone.y);
        goal.onTouched = () => this.win();
        this.items.push(this.put(goal));

        const mori = new Mori(L.start.x, L.start.y, hooks);
        mori.onSplash = (water, x, strength) => {
            this.ripple(water, x, strength);
            this.effects?.burst("splash", x, water.y, Math.round(6 + strength * 8));
            this.sfx("splash", x, 1.1 - strength * 0.15);
        };
        this.mori = this.put(mori);

        for (const [x, minX, maxX, y] of L.mossbacks) {
            this.creatures.push(this.put(new Mossback(x, y ?? 440, minX, maxX, hooks, variant)));
        }
        for (const [x, y, rx, ry] of L.glimmerflies) {
            this.creatures.push(this.put(new Glimmerfly(x, y, rx, ry, hooks, variant)));
        }
        for (const pool of L.gloomfins) {
            this.creatures.push(this.put(new Gloomfin(this.cave.waters[pool], hooks, variant)));
        }

        this.hud = new OkaHud(this, c.crystalIcon, L.crystals.length, c.hud);
        this.hud.setHearts(mori.hearts, mori.maxHearts);
        this.camX = this.clampCam(L.start.x + 200);
        this.lastLeft = this.camX - VIEW_W / 2;
        this.camera.zoom = 1;
        this.camera.pos = vec(this.camX, VIEW_H / 2);
        this.parallax.layout(this.lastLeft, 0);
        this.decorate();
        if (c.card) {
            // rise out of the chapter card's black
            this.fadeEl = new ScreenElement({ x: 0, y: 0, z: 250 });
            this.fadeEl.graphics.use(veil(c.card.background));
            this.fadeTime = 1.8;
            this.put(this.fadeEl);
        }
        console.log(`🏰 ${c.name} built: ${L.crystals.length} crystals, ${this.creatures.length} creatures, ${this.items.length} items`);
    }

    // ------------------------------------------------------------- events

    private collectCrystal(c: BlueCrystal): void {
        this.crystals++;
        this.hud?.setCrystals(this.crystals);
        this.effects?.burst("sparkle", c.pos.x, c.pos.y, 12);
        this.sfx("crystal", c.pos.x, 0.94 + Math.random() * 0.12);
        if (this.crystals === this.level.crystals.length) this.hud?.say(this.config.text.allCrystals, 3.4);
    }

    private collectHeart(h: HeartMoss): void {
        const mori = this.mori;
        if (!mori) return;
        mori.hearts = Math.min(mori.maxHearts, mori.hearts + 1);
        this.hud?.setHearts(mori.hearts, mori.maxHearts);
        this.effects?.burst("heart", h.pos.x, h.pos.y, 14);
        this.sfx("heart", h.pos.x);
    }

    private reachCheckpoint(mark: BaseItem): void {
        this.checkpoint = { x: mark.pos.x, y: mark.pos.y - 2 };
        this.effects?.burst("glow", mark.pos.x, mark.pos.y - 30, 16);
        const [name, rate] = this.config.checkpointSfx;
        this.sfx(name, mark.pos.x, rate);
        this.hud?.say(this.config.text.checkpoint);
    }

    protected win(): void {
        if (this.won) return;
        this.won = true;
        this.winTime = 0;
        const stone = this.level.heartstone;
        const t = this.config.text;
        this.effects?.burst("poof", stone.x, stone.y - 80, 40);
        this.effects?.burst("sparkle", stone.x, stone.y - 80, 30);
        duckOkaMusic(0.35, 4.5);
        this.sfx("win", stone.x);
        const total = this.level.crystals.length;
        const next = this.config.next;
        this.hud?.showPanel([
            t.winTitle,
            `${t.crystals} gathered: ${this.crystals} of ${total}`,
            this.crystals === total ? t.winAll : t.winSome,
            next ? next.prompt : "Press Enter to explore again",
        ]);
        if (next) {
            const scene = this.engine.scenes[next.scene];
            if (scene instanceof OkaScene) void scene.prefetch();
        }
        console.log(`🏰 ${this.config.name} cleared with ${this.crystals}/${total} crystals`);
    }

    /** Fade to the next scene's chapter card, then go there. */
    private beginLeaving(): void {
        const next = this.config.next;
        if (!next || this.leaving >= 0) return;
        this.leaving = 0;
        fadeOkaMusic(CARD_FADE + CARD_HOLD);
        this.cardEl = new ScreenElement({ x: 0, y: 0, z: 300 });
        this.cardEl.graphics.use(chapterCard(next.card));
        this.cardEl.graphics.opacity = 0;
        this.put(this.cardEl);
        console.log(`🏰 ${this.config.name} hands over to ${next.scene}`);
    }

    private loseLife(): void {
        const mori = this.mori;
        if (!mori) return;
        this.restingTime = 1.3;
        this.hud?.say(this.config.text.rest, 1.6);
    }

    // ------------------------------------------------------------- loop

    private clampCam(x: number): number {
        return Math.max(VIEW_W / 2, Math.min(this.level.width - VIEW_W / 2, x));
    }

    onPreUpdate(engine: Engine, delta: number): void {
        const mori = this.mori;
        if (!mori || !this.loaded) return;
        const dt = Math.min(delta / 1000, 1 / 30);
        const idle: MoriInput = { left: false, right: false, up: false, down: false, jumpHeld: false, jumpPressed: false };

        if (this.leaving >= 0) {
            this.leaving += dt;
            if (this.cardEl) this.cardEl.graphics.opacity = Math.min(1, this.leaving / CARD_FADE);
            mori.step(idle, dt);
            const next = this.config.next;
            if (next && this.leaving > CARD_FADE + CARD_HOLD) {
                window.history.replaceState(null, "", `#${next.scene}`);
                engine.goToScene(next.scene);
            }
            return;
        }
        if (this.won) {
            this.winTime += dt;
            if (this.config.next && engine.input.keyboard.wasPressed(Keys.R)) {
                this.reset();
                return;
            }
            const go = this.winTime > 1.5 && this.advancePressed(engine);
            if (go || (this.config.next && this.winTime > AUTO_ADVANCE)) {
                if (this.config.next) this.beginLeaving();
                else this.reset();
                return;
            }
            mori.step(idle, dt);
        } else if (this.restingTime > 0) {
            this.restingTime -= dt;
            mori.graphics.opacity = Math.max(0, this.restingTime - 0.5);
            if (this.restingTime <= 0) {
                mori.respawn(this.checkpoint.x, this.checkpoint.y);
                mori.graphics.opacity = 1;
                this.hud?.setHearts(mori.hearts, mori.maxHearts);
                this.effects?.burst("glow", mori.rig.x, mori.rig.y - 30, 14);
            }
        } else {
            mori.step(this.readInput(engine), dt);
            this.collide(mori);
            if (mori.rig.y > VIEW_H + 80) {
                mori.hearts -= 1;
                this.sfx("hurt", mori.rig.x);
                if (mori.hearts <= 0) {
                    this.loseLife();
                } else {
                    mori.respawn(this.checkpoint.x, this.checkpoint.y, false);
                }
            } else if (mori.dead) {
                this.loseLife();
            }
            this.hud?.setHearts(Math.max(0, mori.hearts), mori.maxHearts);
        }
    }

    private collide(mori: Mori): void {
        const b = mori.rig;
        const heroBox = { x: b.x - b.w / 2, y: b.y - b.h, w: b.w, h: b.h };
        for (const c of this.creatures) {
            if (!c.alive || c.isKilled()) continue;
            const box = c.box();
            if (!overlap(heroBox, box)) continue;
            const falling = b.vy > 60;
            const fromAbove = b.y - box.y < Math.min(22, box.h * 0.6);
            if (c.stompable && falling && fromAbove) {
                c.stomp();
                mori.bounce(this.readJumpHeld() ? 560 : 420);
                this.effects?.burst("dust", b.x, b.y, 6);
            } else if (!mori.invulnerable) {
                mori.hurt(box.x + box.w / 2);
            }
        }
        for (const item of this.items) {
            if (item.used && item.pickable) continue;
            if (item.isKilled()) continue;
            if (overlap(heroBox, item.touchBox())) item.touch();
        }
        this.creatures = this.creatures.filter((c) => !c.isKilled());
        this.items = this.items.filter((i) => !i.isKilled());
    }

    private readJumpHeld(): boolean {
        const k = this.engine.input.keyboard;
        return k.isHeld(Keys.Space) || k.isHeld(Keys.Up) || k.isHeld(Keys.W) || k.isHeld(Keys.Z) || this.touch.jump;
    }

    onPostUpdate(_engine: Engine, delta: number): void {
        const mori = this.mori;
        if (!mori || !this.parallax || !this.effects) return;
        const dt = Math.min(delta / 1000, 1 / 30);
        const b = mori.rig;
        const lead = Math.max(-90, Math.min(90, b.vx * 0.38));
        const target = this.clampCam(b.x + lead);
        this.camX += (target - this.camX) * Math.min(1, dt * 4.5);
        this.camX = this.clampCam(this.camX);
        const camY = VIEW_H / 2;
        this.camera.pos = vec(this.camX, camY);
        const left = this.camX - VIEW_W / 2;
        this.parallax.layout(left, dt);
        this.effects.update(dt, left, this.lastLeft);
        this.lastLeft = left;
        this.hud?.update(dt);
        this.frame(dt, left);
        if (this.fadeEl) {
            this.fadeTime -= dt;
            this.fadeEl.graphics.opacity = Math.max(0, Math.min(1, this.fadeTime / 1.2));
            if (this.fadeTime <= 0) {
                this.fadeEl.kill();
                this.fadeEl = null;
            }
        }
    }
}
