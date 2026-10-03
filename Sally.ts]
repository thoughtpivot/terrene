import {
    Actor,
    vec,
    ImageSource,
    Timer,
    Vector,
    randomInRange,
    CollisionType,
    Engine,
    Circle,
    Color,
    GraphicsGroup,
    Text,
    Font,
    FontUnit,
} from "excalibur";
import axios from "axios";
import SallyImage from "./Sally.png";
import { ChatMessage, getChatSystem } from "../../../../common/ChatSystem";
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
    private loadingIndicator: Actor | null = null;
    private isGeneratingDialogue: boolean = false;

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

        // Show loading indicator
        this.showLoadingIndicator();

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

            // Hide loading indicator before returning
            this.hideLoadingIndicator();

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

            // Hide loading indicator before returning fallback
            this.hideLoadingIndicator();

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

    /**
     * Start interactive dialogue with Sally
     */
    public async startInteractiveDialogue(): Promise<void> {
        console.log("🎭 Sally: Starting interactive dialogue!");

        try {
            // Get initial greeting messages
            console.log("🎭 Sally: Getting initial messages...");
            const initialMessages = await this.getDialogue();
            console.log(
                "🎭 Sally: Got",
                initialMessages.length,
                "initial messages"
            );

            const chatSystem = getChatSystem(this.scene!.engine);
            console.log("🎭 Sally: Got chat system, starting interactive chat");

            // Start interactive chat
            chatSystem.startInteractiveChat(
                initialMessages,
                async (userMessage: string) => {
                    console.log(
                        "📤 Sally: Received user message:",
                        userMessage
                    );
                    await this.handleUserMessage(userMessage, chatSystem);
                },
                () => {
                    console.log("💬 Sally: Interactive dialogue ended");
                    this.resumeMovement();
                }
            );

            // Pause Sally's movement during chat
            console.log("🎭 Sally: Pausing movement for chat");
            this.pauseMovement();
            console.log("🎭 Sally: Interactive dialogue setup complete!");
        } catch (error) {
            console.error(
                "🚨 Sally: Error starting interactive dialogue:",
                error
            );
        }
    }

    /**
     * Handle user message and get Sally's response
     */
    private async handleUserMessage(
        userMessage: string,
        chatSystem: any
    ): Promise<void> {
        try {
            // Show loading indicator
            this.showLoadingIndicator();

            console.log("📡 Sally: Sending message to backend:", userMessage);
            console.log("📡 Sally: API URL:", API_BASE_URL + "/chat");

            const response = await axios.get(API_BASE_URL + "/chat", {
                params: {
                    message: userMessage,
                },
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 10000, // 10 second timeout for interactive responses
            });

            console.log(
                "📡 Sally: Backend response received:",
                response.status
            );
            console.log("📡 Sally: Response data:", response.data);

            // Hide loading indicator
            this.hideLoadingIndicator();

            if (!response.data.success) {
                throw new Error(`Backend API failed: ${response.data.error}`);
            }

            console.log(
                "✅ Got response from Sally backend:",
                response.data.response.text
            );

            if (response.data.fallback) {
                console.log("⚠️ Backend used fallback response");
            }

            // Add Sally's response to the chat
            chatSystem.addNPCResponse(response.data.response);
        } catch (error) {
            // Hide loading indicator on error
            this.hideLoadingIndicator();

            let errorMessage =
                "I'm having trouble thinking of what to say right now.";

            if (axios.isAxiosError(error)) {
                if (error.code === "ECONNREFUSED") {
                    errorMessage =
                        "I seem to be having connection issues. Could you try again?";
                } else if (error.code === "ECONNABORTED") {
                    errorMessage =
                        "I'm thinking a bit slowly today. Could you repeat that?";
                }
            }

            console.error("🚨 Error handling user message:", error);

            // Add fallback response
            const fallbackResponse: ChatMessage = {
                speaker: "Sally",
                text: errorMessage,
                duration: 3000,
            };

            chatSystem.addNPCResponse(fallbackResponse);
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

    /**
     * Show loading indicator above Sally
     */
    private showLoadingIndicator(): void {
        if (this.loadingIndicator || this.isGeneratingDialogue) {
            return; // Already showing or already generating
        }

        this.isGeneratingDialogue = true;

        // Create animated loading indicator (50% smaller than previous size)
        this.loadingIndicator = new Actor({
            pos: new Vector(this.pos.x, this.pos.y - 4), // Position above Sally (very close)
            width: 2,
            height: 1,
            z: 1000, // High z-index to appear above everything
        });

        // Create animated loading graphics
        const loadingGraphics = new GraphicsGroup({
            members: [
                // Background bubble
                {
                    graphic: new Circle({
                        radius: 1,
                        color: Color.fromHex("#4A90E2"),
                    }),
                    pos: Vector.Zero,
                },
                // Inner background
                {
                    graphic: new Circle({
                        radius: 0.75,
                        color: Color.fromHex("#1a1a1a"),
                    }),
                    pos: Vector.Zero,
                },
                // Loading text
                {
                    graphic: new Text({
                        text: "...",
                        color: Color.fromHex("#FFD700"),
                        font: new Font({
                            family: "Arial, sans-serif",
                            size: 2,
                            unit: FontUnit.Px,
                            bold: true,
                        }),
                    }),
                    pos: Vector.Zero,
                },
            ],
        });

        this.loadingIndicator.graphics.use(loadingGraphics);

        // Add to current scene
        if (this.scene) {
            this.scene.add(this.loadingIndicator);

            // Add pulsing animation
            this.loadingIndicator.actions.repeatForever((ctx) => {
                ctx.scaleBy(vec(0.2, 0.2), 500).scaleBy(vec(-0.2, -0.2), 500);
            });
        }
    }

    /**
     * Hide loading indicator
     */
    private hideLoadingIndicator(): void {
        if (this.loadingIndicator) {
            this.loadingIndicator.kill();
            this.loadingIndicator = null;
        }
        this.isGeneratingDialogue = false;
    }

    /**
     * Update loading indicator position to follow Sally
     */
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

        // Update loading indicator position if it exists
        if (this.loadingIndicator) {
            this.loadingIndicator.pos = new Vector(this.pos.x, this.pos.y - 4);
        }
    }
}

const Resources = {
    Image: new ImageSource(SallyImage),
};

export { Resources };
