import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import { Actor, Die, ImageSource, vec } from "excalibur";
import Goblin from "../Goblin";
import AnemoImage from "./Horus.png";

export default class Anemo extends Goblin {
    constructor() {
        super({
            pos: vec(245, 245),
            width: 100,
            height: 100,
            scale: vec(128, 128),
        });
    }

    onInitialize() {
        this.graphics.add(Resources.Image.toSprite());

        this.actions
            .delay(5000)
            .repeatForever((ctx) => ctx.moveBy(200, 0, 20).moveBy(-200, 0, 20));
    }
}

const Resources = {
    Image: new ImageSource(AnemoImage),
    AsepriteResource: new AsepriteResource(
        "./components/characters/npc/Goblin/Anemo/Anemo.json"
    ),
};

export { Resources };
