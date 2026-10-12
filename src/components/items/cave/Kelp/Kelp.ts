import { vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import KelpDarkImage from "./Kelp-dark.png";
import KelpImage from "./Kelp.png";

const Resources = {
    Image: paintedImage(KelpImage),
    Dark: paintedImage(KelpDarkImage),
};

export { Resources };

/** Cave kelp. Lives in pools and sways with the water. Fixture: it stays in the scene. */
export default class Kelp extends FixtureItem {
    readonly itemName = "Kelp";

    constructor(options: ItemOptions) {
        super({ anchor: vec(0.5, 1), ...options });
        this.swayAmount = 0.07;
        this.swaySpeed = 1.1;
    }

    onInitialize(): void {
        this.wear(paintedSprite(this.dark ? Resources.Dark : Resources.Image));
    }
}
