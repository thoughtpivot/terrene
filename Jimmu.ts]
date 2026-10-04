import { ImageSource, vec } from "excalibur";
import WanderingMerchant from "../WanderingMerchant";
import JimmuImage from "./Jimmu.png";
export default class Jimmu extends WanderingMerchant {
    constructor() {
        super({
            pos: vec(100, 100),
            width: 100,
            height: 100,
            scale: vec(4, 4),
        });
    }

    onInitialize() {
        this.graphics.add(Resources.Image.toSprite());
        this.actions.blink(500, 190);
        this.vel.x = 8;
    }
}

const Resources = {
    Image: new ImageSource(JimmuImage),
};
export { Resources };
