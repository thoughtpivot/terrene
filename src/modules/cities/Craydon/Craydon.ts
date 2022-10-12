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
            // console.log("Main menu loaded");

            const jasperLabel = new Label({
                text: "Welcome to Craydon",
                pos: new Vector(500, 500),
                font: new Font({
                    quality: 3,
                    size: 30,
                    unit: FontUnit.Px,
                    family: "Termianl",
                    color: Color.Rose,
                }),
            });

            this.add(jasperLabel);

            tiledMapResource.addTiledMapToScene(this);
            craydonThemeSong.loop = true;
            craydonThemeSong.play(1.0);
            // if (craydonThemeSong.isLoaded) {
            //     craydonThemeSong.loop = true;

            //     craydonThemeSong.on("processed", ( e: NativeSoundProcessedEvent) => {
            //         e.data
            //     })
            // }
        });
    }
}
