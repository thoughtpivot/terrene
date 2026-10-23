import { Color, Engine, KeyEvent, Keys, PointerEvent, Scene, ScreenElement, Subscription, Text, TextAlign } from "excalibur";
import { clamp, css, hex, mix } from "./color";
import { FontSources, loadUiFonts, uiFont } from "./fonts";
import { HdScreen } from "./hd";
import { HohHud } from "./hud";
import { HALO_MARK_LABELS, haloState, tierView } from "./hudState";
import { Ctx, FAMILY, drawBar, drawFrame, drawRule, font, inkText, rng, setSpacing } from "./paint";
import { CHOIR_PICKS, DIFFICULTY_OPTIONS } from "./creation";
import { CreationScreen } from "./creationScreen";
import { GiftHandScreen, KitScreen, UiScreen } from "./screens";
import { MAX_CORRUPTION, MAX_STAIN, ROMAN, TIER_NAMES, UiTheme } from "./theme";
import { CooldownInput, HotbarSlotData, HudValues, TabBar, UiWidget } from "./widgets";

export const HEAVEN_OR_HELL_UI_SCENE = "heavenorhellui";

const VIEW_W = 1280;
const VIEW_H = 720;
const TABS = ["HUD", "Kit", "Gift Hand", "Creation"];
const CREATION_TAB = 3;

/** A stand-in for the world under the HUD: a dark floor and one light pool, tinted by corruption. */
class Backdrop extends UiWidget {
    constructor() {
        super({ w: VIEW_W, h: VIEW_H, pad: 0, z: 0, seed: 1 });
    }

    protected animated(): boolean {
        return false;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const k = t.hell;
        const top = mix(hex("#1a1a1e"), hex("#170d0d"), k);
        const bottom = mix(hex("#0e0e10"), hex("#0a0606"), k);
        const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
        g.addColorStop(0, css(bottom));
        g.addColorStop(0.45, css(top));
        g.addColorStop(1, css(bottom));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        // isometric floor seams
        ctx.strokeStyle = css(mix(hex("#59575a"), hex("#4a3533"), k), 0.07);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -VIEW_H; i < VIEW_W + VIEW_H; i += 64) {
            ctx.moveTo(i, VIEW_H);
            ctx.lineTo(i + VIEW_H * 1.2, 0);
            ctx.moveTo(i, 0);
            ctx.lineTo(i + VIEW_H * 1.2, VIEW_H);
        }
        ctx.stroke();
        // a light pool: an altar at Tier 0, a breach by Tier 5
        const pool = mix(hex("#ffd98a"), hex("#ff3a1e"), smooth(k));
        const pg = ctx.createRadialGradient(VIEW_W * 0.52, VIEW_H * 0.46, 10, VIEW_W * 0.52, VIEW_H * 0.46, 330);
        pg.addColorStop(0, css(pool, 0.2));
        pg.addColorStop(0.4, css(pool, 0.07));
        pg.addColorStop(1, css(pool, 0));
        ctx.fillStyle = pg;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        if (t.cracks > 0) this.fissure(ctx, t.cracks);
        const v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.3, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.7);
        v.addColorStop(0, "rgba(0,0,0,0)");
        v.addColorStop(1, "rgba(0,0,0,0.75)");
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    /** A breach in the floor: two jagged arms out of the light pool, forking, longer as the cracks deepen. */
    private fissure(ctx: Ctx, amount: number): void {
        const r = rng(19);
        const cx = VIEW_W * 0.52;
        const cy = VIEW_H * 0.46;
        const arm = (dir: number, len: number, width: number, depth: number, x0: number, y0: number, angle: number) => {
            const pts: Array<[number, number]> = [[x0, y0]];
            let x = x0;
            let y = y0;
            let a = angle;
            const steps = Math.max(2, Math.round(len / 14));
            for (let i = 0; i < steps; i++) {
                a += (r() - 0.5) * 0.9;
                x += Math.cos(a) * 14 * dir;
                y += Math.sin(a) * 7;
                pts.push([x, y]);
            }
            for (let i = 1; i < pts.length; i++) {
                const k = 1 - i / pts.length;
                ctx.lineWidth = Math.max(0.4, width * k);
                ctx.beginPath();
                ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
                ctx.lineTo(pts[i][0], pts[i][1]);
                ctx.stroke();
            }
            if (depth > 0) {
                for (let i = 2; i < pts.length - 1; i += 3) {
                    if (r() < 0.6) arm(dir, len * 0.35, width * 0.5, depth - 1, pts[i][0], pts[i][1], a + (r() < 0.5 ? -0.8 : 0.8));
                }
            }
        };
        ctx.save();
        ctx.lineCap = "round";
        ctx.shadowColor = css(hex("#ff2a10"), 0.9);
        ctx.shadowBlur = 10;
        ctx.strokeStyle = css(hex("#ff5a28"), 0.25 + 0.4 * amount);
        const len = 60 + 220 * amount;
        arm(1, len, 2.6, 1, cx, cy, 0.15);
        arm(-1, len * 0.8, 2.2, 1, cx, cy, -0.1);
        ctx.restore();
    }
}

function smooth(x: number): number {
    return x * x * (3 - 2 * x);
}

type Track = { x: number; y: number; w: number };

/**
 * Scrub World Corruption and Stain, pick lives, and toggle the animation.
 * Over the HUD it is a panel top-left; over the menu screens it folds into a
 * strip along the bottom so it never covers them.
 */
class Controls extends UiWidget {
    lives = 2;
    paused = false;
    sweeping = false;
    compact = false;
    corruptionTrack: Track = { x: 22, y: 76, w: 236 };
    stainTrack: Track = { x: 22, y: 134, w: 236 };
    livesAt = { x: 22, y: 172 };

    constructor() {
        super({ w: 280, h: 212, pad: 20, z: 120, seed: 7 });
    }

    setCompact(on: boolean): void {
        if (on === this.compact) return;
        this.compact = on;
        if (on) {
            this.corruptionTrack = { x: 150, y: 34, w: 220 };
            this.stainTrack = { x: 410, y: 34, w: 200 };
            this.livesAt = { x: 650, y: 30 };
            this.resize(940, 52);
        } else {
            this.corruptionTrack = { x: 22, y: 76, w: 236 };
            this.stainTrack = { x: 22, y: 134, w: 236 };
            this.livesAt = { x: 22, y: 172 };
            this.resize(280, 212);
        }
    }

    track(kind: "corruption" | "stain"): Track {
        return kind === "corruption" ? this.corruptionTrack : this.stainTrack;
    }

    protected paint(ctx: Ctx): void {
        const t: UiTheme = this.theme;
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, bevel: 8, fillAlpha: 1.1 });
        font(ctx, FAMILY.displayBold, 12);
        setSpacing(ctx, 3);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        inkText(ctx, "UI PREVIEW", 22, this.compact ? 31 : 28, css(t.heading), t, 2);
        setSpacing(ctx, 0);
        font(ctx, FAMILY.ui, 9);
        ctx.textAlign = "right";
        inkText(ctx, this.paused ? "PAUSED · P" : this.sweeping ? "SWEEPING · T" : "LIVE · P", this.w - 22, this.compact ? 31 : 28, css(t.textDim), t, 2);
        if (!this.compact) drawRule(ctx, 12, 38, this.w - 24, t, 0.45);

        const tv = tierView(t.corruption);
        const ct = this.corruptionTrack;
        this.slider(ctx, this.compact ? "CORRUPTION" : "WORLD CORRUPTION", `${t.corruption.toFixed(2)} · Tier ${ROMAN[tv.tier]}`, ct, t.corruption / MAX_CORRUPTION, [0.2, 0.4, 0.6, 0.8], t);
        if (!this.compact) {
            font(ctx, FAMILY.bodyItalic, 13);
            ctx.textAlign = "left";
            inkText(ctx, TIER_NAMES[tv.tier], ct.x, ct.y + 24, css(t.textDim), t, 2);
        }
        const halo = haloState(this.lives, t.stain);
        this.slider(ctx, "STAIN", `${Math.round(t.stain)} · ${HALO_MARK_LABELS[halo.mark]}`, this.stainTrack, t.stain / MAX_STAIN, [0.25, 0.5, 0.75], t);

        const { x: lx, y: ly } = this.livesAt;
        font(ctx, FAMILY.ui, 9);
        setSpacing(ctx, 1.6);
        ctx.textAlign = "left";
        inkText(ctx, "LIVES · L", lx, ly + 4, css(t.textDim), t, 2);
        setSpacing(ctx, 0);
        [2, 1, 0].forEach((n, i) => {
            const x = lx + 72 + i * 40;
            const on = this.lives === n;
            drawFrame(ctx, { x, y: ly - 10, w: 34, h: 22, theme: t, time: this.time, seed: 70 + i, bevel: 4, focus: on ? 1 : 0, fillAlpha: on ? 1.2 : 0.7 });
            font(ctx, FAMILY.uiBold, 10);
            ctx.textAlign = "center";
            inkText(ctx, String(n), x + 17, ly + 5, css(on ? t.text : t.textDim), t, 2);
        });
    }

    private slider(ctx: Ctx, label: string, value: string, track: Track, share: number, ticks: number[], t: UiTheme): void {
        const { x, y, w } = track;
        font(ctx, FAMILY.ui, 9);
        setSpacing(ctx, 1.6);
        ctx.textAlign = "left";
        inkText(ctx, label, x, y - 12, css(t.textDim), t, 2);
        setSpacing(ctx, 0);
        font(ctx, FAMILY.uiBold, 10);
        ctx.textAlign = "right";
        inkText(ctx, value, x + w, y - 12, css(t.text), t, 2);
        drawBar(ctx, { x, y: y - 2, w, h: 4, fill: share, colors: { hi: t.goldBright, lo: mix(t.goldBright, t.danger, share) }, theme: t, time: this.time });
        for (const k of ticks) {
            ctx.fillStyle = css(t.ink, 0.9);
            ctx.fillRect(x + w * k - 0.5, y - 2, 1, 4);
        }
        ctx.save();
        ctx.translate(x + w * share, y);
        ctx.rotate(Math.PI / 4);
        ctx.shadowColor = css(t.glow, 0.9);
        ctx.shadowBlur = 8;
        ctx.fillStyle = css(mix(t.text, t.goldBright, 0.4));
        ctx.fillRect(-4.5, -4.5, 9, 9);
        ctx.strokeStyle = css(t.ink, 0.9);
        ctx.strokeRect(-4.5, -4.5, 9, 9);
        ctx.restore();
    }

    /** Which control a screen point is on. */
    hit(px: number, py: number): { kind: "corruption" | "stain"; share: number } | { kind: "lives"; lives: number } | null {
        if (!this.contains(px, py)) return null;
        const p = this.local(px, py);
        for (const kind of ["corruption", "stain"] as const) {
            const tr = this.track(kind);
            if (Math.abs(p.y - tr.y) < 12 && p.x >= tr.x - 8 && p.x <= tr.x + tr.w + 8) return { kind, share: clamp((p.x - tr.x) / tr.w) };
        }
        const { x: lx, y: ly } = this.livesAt;
        if (Math.abs(p.y - ly) < 13) {
            const i = Math.floor((p.x - lx - 72) / 40);
            if (i >= 0 && i < 3) return { kind: "lives", lives: [2, 1, 0][i] };
        }
        return null;
    }
}

interface PreviewHook {
    set(o: { corruption?: number; stain?: number; lives?: number; tab?: number; paused?: boolean; time?: number; sweep?: boolean; step?: number }): void;
    state(): { corruption: number; stain: number; lives: number; tab: number; paused: boolean; ready: boolean; step: number };
}

const WEAPON: HotbarSlotData = { key: "1", name: "Sword", glyph: "sword" };
const HYMNS: Array<HotbarSlotData & { period: number; offset: number }> = [
    { key: "2", name: "Coal of the Altar", glyph: "flame", cost: 30, period: 7, offset: 0, cooldown: { remaining: 0, duration: 4.5 } },
    { key: "3", name: "Terrible Crystal", glyph: "crystal", cost: 45, period: 11, offset: 3, cooldown: { remaining: 0, duration: 8 } },
    { key: "4", name: "Wheel of Eyes", glyph: "wheel", cost: 60, period: 15, offset: 6, cooldown: { remaining: 0, duration: 12 } },
    { key: "5", name: "Psalm of Mending", glyph: "voice", cost: 40, period: 13, offset: 9, cooldown: { remaining: 0, duration: 10 } },
    { key: "6", name: "Wing-Beat", glyph: "wings", cost: 20, period: 5, offset: 1, cooldown: { remaining: 0, duration: 3 } },
    { key: "7", name: "", glyph: null, period: 1, offset: 0 },
];

const DIALOGUE = [
    { speaker: "Altar-keeper", text: "Kneel, little flame. The Courts are quieter than they were, but not for long." },
    { speaker: "Altar-keeper", text: "Every tier the smoke climbs higher. Seal what breaches you can, and keep your halo whole." },
    { speaker: "The Tenth", text: "And if it cracks?" },
    { speaker: "Altar-keeper", text: "Then pray it cracks slowly. I can mend a dimmed halo. I cannot mend a stained one." },
];

const TOASTS: Array<[string, string, "grace" | "info" | "warning" | "danger"]> = [
    ["Witness", "Swore the Vow of the Herald · +5 Testimony", "grace"],
    ["Hymn learned", "Coal of the Altar · Seraph-Fire", "info"],
    ["A breach widens", "The Outer Courts draw a tier nearer", "warning"],
    ["Guard broken", "Your posture gave way", "danger"],
];

/**
 * A preview of the Heaven Or Hell UI kit at /#heavenorhellui: the HUD with
 * dummy values animating, every reusable widget, a Gift hand and the Choir
 * picker, with World Corruption and Stain scrubbable live.
 */
export default class UiPreview extends Scene {
    private engineRef: Engine | null = null;
    private hd = new HdScreen(VIEW_W, VIEW_H);
    private built = false;
    private building: Promise<void> | null = null;
    private hud: HohHud | null = null;
    private backdrop: Backdrop | null = null;
    private controls: Controls | null = null;
    private tabBar: TabBar | null = null;
    private screens: UiScreen[] = [];
    private creation!: CreationScreen;
    private help: ScreenElement | null = null;
    private subs: Subscription[] = [];
    private corruption = 0;
    private stain = 0;
    private tab = 0;
    private sim = 0;
    private dragging: "corruption" | "stain" | null = null;
    private pointerDown = false;
    private lastTier = 0;
    private lastMark = "pure";
    private toastClock = 0;
    private toastIndex = 0;
    private dialogueClock = 0;

    onInitialize(engine: Engine): void {
        this.engineRef = engine;
    }

    onActivate(): void {
        const engine = this.engineRef ?? this.engine;
        this.engineRef = engine;
        this.hd.enter(engine, Color.fromHex("#050506"));
        document.getElementById("loading")?.remove();
        this.readQuery();
        console.log("🏰 Heaven Or Hell UI preview activated");
        this.exposeHook();
        if (this.built) {
            this.relayout();
            this.bindInput(engine);
            return;
        }
        if (!this.building) {
            this.building = loadUiFonts().then(() => {
                this.build();
                if ((engine.currentScene as Scene) === this) {
                    this.relayout();
                    this.bindInput(engine);
                }
            });
        }
    }

    onDeactivate(): void {
        for (const s of this.subs) s.close();
        this.subs = [];
        this.dragging = null;
        if (this.engineRef) this.hd.leave(this.engineRef);
        console.log("🏰 Heaven Or Hell UI preview deactivated");
    }

    private readQuery(): void {
        const q = new URLSearchParams(window.location.search);
        const num = (k: string) => (q.has(k) ? Number(q.get(k)) : undefined);
        this.corruption = clamp(num("c") ?? this.corruption, 0, MAX_CORRUPTION);
        this.stain = clamp(num("s") ?? this.stain, 0, MAX_STAIN);
        this.tab = clamp(Math.floor(num("tab") ?? this.tab), 0, TABS.length - 1);
        this.sim = num("t") ?? this.sim;
    }

    private build(): void {
        this.backdrop = new Backdrop();
        this.backdrop.addTo(this);
        this.hud = new HohHud(this, VIEW_W, VIEW_H, { promptDuringDialogue: true, toastOffset: 52 });
        this.hud.setHotbar(WEAPON, HYMNS);
        this.hud.showPrompt("E", "Pray at the altar");
        this.controls = new Controls();
        this.controls.addTo(this);
        this.tabBar = new TabBar({ w: 440, tabs: TABS, seed: 9, z: 121 });
        this.tabBar.addTo(this);
        this.tabBar.onChange = (i) => this.setTab(i);
        this.creation = new CreationScreen(this, VIEW_W, VIEW_H);
        this.screens = [new KitScreen(this, VIEW_W, VIEW_H), new GiftHandScreen(this, VIEW_W, VIEW_H), this.creation];
        this.creation.onComplete = (r) => {
            const choir = CHOIR_PICKS.find((c) => c.id === r.choir)?.name ?? r.choir;
            const road = DIFFICULTY_OPTIONS.find((d) => d.id === r.difficulty)?.name ?? r.difficulty;
            console.log("🕊️ The Tenth is kindled", r);
            this.setTab(0);
            this.hud?.toast("The Tenth is kindled", `${choir} \u00b7 ${road}`, "grace");
        };
        const pr = this.hd.pixelRatio;
        const text = new Text({
            text: "← →  corruption    ↑ ↓  stain    0–5  tier\nL  lives    H  hit    Space  dialogue\n[ ]  screens    P  pause    T  sweep",
            font: uiFont(FontSources.ui, 10.5, Color.fromHex("#8f897e"), Math.max(2, pr * 2), TextAlign.Right),
        });
        this.help = new ScreenElement({ x: VIEW_W - 24, y: VIEW_H - 66, z: 99 });
        this.help.graphics.use(text);
        this.add(this.help);
        this.built = true;
        const q = new URLSearchParams(window.location.search);
        if (this.controls && q.has("lives")) this.controls.lives = Number(q.get("lives"));
        if (this.controls && q.get("paused") === "1") this.controls.paused = true;
        this.lastTier = Math.floor(this.corruption);
        this.lastMark = haloState(2, this.stain).mark;
        this.hud.say(DIALOGUE);
        this.hud.toast(...TOASTS[0]);
        this.hud.toast(...TOASTS[2]);
        this.setTab(this.tab);
        this.applyTheme();
        console.log("✅ Heaven Or Hell UI preview built");
    }

    private relayout(): void {
        const pr = this.hd.pixelRatio;
        this.hud?.layout(VIEW_W, VIEW_H, pr);
        this.backdrop?.place(0, 0, 1, pr);
        this.placeControls();
        this.tabBar?.place(VIEW_W / 2 - 220, 22, 1, pr);
        for (const s of this.screens) s.layout(1, pr, 0, 0);
    }

    private placeControls(): void {
        if (!this.controls) return;
        const pr = this.hd.pixelRatio;
        this.controls.setCompact(this.tab > 0);
        if (this.controls.compact) this.controls.place(22, VIEW_H - 22 - this.controls.h, 1, pr);
        else this.controls.place(22, 22, 1, pr);
    }

    private setTab(i: number): void {
        this.tab = i;
        this.tabBar?.select(i);
        this.screens.forEach((s, k) => s.show(k === i - 1));
        // a menu screen takes the place of the in-world HUD
        this.hud?.setVisible(i === 0);
        this.placeControls();
    }

    private applyTheme(): void {
        if (!this.hud) return;
        this.hud.setCorruption(this.corruption, this.stain);
        const t = this.hud.theme;
        this.backdrop?.setTheme(t);
        this.controls?.setTheme(t);
        this.tabBar?.setTheme(t);
        for (const s of this.screens) s.setTheme(t);
        const tier = Math.min(MAX_CORRUPTION, Math.floor(this.corruption));
        if (tier !== this.lastTier) {
            if (tier > this.lastTier) this.hud.toast(`Tier ${ROMAN[tier]} · ${TIER_NAMES[tier]}`, "World Corruption rises", tier >= 3 ? "danger" : "warning");
            this.lastTier = tier;
        }
        const mark = haloState(2, this.stain).mark;
        if (mark !== this.lastMark) {
            const order = ["pure", "hairline", "cracked", "fallen", "regard", "fall"];
            if (order.indexOf(mark) > order.indexOf(this.lastMark) && mark !== "hairline") {
                const lines: Record<string, string> = {
                    cracked: "A crack runs through your halo",
                    fallen: "Your Choir turns toward Hell",
                    regard: "Hell's elites hesitate before you",
                    fall: "How art thou fallen from heaven",
                };
                this.hud.toast(HALO_MARK_LABELS[mark as keyof typeof HALO_MARK_LABELS], lines[mark] ?? "", "danger");
            }
            this.lastMark = mark;
        }
    }

    private exposeHook(): void {
        const hook: PreviewHook = {
            set: (o) => {
                if (o.corruption !== undefined) this.corruption = clamp(o.corruption, 0, MAX_CORRUPTION);
                if (o.stain !== undefined) this.stain = clamp(o.stain, 0, MAX_STAIN);
                if (o.lives !== undefined && this.controls) this.controls.lives = o.lives;
                if (o.paused !== undefined && this.controls) this.controls.paused = o.paused;
                if (o.sweep !== undefined && this.controls) this.controls.sweeping = o.sweep;
                if (o.time !== undefined) this.sim = o.time;
                if (o.tab !== undefined) this.setTab(clamp(Math.floor(o.tab), 0, TABS.length - 1));
                if (o.step !== undefined) this.creation?.setStep(o.step);
                this.controls?.invalidate();
                this.applyTheme();
            },
            state: () => ({
                corruption: this.corruption,
                stain: this.stain,
                lives: this.controls?.lives ?? 2,
                tab: this.tab,
                paused: this.controls?.paused ?? false,
                ready: this.built,
                step: this.creation?.state.step ?? 0,
            }),
        };
        (window as unknown as { __hohUi?: PreviewHook }).__hohUi = hook;
    }

    // ---------------------------------------------------------------- input

    private bindInput(engine: Engine): void {
        for (const s of this.subs) s.close();
        const pointer = engine.input.pointers.primary;
        this.subs = [
            pointer.on("down", (e: PointerEvent) => this.onPointer(e, "down")),
            pointer.on("move", (e: PointerEvent) => this.onPointer(e, "move")),
            pointer.on("up", (e: PointerEvent) => this.onPointer(e, "up")),
            engine.input.keyboard.on("press", (e: KeyEvent) => this.onKey(e.key)),
        ];
    }

    private onPointer(e: PointerEvent, kind: "down" | "move" | "up"): void {
        const { x, y } = e.screenPos;
        if (kind === "down") this.pointerDown = true;
        if (kind === "up") {
            this.pointerDown = false;
            this.dragging = null;
        }
        const hit = this.controls?.hit(x, y) ?? null;
        if (kind === "down" && hit) {
            if (hit.kind === "lives") this.setLives(hit.lives);
            else this.dragging = hit.kind;
        }
        if (this.dragging && this.controls) {
            const p = this.controls.local(x, y);
            const tr = this.controls.track(this.dragging);
            const share = clamp((p.x - tr.x) / tr.w);
            if (this.dragging === "corruption") this.corruption = share * MAX_CORRUPTION;
            else this.stain = share * MAX_STAIN;
            this.controls.invalidate();
            this.applyTheme();
            return;
        }
        if (this.tabBar) {
            const i = this.tabBar.hit(x, y);
            this.tabBar.setHover(i);
            if (kind === "down" && i >= 0) this.setTab(i);
        }
        const screen = this.screens[this.tab - 1];
        if (screen) {
            if (kind === "down") screen.pointerDown(x, y);
            screen.pointerMove(x, y, this.pointerDown);
        } else if (this.hud) {
            this.hud.hotbar.active = this.hud.hotbar.hit(x, y);
            if (kind === "down" && this.hud.dialogue.contains(x, y)) this.hud.advanceDialogue();
        }
    }

    /** Creation takes the arrows, Enter and Escape; returns whether the key was used. */
    private creationKey(key: Keys): boolean {
        const c = this.creation;
        if (key === Keys.Left) c.move(-1, 0);
        else if (key === Keys.Right) c.move(1, 0);
        else if (key === Keys.Up) c.move(0, -1);
        else if (key === Keys.Down) c.move(0, 1);
        else if (key === Keys.Enter) c.goNext();
        else if (key === Keys.Escape || key === Keys.Backspace) c.goBack();
        else return false;
        return true;
    }

    private setLives(n: number): void {
        if (!this.controls) return;
        this.controls.lives = n;
        this.controls.invalidate();
        if (n < 2) this.hud?.toast(n === 1 ? "Struck down" : "Cast out", n === 1 ? "Your halo dims. Pray at an altar to mend it." : "The run is over", "danger");
    }

    private onKey(key: Keys): void {
        if (!this.controls || !this.hud) return;
        if (this.tab === CREATION_TAB && this.creationKey(key)) return;
        const digit = ["Digit0", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].indexOf(key);
        if (digit >= 0) {
            this.corruption = digit;
            this.applyTheme();
        } else if (key === Keys.L) {
            this.setLives(this.controls.lives <= 0 ? 2 : this.controls.lives - 1);
        } else if (key === Keys.P) {
            this.controls.paused = !this.controls.paused;
        } else if (key === Keys.T) {
            this.controls.sweeping = !this.controls.sweeping;
        } else if (key === Keys.Space) {
            if (!this.hud.dialogue.open) this.hud.say(DIALOGUE);
            else this.hud.advanceDialogue();
            this.dialogueClock = 0;
        } else if (key === Keys.H) {
            this.sim += 0.9;
        } else if (key === Keys.BracketRight || key === Keys.Tab) {
            this.setTab((this.tab + 1) % TABS.length);
        } else if (key === Keys.BracketLeft) {
            this.setTab((this.tab + TABS.length - 1) % TABS.length);
        }
        this.controls.invalidate();
    }

    // --------------------------------------------------------------- update

    onPreUpdate(engine: Engine, elapsed: number): void {
        if (!this.built || !this.hud || !this.controls) return;
        const dt = Math.min(0.05, elapsed / 1000);
        const kb = engine.input.keyboard;
        let changed = false;
        const arrowsFree = this.tab !== CREATION_TAB;
        if (arrowsFree && (kb.isHeld(Keys.Left) || kb.isHeld(Keys.Right))) {
            this.corruption = clamp(this.corruption + (kb.isHeld(Keys.Right) ? 1 : -1) * 1.2 * dt, 0, MAX_CORRUPTION);
            changed = true;
        }
        if (arrowsFree && (kb.isHeld(Keys.Up) || kb.isHeld(Keys.Down))) {
            this.stain = clamp(this.stain + (kb.isHeld(Keys.Up) ? 1 : -1) * 30 * dt, 0, MAX_STAIN);
            changed = true;
        }
        if (this.controls.sweeping) {
            // corruption 0 to 5 and back over 24 seconds, Stain riding along
            const phase = (performance.now() / 1000 / 24) % 1;
            const k = phase < 0.5 ? phase * 2 : 2 - phase * 2;
            this.corruption = k * MAX_CORRUPTION;
            this.stain = k * 92;
            changed = true;
        }
        if (changed) {
            this.controls.invalidate();
            this.applyTheme();
        }

        if (!this.controls.paused) {
            this.sim += dt;
            this.toastClock += dt;
            this.dialogueClock += dt;
            if (this.toastClock > 6.5) {
                this.toastClock = 0;
                this.toastIndex = (this.toastIndex + 1) % TOASTS.length;
                this.hud.toast(...TOASTS[this.toastIndex]);
            }
            if (this.dialogueClock > 4.2) {
                this.dialogueClock = 0;
                if (this.hud.dialogue.open) this.hud.advanceDialogue();
                else this.hud.say(DIALOGUE);
            }
        }
        this.hud.setValues(this.dummyValues(this.sim, this.controls.lives));
        this.hud.setHotbar(WEAPON, HYMNS.map((h) => ({ ...h, cooldown: h.glyph ? this.cycle(this.sim, h.period, h.offset, h.cooldown?.duration ?? 0) : undefined })));
        this.hud.update(dt);
        this.backdrop?.update(dt);
        this.controls.update(dt);
        this.tabBar?.update(dt);
        for (const s of this.screens) s.update(dt);
    }

    /** One cooldown that fires every `period` seconds. */
    private cycle(t: number, period: number, offset: number, duration: number, locked = false): CooldownInput {
        const p = (t + offset) % period;
        return { remaining: Math.max(0, duration - p), duration, sinceReady: p - duration, locked };
    }

    /** Dummy vitals: HP drained in hits then healed, posture filling, Grace spent and regained. */
    private dummyValues(t: number, lives: number): HudValues {
        const hpMax = 220;
        const hpCap = lives < 2 ? 150 : hpMax;
        const c = t % 16;
        const hits = Math.floor(Math.min(c, 9) / 0.9);
        const hp = c < 9 ? Math.max(34, hpCap - hits * 19) : Math.min(hpCap, 34 + ((c - 9) / 6) * (hpCap - 34));
        const pc = t % 7;
        const posture = pc < 5.6 ? Math.min(100, Math.floor(pc / 0.45) * 8.5) : Math.max(0, 100 - (pc - 5.6) * 90);
        const gc = t % 9;
        const grace = gc < 1 ? 168 - gc * 70 : Math.min(180, 98 + (gc - 1) * 14);
        const fervour = 16 + 74 * (0.5 - 0.5 * Math.cos(t * 0.55));
        const sanctity = 66 + 34 * Math.cos(t * 0.27);
        return {
            name: "The Tenth · Kindled",
            hp,
            hpMax,
            hpCap,
            posture,
            postureMax: 100,
            grace,
            graceMax: 180,
            fervour,
            fervourMax: 100,
            sanctity,
            sanctityMax: 100,
            lives,
            cooldowns: {
                roll: this.cycle(t, 3.4, 0.4, 2.2),
                parry: this.cycle(t, 2.8, 1.1, 1.6),
                block: this.cycle(t, 4.1, 2.3, 0.8),
                feint: this.cycle(t, 2.3, 0.2, 1),
                critical: this.cycle(t, 8, 3, 6),
                trumpet: this.cycle(t, 40, 12, 30, this.corruption < 4),
            },
        };
    }
}
