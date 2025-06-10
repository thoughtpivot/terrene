import {
    Engine,
    Scene,
    Loader,
    Sound,
    SceneActivationContext,
    Color,
    Vector,
} from "excalibur";
import { TiledMapResource } from "@excaliburjs/plugin-tiled";
import You from "../../characters/player/You/You";

const tiledMapResource = new TiledMapResource(
    "./components/cities/Craydon/Craydon.tmx",
    {
        startingLayerZIndex: -2,
    }
);

// const craydonThemeSong = new Sound("./modules/cities/Craydon/Craydon.mp3");
const craydonThemeSong = new Sound("./assets/from_one_to_the_next.mp3");

export default class Craydon extends Scene {
    private player!: You;

    onInitialize(engine: Engine): void {
        const loader = new Loader([tiledMapResource, craydonThemeSong]);

        // loader.loadingBarColor = Color.DarkGray;
        // loader.playButtonText = "Enter the city of Craydon";

        engine.start(loader).then(() => {
            craydonThemeSong.play();

            craydonThemeSong.on("playbackstart", () => {
                craydonThemeSong.volume = 0.1;
                craydonThemeSong.loop = true;
            });

            tiledMapResource.addTiledMapToScene(this);

            // Add and setup player character
            this.setupPlayer(engine);
        });
    }

    private setupPlayer(engine: Engine): void {
        // Create and add player character
        this.player = new You();
        this.player.pos = new Vector(375, 104); // Start player at the player-start position from the map
        this.add(this.player);

        // Setup camera to follow player with appropriate zoom
        this.camera.zoom = 2.5;
        this.camera.strategy.elasticToActor(this.player, 0.8, 0.9);
    }

    onDeactivate(_context: SceneActivationContext<undefined>): void {
        //
    }
}
