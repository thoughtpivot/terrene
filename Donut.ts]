import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import { Actor, Die, ImageSource, vec, Sprite, Rectangle } from "excalibur";
import DonutImage from "./Donut.png";

export default class Donut extends Actor {
    constructor() {
        super({
            pos: vec(245, 245),
            width: 100,
            height: 100,
            scale: vec(4, 4),
        });
    }

    onInitialize() {
        // Create a sprite that shows only the first donut (top donut only)
        const firstDonutSprite = new Sprite({
            image: Resources.Image,
            sourceView: {
                x: 0, // Start from left edge
                y: 0, // Start from top edge
                width: 16, // 16px wide
                height: 16, // Show only top donut - cut off at 15px to avoid the second donut
            },
        });

        this.graphics.use(firstDonutSprite);

        console.log(
            "Donut initialized - showing single donut only (16x15 from 96x32 sprite sheet)"
        );

        this.actions
            .delay(5000)
            .repeatForever((ctx) => ctx.moveBy(200, 0, 33).moveBy(-200, 0, 44));
    }
}

const Resources = {
    Image: new ImageSource(DonutImage),
    AsepriteResource: new AsepriteResource(
        "./components/items/food/Donut/Donut.json"
    ),
    // Sound: new Sound("./components/items/food/Donut/Donut.mp3"), // Missing file
};

export { Resources };
