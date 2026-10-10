import { vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import FernImage from "./Fern.png";

const Resources = {
    Image: paintedImage(FernImage),
};

export { Resources };

/** A leafy cave fern that sways a little. Fixture: it stays in the scene. */
export default class Fern extends FixtureItem {
    readonly itemName = "Fern";

    constructor(options: ItemOptions) {
        super({ anchor: vec(0.5, 1), ...options });
        this.swayAmount = 0.03;
        this.swaySpeed = 0.9;
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
    }
}
