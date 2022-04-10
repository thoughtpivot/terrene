import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import { Actor, Die, ImageSource, vec } from "excalibur";
import GoblinImage from "./Goblin.png";

class Goblin extends Actor {
    constructor() {
        super({
            pos: vec(245, 245),
            width: 100,
            height: 100,
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
    Image: new ImageSource(GoblinImage),
    AsepriteResource: new AsepriteResource(
        "./modules/characters/npc/Goblin/Goblin.json"
    ),
};

export { Resources };

export default Goblin;
