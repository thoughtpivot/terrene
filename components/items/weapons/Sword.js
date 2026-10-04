import { Actor, vec, ImageSource, Sound } from "excalibur";
import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import SwordImage from "./Sword.png";
export default class Sword extends Actor {
    constructor() {
        super({
            pos: vec(0, 0),
            width: 4,
            height: 16,
            scale: vec(2, 2),
            anchor: vec(0.5, 1), // Anchor at bottom center (handle)
        });
        this.isSwinging = false;
    }
    onInitialize() {
        // Use the Aseprite sprite instead of a rectangle
        this.graphics.use(Resources.Image.toSprite());
        // Initially hide the sword
        this.graphics.visible = false;
    }
    /**
     * Perform a sword swing animation
     * @param startPosition - Starting position relative to wielder
     * @param startRotation - Starting rotation angle
     * @param swingAngle - Angle to swing through
     * @param duration - Duration of swing in milliseconds
     */
    swing(startPosition = vec(12, -8), startRotation = -Math.PI / 4, swingAngle = Math.PI / 2, duration = 150) {
        if (this.isSwinging) {
            return Promise.resolve(); // Already swinging
        }
        this.isSwinging = true;
        // Debug logging
        console.log("Sword swing started!", {
            position: startPosition,
            rotation: startRotation,
            visible: this.graphics.visible,
        });
        // Position and orient the sword
        this.pos = startPosition;
        this.rotation = startRotation;
        // Show the sword
        this.graphics.visible = true;
        console.log("Sword should be visible now at:", this.pos);
        // Return a promise that resolves when swing is complete
        return new Promise((resolve) => {
            this.actions.rotateBy(swingAngle, duration).callMethod(() => {
                this.hide();
                this.isSwinging = false;
                resolve();
            });
        });
    }
    /**
     * Hide the sword
     */
    hide() {
        this.graphics.visible = false;
    }
    /**
     * Show the sword at a specific position
     */
    show(position = vec(12, -8)) {
        this.pos = position;
        this.graphics.visible = true;
    }
    /**
     * Check if the sword is currently swinging
     */
    getIsSwinging() {
        return this.isSwinging;
    }
}
const Resources = {
    Image: new ImageSource(SwordImage, true),
    AsepriteResource: new AsepriteResource("./components/items/weapons/Sword.json"),
    Sound: new Sound("./components/items/weapons/sword_swing.mp3"),
};
export { Resources };
//# sourceMappingURL=Sword.js.map