import {
    Engine,
    Scene,
    Loader,
    Sound,
    SceneActivationContext,
    Color,
} from "excalibur";
import { TiledMapResource } from "@excaliburjs/plugin-tiled";

const tiledMapResource = new TiledMapResource(
    "./modules/cities/Craydon/Craydon.tmx",
    {
        startingLayerZIndex: -2,
    }
);

// const craydonThemeSong = new Sound("./modules/cities/Craydon/Craydon.mp3");
const craydonThemeSong = new Sound("./assets/from_one_to_the_next.mp3");

export default class Craydon extends Scene {
    onInitialize(engine: Engine): void {
        const loader = new Loader([tiledMapResource, craydonThemeSong]);

        loader.loadingBarColor = Color.DarkGray;
        loader.playButtonText = "Enter the city of Craydon";

        engine.start(loader).then(() => {
            craydonThemeSong.play();

            craydonThemeSong.on("playbackstart", () => {
                craydonThemeSong.volume = 0.1;
                craydonThemeSong.loop = true;
            });

            tiledMapResource.addTiledMapToScene(this);
        });
    }

    onDeactivate(_context: SceneActivationContext<undefined>): void {
        //
    }
}
