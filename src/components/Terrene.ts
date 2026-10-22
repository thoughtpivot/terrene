import {
    Color,
    DefaultLoader,
    DefaultLoaderOptions,
    DisplayMode,
    Engine,
    Loadable,
    PointerScope,
} from "excalibur";
import OkaWorld, { OKA_WORLD_SCENE } from "./scenes/OkaWorld/OkaWorld";
import OkaWorldTwo, { OKA_WORLD_TWO_SCENE } from "./scenes/OkaWorld/2/OkaWorldTwo";
import SapWorld, { SAP_WORLD_SCENE } from "./scenes/SapWorld/SapWorld";
import Street, { STREET_SCENE } from "./scenes/Street/Street";
import HeavenOrHell, { HEAVEN_OR_HELL_SCENE } from "./scenes/HeavenOrHell/HeavenOrHell";
import ZeldaCave from "./scenes/ZeldaCave/ZeldaCave";
import ZeldaLand from "./scenes/ZeldaLand/ZeldaLand";
import { ZELDA_CAVE_SCENE, ZELDA_LAND_SCENE } from "./scenes/ZeldaLand/run";
import WorldOne, { Resources as WorldOneResources } from "./scenes/WorldOne/WorldOne";
import WorldOneTwo, { WORLD_ONE_TWO_SCENE } from "./scenes/WorldOneTwo/WorldOneTwo";

export class SilentLoader extends DefaultLoader {
    constructor(loadables?: Loadable<unknown>[] | DefaultLoaderOptions) {
        super(Array.isArray(loadables) ? { loadables } : loadables);
    }

    override onDraw(): void {
        // Suppress Excalibur's startup splash screen and loading spinner.
    }

    override async onUserAction(): Promise<void> {}

    override async onBeforeLoad(): Promise<void> {}

    override async onAfterLoad(): Promise<void> {}
}

const WORLD_ONE_SCENE = "worldone";
const DEFAULT_SCENE = OKA_WORLD_SCENE;

/** Scenes that can be opened straight from the URL, e.g. /#worldone. An empty or unknown hash opens the default. */
const ROUTED_SCENES = [
    OKA_WORLD_SCENE,
    OKA_WORLD_TWO_SCENE,
    WORLD_ONE_SCENE,
    SAP_WORLD_SCENE,
    STREET_SCENE,
    HEAVEN_OR_HELL_SCENE,
];

const HASH_ALIASES: Record<string, string> = {
    forestlastsapworld: SAP_WORLD_SCENE,
    sapwell: SAP_WORLD_SCENE,
    sap: SAP_WORLD_SCENE,
    sceneone: STREET_SCENE,
    "heaven-or-hell": HEAVEN_OR_HELL_SCENE,
    heaven: HEAVEN_OR_HELL_SCENE,
    hoh: HEAVEN_OR_HELL_SCENE,
};

const SCENE_TITLES: Record<string, string> = {
    [OKA_WORLD_SCENE]: "Oka World",
    [OKA_WORLD_TWO_SCENE]: "Oka World 2",
    [WORLD_ONE_SCENE]: "World 1-1",
    [SAP_WORLD_SCENE]: "Forest Last Sap World",
    [STREET_SCENE]: "Street",
    [HEAVEN_OR_HELL_SCENE]: "Heaven Or Hell",
};

function sceneFromHash(): string {
    const raw = window.location.hash.replace(/^#\/?/, "").toLowerCase();
    const hash = HASH_ALIASES[raw] ?? raw;
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

    override async load(loader: DefaultLoader, hideLoader = false): Promise<void> {
        const silent = loader instanceof SilentLoader
            ? loader
            : new SilentLoader([...loader.resources]);
        return super.load(silent, hideLoader);
    }

    initialize(): Promise<void> {
        const loader = new SilentLoader([WorldOneResources.Image]);

        return this.start(loader).then(() => {
            this.addScene(WORLD_ONE_SCENE, new WorldOne());
            this.addScene(WORLD_ONE_TWO_SCENE, new WorldOneTwo());
            this.addScene(ZELDA_LAND_SCENE, new ZeldaLand());
            this.addScene(ZELDA_CAVE_SCENE, new ZeldaCave());
            this.addScene(OKA_WORLD_SCENE, new OkaWorld());
            this.addScene(OKA_WORLD_TWO_SCENE, new OkaWorldTwo());
            this.addScene(SAP_WORLD_SCENE, new SapWorld());
            this.addScene(STREET_SCENE, new Street());
            this.addScene(HEAVEN_OR_HELL_SCENE, new HeavenOrHell());
            const first = sceneFromHash();
            console.log(first === DEFAULT_SCENE
                ? `🏰 Engine started, loading ${SCENE_TITLES[first]} as the default scene`
                : `🏰 Engine started, opening ${SCENE_TITLES[first]} from the URL`);
            this.goToScene(first);
            window.addEventListener("hashchange", () => this.goToScene(sceneFromHash()));
        });
    }
}

export default Terrene;
