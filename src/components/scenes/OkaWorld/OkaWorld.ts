import type { ImageSource } from "excalibur";
import { Resources as MoriResources } from "../../characters/player/Mori/Mori";
import { Resources as GlimmerflyResources } from "../../creatures/Glimmerfly/Glimmerfly";
import { Resources as GloomfinResources } from "../../creatures/Gloomfin/Gloomfin";
import { Resources as MossbackResources } from "../../creatures/Mossback/Mossback";
import { Resources as BlueCrystalResources } from "../../items/cave/BlueCrystal/BlueCrystal";
import { Resources as BonsaiTreeResources } from "../../items/cave/BonsaiTree/BonsaiTree";
import { Resources as BouldersResources } from "../../items/cave/Boulders/Boulders";
import { Resources as FernResources } from "../../items/cave/Fern/Fern";
import { Resources as GlowShroomsResources } from "../../items/cave/GlowShrooms/GlowShrooms";
import { Resources as GrassTuftResources } from "../../items/cave/GrassTuft/GrassTuft";
import { Resources as HeartMossResources } from "../../items/cave/HeartMoss/HeartMoss";
import { Resources as HeartstoneResources } from "../../items/cave/Heartstone/Heartstone";
import { Resources as KelpResources } from "../../items/cave/Kelp/Kelp";
import { Resources as MossDripResources } from "../../items/cave/MossDrip/MossDrip";
import { Resources as MossyBoulderResources } from "../../items/cave/MossyBoulder/MossyBoulder";
import { Resources as StalagmiteResources } from "../../items/cave/Stalagmite/Stalagmite";
import { HOLLOW_CARD, OKA_WORLD_TWO_SCENE } from "./2/chapter";
import BackdropImage from "./art/backdrop.jpg";
import PillarsMidImage from "./art/pillars-mid.png";
import PillarsNearImage from "./art/pillars-near.png";
import { OKA_SOUNDTRACK } from "./audio";
import { OKA_BURSTS, OKA_MOTES } from "./effects";
import { OKA_HUD } from "./hud";
import { LEVEL } from "./level";
import OkaScene, { type OkaSceneConfig } from "./OkaScene";
import OkaWorldImage from "./OkaWorld.png";
import { paintedImage } from "./paint";
import { OKA_PARALLAX } from "./parallax";
import { OKA_WATER } from "./Water";

export const OKA_WORLD_SCENE = "okaworld";

const Resources = {
    Image: paintedImage(OkaWorldImage),
    Backdrop: paintedImage(BackdropImage),
    PillarsMid: paintedImage(PillarsMidImage),
    PillarsNear: paintedImage(PillarsNearImage),
};

export { Resources };

const IMAGES: ImageSource[] = [
    MoriResources.Image, MossbackResources.Image, GlimmerflyResources.Image, GloomfinResources.Image,
    BlueCrystalResources.Image, HeartMossResources.Image, HeartstoneResources.Image, BonsaiTreeResources.Image,
    BouldersResources.Image, MossyBoulderResources.Image, StalagmiteResources.Image, KelpResources.Image,
    FernResources.Image, GrassTuftResources.Image, MossDripResources.Image, GlowShroomsResources.Image,
];

export const OKA_WORLD: OkaSceneConfig = {
    key: OKA_WORLD_SCENE,
    name: "Oka World",
    level: LEVEL,
    variant: "light",
    background: "#16302f",
    art: { atlas: Resources.Image, backdrop: Resources.Backdrop, mid: Resources.PillarsMid, near: Resources.PillarsNear },
    images: IMAGES,
    crystalIcon: BlueCrystalResources.Image,
    soundtrack: OKA_SOUNDTRACK,
    parallax: OKA_PARALLAX,
    water: OKA_WATER,
    bursts: OKA_BURSTS,
    motes: [{ count: 46, style: OKA_MOTES }],
    hud: OKA_HUD,
    text: {
        crystals: "Crystals",
        allCrystals: "Every crystal sings. The Heartstone is listening.",
        checkpoint: "The glowcaps remember you",
        rest: "Mori rests by the glowcaps…",
        winTitle: "The Heartstone wakes",
        winAll: "Every crystal found. The cave glows for you.",
        winSome: "Some crystals still hide in the dark.",
    },
    checkpointSfx: ["heart", 1.25],
    next: {
        scene: OKA_WORLD_TWO_SCENE,
        card: HOLLOW_CARD,
        prompt: "Press Enter to follow the light down   ·   R to explore again",
    },
};

/**
 * Oka World: a hand-painted cave platformer. Misty hourglass columns drift
 * behind, jade pools glow below, and Mori follows the crystals to the
 * Heartstone at the far end of the cave. Waking it opens the way down to
 * Oka World 2.
 */
export default class OkaWorld extends OkaScene {
    constructor() {
        super(OKA_WORLD);
    }
}
