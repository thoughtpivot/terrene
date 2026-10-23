import {
    Color,
    DefaultLoader,
    DefaultLoaderOptions,
    DisplayMode,
    Engine,
    Loadable,
    PointerScope,
    Scene,
} from "excalibur";
import OkaWorld, { OKA_WORLD_SCENE } from "./scenes/OkaWorld/OkaWorld";
import OkaWorldTwo, { OKA_WORLD_TWO_SCENE } from "./scenes/OkaWorld/2/OkaWorldTwo";
import SapWorld, { SAP_WORLD_SCENE } from "./scenes/SapWorld/SapWorld";
import Street, { STREET_SCENE } from "./scenes/Street/Street";
import HeavenOrHell, { HEAVEN_OR_HELL_SCENE } from "./scenes/HeavenOrHell/HeavenOrHell";
import HeavenOrHellUi, { HEAVEN_OR_HELL_UI_SCENE } from "./scenes/HeavenOrHell/ui/UiPreview";
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
    HEAVEN_OR_HELL_UI_SCENE,
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
    [HEAVEN_OR_HELL_UI_SCENE]: "Heaven Or Hell UI",
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
        const first = sceneFromHash();
        // Heaven Or Hell is a DOM scene. Waiting on World 1-1 art here left
        // "Loading Terrene..." up forever when that sheet stalled, and the hash
        // scene never mounted.
        const blockOnWorldOne = first === WORLD_ONE_SCENE;
        const loader = new SilentLoader(blockOnWorldOne ? [WorldOneResources.Image] : []);
        if (!blockOnWorldOne) {
            void WorldOneResources.Image.load().catch((error: unknown) => {
                console.error(error);
            });
        }

        return this.start(loader).then(() => {
            console.log(first === DEFAULT_SCENE
                ? `🏰 Engine started, loading ${SCENE_TITLES[first]} as the default scene`
                : `🏰 Engine started, opening ${SCENE_TITLES[first]} from the URL`);

            if (first === HEAVEN_OR_HELL_SCENE) {
                this.addScene(HEAVEN_OR_HELL_SCENE, new HeavenOrHell());
                void this.goToScene(first).catch((error: unknown) => console.error(error));
            }

            this.addScenes(first === HEAVEN_OR_HELL_SCENE ? HEAVEN_OR_HELL_SCENE : undefined);

            if (first !== HEAVEN_OR_HELL_SCENE) {
                void this.goToScene(first).catch((error: unknown) => console.error(error));
            }

            window.addEventListener("hashchange", () => {
                const next = sceneFromHash();
                const go = () => {
                    void this.goToScene(next).catch((error: unknown) => console.error(error));
                };
                if (next === WORLD_ONE_SCENE && !WorldOneResources.Image.isLoaded()) {
                    void WorldOneResources.Image.load().then(go, (error: unknown) => {
                        console.error(error);
                        go();
                    });
                    return;
                }
                go();
            });
        });
    }

    /** Register every routed scene. A constructor failure must not block the scene already open. */
    private addScenes(skip?: string): void {
        const add = (name: string, create: () => Scene) => {
            if (name === skip) return;
            try {
                this.addScene(name, create());
            } catch (error) {
                console.error(error);
            }
        };
        add(WORLD_ONE_SCENE, () => new WorldOne());
        add(WORLD_ONE_TWO_SCENE, () => new WorldOneTwo());
        add(ZELDA_LAND_SCENE, () => new ZeldaLand());
        add(ZELDA_CAVE_SCENE, () => new ZeldaCave());
        add(OKA_WORLD_SCENE, () => new OkaWorld());
        add(OKA_WORLD_TWO_SCENE, () => new OkaWorldTwo());
        add(SAP_WORLD_SCENE, () => new SapWorld());
        add(STREET_SCENE, () => new Street());
        add(HEAVEN_OR_HELL_SCENE, () => new HeavenOrHell());
        add(HEAVEN_OR_HELL_UI_SCENE, () => new HeavenOrHellUi());
    }
}

export default Terrene;
