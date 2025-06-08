import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import { Actor, ImageSource, vec } from "excalibur";
import MoonGraasImage from "./MoonGraas.png";

export default class MoonGrass extends Actor {
    constructor() {
        super({
            pos: vec(245, 245),
            width: 100,
            height: 100,
            scale: vec(4, 4),
        });
    }

    onInitialize() {
        this.graphics.use(Resources.Image.toSprite());

        this.actions
            .delay(5000)
            .repeatForever((ctx) => ctx.moveBy(200, 0, 33).moveBy(-200, 0, 44));
    }
}

const Resources = {
    Image: new ImageSource(MoonGraasImage),
};

export { Resources };
