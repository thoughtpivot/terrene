import {
    Engine,
    Scene,
    Loader,
    Label,
    Vector,
    FontUnit,
    Color,
    Font,
    vec,
    Polygon,
    Circle,
    SpriteSheet,
    ImageSource,
    TileMap,
    Tile,
    ExcaliburGraphicsContext2DCanvas,
} from "excalibur";
import { TiledMapResource } from "@excaliburjs/plugin-tiled";

// import tiledMap from "../../assets/kenney.nl/kenney_tinydungeon/Tiled/sampleMap.tmx";

// const tiledMapResource = new TiledMapResource(tiledMap);

import MoonGraasImage from "./MoonGraas/MoonGraas.png";
export default class MainMenu extends Scene {
    onInitialize(_engine: Engine): void {
        const jasperLabel = new Label({
            text: "Welcome to the main  scene",
            pos: new Vector(500, 500),
            font: new Font({
                quality: 3,
                size: 30,
                unit: FontUnit.Px,
                family: "Termianl",
                color: Color.Cyan,
            }),
        });

        this.add(jasperLabel);

        const rougeLikeSpriteSheet = SpriteSheet.fromImageSource({
            image: new ImageSource(MoonGraasImage),
            grid: {
                rows: 31,
                columns: 51,
                spriteHeight: 16,
                spriteWidth: 16,
            },
            spacing: {
                margin: {
                    x: 1,
                    y: 1,
                },
            },
        });

        const tilemap = new TileMap({
            tileHeight: 1,
            tileWidth: 2,
            columns: 10,
            rows: 10,
        });

        _engine.start().then(() => {
            const triangle = new Polygon({
                points: [vec(10 * 5, 0), vec(0, 20 * 5), vec(20 * 5, 20 * 5)],
                color: Color.Yellow,
            });

            const circle = new Circle({
                radius: 10,
                color: Color.Red,
            });

            // console.log("Main menu loaded");
            // tiledMapResource.addTiledMapToScene(this);
        });
    }
}
