import { Actor, Die, vec, ImageSource } from "excalibur";
import WanderingMerchant from "../WanderingMerchant";
import NovosahImage from "./Navosah.png";
export default class Novosah extends WanderingMerchant {
    constructor() {
        super({
            pos: vec(100, 100),
            width: 5,
            height: 5,
            scale: vec(1, 1),
        });
    }

    onInitialize() {
        this.graphics.add(Resources.Image.toSprite());
        this.actions.blink(500, 190);
        this.vel.x = 8;
    }
}

const Resources = {
    Image: new ImageSource(NovosahImage),
};

export { Resources };
