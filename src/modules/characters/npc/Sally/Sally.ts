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
import SallyImage from "./Sally.png";
import { ChatMessage } from "../../../../common/ChatSystem";
import { DialogueNPC } from "../../../../common/DialogueNPC";

export default class Sally extends Actor implements DialogueNPC {
    private walkTimer: Timer;
    private currentDirection: Vector;
    private walkSpeed: number = 30; // pixels per second
    private bounds: { minX: number; maxX: number; minY: number; maxY: number };

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

    // DialogueNPC interface implementation
    public getDialogue(): ChatMessage[] {
        return [
            {
                speaker: "Sally",
                text: "Hello there! Isn't this beach lovely?",
                duration: 3000,
            },
            {
                speaker: "Sally",
                text: "I love walking around here and enjoying the sea breeze!",
                duration: 4000,
            },
            {
                speaker: "Sally",
                text: "Be careful of the rocks though - they can be quite sharp!",
                duration: 3500,
            },
        ];
    }

    public isInRange(playerPos: Vector): boolean {
        const distance = this.pos.distance(playerPos);
        return distance <= 30; // 30 pixel interaction range
    }

    public getNPCName(): string {
        return "Sally";
    }
}

const Resources = {
    Image: new ImageSource(SallyImage),
};

export { Resources };
