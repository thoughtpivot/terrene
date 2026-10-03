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
    GraphicsGroup,
    Input,
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

    // Interactive dialogue properties
    private isInteractive: boolean = false;
    private inputField: Actor | null = null;
    private inputText: Text | null = null;
    private inputTextActor: Actor | null = null; // Keep reference to the text actor
    private userInput: string = "";
    private onUserMessage: ((message: string) => Promise<void>) | null = null;
    private isWaitingForResponse: boolean = false;
    private updateDisplayTimeout: number | null = null;
    private lastKeyEventTime: number = 0;
    private keyEventThrottle: number = 100; // Minimum 100ms between key events (more aggressive)
    private keyboardHandler: ((evt: any) => void) | null = null;

    constructor(engine: Engine) {
        this.engine = engine;
        // Don't setup keyboard handlers in constructor - do it when needed
    }

    private setupKeyboardHandlers(): void {
        // Remove existing handler if present
        this.removeKeyboardHandlers();

        // Create the handler function
        this.keyboardHandler = (evt) => {
            if (!this.isActive || !this.isInteractive) {
                return;
            }

            // Throttle key events to prevent overwhelming the system
            const currentTime = Date.now();
            if (currentTime - this.lastKeyEventTime < this.keyEventThrottle) {
                return;
            }
            this.lastKeyEventTime = currentTime;

            // Add more debugging to understand what's happening
            console.log(
                "ChatSystem: Key event:",
                evt.key,
                "User input length:",
                this.userInput.length,
                "Waiting:",
                this.isWaitingForResponse
            );

            if (evt.key === Input.Keys.Enter) {
                console.log("ChatSystem: Enter key pressed, sending message");
                this.sendUserMessage();
                return;
            } else if (evt.key === Input.Keys.Backspace) {
                if (!this.isWaitingForResponse) {
                    this.userInput = this.userInput.slice(0, -1);
                    this.throttledUpdateDisplay();
                }
                return;
            } else {
                // Handle character input - extract character from key names like "KeyF" -> "F"
                let char = "";
                if (evt.key.startsWith("Key") && evt.key.length === 4) {
                    // Handle keys like "KeyF", "KeyA", etc.
                    char = evt.key.substring(3).toLowerCase();
                } else if (
                    evt.key.startsWith("Digit") &&
                    evt.key.length === 6
                ) {
                    // Handle keys like "Digit1", "Digit2", etc.
                    char = evt.key.substring(5);
                } else if (evt.key === Input.Keys.Space) {
                    char = " ";
                } else if (evt.key.length === 1) {
                    // Handle direct character keys
                    char = evt.key;
                }

                if (
                    char &&
                    !this.isWaitingForResponse &&
                    this.userInput.length < 100
                ) {
                    console.log(
                        "ChatSystem: Adding character:",
                        char,
                        "to input:",
                        this.userInput
                    );
                    try {
                        this.userInput += char;
                        // Throttle display updates to avoid performance issues
                        this.throttledUpdateDisplay();
                    } catch (error) {
                        console.error(
                            "ChatSystem: Error adding character:",
                            error
                        );
                    }
                } else if (char) {
                    console.log(
                        "ChatSystem: Blocked character input - waiting:",
                        this.isWaitingForResponse,
                        "length:",
                        this.userInput.length
                    );
                }
            }
        };

        // Add the handler to the keyboard input
        this.engine.input.keyboard.on("press", this.keyboardHandler);
    }

    private removeKeyboardHandlers(): void {
        if (this.keyboardHandler) {
            this.engine.input.keyboard.off("press", this.keyboardHandler);
            this.keyboardHandler = null;
        }
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
        this.isInteractive = false; // Default to non-interactive

        console.log("Chat system: Creating chat UI");
        // Create chat UI
        this.createChatUI();

        console.log("Chat system: Starting to show messages");
        // Start displaying messages
        this.showNextMessage();
    }

    public startInteractiveChat(
        initialMessages: ChatMessage[],
        onUserMessage: (message: string) => Promise<void>,
        onComplete?: () => void
    ): void {
        console.log("Chat system: Starting interactive chat");
        console.log("Chat system: Setting isActive=true, isInteractive=true");

        this.messageQueue = [...initialMessages];
        this.allMessages = [...initialMessages];
        this.currentMessageIndex = -1;
        this.onComplete = onComplete || null;
        this.onUserMessage = onUserMessage;
        this.isActive = true;
        this.isInteractive = true;
        this.userInput = "";

        console.log("Chat system: Creating chat UI and input field");
        this.createChatUI();
        this.createInputField();
        this.setupKeyboardHandlers(); // Set up keyboard handlers for interactive mode

        console.log("Chat system: Interactive chat setup complete");
        console.log("Chat system: isActive =", this.isActive);
        console.log("Chat system: isInteractive =", this.isInteractive);

        if (initialMessages.length > 0) {
            this.showNextMessage();
        } else {
            this.showInputField();
        }
    }

    private createInputField(): void {
        console.log("ChatSystem: Creating input field");
        if (!this.chatUI) {
            console.log(
                "ChatSystem: No chatUI found, cannot create input field"
            );
            return;
        }

        const inputWidth = this.chatUI.width - 40;
        const inputHeight = 30;

        console.log(
            "ChatSystem: Input field dimensions:",
            inputWidth,
            "x",
            inputHeight
        );
        console.log(
            "ChatSystem: Input field position:",
            this.chatUI.pos.x,
            this.chatUI.pos.y + 60
        );

        // Create input field background
        this.inputField = new Actor({
            pos: new Vector(
                this.chatUI.pos.x,
                this.chatUI.pos.y + 60 // Position below the chat area
            ),
            width: inputWidth,
            height: inputHeight,
            z: 1001,
            coordPlane: CoordPlane.Screen,
        });

        const inputGraphics = new GraphicsGroup({
            members: [
                // Input field background
                {
                    graphic: new Rectangle({
                        width: inputWidth,
                        height: inputHeight,
                        color: Color.fromHex("#2a2a2a"),
                    }),
                    pos: Vector.Zero,
                },
                // Input field border
                {
                    graphic: new Rectangle({
                        width: inputWidth,
                        height: inputHeight,
                        color: Color.fromHex("#4A90E2"),
                    }),
                    pos: Vector.Zero,
                },
                // Inner input area
                {
                    graphic: new Rectangle({
                        width: inputWidth - 4,
                        height: inputHeight - 4,
                        color: Color.fromHex("#1a1a1a"),
                    }),
                    pos: Vector.Zero,
                },
            ],
        });

        this.inputField.graphics.use(inputGraphics);
        this.engine.currentScene.add(this.inputField);
        console.log("ChatSystem: Input field added to scene");

        // Create input text
        this.inputText = new Text({
            text: "",
            color: Color.fromHex("#F5F5F5"),
            font: new Font({
                family: "Arial, sans-serif",
                size: 14,
                unit: FontUnit.Px,
            }),
        });

        console.log("ChatSystem: Input text created, updating display");
        this.updateInputDisplay();
        console.log("ChatSystem: Input field creation complete");
    }

    private throttledUpdateDisplay(): void {
        // Cancel any pending update
        if (this.updateDisplayTimeout) {
            clearTimeout(this.updateDisplayTimeout);
            this.updateDisplayTimeout = null;
        }

        // Update immediately instead of using setTimeout to avoid accumulation issues
        try {
            this.updateInputDisplay();
        } catch (error) {
            console.error("ChatSystem: Error updating input display:", error);
        }
    }

    private updateInputDisplay(): void {
        if (!this.inputField) {
            console.log(
                "ChatSystem: Cannot update display - missing inputField"
            );
            return;
        }

        // Show user input with cursor
        const displayText = this.isWaitingForResponse
            ? "Waiting for response..."
            : this.userInput + "_";

        console.log("ChatSystem: Updating display with text:", displayText);

        // Recreate text and actor each time to ensure it displays correctly
        if (this.inputTextActor && !this.inputTextActor.isKilled()) {
            this.inputTextActor.kill();
        }

        this.inputText = new Text({
            text: displayText,
            color: Color.fromHex("#F5F5F5"),
            font: new Font({
                family: "Arial, sans-serif",
                size: 14,
                unit: FontUnit.Px,
            }),
        });

        this.inputTextActor = new Actor({
            pos: new Vector(
                this.inputField.pos.x - this.inputField.width / 2 + 10,
                this.inputField.pos.y
            ),
            z: 1002,
            coordPlane: CoordPlane.Screen,
        });

        this.inputTextActor.graphics.use(this.inputText);
        this.engine.currentScene.add(this.inputTextActor);
    }

    private async sendUserMessage(): Promise<void> {
        if (
            !this.userInput.trim() ||
            this.isWaitingForResponse ||
            !this.onUserMessage
        ) {
            return;
        }

        const message = this.userInput.trim();
        this.userInput = "";
        this.isWaitingForResponse = true;
        this.updateInputDisplay();

        // Add user message to the conversation
        const userMessage: ChatMessage = {
            speaker: "You",
            text: message,
            duration: 2000,
        };

        this.allMessages.push(userMessage);
        this.currentMessageIndex = this.allMessages.length - 1;
        this.showCurrentMessage();

        try {
            // Send message to the backend handler
            await this.onUserMessage(message);
        } catch (error) {
            console.error("Error sending user message:", error);
        }

        this.isWaitingForResponse = false;
        this.updateInputDisplay();
    }

    public addNPCResponse(message: ChatMessage): void {
        console.log("ChatSystem: Adding NPC response:", message);
        this.allMessages.push(message);
        this.currentMessageIndex = this.allMessages.length - 1;
        this.showCurrentMessage();
        console.log(
            "ChatSystem: NPC response added, message count:",
            this.allMessages.length
        );
    }

    private showCurrentMessage(): void {
        if (
            this.currentMessageIndex < 0 ||
            this.currentMessageIndex >= this.allMessages.length
        ) {
            return;
        }

        this.currentMessage = this.allMessages[this.currentMessageIndex];

        // Clean up previous message actors
        if (this.currentSpeakerActor) {
            this.currentSpeakerActor.kill();
            this.currentSpeakerActor = null;
        }
        if (this.currentMessageActor) {
            this.currentMessageActor.kill();
            this.currentMessageActor = null;
        }

        if (this.speakerText && this.messageText && this.chatUI) {
            this.speakerText.text = this.currentMessage.speaker + ":";
            this.messageText.text = this.currentMessage.text;

            // Position speaker text
            this.currentSpeakerActor = new Actor({
                pos: new Vector(
                    this.chatUI.pos.x - this.chatUI.width / 2 + 50,
                    this.chatUI.pos.y - 30
                ),
                z: 1001,
                coordPlane: CoordPlane.Screen,
            });
            this.currentSpeakerActor.graphics.use(this.speakerText);
            this.engine.currentScene.add(this.currentSpeakerActor);

            // Position message text
            this.currentMessageActor = new Actor({
                pos: new Vector(
                    this.chatUI.pos.x - this.chatUI.width / 2 + 50,
                    this.chatUI.pos.y + 15
                ),
                z: 1001,
                coordPlane: CoordPlane.Screen,
            });
            this.currentMessageActor.graphics.use(this.messageText);
            this.engine.currentScene.add(this.currentMessageActor);
        }

        if (this.isInteractive) {
            console.log(
                "ChatSystem: Interactive mode - ensuring input field is shown"
            );
            this.showInputField();
        }
    }

    private showInputField(): void {
        console.log("ChatSystem: showInputField called");
        if (!this.inputField || this.inputField.isKilled()) {
            console.log(
                "ChatSystem: Input field missing or killed, recreating"
            );
            this.createInputField();
        } else {
            console.log(
                "ChatSystem: Input field already exists, ensuring it's displayed"
            );
            // Make sure the input display is updated
            this.updateInputDisplay();
        }
    }

    private createChatUI(): void {
        console.log("Chat system: Creating chat UI");
        console.log("Screen resolution:", this.engine.screen.resolution);

        const chatWidth = this.engine.screen.resolution.width - 80; // Even more padding for better proportions
        const chatHeight = 120; // Taller for better text spacing
        const borderWidth = 4; // Thicker border for more prominence
        const cornerRadius = 12;

        // Create chat background box
        this.chatUI = new Actor({
            pos: new Vector(
                this.engine.screen.resolution.width / 2,
                this.engine.screen.resolution.height - 140 // More spacing from bottom
            ),
            width: chatWidth,
            height: chatHeight,
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

        // Create layered graphics for the chat box
        const chatGraphics = new GraphicsGroup({
            members: [
                // Outer shadow effect (largest rectangle with shadow color)
                {
                    graphic: new Rectangle({
                        width: chatWidth + 6,
                        height: chatHeight + 6,
                        color: Color.fromHex("#000000"), // Black shadow
                    }),
                    pos: new Vector(2, 2), // Offset for shadow effect
                },
                // Main border (larger rectangle with border color)
                {
                    graphic: new Rectangle({
                        width: chatWidth,
                        height: chatHeight,
                        color: Color.fromHex("#4A90E2"), // Nice blue border
                    }),
                    pos: Vector.Zero,
                },
                // Inner highlight border (creates depth)
                {
                    graphic: new Rectangle({
                        width: chatWidth - borderWidth * 2 + 1,
                        height: chatHeight - borderWidth * 2 + 1,
                        color: Color.fromHex("#87CEEB"), // Sky blue highlight
                    }),
                    pos: Vector.Zero,
                },
                // Inner background (main content area)
                {
                    graphic: new Rectangle({
                        width: chatWidth - borderWidth * 2,
                        height: chatHeight - borderWidth * 2,
                        color: Color.fromHex("#1a1a1a"), // Dark charcoal background
                    }),
                    pos: Vector.Zero,
                },
            ],
        });

        // Set opacity for subtle transparency (shadow will be more transparent)
        chatGraphics.opacity = 0.92;

        this.chatUI.graphics.use(chatGraphics);

        // Add to current scene
        console.log("Adding chat UI to scene");
        try {
            this.engine.currentScene.add(this.chatUI);
            console.log("Chat UI added successfully");
        } catch (error) {
            console.error("Error adding chat UI to scene:", error);
        }

        // Create text objects with enhanced styling
        this.speakerText = new Text({
            text: "",
            color: Color.fromHex("#FFD700"), // Gold color for speaker names
            font: new Font({
                family: "Arial, sans-serif",
                size: 18, // Slightly larger for better prominence
                unit: FontUnit.Px,
                bold: true,
            }),
        });

        this.messageText = new Text({
            text: "",
            color: Color.fromHex("#F5F5F5"), // Brighter white for better contrast
            font: new Font({
                family: "Arial, sans-serif",
                size: 15, // Slightly larger for better readability
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
            console.log("Chat system: No more messages");
            if (this.isInteractive) {
                console.log(
                    "Chat system: Interactive mode - showing input field instead of ending"
                );
                // Don't end chat in interactive mode, just show input field
                this.showInputField();
                return;
            } else {
                console.log("Chat system: Non-interactive mode - ending chat");
                this.endChat();
                return;
            }
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

            // Position speaker text in the upper portion of the chat box, well inside the border
            this.currentSpeakerActor = new Actor({
                pos: new Vector(
                    this.chatUI.pos.x - this.chatUI.width / 2 + 50, // Much more padding to ensure it's inside the border
                    this.chatUI.pos.y - 30 // Position in upper portion with better spacing
                ),
                z: 1001,
                coordPlane: CoordPlane.Screen, // Use screen coordinates
            });
            this.currentSpeakerActor.graphics.use(this.speakerText);
            this.engine.currentScene.add(this.currentSpeakerActor);

            // Position message text in the lower portion of the chat box, well inside the border
            this.currentMessageActor = new Actor({
                pos: new Vector(
                    this.chatUI.pos.x - this.chatUI.width / 2 + 50, // Much more padding to ensure it's inside the border
                    this.chatUI.pos.y + 15 // Position in lower portion with good spacing from speaker text
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
        // Clean up any pending timeouts
        if (this.updateDisplayTimeout) {
            clearTimeout(this.updateDisplayTimeout);
            this.updateDisplayTimeout = null;
        }

        // Remove keyboard handlers
        this.removeKeyboardHandlers();

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

        // Clean up input field
        if (this.inputField) {
            this.inputField.kill();
            this.inputField = null;
        }

        // Clean up input text actor
        if (this.inputTextActor) {
            this.inputTextActor.kill();
            this.inputTextActor = null;
        }

        // Clean up timer
        if (this.messageTimer) {
            this.messageTimer.stop();
            this.messageTimer = null;
        }

        // Reset state
        this.isActive = false;
        this.isInteractive = false;
        this.currentMessage = null;
        this.messageQueue = [];
        this.allMessages = [];
        this.currentMessageIndex = -1;
        this.speakerText = null;
        this.messageText = null;
        this.inputText = null;
        this.inputTextActor = null;
        this.userInput = "";
        this.onUserMessage = null;
        this.isWaitingForResponse = false;

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

        // Clean up any pending timeouts
        if (this.updateDisplayTimeout) {
            clearTimeout(this.updateDisplayTimeout);
            this.updateDisplayTimeout = null;
        }

        // Remove keyboard handlers
        this.removeKeyboardHandlers();

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

        // Clean up input field
        if (this.inputField) {
            this.inputField.kill();
            this.inputField = null;
        }

        // Clean up input text actor
        if (this.inputTextActor) {
            this.inputTextActor.kill();
            this.inputTextActor = null;
        }

        // Clean up timer
        if (this.messageTimer) {
            this.messageTimer.stop();
            this.messageTimer = null;
        }

        // Reset state
        this.isActive = false;
        this.isInteractive = false;
        this.currentMessage = null;
        this.messageQueue = [];
        this.allMessages = [];
        this.currentMessageIndex = -1;
        this.speakerText = null;
        this.messageText = null;
        this.inputText = null;
        this.inputTextActor = null;
        this.userInput = "";
        this.onUserMessage = null;
        this.isWaitingForResponse = false;
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
