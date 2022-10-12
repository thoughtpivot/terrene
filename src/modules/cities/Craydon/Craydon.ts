import {
    Engine,
    Scene,
    Loader,
    Label,
    Vector,
    FontUnit,
    Color,
    Font,
    Sound,
    vec,
    Polygon,
    Circle,
    SpriteSheet,
    ImageSource,
    TileMap,
    Tile,
    ExcaliburGraphicsContext2DCanvas,
    NativeSoundProcessedEvent,
} from "excalibur";
import { TiledMapResource } from "@excaliburjs/plugin-tiled";

const tiledMapResource = new TiledMapResource(
    "./modules/cities/Craydon/Craydon.tmx",
    {
        startingLayerZIndex: -2,
    }
);

const craydonThemeSong = new Sound("./modules/cities/Craydon/Craydon.mp3");

export default class Craydon extends Scene {
    onInitialize(_engine: Engine): void {
        const loader = new Loader([tiledMapResource, craydonThemeSong]);

        _engine.start(loader).then(() => {
            craydonThemeSong.play();

            setTimeout(() => {
                craydonThemeSong.volume = 0.2;
                craydonThemeSong.loop = true;
            });

            tiledMapResource.addTiledMapToScene(this);
        });
    }
}
