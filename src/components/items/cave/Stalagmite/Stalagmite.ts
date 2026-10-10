import { vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import StalagmiteImage from "./Stalagmite.png";

const Resources = {
    Image: paintedImage(StalagmiteImage),
};

export { Resources };

/** A short stalagmite rising from the cave floor. Fixture: it stays in the scene. */
export default class Stalagmite extends FixtureItem {
    readonly itemName = "Stalagmite";

    constructor(options: ItemOptions) {
        super({ anchor: vec(0.5, 1), ...options });
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
    }
}
