import { vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import BonsaiTreeImage from "./BonsaiTree.png";

const Resources = {
    Image: paintedImage(BonsaiTreeImage),
};

export { Resources };

/** A gnarled cave bonsai gripping a nest of mossy stones. Fixture: it stays in the scene. */
export default class BonsaiTree extends FixtureItem {
    readonly itemName = "BonsaiTree";

    constructor(options: ItemOptions) {
        super({ anchor: vec(0.5, 1), ...options });
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
    }
}
