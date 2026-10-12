import { vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import MossyBoulderDarkImage from "./MossyBoulder-dark.png";
import MossyBoulderImage from "./MossyBoulder.png";

const Resources = {
    Image: paintedImage(MossyBoulderImage),
    Dark: paintedImage(MossyBoulderDarkImage),
};

export { Resources };

/** A big boulder wearing a coat of moss. Fixture: it stays in the scene. */
export default class MossyBoulder extends FixtureItem {
    readonly itemName = "MossyBoulder";

    constructor(options: ItemOptions) {
        super({ anchor: vec(0.5, 1), ...options });
    }

    onInitialize(): void {
        this.wear(paintedSprite(this.dark ? Resources.Dark : Resources.Image));
    }
}
