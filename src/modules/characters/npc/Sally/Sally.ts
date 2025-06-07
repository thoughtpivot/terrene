import {
    Actor,
    vec,
    ImageSource,
    Timer,
    Vector,
    randomInRange,
    CollisionType,
    Engine,
} from "excalibur";
import axios from "axios";
import SallyImage from "./Sally.png";
import { ChatMessage } from "../../../../common/ChatSystem";
import { DialogueNPC } from "../../../../common/DialogueNPC";
import {
    CharacterFileReader,
    CharacterBio,
} from "../../../../common/CharacterFileReader";
// @ts-ignore
import sallyBio from "!!raw-loader!./Sally.md";

// API configuration
const API_BASE_URL = "http://localhost:3000/api/sally";

export default class Sally extends Actor implements DialogueNPC {
    private walkTimer: Timer;
    private currentDirection: Vector;
    private walkSpeed: number = 30; // pixels per second
    private bounds: { minX: number; maxX: number; minY: number; maxY: number };
    private characterBio: CharacterBio | null = null;

    constructor(bounds?: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    }) {
        super({
            pos: vec(450, 200),
            width: 16,
            height: 16,
            scale: vec(2, 2),
            collisionType: CollisionType.Active,
        });

        // Set walking bounds (default to reasonable beach area if not provided)
        this.bounds = bounds || {
            minX: 340,
            maxX: 620,
            minY: 20,
            maxY: 460,
        };

        // Initialize with random direction
        this.currentDirection = this.getRandomDirection();

        // Create timer for changing direction randomly
        this.walkTimer = new Timer({
            fcn: () => this.changeDirection(),
            interval: randomInRange(2000, 5000), // Change direction every 2-5 seconds
            repeats: true,
        });
    }

    onInitialize(engine: Engine) {
        this.graphics.add(Resources.Image.toSprite());
        console.log("🌊 Sally initialized at position:", this.pos);
        console.log(
            "🌊 Sally implements DialogueNPC:",
            this instanceof Object && "getDialogue" in this
        );
        console.log("🌊 Has getDialogue:", "getDialogue" in this);
        console.log("🌊 Has isInRange:", "isInRange" in this);
        console.log("🌊 Has getNPCName:", "getNPCName" in this);

        // Load character bio
        this.loadCharacterBio();

        // Start the walking timer
        engine.addTimer(this.walkTimer);

        // Handle collisions - change direction when hitting something
        this.on("collisionstart", () => {
            this.changeDirection();
        });
    }

    onPreUpdate(engine: Engine, delta: number): void {
        super.onPreUpdate(engine, delta);

        // Move in current direction
        this.vel = this.currentDirection.scale(this.walkSpeed);

        // Check bounds and reverse direction if hitting edges
        if (this.pos.x <= this.bounds.minX || this.pos.x >= this.bounds.maxX) {
            this.currentDirection = new Vector(
                -this.currentDirection.x,
                this.currentDirection.y
            );
        }
        if (this.pos.y <= this.bounds.minY || this.pos.y >= this.bounds.maxY) {
            this.currentDirection = new Vector(
                this.currentDirection.x,
                -this.currentDirection.y
            );
        }

        // Keep Sally within bounds
        this.pos.x = Math.max(
            this.bounds.minX,
            Math.min(this.bounds.maxX, this.pos.x)
        );
        this.pos.y = Math.max(
            this.bounds.minY,
            Math.min(this.bounds.maxY, this.pos.y)
        );
    }

    private getRandomDirection(): Vector {
        const angle = randomInRange(0, Math.PI * 2);
        return new Vector(Math.cos(angle), Math.sin(angle));
    }

    private changeDirection(): void {
        this.currentDirection = this.getRandomDirection();

        // Reset timer with new random interval
        this.walkTimer.interval = randomInRange(2000, 5000);
        this.walkTimer.reset();
    }

    // Method to pause Sally's movement
    public pauseMovement(): void {
        this.vel = Vector.Zero;
        this.walkTimer.pause();
    }

    // Method to resume Sally's movement
    public resumeMovement(): void {
        this.walkTimer.resume();
    }

    /**
     * Loads Sally's character bio from the .md file
     */
    private loadCharacterBio(): void {
        this.characterBio = CharacterFileReader.parseMarkdownBio(sallyBio);
        console.log(`Loaded character bio for ${this.characterBio.name}`);
    }

    // DialogueNPC interface implementation - powered by backend API
    public async getDialogue(): Promise<ChatMessage[]> {
        console.log("🎭 getDialogue() called on Sally!");

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
                    speaker: "Sally",
                    text: "Oh my, another visitor! How delightful!",
                    duration: 3000,
                },
                {
                    speaker: "Sally",
                    text: "The beach is so peaceful this time of day, don't you think?",
                    duration: 3500,
                },
                {
                    speaker: "Sally",
                    text: "I love collecting seashells - each one tells its own story.",
                    duration: 3000,
                },
            ];

            return emergencyMessages;
        }
    }

    public isInRange(playerPos: Vector): boolean {
        const distance = this.pos.distance(playerPos);
        const inRange = distance <= 30; // 30 pixel interaction range
        console.log(
            `Sally distance check: ${distance.toFixed(
                1
            )} pixels, in range: ${inRange}`
        );
        return inRange;
    }

    public getNPCName(): string {
        return "Sally";
    }

    /**
     * Regenerate Sally's dialogue (calls backend API)
     */
    public async regenerateDialogue(): Promise<void> {
        try {
            console.log("🔄 Regenerating Sally's dialogue...");

            const response = await axios.post(
                API_BASE_URL + "/regenerate",
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 10000, // 10 second timeout for regeneration
                }
            );

            if (response.data.success) {
                console.log(
                    `✅ Sally's dialogue regenerated - ${response.data.message}`
                );
            } else {
                console.error(
                    "❌ Failed to regenerate Sally's dialogue:",
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

            console.error(
                "🚨 Failed to regenerate Sally's dialogue:",
                errorMessage
            );
        }
    }

    /**
     * Get Sally's character bio
     */
    public getCharacterBio(): CharacterBio | null {
        return this.characterBio;
    }
}

const Resources = {
    Image: new ImageSource(SallyImage),
};

export { Resources };
