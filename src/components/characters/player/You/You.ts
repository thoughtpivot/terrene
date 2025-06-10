import {
    Engine,
    Actor,
    Die,
    Input,
    vec,
    Vector,
    ImageSource,
    Sound,
    CollisionType,
    ImageFiltering,
    Timer,
} from "excalibur";
import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import YouImage from "./You.png";
import Sword from "../../../items/weapons/Sword";
import { getChatSystem } from "../../../../common/ChatSystem";
import { DialogueNPC } from "../../../../common/DialogueNPC";

export default class You extends Actor {
    private isSwinging: boolean = false;
    private swordSwingSound: Sound;
    private sword: Sword;
    private targetPosition: Vector | null = null;
    private isMovingToTarget: boolean = false;
    private moveSpeed: number = 2;

    constructor() {
        super({
            pos: vec(300, 300),
            width: 16,
            height: 16,
            scale: vec(1, 1),
            collisionType: CollisionType.Active,
        });
    }

    onInitialize(engine: Engine) {
        console.log("*** YOU CHARACTER INITIALIZING ***");
        this.graphics.add(Resources.Image.toSprite());

        const sound = new Sound("./modules/characters/player/You/You.mp3");
        this.swordSwingSound = Resources.SwordSwingSound;

        console.log("*** SETTING UP KEYBOARD INPUT ***");

        // Create sword actor
        this.sword = new Sword();

        // Add sword as a child of the player
        this.addChild(this.sword);

        // Mouse input for point-and-click movement
        engine.input.pointers.primary.on("down", (evt) => {
            // Set the target position to where the mouse was clicked
            this.targetPosition = evt.worldPos.clone();
            this.isMovingToTarget = true;
            console.log(
                `Moving to target: ${this.targetPosition.x}, ${this.targetPosition.y}`
            );
        });

        engine.input.keyboard.on("hold", (press) => {
            // Stop automatic movement when manual keyboard input is detected
            this.isMovingToTarget = false;
            this.targetPosition = null;

            switch (press.key) {
                case Input.Keys.Up:
                case Input.Keys.W:
                    this.pos.y = this.pos.y - this.moveSpeed;
                    break;
                case Input.Keys.Down:
                case Input.Keys.S:
                    this.pos.y = this.pos.y + this.moveSpeed;
                    break;
                case Input.Keys.Left:
                case Input.Keys.A:
                    this.pos.x = this.pos.x - this.moveSpeed;
                    sound.loop = true;
                    sound.play(1.0);
                    break;
                case Input.Keys.Right:
                case Input.Keys.D:
                    this.pos.x = this.pos.x + this.moveSpeed;
                    break;
            }
        });

        engine.input.keyboard.on("press", (press) => {
            console.log("Key pressed:", press.key, "Key code:", press.key);

            if (press.key === Input.Keys.Space) {
                // Stop automatic movement when using space to skip
                this.isMovingToTarget = false;
                this.targetPosition = null;

                // Get current movement direction from held keys
                const isMovingUp =
                    engine.input.keyboard.isHeld(Input.Keys.Up) ||
                    engine.input.keyboard.isHeld(Input.Keys.W);
                const isMovingDown =
                    engine.input.keyboard.isHeld(Input.Keys.Down) ||
                    engine.input.keyboard.isHeld(Input.Keys.S);
                const isMovingLeft =
                    engine.input.keyboard.isHeld(Input.Keys.Left) ||
                    engine.input.keyboard.isHeld(Input.Keys.A);
                const isMovingRight =
                    engine.input.keyboard.isHeld(Input.Keys.Right) ||
                    engine.input.keyboard.isHeld(Input.Keys.D);

                // Skip in the direction of movement
                if (isMovingUp) this.pos.y -= 10;
                if (isMovingDown) this.pos.y += 10;
                if (isMovingLeft) this.pos.x -= 10;
                if (isMovingRight) this.pos.x += 10;
            }

            if (press.key === Input.Keys.X) {
                this.swingSword();
            }

            // T key for talking to NPCs
            if (press.key === Input.Keys.T) {
                console.log("*** T KEY DETECTED! ***");
                this.attemptTalkToNPC(engine);
            }

            // Arrow keys for chat navigation when chat is active
            const chatSystem = getChatSystem(engine);
            if (chatSystem.getIsActive()) {
                if (press.key === Input.Keys.Right) {
                    console.log("*** RIGHT ARROW DETECTED IN CHAT ***");
                    chatSystem.navigateToNextMessage();
                    return; // Don't process other movement when in chat
                }
                if (press.key === Input.Keys.Left) {
                    console.log("*** LEFT ARROW DETECTED IN CHAT ***");
                    chatSystem.navigateToPreviousMessage();
                    return; // Don't process other movement when in chat
                }
                // Block all other movement when in chat
                if (
                    press.key === Input.Keys.Up ||
                    press.key === Input.Keys.Down ||
                    press.key === Input.Keys.W ||
                    press.key === Input.Keys.A ||
                    press.key === Input.Keys.S ||
                    press.key === Input.Keys.D
                ) {
                    console.log("Movement blocked during chat");
                    return;
                }
            }

            // Return to city selection menu on Escape key
            if (press.key === Input.Keys.Escape) {
                console.log(
                    "Escape key pressed - returning to city selection menu"
                );
                engine.goToScene("menu");
            }
        });

        console.log("*** KEYBOARD INPUT SETUP COMPLETE ***");
        console.log("Engine input system:", engine.input);
        console.log("Keyboard available:", engine.input.keyboard);

        // Add global keyboard listener as backup
        window.addEventListener("keydown", (event) => {
            console.log("*** GLOBAL KEY DETECTED ***", event.key, event.code);
            if (event.key.toLowerCase() === "t") {
                console.log("*** GLOBAL T KEY DETECTED ***");
                this.attemptTalkToNPC(engine);
            }
        });
    }

    onPreUpdate(engine: Engine, delta: number): void {
        super.onPreUpdate(engine, delta);

        // Handle automatic movement to target position
        if (this.isMovingToTarget && this.targetPosition) {
            const direction = this.targetPosition.sub(this.pos);
            const distance = direction.size;

            // If we're close enough to the target, stop moving
            if (distance < this.moveSpeed) {
                this.isMovingToTarget = false;
                this.targetPosition = null;
                console.log("Reached target position");
            } else {
                // Move towards the target
                const normalizedDirection = direction.normalize();
                const movement = normalizedDirection.scale(this.moveSpeed);
                this.pos = this.pos.add(movement);
            }
        }
    }

    private swingSword(): void {
        console.log("X key pressed - attempting sword swing");

        if (this.isSwinging || this.sword.getIsSwinging()) {
            console.log("Sword swing blocked - already swinging");
            return;
        }

        console.log("Starting sword swing");
        this.isSwinging = true;

        // Play sword swing sound
        this.swordSwingSound.play(0.3);

        // Use the sword's swing method
        this.sword.swing().then(() => {
            console.log("Sword swing completed");
            this.isSwinging = false;
        });
    }

    private attemptTalkToNPC(engine: Engine): void {
        console.log("T key pressed - looking for nearby NPCs");
        console.log("Player position:", this.pos);

        // Check if chat is already active
        const chatSystem = getChatSystem(engine);
        if (chatSystem.getIsActive()) {
            console.log("Chat is already active - advancing or closing");
            chatSystem.advanceOrClose();
            return;
        }

        // Get all actors in the current scene
        const actors = engine.currentScene.actors;
        console.log(`Found ${actors.length} total actors in scene`);

        let npcCount = 0;
        let dialogueNPCCount = 0;

        // Find NPCs that implement DialogueNPC interface and are in range
        for (const actor of actors) {
            console.log(
                `Checking actor: ${actor.constructor.name} at position:`,
                actor.pos
            );

            // Check if the actor implements DialogueNPC interface
            if (
                "getDialogue" in actor &&
                "isInRange" in actor &&
                "getNPCName" in actor
            ) {
                dialogueNPCCount++;
                const npc = actor as unknown as DialogueNPC;
                const distance = this.pos.distance(actor.pos);

                console.log(
                    `Found DialogueNPC: ${npc.getNPCName()}, distance: ${distance.toFixed(
                        1
                    )}`
                );

                if (npc.isInRange(this.pos)) {
                    console.log(
                        `Found nearby NPC: ${npc.getNPCName()} - STARTING CHAT!`
                    );

                    // Pause Old Man Sam's chasing if it's him
                    if (
                        npc.getNPCName() === "Old Man Sam" &&
                        "stopChasing" in actor
                    ) {
                        console.log(
                            "Pausing Old Man Sam's chasing during chat"
                        );
                        (actor as any).stopChasing();
                    }

                    // Check if this NPC supports interactive dialogue
                    if (
                        npc.getNPCName() === "Sally" &&
                        "startInteractiveDialogue" in actor
                    ) {
                        console.log(
                            "🎭 Starting interactive dialogue with Sally!"
                        );
                        (actor as any).startInteractiveDialogue();
                        return; // Exit early for interactive NPCs
                    }

                    // Get the chat system and start dialogue
                    const chatSystem = getChatSystem(engine);
                    const dialogueResult = npc.getDialogue();

                    // Handle both sync and async dialogue
                    if (dialogueResult instanceof Promise) {
                        console.log(
                            `Getting async dialogue from ${npc.getNPCName()}...`
                        );

                        dialogueResult
                            .then((dialogue) => {
                                console.log(
                                    `Starting dialogue with ${npc.getNPCName()}, ${
                                        dialogue.length
                                    } messages:`,
                                    dialogue
                                );

                                chatSystem.startChat(dialogue, () => {
                                    console.log(
                                        `Finished talking to ${npc.getNPCName()}`
                                    );

                                    // Resume Old Man Sam's chasing when chat ends
                                    if (
                                        npc.getNPCName() === "Old Man Sam" &&
                                        "resumeChasing" in actor
                                    ) {
                                        console.log(
                                            "Resuming Old Man Sam's chasing after chat"
                                        );
                                        (actor as any).resumeChasing();
                                    }
                                });
                            })
                            .catch((error) => {
                                console.error(
                                    `Error getting dialogue from ${npc.getNPCName()}:`,
                                    error
                                );
                            });
                    } else {
                        // Synchronous dialogue
                        console.log(
                            `Starting dialogue with ${npc.getNPCName()}, ${
                                dialogueResult.length
                            } messages:`,
                            dialogueResult
                        );

                        chatSystem.startChat(dialogueResult, () => {
                            console.log(
                                `Finished talking to ${npc.getNPCName()}`
                            );

                            // Resume Old Man Sam's chasing when chat ends
                            if (
                                npc.getNPCName() === "Old Man Sam" &&
                                "resumeChasing" in actor
                            ) {
                                console.log(
                                    "Resuming Old Man Sam's chasing after chat"
                                );
                                (actor as any).resumeChasing();
                            }
                        });
                    }

                    return; // Only talk to one NPC at a time
                } else {
                    console.log(
                        `${npc.getNPCName()} is out of range (distance: ${distance.toFixed(
                            1
                        )})`
                    );
                }
            } else {
                if (
                    actor.constructor.name === "OldManSam" ||
                    actor.constructor.name === "Sally"
                ) {
                    npcCount++;
                    console.log(
                        `Found NPC ${actor.constructor.name} but it doesn't implement DialogueNPC interface!`
                    );
                    console.log(
                        "Actor properties:",
                        Object.getOwnPropertyNames(actor)
                    );
                }
            }
        }

        console.log(
            `Total NPCs found: ${npcCount}, DialogueNPCs found: ${dialogueNPCCount}`
        );
        console.log("No NPCs in range to talk to");
    }
}

const Resources = {
    Image: new ImageSource(YouImage, true),
    AsepriteResource: new AsepriteResource(
        "./components/characters/player/You/You.json"
    ),
    Sound: new Sound("./components/characters/player/You/You.mp3"),
    SwordSwingSound: new Sound("./components/characters/player/You/You.mp3"), // Using existing sound for now
};

export { Resources };
