import {
    Engine,
    Actor,
    Die,
    Input,
    vec,
    ImageSource,
    Sound,
    CollisionType,
    ImageFiltering,
} from "excalibur";
import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import YouImage from "./You.png";
export default class You extends Actor {
    constructor() {
        super({
            pos: vec(300, 300),
            width: 16,
            height: 16,
            scale: vec(1, 1),
            collisionType: CollisionType.Active,
        });
    }

    onInitialize(engine: Engine) {
        this.graphics.add(Resources.Image.toSprite());

        const sound = new Sound("./modules/characters/player/You/You.mp3");

        engine.input.keyboard.on("hold", (press) => {
            switch (press.key) {
                case Input.Keys.Up:
                case Input.Keys.W:
                    this.pos.y = this.pos.y - 2;
                    break;
                case Input.Keys.Down:
                case Input.Keys.S:
                    this.pos.y = this.pos.y + 2;
                    break;
                case Input.Keys.Left:
                case Input.Keys.A:
                    this.pos.x = this.pos.x - 2;
                    sound.loop = true;
                    sound.play(1.0);
                    break;
                case Input.Keys.Right:
                case Input.Keys.D:
                    this.pos.x = this.pos.x + 2;
                    break;
            }
        });

        engine.input.keyboard.on("press", (press) => {
            if (press.key === Input.Keys.Space) {
                // Get current movement direction from held keys
                const isMovingUp =
                    engine.input.keyboard.isHeld(Input.Keys.Up) ||
                    engine.input.keyboard.isHeld(Input.Keys.W);
                const isMovingDown =
                    engine.input.keyboard.isHeld(Input.Keys.Down) ||
                    engine.input.keyboard.isHeld(Input.Keys.S);
                const isMovingLeft =
                    engine.input.keyboard.isHeld(Input.Keys.Left) ||
                    engine.input.keyboard.isHeld(Input.Keys.A);
                const isMovingRight =
                    engine.input.keyboard.isHeld(Input.Keys.Right) ||
                    engine.input.keyboard.isHeld(Input.Keys.D);

                // Skip in the direction of movement
                if (isMovingUp) this.pos.y -= 20;
                if (isMovingDown) this.pos.y += 20;
                if (isMovingLeft) this.pos.x -= 20;
                if (isMovingRight) this.pos.x += 20;
            }
        });
    }
}

const Resources = {
    Image: new ImageSource(YouImage, true),
    AsepriteResource: new AsepriteResource("./You.json"),
    Sound: new Sound("./You.mp3"),
};

export { Resources };
