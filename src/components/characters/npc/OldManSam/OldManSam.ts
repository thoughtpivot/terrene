import {
    Actor,
    vec,
    ImageSource,
    Vector,
    CollisionType,
    Engine,
    Timer,
} from "excalibur";
import axios from "axios";
import OldManSamImage from "./OldManSam.png";
import { ChatMessage } from "../../../../common/ChatSystem";
import { DialogueNPC } from "../../../../common/DialogueNPC";
import {
    CharacterFileReader,
    CharacterBio,
} from "../../../../common/CharacterFileReader";
// @ts-ignore
import oldManSamBio from "!!raw-loader!./OldManSam.md";

// API configuration
const API_BASE_URL = "http://localhost:3000/api/oldmansam";

export default class OldManSam extends Actor implements DialogueNPC {
    private player: Actor | null = null;
    private chaseSpeed: number = 25; // pixels per second
    private isChasing: boolean = true;
    private interactionRange: number = 30; // Range for T key interaction
    private characterBio: CharacterBio | null = null;

    constructor() {
        super({
            pos: vec(150, 150),
            width: 16,
            height: 16,
            scale: vec(2, 2),
            collisionType: CollisionType.Active,
        });
    }

    onInitialize(engine: Engine) {
        this.graphics.add(Resources.Image.toSprite());
        console.log("🧙 Old Man Sam initialized at position:", this.pos);
        console.log(
            "🧙 Old Man Sam implements DialogueNPC:",
            this instanceof Object && "getDialogue" in this
        );
        console.log("🧙 Has getDialogue:", "getDialogue" in this);
        console.log("🧙 Has isInRange:", "isInRange" in this);
        console.log("🧙 Has getNPCName:", "getNPCName" in this);

        // Load character bio
        this.loadCharacterBio();

        // Find the player in the scene
        this.findPlayer(engine);
    }

    onPreUpdate(engine: Engine, delta: number): void {
        super.onPreUpdate(engine, delta);

        // Keep trying to find the player if we haven't found them yet
        if (!this.player) {
            this.findPlayer(engine);
        }

        if (!this.player || !this.isChasing) {
            this.vel = Vector.Zero;
            return;
        }

        // Chase the player (but don't auto-trigger chat)
        const direction = this.player.pos.sub(this.pos).normalize();
        this.vel = direction.scale(this.chaseSpeed);

        // Log occasionally to avoid spam
        if (Math.random() < 0.01) {
            // 1% chance per frame
            const distanceToPlayer = this.pos.distance(this.player.pos);
            console.log(
                `Old Man Sam chasing player. Distance: ${distanceToPlayer.toFixed(
                    1
                )}`
            );
        }
    }

    private findPlayer(engine: Engine): void {
        // Look for player actor in the current scene
        const actors = engine.currentScene.actors;
        console.log(
            "Old Man Sam looking for player among",
            actors.length,
            "actors"
        );

        for (const actor of actors) {
            // Check if this is the player character (You class)
            if (actor.constructor.name === "You") {
                this.player = actor;
                console.log(
                    "Old Man Sam found the player at position:",
                    actor.pos
                );
                break;
            }
        }

        if (!this.player) {
            console.warn("Old Man Sam couldn't find the player in the scene!");
        }
    }

    /**
     * Loads Old Man Sam's character bio from the .md file
     */
    private loadCharacterBio(): void {
        this.characterBio = CharacterFileReader.parseMarkdownBio(oldManSamBio);
        console.log(`Loaded character bio for ${this.characterBio.name}`);
    }

    // DialogueNPC interface implementation - powered by backend API
    public async getDialogue(): Promise<ChatMessage[]> {
        console.log("🎭 getDialogue() called on Old Man Sam!");

        try {
            console.log("📡 Calling backend API for dialogue...");

            const response = await axios.get(API_BASE_URL + "/dialogue", {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 5000, // 5 second timeout
            });

            if (!response.data.success) {
                throw new Error(`Backend API failed: ${response.data.error}`);
            }

            console.log(
                `✅ Got ${response.data.messages.length} messages from backend API`,
                response.data.cached ? "(cached)" : "(fresh)"
            );

            if (response.data.fallback) {
                console.log("⚠️ Backend used fallback messages");
            }

            return response.data.messages;
        } catch (error) {
            let errorMessage = "Unknown error";

            if (axios.isAxiosError(error)) {
                if (error.code === "ECONNREFUSED") {
                    errorMessage = "Backend server is not running";
                } else if (error.code === "ECONNABORTED") {
                    errorMessage = "Request timeout";
                } else if (error.response) {
                    errorMessage = `Backend returned ${error.response.status}: ${error.response.statusText}`;
                } else if (error.request) {
                    errorMessage = "No response from backend server";
                } else {
                    errorMessage = error.message;
                }
            } else {
                errorMessage = String(error);
            }

            console.error(
                "🚨 Backend API call failed, using emergency fallback:",
                errorMessage
            );

            // Emergency fallback if backend is down
            const emergencyMessages: ChatMessage[] = [
                {
                    speaker: "Old Man Sam",
                    text: "Arr, the winds be blowin' strange today...",
                    duration: 3000,
                },
                {
                    speaker: "Old Man Sam",
                    text: "Me old bones be creakin' somethin' fierce!",
                    duration: 3500,
                },
                {
                    speaker: "Old Man Sam",
                    text: "Best ye be on yer way, lad!",
                    duration: 3000,
                },
            ];

            return emergencyMessages;
        }
    }

    public isInRange(playerPos: Vector): boolean {
        const distance = this.pos.distance(playerPos);
        const inRange = distance <= this.interactionRange;
        console.log(
            `🔍 Old Man Sam isInRange check: distance=${distance.toFixed(
                1
            )}, range=${this.interactionRange}, inRange=${inRange}`
        );
        console.log(
            `🔍 Sam pos: (${this.pos.x.toFixed(1)}, ${this.pos.y.toFixed(1)})`
        );
        console.log(
            `🔍 Player pos: (${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(
                1
            )})`
        );

        if (inRange) {
            console.log("✅ Old Man Sam IS IN RANGE - should trigger chat!");
        } else {
            console.log("❌ Old Man Sam is OUT OF RANGE");
        }

        return inRange;
    }

    public getNPCName(): string {
        return "Old Man Sam";
    }

    // Method to stop chasing (useful for when conversation starts)
    public stopChasing(): void {
        this.isChasing = false;
        this.vel = Vector.Zero;
    }

    // Method to resume chasing
    public resumeChasing(): void {
        this.isChasing = true;
    }

    /**
     * Force regeneration of dialogue (clears backend cache)
     */
    public async regenerateDialogue(): Promise<void> {
        try {
            const response = await axios.post(
                API_BASE_URL + "/regenerate",
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 5000, // 5 second timeout
                }
            );

            if (response.data.success) {
                console.log("✅ Backend dialogue cache cleared");
            } else {
                console.warn(
                    "⚠️ Failed to clear backend cache:",
                    response.data.error
                );
            }
        } catch (error) {
            let errorMessage = "Unknown error";

            if (axios.isAxiosError(error)) {
                if (error.code === "ECONNREFUSED") {
                    errorMessage = "Backend server is not running";
                } else if (error.code === "ECONNABORTED") {
                    errorMessage = "Request timeout";
                } else if (error.response) {
                    errorMessage = `Backend returned ${error.response.status}: ${error.response.statusText}`;
                } else if (error.request) {
                    errorMessage = "No response from backend server";
                } else {
                    errorMessage = error.message;
                }
            } else {
                errorMessage = String(error);
            }

            console.error("❌ Error clearing backend cache:", errorMessage);
        }
    }

    /**
     * Get the character's bio (useful for debugging or external access)
     */
    public getCharacterBio(): CharacterBio | null {
        return this.characterBio;
    }
}

const Resources = {
    Image: new ImageSource(OldManSamImage),
};

export { Resources };
