import { vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import BouldersImage from "./Boulders.png";

const Resources = {
    Image: paintedImage(BouldersImage),
};

export { Resources };

/** A pile of rounded slate boulders. Fixture: it stays in the scene. */
export default class Boulders extends FixtureItem {
    readonly itemName = "Boulders";

    constructor(options: ItemOptions) {
        super({ anchor: vec(0.5, 1), ...options });
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
    }
}
