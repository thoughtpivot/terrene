import {
    Engine,
    Actor,
    Vector,
    Rectangle,
    Color,
    Text,
    Font,
    FontUnit,
    Timer,
    CoordPlane,
} from "excalibur";

export interface ChatMessage {
    speaker: string;
    text: string;
    duration?: number; // Optional duration, defaults to auto-calculate based on text length
}

export class ChatSystem {
    private engine: Engine;
    private isActive: boolean = false;
    private messageQueue: ChatMessage[] = [];
    private currentMessage: ChatMessage | null = null;
    private chatUI: Actor | null = null;
    private messageText: Text | null = null;
    private speakerText: Text | null = null;
    private messageTimer: Timer | null = null;
    private onComplete: (() => void) | null = null;
    private currentSpeakerActor: Actor | null = null;
    private currentMessageActor: Actor | null = null;
    private allMessages: ChatMessage[] = []; // Store all messages for navigation
    private currentMessageIndex: number = -1; // Track current position

    constructor(engine: Engine) {
        this.engine = engine;
    }

    public startChat(messages: ChatMessage[], onComplete?: () => void): void {
        console.log(
            "Chat system: startChat called with",
            messages.length,
            "messages"
        );
        console.log("Chat system: isActive =", this.isActive);

        if (this.isActive) {
            console.log(
                "Chat system: Already active, forcing reset and trying again"
            );
            // Force reset if stuck in active state
            this.forceReset();
        }

        this.messageQueue = [...messages]; // Clone the messages array
        this.allMessages = [...messages]; // Store all messages for navigation
        this.currentMessageIndex = -1; // Reset index
        this.onComplete = onComplete || null;
        this.isActive = true;

        console.log("Chat system: Creating chat UI");
        // Create chat UI
        this.createChatUI();

        console.log("Chat system: Starting to show messages");
        // Start displaying messages
        this.showNextMessage();
    }

    private createChatUI(): void {
        console.log("Chat system: Creating chat UI");
        console.log("Screen resolution:", this.engine.screen.resolution);

        // Create chat background box
        this.chatUI = new Actor({
            pos: new Vector(
                this.engine.screen.resolution.width / 2,
                this.engine.screen.resolution.height - 120
            ),
            width: this.engine.screen.resolution.width - 40,
            height: 100,
            z: 1000, // High z-index to appear above everything
            coordPlane: CoordPlane.Screen, // Use screen coordinates for UI
        });

        console.log("Chat UI position:", this.chatUI.pos);
        console.log(
            "Chat UI size:",
            this.chatUI.width,
            "x",
            this.chatUI.height
        );

        // Dark semi-transparent background
        const chatBackground = new Rectangle({
            width: this.engine.screen.resolution.width - 40,
            height: 100,
            color: Color.fromHex("#000000"),
        });
        chatBackground.opacity = 0.8;

        this.chatUI.graphics.use(chatBackground);

        // Add to current scene
        console.log("Adding chat UI to scene");
        try {
            this.engine.currentScene.add(this.chatUI);
            console.log("Chat UI added successfully");
        } catch (error) {
            console.error("Error adding chat UI to scene:", error);
        }

        // Create text objects (will be positioned relative to chat box)
        this.speakerText = new Text({
            text: "",
            color: Color.Yellow,
            font: new Font({
                family: "Arial",
                size: 16,
                unit: FontUnit.Px,
                bold: true,
            }),
        });

        this.messageText = new Text({
            text: "",
            color: Color.White,
            font: new Font({
                family: "Arial",
                size: 14,
                unit: FontUnit.Px,
            }),
        });
    }

    private showNextMessage(): void {
        console.log(
            "Chat system: showNextMessage called, queue length:",
            this.messageQueue.length
        );

        // Advance to next message
        this.currentMessageIndex++;

        if (this.currentMessageIndex >= this.allMessages.length) {
            console.log("Chat system: No more messages, ending chat");
            this.endChat();
            return;
        }

        // Get current message
        this.currentMessage = this.allMessages[this.currentMessageIndex];
        console.log(
            "Chat system: Showing message:",
            this.currentMessage.speaker,
            "-",
            this.currentMessage.text
        );

        // Clean up previous message actors first
        if (this.currentSpeakerActor) {
            this.currentSpeakerActor.kill();
            this.currentSpeakerActor = null;
        }
        if (this.currentMessageActor) {
            this.currentMessageActor.kill();
            this.currentMessageActor = null;
        }

        // Update UI with new message
        if (this.speakerText && this.messageText && this.chatUI) {
            this.speakerText.text = this.currentMessage.speaker + ":";
            this.messageText.text = this.currentMessage.text;

            // Position speaker text at top of chat box with much more left margin
            this.currentSpeakerActor = new Actor({
                pos: new Vector(
                    this.chatUI.pos.x - this.chatUI.width / 2 + 60, // Much larger left margin
                    this.chatUI.pos.y - 30
                ),
                z: 1001,
                coordPlane: CoordPlane.Screen, // Use screen coordinates
            });
            this.currentSpeakerActor.graphics.use(this.speakerText);
            this.engine.currentScene.add(this.currentSpeakerActor);

            // Position message text below speaker with much more left margin
            this.currentMessageActor = new Actor({
                pos: new Vector(
                    this.chatUI.pos.x - this.chatUI.width / 2 + 60, // Much larger left margin
                    this.chatUI.pos.y - 5
                ),
                z: 1001,
                coordPlane: CoordPlane.Screen, // Use screen coordinates
            });
            this.currentMessageActor.graphics.use(this.messageText);
            this.engine.currentScene.add(this.currentMessageActor);

            // Set up timer for message duration
            const duration =
                this.currentMessage.duration ||
                this.calculateMessageDuration(this.currentMessage.text);

            this.messageTimer = new Timer({
                fcn: () => {
                    // Show next message (cleanup will happen at start of next message)
                    this.showNextMessage();
                },
                interval: duration,
                repeats: false,
            });

            this.engine.addTimer(this.messageTimer);
        }
    }

    private calculateMessageDuration(text: string): number {
        // Base duration: 2 seconds + 50ms per character (reading time)
        const baseTime = 2000;
        const perCharTime = 50;
        return Math.max(baseTime, text.length * perCharTime);
    }

    private endChat(): void {
        // Clean up current message actors
        if (this.currentSpeakerActor) {
            this.currentSpeakerActor.kill();
            this.currentSpeakerActor = null;
        }
        if (this.currentMessageActor) {
            this.currentMessageActor.kill();
            this.currentMessageActor = null;
        }

        // Clean up UI
        if (this.chatUI) {
            this.chatUI.kill();
            this.chatUI = null;
        }

        // Clean up timer
        if (this.messageTimer) {
            this.messageTimer.stop();
            this.messageTimer = null;
        }

        // Reset state
        this.isActive = false;
        this.currentMessage = null;
        this.messageQueue = [];
        this.allMessages = [];
        this.currentMessageIndex = -1;
        this.speakerText = null;
        this.messageText = null;

        // Call completion callback
        if (this.onComplete) {
            this.onComplete();
            this.onComplete = null;
        }
    }

    public getIsActive(): boolean {
        return this.isActive;
    }

    public skipCurrentMessage(): void {
        if (this.messageTimer && this.isActive) {
            this.messageTimer.stop();
            this.showNextMessage();
        }
    }

    public advanceOrClose(): void {
        console.log("Chat system: Manual advance requested");
        if (!this.isActive) {
            console.log("Chat system: Not active, ignoring advance request");
            return;
        }

        // Stop current timer if running
        if (this.messageTimer) {
            console.log("Chat system: Stopping current message timer");
            this.messageTimer.stop();
            this.messageTimer = null;
        }

        // Check if there are more messages
        if (this.currentMessageIndex + 1 < this.allMessages.length) {
            console.log(
                `Chat system: Advancing to next message (${
                    this.allMessages.length - this.currentMessageIndex - 1
                } remaining)`
            );
            this.showNextMessage();
        } else {
            console.log("Chat system: No more messages, closing chat");
            this.endChat();
        }
    }

    public navigateToNextMessage(): void {
        console.log("Chat system: Right arrow - next message");
        if (!this.isActive) return;

        // Stop current timer if running
        if (this.messageTimer) {
            this.messageTimer.stop();
            this.messageTimer = null;
        }

        if (this.currentMessageIndex + 1 < this.allMessages.length) {
            this.showNextMessage();
        } else {
            console.log("Chat system: Already at last message");
        }
    }

    public navigateToPreviousMessage(): void {
        console.log("Chat system: Left arrow - previous message");
        if (!this.isActive) return;

        // Stop current timer if running
        if (this.messageTimer) {
            this.messageTimer.stop();
            this.messageTimer = null;
        }

        if (this.currentMessageIndex > 0) {
            this.currentMessageIndex -= 2; // Go back two, showNextMessage will advance by one
            this.showNextMessage();
        } else {
            console.log("Chat system: Already at first message");
        }
    }

    public forceReset(): void {
        console.log("Chat system: Force resetting...");

        // Clean up current message actors
        if (this.currentSpeakerActor) {
            this.currentSpeakerActor.kill();
            this.currentSpeakerActor = null;
        }
        if (this.currentMessageActor) {
            this.currentMessageActor.kill();
            this.currentMessageActor = null;
        }

        // Clean up UI
        if (this.chatUI) {
            this.chatUI.kill();
            this.chatUI = null;
        }

        // Clean up timer
        if (this.messageTimer) {
            this.messageTimer.stop();
            this.messageTimer = null;
        }

        // Reset state
        this.isActive = false;
        this.currentMessage = null;
        this.messageQueue = [];
        this.allMessages = [];
        this.currentMessageIndex = -1;
        this.speakerText = null;
        this.messageText = null;
        this.onComplete = null;

        console.log("Chat system: Force reset complete");
    }
}

// Global chat system instance (singleton pattern)
let globalChatSystem: ChatSystem | null = null;

export function getChatSystem(engine: Engine): ChatSystem {
    if (!globalChatSystem) {
        globalChatSystem = new ChatSystem(engine);
    }
    return globalChatSystem;
}
