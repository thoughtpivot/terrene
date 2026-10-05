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
import { getQuestLogUI } from "../../../../common/QuestLogUI";

export default class You extends Actor {
    private isSwinging: boolean = false;
    private swordSwingSound: Sound;
    private sword: Sword;
    private targetPosition: Vector | null = null;
    private isMovingToTarget: boolean = false;
    private moveSpeed: number = 200; // Pixels per second for platformer
    private jumpSpeed: number = 400; // Jump force
    private movementSound: Sound | null = null;
    private isPlatformerMode: boolean = false; // Track if we're in platformer mode

    constructor() {
        super({
            pos: vec(300, 300),
            width: 16,
            height: 16,
            scale: vec(2.5, 2.5),
            collisionType: CollisionType.Active,
        });
    }
    
    public enablePlatformerMode(): void {
        this.isPlatformerMode = true;
        // Enable gravity using body.acc (acceleration) for downward force
        this.body.acc = vec(0, 800); // Gravity acceleration downward
        this.body.mass = 10;
    }
    
    public disablePlatformerMode(): void {
        this.isPlatformerMode = false;
        this.body.acc = vec(0, 0); // Remove gravity
    }

    onInitialize(engine: Engine) {
        console.log("*** YOU CHARACTER INITIALIZING ***");
        this.graphics.add(Resources.Image.toSprite());

        this.movementSound = new Sound(
            "./modules/characters/player/You/You.mp3"
        );
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
            // In platformer mode, handle horizontal movement only
            if (this.isPlatformerMode) {
                const velocity = this.vel;
                
                if (press.key === Input.Keys.Left || press.key === Input.Keys.A) {
                    velocity.x = -this.moveSpeed;
                } else if (press.key === Input.Keys.Right || press.key === Input.Keys.D) {
                    velocity.x = this.moveSpeed;
                }
                
                this.vel = velocity;
                return;
            }
            
            // Original top-down movement for non-platformer modes
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
                    if (this.movementSound) {
                        this.movementSound.loop = true;
                        this.movementSound.play(1.0);
                    }
                    break;
                case Input.Keys.Right:
                case Input.Keys.D:
                    this.pos.x = this.pos.x + this.moveSpeed;
                    break;
            }
        });
        
        // Stop horizontal movement when keys are released in platformer mode
        engine.input.keyboard.on("release", (press) => {
            if (this.isPlatformerMode) {
                if (press.key === Input.Keys.Left || press.key === Input.Keys.A ||
                    press.key === Input.Keys.Right || press.key === Input.Keys.D) {
                    this.vel.x = 0;
                }
            }
        });

        engine.input.keyboard.on("press", (press) => {
            console.log("Key pressed:", press.key, "Key code:", press.key);

            // Q key for quest log
            if (press.key === Input.Keys.Q) {
                const questLogUI = getQuestLogUI(engine);
                questLogUI.toggle();
                
                // Stop movement when opening quest log
                if (questLogUI.getIsVisible()) {
                    this.isMovingToTarget = false;
                    this.targetPosition = null;
                }
                return;
            }

            if (press.key === Input.Keys.Space) {
                // In platformer mode, Space is for jumping
                if (this.isPlatformerMode) {
                    // Check if player is on the ground (simple collision check)
                    const onGround = Math.abs(this.vel.y) < 10;
                    if (onGround) {
                        this.vel.y = -this.jumpSpeed;
                    }
                    return;
                }
                
                // Original space behavior for non-platformer modes
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
                
                // Close quest log if open before talking to NPCs
                const questLogUI = getQuestLogUI(engine);
                if (questLogUI.getIsVisible()) {
                    questLogUI.hide();
                }
                
                this.attemptTalkToNPC(engine);
                return;
            }

            // Arrow keys for chat navigation when chat is active
            const chatSystem = getChatSystem(engine);
            const questLogUI = getQuestLogUI(engine);
            
            // Block movement if chat or quest log is open
            if (chatSystem.getIsActive() || questLogUI.getIsVisible()) {
                if (press.key === Input.Keys.Right && chatSystem.getIsActive()) {
                    console.log("*** RIGHT ARROW DETECTED IN CHAT ***");
                    chatSystem.navigateToNextMessage();
                    return; // Don't process other movement when in chat
                }
                if (press.key === Input.Keys.Left && chatSystem.getIsActive()) {
                    console.log("*** LEFT ARROW DETECTED IN CHAT ***");
                    chatSystem.navigateToPreviousMessage();
                    return; // Don't process other movement when in chat
                }
                // Block all other movement when in chat or quest log
                if (
                    press.key === Input.Keys.Up ||
                    press.key === Input.Keys.Down ||
                    press.key === Input.Keys.W ||
                    press.key === Input.Keys.A ||
                    press.key === Input.Keys.S ||
                    press.key === Input.Keys.D
                ) {
                    console.log("Movement blocked during chat or quest log");
                    return;
                }
            }

            // Return to city selection menu on Escape key
            if (press.key === Input.Keys.Escape) {
                console.log(
                    "Escape key pressed - fading out audio and returning to city selection menu"
                );
                this.fadeOutAudioAndChangeScene(engine);
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

    private async fadeOutAudioAndChangeScene(engine: Engine): Promise<void> {
        const fadeOutPromises: Promise<void>[] = [];

        // Fade out movement sound if playing
        if (this.movementSound && this.movementSound.isPlaying()) {
            fadeOutPromises.push(this.fadeOutSound(this.movementSound));
        }

        // Fade out sword swing sound if playing
        if (this.swordSwingSound && this.swordSwingSound.isPlaying()) {
            fadeOutPromises.push(this.fadeOutSound(this.swordSwingSound));
        }

        // Wait for all sounds to fade out
        if (fadeOutPromises.length > 0) {
            await Promise.all(fadeOutPromises);
        }

        // Now change the scene
        engine.goToScene("menu");
    }

    private fadeOutSound(sound: Sound, duration: number = 1000): Promise<void> {
        return new Promise((resolve) => {
            const startVolume = sound.volume;
            const fadeInterval = 16; // ~60fps
            const fadeSteps = duration / fadeInterval;
            const volumeStep = startVolume / fadeSteps;
            let currentStep = 0;

            const fadeTimer = setInterval(() => {
                currentStep++;
                const newVolume = Math.max(
                    0,
                    startVolume - volumeStep * currentStep
                );
                sound.volume = newVolume;

                if (newVolume <= 0 || currentStep >= fadeSteps) {
                    clearInterval(fadeTimer);
                    sound.stop();
                    sound.volume = startVolume; // Reset volume for next time
                    resolve();
                }
            }, fadeInterval);
        });
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
