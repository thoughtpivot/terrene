var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Actor, vec, ImageSource, Vector, CollisionType, } from "excalibur";
import axios from "axios";
import OldManSamImage from "./OldManSam.png";
import { CharacterFileReader, } from "../../../../common/CharacterFileReader";
// @ts-ignore
import oldManSamBio from "!!raw-loader!./OldManSam.md";
// API configuration
const API_BASE_URL = "http://localhost:3000/api/oldmansam";
export default class OldManSam extends Actor {
    constructor() {
        super({
            pos: vec(150, 150),
            width: 16,
            height: 16,
            scale: vec(2, 2),
            collisionType: CollisionType.Active,
        });
        this.player = null;
        this.chaseSpeed = 25; // pixels per second
        this.isChasing = true;
        this.interactionRange = 30; // Range for T key interaction
        this.characterBio = null;
    }
    onInitialize(engine) {
        this.graphics.add(Resources.Image.toSprite());
        console.log("🧙 Old Man Sam initialized at position:", this.pos);
        console.log("🧙 Old Man Sam implements DialogueNPC:", this instanceof Object && "getDialogue" in this);
        console.log("🧙 Has getDialogue:", "getDialogue" in this);
        console.log("🧙 Has isInRange:", "isInRange" in this);
        console.log("🧙 Has getNPCName:", "getNPCName" in this);
        // Load character bio
        this.loadCharacterBio();
        // Find the player in the scene
        this.findPlayer(engine);
    }
    onPreUpdate(engine, delta) {
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
            console.log(`Old Man Sam chasing player. Distance: ${distanceToPlayer.toFixed(1)}`);
        }
    }
    findPlayer(engine) {
        // Look for player actor in the current scene
        const actors = engine.currentScene.actors;
        console.log("Old Man Sam looking for player among", actors.length, "actors");
        for (const actor of actors) {
            // Check if this is the player character (You class)
            if (actor.constructor.name === "You") {
                this.player = actor;
                console.log("Old Man Sam found the player at position:", actor.pos);
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
    loadCharacterBio() {
        this.characterBio = CharacterFileReader.parseMarkdownBio(oldManSamBio);
        console.log(`Loaded character bio for ${this.characterBio.name}`);
    }
    // DialogueNPC interface implementation - powered by backend API
    getDialogue() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("🎭 getDialogue() called on Old Man Sam!");
            try {
                console.log("📡 Calling backend API for dialogue...");
                const response = yield axios.get(API_BASE_URL + "/dialogue", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 5000, // 5 second timeout
                });
                if (!response.data.success) {
                    throw new Error(`Backend API failed: ${response.data.error}`);
                }
                console.log(`✅ Got ${response.data.messages.length} messages from backend API`, response.data.cached ? "(cached)" : "(fresh)");
                if (response.data.fallback) {
                    console.log("⚠️ Backend used fallback messages");
                }
                return response.data.messages;
            }
            catch (error) {
                let errorMessage = "Unknown error";
                if (axios.isAxiosError(error)) {
                    if (error.code === "ECONNREFUSED") {
                        errorMessage = "Backend server is not running";
                    }
                    else if (error.code === "ECONNABORTED") {
                        errorMessage = "Request timeout";
                    }
                    else if (error.response) {
                        errorMessage = `Backend returned ${error.response.status}: ${error.response.statusText}`;
                    }
                    else if (error.request) {
                        errorMessage = "No response from backend server";
                    }
                    else {
                        errorMessage = error.message;
                    }
                }
                else {
                    errorMessage = String(error);
                }
                console.error("🚨 Backend API call failed, using emergency fallback:", errorMessage);
                // Emergency fallback if backend is down
                const emergencyMessages = [
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
        });
    }
    isInRange(playerPos) {
        const distance = this.pos.distance(playerPos);
        const inRange = distance <= this.interactionRange;
        console.log(`🔍 Old Man Sam isInRange check: distance=${distance.toFixed(1)}, range=${this.interactionRange}, inRange=${inRange}`);
        console.log(`🔍 Sam pos: (${this.pos.x.toFixed(1)}, ${this.pos.y.toFixed(1)})`);
        console.log(`🔍 Player pos: (${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(1)})`);
        if (inRange) {
            console.log("✅ Old Man Sam IS IN RANGE - should trigger chat!");
        }
        else {
            console.log("❌ Old Man Sam is OUT OF RANGE");
        }
        return inRange;
    }
    getNPCName() {
        return "Old Man Sam";
    }
    // Method to stop chasing (useful for when conversation starts)
    stopChasing() {
        this.isChasing = false;
        this.vel = Vector.Zero;
    }
    // Method to resume chasing
    resumeChasing() {
        this.isChasing = true;
    }
    /**
     * Force regeneration of dialogue (clears backend cache)
     */
    regenerateDialogue() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios.post(API_BASE_URL + "/regenerate", {}, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 5000, // 5 second timeout
                });
                if (response.data.success) {
                    console.log("✅ Backend dialogue cache cleared");
                }
                else {
                    console.warn("⚠️ Failed to clear backend cache:", response.data.error);
                }
            }
            catch (error) {
                let errorMessage = "Unknown error";
                if (axios.isAxiosError(error)) {
                    if (error.code === "ECONNREFUSED") {
                        errorMessage = "Backend server is not running";
                    }
                    else if (error.code === "ECONNABORTED") {
                        errorMessage = "Request timeout";
                    }
                    else if (error.response) {
                        errorMessage = `Backend returned ${error.response.status}: ${error.response.statusText}`;
                    }
                    else if (error.request) {
                        errorMessage = "No response from backend server";
                    }
                    else {
                        errorMessage = error.message;
                    }
                }
                else {
                    errorMessage = String(error);
                }
                console.error("❌ Error clearing backend cache:", errorMessage);
            }
        });
    }
    /**
     * Get the character's bio (useful for debugging or external access)
     */
    getCharacterBio() {
        return this.characterBio;
    }
}
const Resources = {
    Image: new ImageSource(OldManSamImage),
};
export { Resources };
//# sourceMappingURL=OldManSam.js.map