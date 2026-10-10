import { vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import GrassTuftImage from "./GrassTuft.png";

const Resources = {
    Image: paintedImage(GrassTuftImage),
};

export { Resources };

/** A tuft of cave grass. Often placed in front of the hero. Fixture: it stays in the scene. */
export default class GrassTuft extends FixtureItem {
    readonly itemName = "GrassTuft";

    constructor(options: ItemOptions) {
        super({ anchor: vec(0.5, 1), ...options });
        this.swayAmount = 0.05;
        this.swaySpeed = 1.6;
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
    }
}
