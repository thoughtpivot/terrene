import { Color, DisplayMode, Engine, Loader, Physics, PointerScope, vec } from "excalibur";
import ZeldaCave from "./scenes/ZeldaCave/ZeldaCave";
import ZeldaLand from "./scenes/ZeldaLand/ZeldaLand";
import { ZELDA_CAVE_SCENE, ZELDA_LAND_SCENE } from "./scenes/ZeldaLand/run";
import WorldOne, { Resources as WorldOneResources } from "./scenes/WorldOne/WorldOne";
import WorldOneTwo, { WORLD_ONE_TWO_SCENE } from "./scenes/WorldOneTwo/WorldOneTwo";

class Terrene extends Engine {
    constructor() {
        super({
            displayMode: DisplayMode.FitScreen,
            maxFps: 60,
            fixedUpdateFps: 60,
            pointerScope: PointerScope.Canvas,
            antialiasing: false,
            pixelRatio: 1,
            snapToPixel: true,
            backgroundColor: Color.fromHex("#5c94fc"),
            suppressPlayButton: true,
            suppressConsoleBootMessage: true,
            suppressHiDPIScaling: true,
            width: 256,
            height: 240,
        });
    }

    initialize(): void {
        const loader = new Loader([WorldOneResources.Image]);
        loader.suppressPlayButton = true;

        this.start(loader).then(() => {
            Physics.acc = vec(0, 0);
            console.log("🏰 Engine started, loading Zelda Land as the default scene");
            this.addScene(ZELDA_LAND_SCENE, new ZeldaLand());
            this.addScene(ZELDA_CAVE_SCENE, new ZeldaCave());
            this.addScene("worldone", new WorldOne());
            this.addScene(WORLD_ONE_TWO_SCENE, new WorldOneTwo());
            this.goToScene(ZELDA_LAND_SCENE);
        });
    }
}

export default Terrene;
