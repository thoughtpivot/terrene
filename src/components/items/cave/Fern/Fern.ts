import { vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import FernDarkImage from "./Fern-dark.png";
import FernImage from "./Fern.png";

const Resources = {
    Image: paintedImage(FernImage),
    Dark: paintedImage(FernDarkImage),
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
        this.wear(paintedSprite(this.dark ? Resources.Dark : Resources.Image));
    }
}
