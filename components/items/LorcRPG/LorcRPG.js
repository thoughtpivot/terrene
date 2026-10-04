var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import { Actor, ImageSource, vec, Sprite } from "excalibur";
import LorcRPGImage from "./LorcRPG.png";
import { getIconMappingById, getAllAvailableIcons, SPRITE_CONFIG, } from "./LorcRPG.config";
export default class LorcRPG extends Actor {
    constructor(options) {
        const { itemId, scale = 2 } = options, actorArgs = __rest(options, ["itemId", "scale"]);
        super(Object.assign({ width: 64, height: 64, scale: vec(scale, scale) }, actorArgs));
        this.currentIcon = null;
        // Get icon by ID
        try {
            this.currentIcon = getIconMappingById(itemId);
        }
        catch (error) {
            console.error(`LorcRPG: ${error}`);
            this.currentIcon = getIconMappingById(0); // Default to first icon
        }
    }
    onInitialize() {
        if (!this.currentIcon) {
            console.error("LorcRPG: No icon mapping found!");
            return;
        }
        // Create sprite with sourceView to show only the specific icon
        const iconSprite = new Sprite({
            image: Resources.Image,
            sourceView: {
                x: this.currentIcon.x,
                y: this.currentIcon.y,
                width: SPRITE_CONFIG.ICON_SIZE,
                height: SPRITE_CONFIG.ICON_SIZE,
            },
        });
        this.graphics.use(iconSprite);
        console.log(`LorcRPG initialized: ID ${this.currentIcon.id} at (${this.currentIcon.x}, ${this.currentIcon.y})`);
    }
    // Method to change the displayed icon dynamically
    changeIcon(itemId) {
        try {
            this.currentIcon = getIconMappingById(itemId);
        }
        catch (error) {
            console.error(`LorcRPG: ${error}`);
            return;
        }
        const iconSprite = new Sprite({
            image: Resources.Image,
            sourceView: {
                x: this.currentIcon.x,
                y: this.currentIcon.y,
                width: SPRITE_CONFIG.ICON_SIZE,
                height: SPRITE_CONFIG.ICON_SIZE,
            },
        });
        this.graphics.use(iconSprite);
        console.log(`LorcRPG changed to: ID ${this.currentIcon.id}`);
    }
    // Get current icon info
    getCurrentIcon() {
        return this.currentIcon;
    }
    // Static method to get all available icons (all 789!)
    static getAvailableIcons() {
        return getAllAvailableIcons();
    }
    // Static method to get icon by ID (supports all 789 icons)
    static getIconById(id) {
        try {
            return getIconMappingById(id);
        }
        catch (error) {
            console.error(`LorcRPG.getIconById: ${error}`);
            return null;
        }
    }
    // Static method to get total number of available icons
    static getTotalIconCount() {
        return SPRITE_CONFIG.TOTAL_ICONS;
    }
    // Static method to get random icon ID
    static getRandomIconId() {
        return Math.floor(Math.random() * SPRITE_CONFIG.TOTAL_ICONS);
    }
}
const Resources = {
    Image: new ImageSource(LorcRPGImage),
    AsepriteResource: new AsepriteResource("./components/items/LorcRPG/LorcRPG.json"),
    // Sound: new Sound("./components/items/LorcRPG/LorcRPG.mp3"), // Missing file
};
export { Resources };
//# sourceMappingURL=LorcRPG.js.map