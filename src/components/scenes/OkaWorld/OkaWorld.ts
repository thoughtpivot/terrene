import {
    Actor, Axes, Buttons, Color, Engine, Keys, Scene, ScreenElement, vec,
} from "excalibur";
import type { ImageSource } from "excalibur";
import BaseItem from "../../../common/BaseItem";
import Mori, { Resources as MoriResources, type MoriInput } from "../../characters/player/Mori/Mori";
import Glimmerfly, { Resources as GlimmerflyResources } from "../../creatures/Glimmerfly/Glimmerfly";
import Gloomfin, { Resources as GloomfinResources } from "../../creatures/Gloomfin/Gloomfin";
import Mossback, { Resources as MossbackResources } from "../../creatures/Mossback/Mossback";
import BlueCrystal, { Resources as BlueCrystalResources } from "../../items/cave/BlueCrystal/BlueCrystal";
import BonsaiTree, { Resources as BonsaiTreeResources } from "../../items/cave/BonsaiTree/BonsaiTree";
import Boulders, { Resources as BouldersResources } from "../../items/cave/Boulders/Boulders";
import Fern, { Resources as FernResources } from "../../items/cave/Fern/Fern";
import GlowShrooms, { Resources as GlowShroomsResources } from "../../items/cave/GlowShrooms/GlowShrooms";
import GrassTuft, { Resources as GrassTuftResources } from "../../items/cave/GrassTuft/GrassTuft";
import HeartMoss, { Resources as HeartMossResources } from "../../items/cave/HeartMoss/HeartMoss";
import Heartstone, { Resources as HeartstoneResources } from "../../items/cave/Heartstone/Heartstone";
import Kelp, { Resources as KelpResources } from "../../items/cave/Kelp/Kelp";
import MossDrip, { Resources as MossDripResources } from "../../items/cave/MossDrip/MossDrip";
import MossyBoulder, { Resources as MossyBoulderResources } from "../../items/cave/MossyBoulder/MossyBoulder";
import Stalagmite, { Resources as StalagmiteResources } from "../../items/cave/Stalagmite/Stalagmite";
import BackdropImage from "./art/backdrop.jpg";
import PillarsMidImage from "./art/pillars-mid.png";
import PillarsNearImage from "./art/pillars-near.png";
import {
    duckOkaMusic, playOkaSfx, preloadOkaAudio, startOkaMusic, stopOkaMusic, unlockOkaAudio, type OkaSfx,
} from "./audio";
import { Effects } from "./effects";
import { overlap, type BurstKind, type OkaHooks } from "./hooks";
import { loadingCard, OkaHud, touchPad } from "./hud";
import { LEVEL, type FixtureName } from "./level";
import OkaCreature from "./OkaCreature";
import OkaWorldImage from "./OkaWorld.png";
import { paintedImage } from "./paint";
import { CaveParallax, VIEW_H, VIEW_W } from "./parallax";
import { OkaPhysics, type Water as WaterRegion } from "./physics";
import { placeGround, placePiece, placeWall } from "./terrain";
import Water from "./Water";

export const OKA_WORLD_SCENE = "okaworld";

const Resources = {
    Image: paintedImage(OkaWorldImage),
    Backdrop: paintedImage(BackdropImage),
    PillarsMid: paintedImage(PillarsMidImage),
    PillarsNear: paintedImage(PillarsNearImage),
};

export { Resources };

const FIXTURES: Record<FixtureName, new (o: { x: number; y: number; z?: number; flip?: boolean; scale?: number }) => BaseItem> = {
    BonsaiTree, Boulders, MossyBoulder, Stalagmite, Kelp, Fern, GrassTuft, MossDrip, GlowShrooms,
};

const ALL_IMAGES: ImageSource[] = [
    Resources.Image, Resources.Backdrop, Resources.PillarsMid, Resources.PillarsNear,
    MoriResources.Image, MossbackResources.Image, GlimmerflyResources.Image, GloomfinResources.Image,
    BlueCrystalResources.Image, HeartMossResources.Image, HeartstoneResources.Image, BonsaiTreeResources.Image,
    BouldersResources.Image, MossyBoulderResources.Image, StalagmiteResources.Image, KelpResources.Image,
    FernResources.Image, GrassTuftResources.Image, MossDripResources.Image, GlowShroomsResources.Image,
];

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

/**
 * Oka World: a hand-painted cave platformer. Misty hourglass columns drift
 * behind, jade pools glow below, and Mori follows the crystals to the
 * Heartstone at the far end of the cave.
 *
 * The rest of Terrene runs at 256x240 pixel art. This scene switches the
 * screen to 960x540 with smoothing while it is active and puts it back after.
 */
export default class OkaWorld extends Scene {
    private engineRef: Engine | null = null;
    private saved: SavedScreen | null = null;
    private loaded = false;
    private loading: Promise<void> | null = null;
    private progress = 0;
    private loadingEl: ScreenElement | null = null;
    private built: Actor[] = [];
    private cave = new OkaPhysics();
    private mori: Mori | null = null;
    private creatures: OkaCreature[] = [];
    private items: BaseItem[] = [];
    private waters: Water[] = [];
    private parallax: CaveParallax | null = null;
    private effects: Effects | null = null;
    private hud: OkaHud | null = null;
    private crystals = 0;
    private checkpoint = { ...LEVEL.start };
    private camX = VIEW_W / 2;
    private lastLeft = 0;
    private won = false;
    private winTime = 0;
    private restingTime = 0;
    private touch = { left: false, right: false, jump: false, jumpPressed: false };
    private touchEl: ScreenElement | null = null;
    private onKey = (event: KeyboardEvent) => this.gesture(event);
    private onPointer = (event: PointerEvent) => this.gesture(event);
    private onTouch = (event: TouchEvent) => this.readTouches(event);
    private gestureTargets: (Window | HTMLElement)[] = [];

    onInitialize(engine: Engine): void {
        this.engineRef = engine;
    }

    onActivate(): void {
        const engine = this.engineRef ?? this.engine;
        this.engineRef = engine;
        this.enterHd(engine);
        this.bindInput(engine);
        (window as unknown as { __oka?: OkaWorld }).__oka = this;
        console.log("🏰 Oka World activated");
        if (this.loaded) {
            this.reset();
            return;
        }
        this.showLoading();
        this.loading = this.loading ?? this.loadAll();
        void this.loading.then(() => {
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
        console.log("🏰 Oka World deactivated");
    }

    // ------------------------------------------------------------- screen

    private pickPixelRatio(engine: Engine): number {
        const dpr = window.devicePixelRatio || 1;
        const fit = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
        const want = Math.ceil(dpr * fit * 2) / 2;
        void engine;
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
        screen._pixelRatioOverride = this.pickPixelRatio(engine);
        engine.screen.antialiasing = true;
        engine.snapToPixel = false;
        engine.backgroundColor = Color.fromHex("#16302f");
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

    private loadAll(): Promise<void> {
        let done = 0;
        const total = ALL_IMAGES.length + 1;
        const tick = () => {
            done++;
            this.progress = done / total;
        };
        const images = ALL_IMAGES.map((img) => (img.isLoaded() ? Promise.resolve() : img.load().then(() => undefined)).then(tick));
        const sound = preloadOkaAudio().then(tick);
        return Promise.all([...images, sound]).then(() => {
            this.loaded = true;
            console.log("🏰 Oka World art and music loaded");
        }).catch((error) => {
            console.error("❌ Oka World failed to load", error);
        });
    }

    private showLoading(): void {
        this.loadingEl = new ScreenElement({ x: 0, y: 0, z: 200 });
        this.loadingEl.graphics.use(loadingCard(() => this.progress));
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
        startOkaMusic();
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

    // ------------------------------------------------------------- world

    private put<T extends Actor>(actor: T): T {
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

    private hooks(): OkaHooks {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const scene = this;
        return {
            get physics() {
                return scene.cave;
            },
            get hero() {
                return scene.mori as Mori;
            },
            sfx: (name: OkaSfx, x?: number, rate?: number) => scene.sfx(name, x, rate),
            burst: (kind: BurstKind, x: number, y: number, count?: number) => scene.effects?.burst(kind, x, y, count),
            ripple: (water: WaterRegion, x: number, strength: number) => scene.ripple(water, x, strength),
        };
    }

    private sfx(name: OkaSfx, x?: number, rate = 1): void {
        const pan = x === undefined ? 0 : Math.max(-0.8, Math.min(0.8, (x - this.camX) / (VIEW_W / 2)));
        playOkaSfx(name, pan, rate);
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
        this.crystals = 0;
        this.checkpoint = { ...LEVEL.start };
        this.build();
        startOkaMusic();
    }

    private build(): void {
        const hooks = this.hooks();
        const atlas = Resources.Image;

        this.parallax = new CaveParallax(this, {
            backdrop: Resources.Backdrop, mid: Resources.PillarsMid, near: Resources.PillarsNear,
        });
        this.parallax.build();
        this.effects = new Effects(this);
        this.effects.seedMotes(46);

        for (const [x0, x1, top] of LEVEL.ground) {
            for (const a of placeGround(atlas, this.cave, x0, x1, top)) this.put(a);
        }
        for (const [x, top] of LEVEL.walls) this.put(placeWall(atlas, this.cave, x, top));
        for (const piece of LEVEL.pieces) this.put(placePiece(atlas, this.cave, piece));
        for (const pool of LEVEL.pools) {
            const region = this.cave.addWater(pool.x0 - 14, pool.surface, pool.x1 - pool.x0 + 28, pool.floor - pool.surface + 80);
            this.cave.addSolid(pool.x0, pool.floor, pool.x1 - pool.x0, 120);
            this.waters.push(this.put(new Water(region, pool.floor + 20)));
        }
        // level bounds
        this.cave.solids.push({ x: -100, y: -400, w: 100, h: 1200 });
        this.cave.solids.push({ x: LEVEL.width, y: -400, w: 100, h: 1200 });

        for (const f of LEVEL.fixtures) {
            const Ctor = FIXTURES[f.name];
            const item = new Ctor({ x: f.x, y: f.y, z: f.front ? 14 : 4, flip: f.flip, scale: f.scale });
            this.items.push(this.put(item));
        }
        for (const [x, y] of LEVEL.checkpoints) {
            const shroom = new GlowShrooms({ x, y, z: 4 }, true);
            shroom.onTouched = () => this.reachCheckpoint(shroom);
            this.items.push(this.put(shroom));
        }
        for (const [x, y] of LEVEL.crystals) {
            const c = new BlueCrystal({ x, y });
            c.onTouched = () => this.collectCrystal(c);
            this.items.push(this.put(c));
        }
        for (const [x, y] of LEVEL.hearts) {
            const h = new HeartMoss({ x, y });
            h.onTouched = () => this.collectHeart(h);
            this.items.push(this.put(h));
        }
        const stone = new Heartstone({ x: LEVEL.heartstone.x, y: LEVEL.heartstone.y, z: 4 });
        stone.onTouched = () => this.win();
        this.items.push(this.put(stone));

        const mori = new Mori(LEVEL.start.x, LEVEL.start.y, hooks);
        mori.onSplash = (water, x, strength) => {
            this.ripple(water, x, strength);
            this.effects?.burst("splash", x, water.y, Math.round(6 + strength * 8));
            this.sfx("splash", x, 1.1 - strength * 0.15);
        };
        mori.onLand = (speed) => {
            if (speed > 420) this.effects?.burst("dust", mori.rig.x, mori.rig.y, 6);
        };
        this.mori = this.put(mori);

        for (const [x, minX, maxX] of LEVEL.mossbacks) {
            this.creatures.push(this.put(new Mossback(x, 440, minX, maxX, hooks)));
        }
        for (const [x, y, rx, ry] of LEVEL.glimmerflies) {
            this.creatures.push(this.put(new Glimmerfly(x, y, rx, ry, hooks)));
        }
        for (const pool of LEVEL.gloomfins) {
            this.creatures.push(this.put(new Gloomfin(this.cave.waters[pool], hooks)));
        }

        this.hud = new OkaHud(this, BlueCrystalResources.Image, LEVEL.crystals.length);
        this.hud.setHearts(mori.hearts, mori.maxHearts);
        this.camX = this.clampCam(LEVEL.start.x + 200);
        this.lastLeft = this.camX - VIEW_W / 2;
        this.camera.zoom = 1;
        this.camera.pos = vec(this.camX, VIEW_H / 2);
        this.parallax.layout(this.lastLeft, 0);
        console.log(`🏰 Oka World built: ${LEVEL.crystals.length} crystals, ${this.creatures.length} creatures, ${this.items.length} items`);
    }

    // ------------------------------------------------------------- events

    private collectCrystal(c: BlueCrystal): void {
        this.crystals++;
        this.hud?.setCrystals(this.crystals);
        this.effects?.burst("sparkle", c.pos.x, c.pos.y, 12);
        this.sfx("crystal", c.pos.x, 0.94 + Math.random() * 0.12);
        if (this.crystals === LEVEL.crystals.length) this.hud?.say("Every crystal sings. The Heartstone is listening.", 3.4);
    }

    private collectHeart(h: HeartMoss): void {
        const mori = this.mori;
        if (!mori) return;
        mori.hearts = Math.min(mori.maxHearts, mori.hearts + 1);
        this.hud?.setHearts(mori.hearts, mori.maxHearts);
        this.effects?.burst("heart", h.pos.x, h.pos.y, 14);
        this.sfx("heart", h.pos.x);
    }

    private reachCheckpoint(shroom: GlowShrooms): void {
        this.checkpoint = { x: shroom.pos.x, y: shroom.pos.y - 2 };
        this.effects?.burst("glow", shroom.pos.x, shroom.pos.y - 30, 16);
        this.sfx("heart", shroom.pos.x, 1.25);
        this.hud?.say("The glowcaps remember you");
    }

    private win(): void {
        if (this.won) return;
        this.won = true;
        this.winTime = 0;
        const stone = LEVEL.heartstone;
        this.effects?.burst("poof", stone.x, stone.y - 80, 40);
        this.effects?.burst("sparkle", stone.x, stone.y - 80, 30);
        duckOkaMusic(0.35, 4.5);
        this.sfx("win", stone.x);
        const total = LEVEL.crystals.length;
        this.hud?.showPanel([
            "The Heartstone wakes",
            `Crystals gathered: ${this.crystals} of ${total}`,
            this.crystals === total ? "Every crystal found. The cave glows for you." : "Some crystals still hide in the dark.",
            "Press Enter to explore again",
        ]);
        console.log(`🏰 Oka World cleared with ${this.crystals}/${total} crystals`);
    }

    private loseLife(): void {
        const mori = this.mori;
        if (!mori) return;
        this.restingTime = 1.3;
        this.hud?.say("Mori rests by the glowcaps…", 1.6);
    }

    // ------------------------------------------------------------- loop

    private clampCam(x: number): number {
        return Math.max(VIEW_W / 2, Math.min(LEVEL.width - VIEW_W / 2, x));
    }

    onPreUpdate(engine: Engine, delta: number): void {
        const mori = this.mori;
        if (!mori || !this.loaded) return;
        const dt = Math.min(delta / 1000, 1 / 30);

        if (this.won) {
            this.winTime += dt;
            if (this.winTime > 1.5 && (engine.input.keyboard.wasPressed(Keys.Enter) || this.touch.jumpPressed)) {
                this.reset();
                return;
            }
            mori.step({ left: false, right: false, up: false, down: false, jumpHeld: false, jumpPressed: false }, dt);
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
    }
}
