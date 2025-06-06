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
    Timer,
} from "excalibur";
import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import YouImage from "./You.png";
import Sword from "../../../items/weapons/Sword";
export default class You extends Actor {
    private isSwinging: boolean = false;
    private swordSwingSound: Sound;
    private sword: Sword;

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
        this.swordSwingSound = Resources.SwordSwingSound;

        // Create sword actor
        this.sword = new Sword();

        // Add sword as a child of the player
        this.addChild(this.sword);

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
                if (isMovingUp) this.pos.y -= 10;
                if (isMovingDown) this.pos.y += 10;
                if (isMovingLeft) this.pos.x -= 10;
                if (isMovingRight) this.pos.x += 10;
            }

            if (press.key === Input.Keys.X) {
                this.swingSword();
            }

            // Return to city selection menu on Escape key
            if (press.key === Input.Keys.Escape) {
                console.log(
                    "Escape key pressed - returning to city selection menu"
                );
                engine.goToScene("menu");
            }
        });
    }

    private swingSword(): void {
        console.log("X key pressed - attempting sword swing");

        if (this.isSwinging || this.sword.getIsSwinging()) {
            console.log("Sword swing blocked - already swinging");
            return;
        }

        console.log("Starting sword swing");
        this.isSwinging = true;

        // Play sword swing sound
        this.swordSwingSound.play(0.3);

        // Use the sword's swing method
        this.sword.swing().then(() => {
            console.log("Sword swing completed");
            this.isSwinging = false;
        });
    }
}

const Resources = {
    Image: new ImageSource(YouImage, true),
    AsepriteResource: new AsepriteResource("./You.json"),
    Sound: new Sound("./You.mp3"),
    SwordSwingSound: new Sound("./modules/characters/player/You/You.mp3"), // Using existing sound for now
};

export { Resources };
