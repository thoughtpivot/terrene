import { Engine, Scene, Loader, Sound } from "excalibur";
import { TiledMapResource } from "@excaliburjs/plugin-tiled";

const tiledMapResource = new TiledMapResource(
    "./modules/cities/Craydon/Craydon.tmx",
    {
        startingLayerZIndex: -2,
    }
);

const craydonThemeSong = new Sound("./modules/cities/Craydon/Craydon.mp3");

export default class Craydon extends Scene {
    onInitialize(engine: Engine): void {
        const loader = new Loader([tiledMapResource, craydonThemeSong]);

        engine.start(loader).then(() => {
            craydonThemeSong.play();

            craydonThemeSong.on("playbackstart", () => {
                craydonThemeSong.loop = true;
            });

            // // TODO we really shouldn't have to do this.
            // setTimeout(() => {
            //     craydonThemeSong.volume = 0.2;
            //     craydonThemeSong.loop = true;
            // });

            tiledMapResource.addTiledMapToScene(this);
        });
    }
}
