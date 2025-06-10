import {
    DisplayMode,
    Engine,
    Loader,
    Vector,
    Label,
    FontUnit,
    CoordPlane,
    Color,
    Sound,
    Font,
    Transform,
    Input,
    Scene,
    PointerScope,
} from "excalibur";

import { TiledMapResource } from "@excaliburjs/plugin-tiled";

// const tiledMapResource = new TiledMapResource("./cities/Craydon/Craydon.json");

import Navosah, {
    Resources as NovosahResources,
} from "./characters/npc/WanderingMerchant/Navosah/Navosah";
// import MainMenu from "./scenes/MainMenu";
import Craydon from "./cities/Craydon/Craydon";
import Solic from "./cities/Solic/Solic";

import Sally, {
    Resources as SallyResources,
} from "./characters/npc/Sally/Sally";

import OldManSam, {
    Resources as OldManSamResources,
} from "./characters/npc/OldManSam/OldManSam";

import Horus, {
    Resources as HorusResources,
} from "./characters/npc/Goblin/Horus/Horus";

import You, { Resources as YouResources } from "./characters/player/You/You";
import { Resources as SwordResources } from "./items/weapons/Sword";

class MainMenu extends Scene {
    onInitialize(_engine: Engine): void {}
}

class Terrene extends Engine {
    constructor() {
        super({
            displayMode: DisplayMode.FitScreenAndFill,
            maxFps: 30,
            pointerScope: PointerScope.Canvas,
            antialiasing: false,
            backgroundColor: Color.Black,
            suppressPlayButton: true,
            suppressConsoleBootMessage: true,
            suppressHiDPIScaling: false,
            width: 960,
            height: 480,
        });
    }

    initialize() {
        // Temporarily suppress audio context warnings during initialization
        const originalWarn = console.warn;
        console.warn = (...args: any[]) => {
            const message = args.join(" ");
            if (
                message.includes("AudioContext") ||
                message.includes("audio context") ||
                message.includes("unlock")
            ) {
                return; // Suppress audio context warnings
            }
            originalWarn.apply(console, args);
        };

        const loader = new Loader([
            // tiledMapResource,
            NovosahResources.Image,
            OldManSamResources.Image,
            SallyResources.Image,
            YouResources.Image,
            YouResources.AsepriteResource,
            YouResources.Sound,
            HorusResources.Image,
            SwordResources.Image,
            SwordResources.AsepriteResource,
            SwordResources.Sound,
        ]);

        this.start(loader).then(() => {
            this.addScene("menu", new Solic());
            this.goToScene("menu");

            // Restore original console.warn after initialization
            setTimeout(() => {
                console.warn = originalWarn;
            }, 1000);
        });
    }
}

export default Terrene;
