import { Color, DisplayMode, Engine, Loader, Physics, PointerScope, vec } from "excalibur";
import WorldOne, { Resources as WorldOneResources } from "./cities/WorldOne/WorldOne";

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
            Physics.acc = vec(0, 1700);
            console.log("🏰 Engine started, loading World 1-1 as the default scene");
            const world = new WorldOne();
            this.addScene("worldone", world);
            this.goToScene("worldone");
        });
    }
}

export default Terrene;
