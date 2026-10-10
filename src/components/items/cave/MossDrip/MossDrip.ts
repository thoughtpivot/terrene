import { vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import MossDripImage from "./MossDrip.png";

const Resources = {
    Image: paintedImage(MossDripImage),
};

export { Resources };

/** Moss hanging from the underside of a ledge. Fixture: it stays in the scene. */
export default class MossDrip extends FixtureItem {
    readonly itemName = "MossDrip";

    constructor(options: ItemOptions) {
        super({ anchor: vec(0.5, 0), ...options });
        this.swayAmount = 0.025;
        this.swaySpeed = 0.7;
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
    }
}
