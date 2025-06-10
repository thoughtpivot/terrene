import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import { Actor, ImageSource, vec, Sound, Sprite, ActorArgs } from "excalibur";
import LorcRPGImage from "./LorcRPG.png";
import LorcRPGJson from "./LorcRPG.json";
import {
    IconMapping,
    getIconMappingById,
    getAllAvailableIcons,
    SPRITE_CONFIG,
} from "./LorcRPG.config";

export interface LorcRPGOptions extends Omit<ActorArgs, "scale"> {
    itemId: number; // ID from 0-788 for all icons
    scale?: number; // Default scaling
}

export default class LorcRPG extends Actor {
    private currentIcon: IconMapping | null = null;

    constructor(options: LorcRPGOptions) {
        const { itemId, scale = 2, ...actorArgs } = options;

        super({
            width: 64,
            height: 64,
            scale: vec(scale, scale),
            ...actorArgs,
        });

        // Get icon by ID
        try {
            this.currentIcon = getIconMappingById(itemId);
        } catch (error) {
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

        console.log(
            `LorcRPG initialized: ID ${this.currentIcon.id} at (${this.currentIcon.x}, ${this.currentIcon.y})`
        );
    }

    // Method to change the displayed icon dynamically
    changeIcon(itemId: number) {
        try {
            this.currentIcon = getIconMappingById(itemId);
        } catch (error) {
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
    getCurrentIcon(): IconMapping | null {
        return this.currentIcon;
    }

    // Static method to get all available icons (all 789!)
    static getAvailableIcons(): { [key: string]: IconMapping } {
        return getAllAvailableIcons();
    }

    // Static method to get icon by ID (supports all 789 icons)
    static getIconById(id: number): IconMapping | null {
        try {
            return getIconMappingById(id);
        } catch (error) {
            console.error(`LorcRPG.getIconById: ${error}`);
            return null;
        }
    }

    // Static method to get total number of available icons
    static getTotalIconCount(): number {
        return SPRITE_CONFIG.TOTAL_ICONS;
    }

    // Static method to get random icon ID
    static getRandomIconId(): number {
        return Math.floor(Math.random() * SPRITE_CONFIG.TOTAL_ICONS);
    }
}

const Resources = {
    Image: new ImageSource(LorcRPGImage),
    AsepriteResource: new AsepriteResource("./LorcRPG.json"),
    Sound: new Sound("./LorcRPG.mp3"),
};

export { Resources };
export type { IconMapping };
