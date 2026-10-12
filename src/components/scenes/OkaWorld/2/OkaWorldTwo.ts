import type { ImageSource } from "excalibur";
import type BaseItem from "../../../../common/BaseItem";
import { Resources as MoriResources } from "../../../characters/player/Mori/Mori";
import Glimmerfly, { Resources as GlimmerflyResources } from "../../../creatures/Glimmerfly/Glimmerfly";
import Gloomfin, { Resources as GloomfinResources } from "../../../creatures/Gloomfin/Gloomfin";
import Mossback, { Resources as MossbackResources } from "../../../creatures/Mossback/Mossback";
import BlueCrystal, { Resources as BlueCrystalResources } from "../../../items/cave/BlueCrystal/BlueCrystal";
import { Resources as BouldersResources } from "../../../items/cave/Boulders/Boulders";
import { Resources as DeadTreeResources } from "../../../items/cave/DeadTree/DeadTree";
import { Resources as FernResources } from "../../../items/cave/Fern/Fern";
import { Resources as GrassTuftResources } from "../../../items/cave/GrassTuft/GrassTuft";
import HangingLantern, { Resources as HangingLanternResources } from "../../../items/cave/HangingLantern/HangingLantern";
import HeartMoss, { Resources as HeartMossResources } from "../../../items/cave/HeartMoss/HeartMoss";
import { Resources as KelpResources } from "../../../items/cave/Kelp/Kelp";
import { Resources as MossDripResources } from "../../../items/cave/MossDrip/MossDrip";
import { Resources as MossyBoulderResources } from "../../../items/cave/MossyBoulder/MossyBoulder";
import PaleShrooms, { Resources as PaleShroomsResources } from "../../../items/cave/PaleShrooms/PaleShrooms";
import SoulShrine, { Resources as SoulShrineResources } from "../../../items/cave/SoulShrine/SoulShrine";
import { Resources as StalagmiteResources } from "../../../items/cave/Stalagmite/Stalagmite";
import type { OkaSoundtrack } from "../audio";
import type { BurstPalette, MoteStyle } from "../effects";
import type { HudStyle } from "../hud";
import OkaScene, { type OkaSceneConfig } from "../OkaScene";
import { paintedImage } from "../paint";
import { VIEW_H, type ParallaxStyle } from "../parallax";
import type { WaterStyle } from "../Water";
import { HollowAmbience } from "./ambience";
import BackdropImage from "./art/backdrop.jpg";
import PillarsMidImage from "./art/pillars-mid.png";
import PillarsNearImage from "./art/pillars-near.png";
import { HOLLOW_CARD, OKA_WORLD_TWO_SCENE } from "./chapter";
import { LEVEL_TWO } from "./level";
import { HollowDark, type Light } from "./lighting";
import OkaWorld2Music from "./OkaWorld2.mp3";
import OkaWorld2Image from "./OkaWorld2.png";
import CrystalSfx from "./sfx/crystal.mp3";
import HeartSfx from "./sfx/heart.mp3";
import HurtSfx from "./sfx/hurt.mp3";
import JumpSfx from "./sfx/jump.mp3";
import LandSfx from "./sfx/land.mp3";
import LanternSfx from "./sfx/lantern.mp3";
import RumbleSfx from "./sfx/rumble.mp3";
import SkidSfx from "./sfx/skid.mp3";
import SplashSfx from "./sfx/splash.mp3";
import Step1Sfx from "./sfx/step-1.mp3";
import Step2Sfx from "./sfx/step-2.mp3";
import Step3Sfx from "./sfx/step-3.mp3";
import Step4Sfx from "./sfx/step-4.mp3";
import Step5Sfx from "./sfx/step-5.mp3";
import StepWet1Sfx from "./sfx/step-wet-1.mp3";
import StepWet2Sfx from "./sfx/step-wet-2.mp3";
import StepWet3Sfx from "./sfx/step-wet-3.mp3";
import StompSfx from "./sfx/stomp.mp3";
import WinSfx from "./sfx/win.mp3";

export { OKA_WORLD_TWO_SCENE };

const Resources = {
    Image: paintedImage(OkaWorld2Image),
    Backdrop: paintedImage(BackdropImage),
    PillarsMid: paintedImage(PillarsMidImage),
    PillarsNear: paintedImage(PillarsNearImage),
};

export { Resources };

const IMAGES: ImageSource[] = [
    MoriResources.Image, MossbackResources.Dark, GlimmerflyResources.Dark, GloomfinResources.Dark,
    BlueCrystalResources.Dark, HeartMossResources.Dark, BouldersResources.Dark, MossyBoulderResources.Dark,
    StalagmiteResources.Dark, KelpResources.Dark, FernResources.Dark, GrassTuftResources.Dark, MossDripResources.Dark,
    DeadTreeResources.Image, PaleShroomsResources.Image, HangingLanternResources.Image, SoulShrineResources.Image,
];

/** "Where the Lanterns Sleep", rendered by tools/oka-world/2/compose_music.py. */
const SOUNDTRACK: OkaSoundtrack = {
    name: "Where the Lanterns Sleep",
    music: OkaWorld2Music,
    loopStart: 1,
    loopLength: (32 * 4 * 60) / 60,
    level: 0.7,
    sfx: {
        jump: JumpSfx,
        crystal: CrystalSfx,
        heart: HeartSfx,
        hurt: HurtSfx,
        stomp: StompSfx,
        splash: SplashSfx,
        win: WinSfx,
        lantern: LanternSfx,
        rumble: RumbleSfx,
        step: [Step1Sfx, Step2Sfx, Step3Sfx, Step4Sfx, Step5Sfx],
        stepWet: [StepWet1Sfx, StepWet2Sfx, StepWet3Sfx],
        land: LandSfx,
        skid: SkidSfx,
    },
    sfxLevel: {
        jump: 0.3,
        crystal: 0.45,
        heart: 0.55,
        hurt: 0.65,
        stomp: 0.6,
        splash: 0.45,
        win: 0.85,
        lantern: 0.6,
        rumble: 0.5,
        step: 0.2,
        stepWet: 0.22,
        land: 0.34,
        skid: 0.24,
    },
};

/** Near-black blues: a ruined city far off, temple columns, thorned stalactites, fog that pools low. */
const PARALLAX: ParallaxStyle = {
    mist: "96,122,156",
    rays: ["170,200,235", "120,155,200"],
    raysOpacity: 0.5,
    layers: [
        { kind: "tiles", image: "backdrop", z: -100, factor: 0.04, height: VIEW_H, mirror: true, tint: "#9aa6b8" },
        { kind: "rays", z: -95, beams: [[260, 46, 0.09], [700, 80, 0.06], [1060, 38, 0.1], [1400, 60, 0.05]] },
        { kind: "tiles", image: "mid", z: -90, factor: 0.16, height: VIEW_H, opacity: 0.9, mirror: true, tint: "#6c7c94", gap: 240 },
        { kind: "mist", z: -85, factor: 0.3, y: 200, opacity: 0.4, drift: 5, height: 260 },
        { kind: "tiles", image: "near", z: -80, factor: 0.42, height: 640, gap: 560, y: -40, opacity: 0.97, mirror: true, tint: "#47536a" },
        { kind: "mist", z: -70, factor: 0.62, y: 310, opacity: 0.42, drift: -8, height: 260 },
        // fog that rolls along the floor in front of everything
        { kind: "mist", z: 13.5, factor: 1.05, y: 360, opacity: 0.2, drift: 16, height: 220 },
        // thorned stalactites in silhouette, very close to the eye
        {
            kind: "tiles", image: "near", z: 40, factor: 1.35, height: 470, gap: 1700, y: -40, mirror: true, tint: "#020306",
            view: { x: 0, y: 0, w: 0.42, h: 0.62 }, phase: 900,
        },
    ],
};

const WATER: WaterStyle = {
    body: [[0, "60,90,130", 0.55], [0.15, "20,36,62", 0.78], [0.6, "8,14,30", 0.92], [1, "2,4,10", 0.97]],
    caustic: ["120,160,220", 0.05],
    shaft: ["150,190,255", 0.05],
    surface: ["170,205,245", 0.62],
    sparkle: 0.5,
};

const BURSTS: BurstPalette = {
    sparkle: ["200,235,255", "235,245,255"],
    heart: ["255,80,110", "255,150,170"],
    splash: ["150,180,220", "90,120,170"],
    dust: ["120,130,150", "90,100,120"],
    poof: ["190,170,255", "220,210,255"],
    glow: ["170,215,255", "230,240,255"],
};

const DUST: MoteStyle = { looks: [[3, "160,170,190", 0.55], [2, "200,205,220", 0.6]], rise: [-16, -5], sway: 10 };
const SPORES: MoteStyle = { looks: [[5, "150,220,255", 0.7], [7, "190,170,255", 0.45]], rise: [3, 8], sway: 6 };

const HUD: HudStyle = {
    title: "Oka World II",
    subtitle: "The Hollow Beneath",
    hints: [
        "Arrows or A / D to move   ·   Space, W or Up to jump and swim   ·   Down + Jump drops through",
        "Carry your light to the Soul Shrine. Every lantern you light will remember you.",
    ],
    text: "#dfe9f2",
    accent: "#8fa9c4",
    shade: "2,5,10",
    loading: { text: "Descending…", background: HOLLOW_CARD.background, label: HOLLOW_CARD.text, bar: "#c9a46a" },
    emptyHeart: "10,14,24",
};

export const OKA_WORLD_TWO: OkaSceneConfig = {
    key: OKA_WORLD_TWO_SCENE,
    name: "Oka World 2",
    level: LEVEL_TWO,
    variant: "dark",
    background: "#03060b",
    art: { atlas: Resources.Image, backdrop: Resources.Backdrop, mid: Resources.PillarsMid, near: Resources.PillarsNear },
    images: IMAGES,
    crystalIcon: BlueCrystalResources.Dark,
    soundtrack: SOUNDTRACK,
    parallax: PARALLAX,
    water: WATER,
    bursts: BURSTS,
    motes: [{ count: 48, style: DUST }, { count: 20, style: SPORES }],
    hud: HUD,
    text: {
        crystals: "Soul shards",
        allCrystals: "Every shard gathered. Something in the deep stirs.",
        checkpoint: "The lantern takes your flame",
        rest: "Mori's light gutters… and returns",
        winTitle: "The Hollow remembers its light",
        winAll: "Every soul shard found. The dark draws back.",
        winSome: "Some shards still drift in the dark.",
    },
    checkpointSfx: ["lantern", 1],
    card: HOLLOW_CARD,
};

/**
 * Oka World 2, the Hollow Beneath: the same cave a long way down, where the
 * light has nearly gone. The level is darker, tighter and busier, the
 * creatures wear their Hollow colours, and Mori's lantern is the light you
 * play by. Lanterns hang on long chains as checkpoints, and the goal is the
 * Soul Shrine at the far end.
 */
export default class OkaWorldTwo extends OkaScene {
    private dark: HollowDark | null = null;
    private ambience: HollowAmbience | null = null;

    constructor() {
        super(OKA_WORLD_TWO);
    }

    protected makeCheckpoint(x: number, y: number): BaseItem {
        return new HangingLantern({ x, y, z: 4 });
    }

    protected makeGoal(x: number, y: number): BaseItem {
        return new SoulShrine({ x, y, z: 4 });
    }

    protected decorate(): void {
        this.mori?.brightenLantern();
        this.dark = new HollowDark(this, 0.66);
        this.put(this.dark.actor);
        this.ambience = new HollowAmbience(
            this,
            (pan) => this.sfx("rumble", this.camX + pan * 480, 0.85 + Math.random() * 0.2),
            () => this.camera.shake(2.5, 1.5, 700),
        );
    }

    protected frame(dt: number, left: number): void {
        const dark = this.dark;
        const mori = this.mori;
        if (!dark || !mori) return;
        this.ambience?.update(dt, left);
        const lights: Light[] = [];
        const lamp = mori.lantern;
        const presence = mori.graphics.opacity < 0.5 ? mori.graphics.opacity * 2 : 1;
        lights.push({ x: lamp.x, y: lamp.y - 6, r: 300 * (0.9 + lamp.flicker * 0.1) * (0.6 + presence * 0.4), strength: 0.97 * presence, warm: true });
        lights.push({ x: mori.rig.x, y: mori.rig.y - 30, r: 120, strength: 0.6 * presence });
        const viewL = left - 300;
        const viewR = left + 1260;
        for (const item of this.items) {
            const x = item.pos.x;
            if (x < viewL || x > viewR) continue;
            if (item instanceof HangingLantern) {
                const f = item.flame();
                const g = item.glowAmount;
                lights.push({ x: f.x, y: f.y, r: 120 + g * 190, strength: 0.55 + g * 0.4, warm: g > 0.3 });
                if (g > 0.3) lights.push({ x: item.pos.x, y: item.pos.y - 20, r: 150 * g, strength: 0.5 * g, warm: true });
            } else if (item instanceof PaleShrooms) {
                lights.push({ x, y: item.pos.y - 30, r: 150, strength: 0.75 * item.glowAmount });
            } else if (item instanceof SoulShrine) {
                const o = item.orb();
                const awake = item.awake;
                lights.push({ x: o.x, y: o.y, r: awake ? 700 : 260, strength: awake ? 1 : 0.7 * item.glowAmount + 0.2 });
            } else if (item instanceof BlueCrystal && !item.used) {
                lights.push({ x, y: item.pos.y, r: 58, strength: 0.62 });
            } else if (item instanceof HeartMoss && !item.used) {
                lights.push({ x, y: item.pos.y, r: 70, strength: 0.6 });
            }
        }
        for (const c of this.creatures) {
            if (!c.alive || c.pos.x < viewL || c.pos.x > viewR) continue;
            if (c instanceof Glimmerfly) {
                lights.push({ x: c.pos.x, y: c.pos.y, r: 110, strength: 0.66 });
            } else if (c instanceof Gloomfin) {
                lights.push({ x: c.lurePos.x, y: c.lurePos.y, r: 80, strength: 0.6 });
            } else if (c instanceof Mossback) {
                const e = c.eyeGlow();
                if (e) lights.push({ x: e.x, y: e.y, r: 70, strength: 0.45 });
            }
        }
        if (this.won) dark.lift = Math.min(1, dark.lift + dt * 0.4);
        dark.update(dt, left, lights, this.ambience?.glints() ?? [], { x: mori.rig.x, y: mori.rig.y - 40 });
    }
}
