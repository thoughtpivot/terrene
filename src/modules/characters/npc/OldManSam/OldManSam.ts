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

export default class OldManSam extends Actor implements DialogueNPC {
    private player: Actor | null = null;
    private chaseSpeed: number = 25; // pixels per second
    private isChasing: boolean = true;
    private interactionRange: number = 30; // Range for T key interaction

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

    // DialogueNPC interface implementation
    public getDialogue(): ChatMessage[] {
        return [
            {
                speaker: "Old Man Sam",
                text: "Young traveler! I've been trying to catch up with you!",
                duration: 4000,
            },
            {
                speaker: "Old Man Sam",
                text: "These beaches can be dangerous... especially with all those rocks scattered about.",
                duration: 5000,
            },
            {
                speaker: "Old Man Sam",
                text: "Be careful out there, and watch your step!",
                duration: 3500,
            },
        ];
    }

    public isInRange(playerPos: Vector): boolean {
        const distance = this.pos.distance(playerPos);
        console.log(
            `Old Man Sam isInRange check: distance=${distance.toFixed(
                1
            )}, range=${this.interactionRange}, inRange=${
                distance <= this.interactionRange
            }`
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
}

const Resources = {
    Image: new ImageSource(OldManSamImage),
};

export { Resources };
