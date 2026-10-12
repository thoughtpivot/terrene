import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import DeadTreeImage from "./DeadTree.png";

const Resources = {
    Image: paintedImage(DeadTreeImage),
};

export { Resources };

/** A leafless, twisted tree that died when the light left the Hollow. Fixture: it creaks a little in the draft. */
export default class DeadTree extends FixtureItem {
    readonly itemName = "DeadTree";

    constructor(options: ItemOptions) {
        super(options);
        this.swayAmount = 0.008;
        this.swaySpeed = 0.5;
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
    }
}
