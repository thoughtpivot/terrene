import { DisplayMode, Engine, Loader, Color, Scene, PointerScope, } from "excalibur";
// const tiledMapResource = new TiledMapResource("./cities/Craydon/Craydon.json");
import { Resources as NovosahResources, } from "./characters/npc/WanderingMerchant/Navosah/Navosah";
import { BreazeResources } from "./cities/Breeze/Breaze";
import { Resources as SallyResources, } from "./characters/npc/Sally/Sally";
import { Resources as OldManSamResources, } from "./characters/npc/OldManSam/OldManSam";
import { Resources as HorusResources, } from "./characters/npc/Goblin/Horus/Horus";
import { Resources as YouResources } from "./characters/player/You/You";
import { Resources as SwordResources } from "./items/weapons/Sword";
import { Resources as DonutResources } from "./items/food/Donut/Donut";
import { Resources as LorcRPGResources } from "./items/LorcRPG/LorcRPG";
import Eldergrove, { tiledMapResource as EldergroveMap } from "./cities/Eldergrove/Eldergrove";
class MainMenu extends Scene {
    onInitialize(_engine) { }
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
            height: 540,
        });
    }
    initialize() {
        // Temporarily suppress audio context warnings during initialization
        const originalWarn = console.warn;
        console.warn = (...args) => {
            const message = args.join(" ");
            if (message.includes("AudioContext") ||
                message.includes("audio context") ||
                message.includes("unlock")) {
                return; // Suppress audio context warnings
            }
            originalWarn.apply(console, args);
        };
        const loader = new Loader([
            // tiledMapResource,
            EldergroveMap,
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
            DonutResources.Image,
            DonutResources.AsepriteResource,
            LorcRPGResources.Image,
            LorcRPGResources.AsepriteResource,
            BreazeResources.Image,
            BreazeResources.AsepriteResource,
            // Eldergrove NPCs are now loaded by the scene itself
        ]);
        this.start(loader).then(() => {
            console.log("Engine started, loading Eldergrove as default scene");
            // Load Eldergrove directly as the main scene
            const eldergrove = new Eldergrove();
            this.addScene("eldergrove", eldergrove);
            this.goToScene("eldergrove");
            console.log("Eldergrove loaded as default scene");
            console.log("Canvas size:", this.canvasWidth, "x", this.canvasHeight);
            // Restore original console.warn after initialization
            setTimeout(() => {
                console.warn = originalWarn;
            }, 1000);
        });
    }
}
export default Terrene;
//# sourceMappingURL=Terrene.js.map