import { Color, DisplayMode, Engine, Loader, Physics, PointerScope, vec } from "excalibur";
import OkaWorld, { OKA_WORLD_SCENE } from "./scenes/OkaWorld/OkaWorld";
import ZeldaCave from "./scenes/ZeldaCave/ZeldaCave";
import ZeldaLand from "./scenes/ZeldaLand/ZeldaLand";
import { ZELDA_CAVE_SCENE, ZELDA_LAND_SCENE } from "./scenes/ZeldaLand/run";
import WorldOne, { Resources as WorldOneResources } from "./scenes/WorldOne/WorldOne";
import WorldOneTwo, { WORLD_ONE_TWO_SCENE } from "./scenes/WorldOneTwo/WorldOneTwo";

const DEFAULT_SCENE = "worldone";

/** Scenes that can be opened straight from the URL, e.g. /#okaworld */
const ROUTED_SCENES = [DEFAULT_SCENE, OKA_WORLD_SCENE];

function sceneFromHash(): string {
    const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
    return ROUTED_SCENES.includes(hash) ? hash : DEFAULT_SCENE;
}

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
            this.addScene(DEFAULT_SCENE, new WorldOne());
            this.addScene(WORLD_ONE_TWO_SCENE, new WorldOneTwo());
            this.addScene(ZELDA_LAND_SCENE, new ZeldaLand());
            this.addScene(ZELDA_CAVE_SCENE, new ZeldaCave());
            this.addScene(OKA_WORLD_SCENE, new OkaWorld());
            const first = sceneFromHash();
            console.log(first === DEFAULT_SCENE
                ? "🏰 Engine started, loading World 1-1 as the default scene"
                : `🏰 Engine started, opening ${first} from the URL`);
            this.goToScene(first);
            window.addEventListener("hashchange", () => this.goToScene(sceneFromHash()));
        });
    }
}

export default Terrene;
