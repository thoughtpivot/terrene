import { Canvas, ImageFiltering, Scene, ScreenElement } from "excalibur";
import { css, mix } from "./color";
import { GLYPHS, GlyphName } from "./icons";
import { Ctx, FAMILY, drawFrame, drawRule, font, glowAlpha, inkText, setSpacing, wrapText } from "./paint";
import { UiTheme } from "./theme";
import { Button, GiftCard, GiftData, Panel, TabBar, Tooltip, UiWidget, WidgetOptions } from "./widgets";

/** A centred title with a lit rule and a line of italic beneath. */
export class Heading extends UiWidget {
    title: string;
    subtitle: string;

    constructor(o: WidgetOptions & { title: string; subtitle?: string }) {
        super({ pad: 20, ...o });
        this.title = o.title;
        this.subtitle = o.subtitle ?? "";
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        font(ctx, FAMILY.displayBold, 26);
        setSpacing(ctx, 5);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.save();
        ctx.shadowColor = css(t.glow, glowAlpha(t, this.time, 4) * 0.7);
        ctx.shadowBlur = 18;
        ctx.fillStyle = css(t.heading);
        ctx.fillText(this.title.toUpperCase(), this.w / 2 + 2.5, 30);
        ctx.restore();
        setSpacing(ctx, 0);
        drawRule(ctx, this.w / 2 - 190, 44, 380, t, 0.7);
        ctx.save();
        ctx.fillStyle = css(t.goldBright);
        ctx.shadowColor = css(t.glow, 0.9);
        ctx.shadowBlur = 8;
        ctx.translate(this.w / 2, 44.5);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-3, -3, 6, 6);
        ctx.restore();
        if (this.subtitle) {
            font(ctx, FAMILY.bodyItalic, 17);
            inkText(ctx, this.subtitle, this.w / 2, 68, css(t.textDim), t, 3);
        }
    }
}

/** A screen of widgets shown over the HUD behind a dark veil. */
export abstract class UiScreen {
    protected widgets: UiWidget[] = [];
    protected buttons: Button[] = [];
    private veil: ScreenElement;
    private veilCanvas: Canvas;
    private shown = false;

    constructor(protected scene: Scene, protected width: number, protected height: number) {
        this.veilCanvas = new Canvas({
            width,
            height,
            cache: true,
            quality: 1,
            filtering: ImageFiltering.Blended,
            draw: (ctx) => {
                const g = ctx.createRadialGradient(this.width / 2, this.height * 0.45, 60, this.width / 2, this.height * 0.45, this.width * 0.7);
                g.addColorStop(0, "rgba(4,4,6,0.62)");
                g.addColorStop(1, "rgba(2,2,3,0.9)");
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, this.width, this.height);
            },
        });
        this.veil = new ScreenElement({ x: 0, y: 0, z: 110 });
        this.veil.graphics.use(this.veilCanvas);
        scene.add(this.veil);
    }

    protected add<T extends UiWidget>(w: T): T {
        w.element.z = Math.max(w.element.z, 112);
        this.widgets.push(w);
        if (w instanceof Button) this.buttons.push(w);
        w.addTo(this.scene);
        return w;
    }

    /** Place every widget from reference coordinates. */
    abstract layout(scale: number, pixelRatio: number, ox: number, oy: number): void;

    get visible(): boolean {
        return this.shown;
    }

    show(on: boolean): void {
        this.shown = on;
        this.veil.graphics.isVisible = on;
        for (const w of this.widgets) w.visible = on;
    }

    setTheme(t: UiTheme): void {
        for (const w of this.widgets) w.setTheme(t);
    }

    update(dt: number): void {
        if (!this.shown) return;
        for (const w of this.widgets) w.update(dt);
    }

    pointerMove(x: number, y: number, down: boolean): void {
        for (const b of this.buttons) {
            if (b.state === "disabled") continue;
            b.setState(b.contains(x, y) ? (down ? "pressed" : "hover") : "normal");
        }
    }

    pointerDown(x: number, y: number): void {
        for (const b of this.buttons) {
            if (b.state !== "disabled" && b.contains(x, y)) {
                b.setState("pressed");
                b.onClick?.();
            }
        }
    }

    destroy(): void {
        for (const w of this.widgets) w.destroy();
        this.veil.kill();
    }
}

// ------------------------------------------------------------------ kit

const KIT_CARDS: GiftData[] = [
    { name: "Covering Wings", rarity: "common", category: "Form", text: "10% less posture damage when blocking from the front.", requirement: "Steadfast 20", glyph: "wings" },
    { name: "Full of Eyes", rarity: "rare", category: "Spirit", text: "Enemies behind you flash when they wind up an attack.", requirement: "Wisdom 35", glyph: "eye" },
    { name: "Turned Not", rarity: "advanced", category: "Form", text: "Dashing forward grants hyperarmor, but you can't steer during it.", requirement: "Swiftness 40", glyph: "wheel" },
    { name: "Brimstone Lungs", rarity: "rare", category: "Fallen", text: "Your Outcry breathes fire and brimstone. Each use adds 2 Stain.", requirement: "Stain 25", glyph: "flame", fallen: true },
];

/** Every reusable widget together: panel, buttons, tab bar, the three rarity frames and a tooltip. */
export class KitScreen extends UiScreen {
    private heading = this.add(new Heading({ w: 600, h: 76, title: "The Kit", subtitle: "Panels, buttons, tabs, Gift cards and tooltips", seed: 11 }));
    private panel = this.add(
        new Panel({
            w: 330,
            h: 250,
            seed: 12,
            title: "The Reliquary",
            subtitle: "Pass one Anointed item down",
            body: "Spend Testimony to keep a single Anointed weapon for your next kindling. Its Brand, if it bears one, comes with it.",
        }),
    );
    private accept = this.add(new Button({ w: 140, h: 40, label: "Keep", hint: "E", seed: 13 }));
    private decline = this.add(new Button({ w: 140, h: 40, label: "Let go", seed: 14 }));
    private locked = this.add(new Button({ w: 296, h: 40, label: "Sealed until Tier IV", seed: 15 }));
    private tabs = this.add(new TabBar({ w: 330, tabs: ["Gifts", "Hymns", "Vows", "Relics"], seed: 16 }));
    private cards = KIT_CARDS.map((data, i) => this.add(new GiftCard({ w: 160, h: 236, data, seed: 20 + i })));
    private tip = this.add(new Tooltip({ w: 286, seed: 30 }));

    constructor(scene: Scene, width: number, height: number) {
        super(scene, width, height);
        this.locked.setState("disabled");
        this.tabs.onChange = () => undefined;
        this.tip.show("Full of Eyes", "Rare Gift · Spirit", "Enemies behind you flash when they wind up an attack. Pairs with the Wheelborn's Rings of Eyes.", "\u201cTheir rings were full of eyes round about.\u201d");
        this.cards[1].setHover(true);
        this.show(false);
    }

    layout(s: number, pr: number, ox: number, oy: number): void {
        const at = (w: UiWidget, x: number, y: number) => w.place(ox + x * s, oy + y * s, s, pr);
        at(this.heading, 340, 92);
        at(this.panel, 96, 196);
        at(this.accept, 113, 386);
        at(this.decline, 273, 386);
        at(this.locked, 113, 462);
        at(this.tabs, 96, 520);
        this.cards.forEach((c, i) => at(c, 460 + i * 180, 206));
        at(this.tip, 918, 456);
    }

    pointerMove(x: number, y: number, down: boolean): void {
        super.pointerMove(x, y, down);
        this.tabs.setHover(this.tabs.hit(x, y));
        this.cards.forEach((c, i) => c.setHover(c.contains(x, y) || (i === 1 && !this.cards.some((k) => k.contains(x, y)))));
    }

    pointerDown(x: number, y: number): void {
        super.pointerDown(x, y);
        const i = this.tabs.hit(x, y);
        if (i >= 0) this.tabs.select(i);
    }
}

// ------------------------------------------------------------ gift hand

const HAND: GiftData[] = [
    { name: "Covering Wings", rarity: "common", category: "Form", text: "10% less posture damage when blocking from the front.", requirement: "Steadfast 20", glyph: "wings" },
    { name: "Lion's Face", rarity: "common", category: "Arms", text: "Your flourish deals +15% posture damage.", requirement: "Might 25", glyph: "face" },
    { name: "Live Coal Parry", rarity: "rare", category: "Tongue · Seraph-Fire", text: "A successful parry Hushes the attacker for 1.5 seconds.", requirement: "Seraph-Fire 30", glyph: "coal" },
    { name: "Full of Eyes", rarity: "rare", category: "Spirit", text: "Enemies behind you flash when they wind up an attack.", requirement: "Wisdom 35", glyph: "eye" },
    { name: "Turned Not", rarity: "advanced", category: "Form", text: "Dashing forward grants hyperarmor, but you can't steer during it.", requirement: "Swiftness 40", glyph: "wheel" },
];

const FALLEN_CARD: GiftData = {
    name: "Brimstone Lungs",
    rarity: "rare",
    category: "Fallen",
    text: "Your Outcry breathes fire and brimstone. Each use adds 2 Stain.",
    requirement: "Stain 25",
    glyph: "flame",
    fallen: true,
};

/** Feathers and the Stay card, drawn as a small strip. */
class FeatherStrip extends UiWidget {
    feathers = 2;

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        font(ctx, FAMILY.ui, 10);
        setSpacing(ctx, 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        inkText(ctx, "FEATHERS", this.w / 2 - 40, this.h / 2, css(t.textDim), t, 2);
        setSpacing(ctx, 0);
        for (let i = 0; i < 3; i++) {
            const lit = i < this.feathers;
            const x = this.w / 2 + 14 + i * 16;
            ctx.save();
            if (lit) {
                ctx.shadowColor = css(t.glow, 0.9);
                ctx.shadowBlur = 8;
            }
            ctx.fillStyle = css(lit ? t.goldBright : t.bars.track);
            ctx.strokeStyle = css(t.gold, 0.7);
            ctx.translate(x, this.h / 2);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.strokeRect(-4, -4, 8, 8);
            ctx.restore();
        }
    }
}

/**
 * The Gift hand on Ascension: four or five cards, pick one. From Tier 3 with
 * 25 Stain or more a Fallen card competes for a place, as the progression doc
 * describes.
 */
export class GiftHandScreen extends UiScreen {
    private heading = this.add(new Heading({ w: 640, h: 80, title: "Ascension VII", subtitle: "Choose one Gift. The rest are lost to the wind.", seed: 41 }));
    private cards = HAND.map((data, i) => this.add(new GiftCard({ w: 172, h: 252, data, seed: 50 + i })));
    private feathers = this.add(new FeatherStrip({ w: 220, h: 26, seed: 60 }));
    private ban = this.add(new Button({ w: 168, h: 40, label: "Ban card", hint: "◆1", seed: 61 }));
    private stay = this.add(new Button({ w: 168, h: 40, label: "Stay", hint: "Fold", seed: 62 }));
    private take = this.add(new Button({ w: 200, h: 44, label: "Take Gift", hint: "E", seed: 63 }));
    private picked = 2;
    private fallen = false;

    constructor(scene: Scene, width: number, height: number) {
        super(scene, width, height);
        this.show(false);
        this.cards[this.picked].selected = true;
    }

    setTheme(t: UiTheme): void {
        super.setTheme(t);
        const fallen = t.tier >= 3 && t.stain >= 25;
        if (fallen !== this.fallen) {
            this.fallen = fallen;
            this.cards[1].data = fallen ? FALLEN_CARD : HAND[1];
            this.cards[1].invalidate();
        }
    }

    layout(s: number, pr: number, ox: number, oy: number): void {
        const at = (w: UiWidget, x: number, y: number) => w.place(ox + x * s, oy + y * s, s, pr);
        at(this.heading, 320, 92);
        const total = 5 * 172 + 4 * 20;
        this.cards.forEach((c, i) => at(c, 640 - total / 2 + i * 192, 196));
        at(this.feathers, 530, 470);
        at(this.ban, 352, 508);
        at(this.take, 540, 506);
        at(this.stay, 760, 508);
    }

    pointerMove(x: number, y: number, down: boolean): void {
        super.pointerMove(x, y, down);
        const over = this.cards.findIndex((c) => c.contains(x, y));
        this.cards.forEach((c, i) => c.setHover(i === over || (over < 0 && i === this.picked)));
    }

    pointerDown(x: number, y: number): void {
        super.pointerDown(x, y);
        const i = this.cards.findIndex((c) => c.contains(x, y));
        if (i >= 0) {
            this.cards[this.picked].selected = false;
            this.picked = i;
            this.cards[i].selected = true;
            this.cards.forEach((c) => c.invalidate());
        }
    }
}

// ---------------------------------------------------------------- choirs

interface ChoirData {
    name: string;
    echo: string;
    stats: string;
    leans: string;
    passive: string;
    passiveText: string;
    flaw: string;
    glyph: GlyphName;
}

const CHOIRS: ChoirData[] = [
    { name: "Kindled", echo: "Seraphim", stats: "+3 Faith  +2 Voice", leans: "Parries and fire", passive: "Live Coal", passiveText: "A parry while holding the Coal deals +20% posture damage, purges an ailment and Sears the attacker.", flaw: "Burning Bright", glyph: "coal" },
    { name: "Four-Faced", echo: "Cherubim", stats: "+3 Might  +2 Steadfast", leans: "Posture, adapting", passive: "Turning Face", passiveText: "At each altar, set a face: Lion, Ox, Eagle or Man, until your next rest.", flaw: "Unturning", glyph: "face" },
    { name: "Wheelborn", echo: "Ophanim", stats: "+3 Wisdom  +2 Swiftness", leans: "Awareness, learning", passive: "Rings of Eyes", passiveText: "Ambushes are outlined, and attacks from outside your view telegraph 0.1 s sooner.", flaw: "Seeing Too Much", glyph: "wheel" },
    { name: "Lordling", echo: "Dominions", stats: "+3 Wisdom  +2 Voice", leans: "Hymns, navigation", passive: "Star-Reckoner", passiveText: "Landmarks show their distance, and your first Hymn in each fight costs 25% less Grace.", flaw: "Aloof", glyph: "crown" },
    { name: "Virtuant", echo: "Virtues", stats: "+3 Faith  +2 Swiftness", leans: "Statuses, rolling", passive: "Charged Step", passiveText: "Rolling through an attack gives your next Hymn +15% status buildup.", flaw: "Lightning Rod", glyph: "crystal" },
    { name: "Bindborn", echo: "Powers", stats: "+3 Might  +2 Faith", leans: "Breaking demons", passive: "Restraint", passiveText: "+10% posture damage to demons, and chains of light hold a guard-broken demon longer.", flaw: "Marked Jailer", glyph: "chain" },
    { name: "Banneret", echo: "Principalities", stats: "+3 Voice  +2 Steadfast", leans: "Fighting beside allies", passive: "Rally", passiveText: "Allied angels near you regain posture faster, and your Outcry restores theirs.", flaw: "Of the Host", glyph: "banner" },
    { name: "Watcher-kin", echo: "Guardian Angels", stats: "+3 Steadfast  +2 Wisdom", leans: "Surviving, at a cost", passive: "Keeper", passiveText: "Allies you revive return stronger, and you rise from a knockdown with hyperarmor.", flaw: "The Old Fall", glyph: "watcher" },
];

class ChoirTile extends UiWidget {
    selected = false;
    hover = false;

    constructor(o: WidgetOptions, public data: ChoirData) {
        super({ pad: 24, ...o });
    }

    protected animated(): boolean {
        return super.animated() || this.selected;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const focus = this.selected ? 1 : this.hover ? 0.55 : 0;
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, bevel: 8, focus, crest: this.selected });
        const cx = this.w / 2;
        ctx.save();
        const g = ctx.createRadialGradient(cx, 44, 2, cx, 44, 40);
        g.addColorStop(0, css(t.glow, (0.1 + 0.2 * focus) * (this.selected ? glowAlpha(t, this.time, 5) * 1.6 : 1)));
        g.addColorStop(1, css(t.glow, 0));
        ctx.fillStyle = g;
        ctx.fillRect(cx - 40, 4, 80, 80);
        ctx.shadowColor = css(t.glow, 0.5 + 0.5 * focus);
        ctx.shadowBlur = 10;
        const c = css(mix(t.text, t.goldBright, 0.3 + 0.5 * focus));
        ctx.strokeStyle = c;
        ctx.fillStyle = c;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        GLYPHS[this.data.glyph](ctx, cx, 44, 17);
        ctx.restore();
        font(ctx, FAMILY.displayBold, 15);
        setSpacing(ctx, 1.5);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        inkText(ctx, this.data.name.toUpperCase(), cx + 0.75, 92, css(this.selected ? t.heading : mix(t.text, t.heading, 0.4)), t, 3);
        setSpacing(ctx, 0);
        font(ctx, FAMILY.bodyItalic, 13.5);
        inkText(ctx, `an echo of the ${this.data.echo}`, cx, 109, css(t.textDim), t, 2);
        drawRule(ctx, 18, 118, this.w - 36, t, 0.4);
        font(ctx, FAMILY.ui, 8.5);
        setSpacing(ctx, 0.6);
        inkText(ctx, this.data.stats.toUpperCase(), cx, 134, css(mix(t.textDim, t.goldBright, 0.35)), t, 2);
        setSpacing(ctx, 0);
    }
}

class ChoirDetail extends UiWidget {
    choir: ChoirData = CHOIRS[0];

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const c = this.choir;
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, bevel: 10, crest: true });
        font(ctx, FAMILY.ui, 9);
        setSpacing(ctx, 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        inkText(ctx, `CHOIR · ${c.echo.toUpperCase()}`, 26, 34, css(t.textDim), t, 2);
        setSpacing(ctx, 0);
        font(ctx, FAMILY.displayBold, 24);
        setSpacing(ctx, 2);
        inkText(ctx, c.name.toUpperCase(), 26, 64, css(t.heading), t, 4);
        setSpacing(ctx, 0);
        font(ctx, FAMILY.ui, 10.5);
        setSpacing(ctx, 1.2);
        inkText(ctx, c.stats.toUpperCase(), 26, 84, css(mix(t.text, t.goldBright, 0.35)), t, 2);
        setSpacing(ctx, 0);
        drawRule(ctx, 16, 98, this.w - 32, t, 0.5);

        let y = 124;
        const section = (label: string, title: string, body: string, color = t.heading) => {
            font(ctx, FAMILY.ui, 8.5);
            setSpacing(ctx, 2);
            inkText(ctx, label, 26, y, css(t.textDim), t, 2);
            setSpacing(ctx, 0);
            y += 18;
            font(ctx, FAMILY.displayBold, 15);
            inkText(ctx, title, 26, y, css(color), t, 3);
            y += 20;
            if (body) {
                font(ctx, FAMILY.body, 14.5);
                for (const l of wrapText(ctx, body, this.w - 52)) {
                    inkText(ctx, l, 26, y, css(t.text, 0.92), t, 2);
                    y += 18;
                }
            }
            y += 10;
        };
        section("SIGNATURE PASSIVE", c.passive, c.passiveText);
        section("LEANS TOWARD", c.leans, "");
        section("FLAW", c.flaw, "", mix(t.heading, t.warning, 0.55));
    }
}

/** Character creation, step one: choose a Choir freely, as Dan decided. */
export class ChoirScreen extends UiScreen {
    private heading = this.add(new Heading({ w: 640, h: 80, title: "Kindle the Tenth", subtitle: "Choose your Choir. Nothing is rolled.", seed: 71 }));
    private steps = this.add(new TabBar({ w: 1012, tabs: ["Choir", "Tongues", "Arms", "Boons", "Origin", "Appearance", "Testimony"], seed: 72 }));
    private tiles = CHOIRS.map((c, i) => this.add(new ChoirTile({ w: 156, h: 150, seed: 80 + i }, c)));
    private detail = this.add(new ChoirDetail({ w: 336, h: 326, seed: 90 }));
    private kindle = this.add(new Button({ w: 336, h: 44, label: "Kindle", hint: "E", seed: 91 }));
    private selected = 0;

    constructor(scene: Scene, width: number, height: number) {
        super(scene, width, height);
        this.tiles[0].selected = true;
        this.show(false);
    }

    layout(s: number, pr: number, ox: number, oy: number): void {
        const at = (w: UiWidget, x: number, y: number) => w.place(ox + x * s, oy + y * s, s, pr);
        at(this.heading, 320, 70);
        at(this.steps, 134, 156);
        this.tiles.forEach((t, i) => at(t, 134 + (i % 4) * 166, 212 + Math.floor(i / 4) * 164));
        at(this.detail, 810, 212);
        at(this.kindle, 810, 552);
    }

    pointerMove(x: number, y: number, down: boolean): void {
        super.pointerMove(x, y, down);
        this.steps.setHover(this.steps.hit(x, y));
        this.tiles.forEach((t) => {
            const h = t.contains(x, y);
            if (h !== t.hover) {
                t.hover = h;
                t.invalidate();
            }
        });
    }

    pointerDown(x: number, y: number): void {
        super.pointerDown(x, y);
        const i = this.tiles.findIndex((t) => t.contains(x, y));
        if (i >= 0) this.select(i);
    }

    select(i: number): void {
        this.tiles[this.selected].selected = false;
        this.tiles[this.selected].invalidate();
        this.selected = i;
        this.tiles[i].selected = true;
        this.tiles[i].invalidate();
        this.detail.choir = CHOIRS[i];
        this.detail.invalidate();
    }
}
