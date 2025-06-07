import {
    Actor,
    vec,
    ImageSource,
    Vector,
    CollisionType,
    Engine,
    Timer,
} from "excalibur";
import OldManSamImage from "./OldManSam.png";
import { ChatMessage } from "../../../../common/ChatSystem";
import { DialogueNPC } from "../../../../common/DialogueNPC";
import { Claude, ClaudeVersion } from "../../../../common/amazon";
import {
    CharacterFileReader,
    CharacterBio,
} from "../../../../common/CharacterFileReader";
// @ts-ignore
import oldManSamBio from "!!raw-loader!./OldManSam.md";

export default class OldManSam extends Actor implements DialogueNPC {
    private player: Actor | null = null;
    private chaseSpeed: number = 25; // pixels per second
    private isChasing: boolean = true;
    private interactionRange: number = 30; // Range for T key interaction
    private characterBio: CharacterBio | null = null;
    private lastMessageGeneration: number = 0;
    private messageCache: ChatMessage[] = [];
    private cacheDuration: number = 300000; // 5 minutes in milliseconds

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
        console.log("Old Man Sam initialized at position:", this.pos);
        console.log(
            "Old Man Sam implements DialogueNPC:",
            this instanceof Object && "getDialogue" in this
        );

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

    // DialogueNPC interface implementation - powered by Claude reading from .md file
    public async getDialogue(): Promise<ChatMessage[]> {
        // Check if we have cached messages that are still fresh
        const now = Date.now();
        if (
            this.messageCache.length > 0 &&
            now - this.lastMessageGeneration < this.cacheDuration
        ) {
            console.log("Using cached dialogue for Old Man Sam");
            return this.messageCache;
        }

        // Ensure character bio is loaded
        if (!this.characterBio) {
            this.loadCharacterBio();
        }

        console.log("Generating new dialogue for Old Man Sam using Claude...");

        const characterPrompt = CharacterFileReader.createCharacterPrompt(
            this.characterBio!
        );

        const claudeInstructions = `${characterPrompt}

Your task is to generate exactly 3 authentic dialogue messages that this character might say to a player who approaches them.

IMPORTANT: Return your response as a valid JavaScript array of objects in this exact format:
[
    {"speaker": "Old Man Sam", "text": "First message here", "duration": 4000},
    {"speaker": "Old Man Sam", "text": "Second message here", "duration": 4500},
    {"speaker": "Old Man Sam", "text": "Third message here", "duration": 3500}
]

Requirements:
- Each message should be a complete thought or statement
- Stay true to the character's personality and speaking style from the bio
- Messages should feel natural and varied
- Don't repeat the exact same phrases from the bio examples
- Keep each message under 80 characters for chat display
- Use duration values between 3000-5000ms based on message length
- Return ONLY the JavaScript array, no other text or formatting`;

        const response = await Claude({
            version: ClaudeVersion.Claude_3_5_Sonnet_20240620_V10,
            instructions: claudeInstructions,
            inputText:
                "Generate dialogue messages for a player who just approached you while you were chasing them on the beach.",
        });

        console.log("Claude response:", response);

        // Parse the response as a JavaScript array
        const messages = this.parseClaudeResponse(response);

        // Cache the generated messages
        this.messageCache = messages;
        this.lastMessageGeneration = now;

        console.log(`Generated ${messages.length} messages for Old Man Sam`);
        return messages;
    }

    /**
     * Parses Claude's response to extract the dialogue array with ChatMessage objects
     */
    private parseClaudeResponse(response: string): ChatMessage[] {
        // Clean up the response to extract just the array
        let cleanedResponse = response.trim();

        // Look for array pattern
        const arrayMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            cleanedResponse = arrayMatch[0];
        }

        // Parse as JSON
        const parsedArray = JSON.parse(cleanedResponse);

        // Validate and convert to ChatMessage format
        return parsedArray
            .filter(
                (item: any) =>
                    item &&
                    typeof item === "object" &&
                    typeof item.speaker === "string" &&
                    typeof item.text === "string" &&
                    item.text.trim().length > 0
            )
            .map((item: any) => ({
                speaker: item.speaker,
                text: item.text,
                duration:
                    typeof item.duration === "number" ? item.duration : 4000,
            }));
    }

    public isInRange(playerPos: Vector): boolean {
        const distance = this.pos.distance(playerPos);
        console.log(
            `🔍 Old Man Sam isInRange check: distance=${distance.toFixed(
                1
            )}, range=${this.interactionRange}, inRange=${
                distance <= this.interactionRange
            }`
        );
        console.log(
            `🔍 Sam pos: (${this.pos.x.toFixed(1)}, ${this.pos.y.toFixed(1)})`
        );
        console.log(
            `🔍 Player pos: (${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(
                1
            )})`
        );
        return distance <= this.interactionRange;
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
     * Force regeneration of dialogue (clears cache)
     */
    public regenerateDialogue(): void {
        this.messageCache = [];
        this.lastMessageGeneration = 0;
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
