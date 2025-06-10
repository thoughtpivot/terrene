import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import { Actor, ImageSource, vec, Sound, Sprite, ActorArgs } from "excalibur";
import LorcRPGImage from "./LorcRPG.png";
import LorcRPGJson from "./LorcRPG.json";
import {
    ICON_MAPPINGS,
    ICON_MAPPINGS_BY_ID,
    IconMapping,
} from "./IconMappings";

export interface LorcRPGOptions extends Omit<ActorArgs, "scale"> {
    itemName?: string; // e.g., "Sword", "Health_Potion"
    itemId?: number; // e.g., 0, 100, 200
    scale?: number; // Default scaling
}

export default class LorcRPG extends Actor {
    private currentIcon: IconMapping | null = null;

    constructor(options: LorcRPGOptions = {}) {
        const { itemName, itemId, scale = 2, ...actorArgs } = options;

        super({
            width: 64,
            height: 64,
            scale: vec(scale, scale),
            ...actorArgs,
        });

        // Determine which icon to display
        if (itemName && ICON_MAPPINGS[itemName]) {
            this.currentIcon = ICON_MAPPINGS[itemName];
        } else if (itemId !== undefined && ICON_MAPPINGS_BY_ID[itemId]) {
            this.currentIcon = ICON_MAPPINGS_BY_ID[itemId];
        } else {
            // Default to first sword if no valid icon specified
            this.currentIcon = ICON_MAPPINGS["Sword"];
            console.warn(
                `LorcRPG: Invalid item specified (name: ${itemName}, id: ${itemId}). Using default Sword.`
            );
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
                width: 64, // Each icon is 64x64 pixels
                height: 64,
            },
        });

        this.graphics.use(iconSprite);

        console.log(
            `LorcRPG initialized: ${this.currentIcon.name} at (${this.currentIcon.x}, ${this.currentIcon.y})`
        );
    }

    // Method to change the displayed icon dynamically
    changeIcon(itemName?: string, itemId?: number) {
        let newIcon: IconMapping | null = null;

        if (itemName && ICON_MAPPINGS[itemName]) {
            newIcon = ICON_MAPPINGS[itemName];
        } else if (itemId !== undefined && ICON_MAPPINGS_BY_ID[itemId]) {
            newIcon = ICON_MAPPINGS_BY_ID[itemId];
        }

        if (newIcon) {
            this.currentIcon = newIcon;

            const iconSprite = new Sprite({
                image: Resources.Image,
                sourceView: {
                    x: this.currentIcon.x,
                    y: this.currentIcon.y,
                    width: 64,
                    height: 64,
                },
            });

            this.graphics.use(iconSprite);
            console.log(`LorcRPG changed to: ${this.currentIcon.name}`);
        } else {
            console.warn(
                `LorcRPG: Cannot change to invalid item (name: ${itemName}, id: ${itemId})`
            );
        }
    }

    // Get current icon info
    getCurrentIcon(): IconMapping | null {
        return this.currentIcon;
    }

    // Static method to get all available icons
    static getAvailableIcons(): { [key: string]: IconMapping } {
        return { ...ICON_MAPPINGS };
    }

    // Static method to get icon by name
    static getIconByName(name: string): IconMapping | null {
        return ICON_MAPPINGS[name] || null;
    }

    // Static method to get icon by ID
    static getIconById(id: number): IconMapping | null {
        return ICON_MAPPINGS_BY_ID[id] || null;
    }
}

const Resources = {
    Image: new ImageSource(LorcRPGImage),
    AsepriteResource: new AsepriteResource("./LorcRPG.json"),
    Sound: new Sound("./LorcRPG.mp3"),
};

export { Resources, ICON_MAPPINGS, ICON_MAPPINGS_BY_ID };
export type { IconMapping };
