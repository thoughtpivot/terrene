import { Actor, vec, Engine, Scene, Rectangle, Color, Timer } from "excalibur";

export interface BirdeeOptions {
    direction?: "left" | "right";
    speed?: number;
    wingFlapSpeed?: number;
    flightBounds?: { left: number; right: number };
}

export default class Birdee extends Actor {
    private direction: "left" | "right";
    private speed: number;
    private wingFlapSpeed: number;
    private flightBounds: { left: number; right: number };
    private birdBody!: Rectangle;
    private leftWing!: Rectangle;
    private rightWing!: Rectangle;
    private isFlapping: boolean = false;
    private flapTimer!: Timer;

    constructor(options: BirdeeOptions = {}) {
        super({
            pos: vec(0, 0),
            width: 32,
            height: 32,
            name: "Birdee",
        });

        // Configuration
        this.direction = options.direction || "left";
        this.speed = options.speed || 50; // pixels per second
        this.wingFlapSpeed = options.wingFlapSpeed || 200; // milliseconds per flap
        this.flightBounds = options.flightBounds || { left: -100, right: 800 };
    }

    onInitialize(engine: Engine): void {
        this.createBirdGraphics();
        this.startFlapping();
        this.startFlying();
    }

    private createBirdGraphics(): void {
        // Create a simple combined bird graphic using rectangles
        this.birdBody = new Rectangle({
            width: 12,
            height: 8,
            color: Color.fromHex("#8B4513"), // Brown body
        });

        this.leftWing = new Rectangle({
            width: 6,
            height: 12,
            color: Color.fromHex("#654321"), // Darker brown for wings
        });

        this.rightWing = new Rectangle({
            width: 6,
            height: 12,
            color: Color.fromHex("#654321"),
        });

        // Add the main body graphic
        this.graphics.add("body", this.birdBody);

        // Face the correct direction
        if (this.direction === "right") {
            this.graphics.flipHorizontal = false;
        } else {
            this.graphics.flipHorizontal = true;
        }
    }

    private startFlapping(): void {
        // Wing flapping animation using timer
        this.flapTimer = new Timer({
            fcn: () => this.flapWings(),
            interval: this.wingFlapSpeed,
            repeats: true,
        });
        this.scene?.add(this.flapTimer);
    }

    private flapWings(): void {
        // Animate the main body to simulate wing flapping
        const body = this.graphics.getGraphic("body") as Rectangle;

        if (this.isFlapping) {
            // Wings down position - make body slightly smaller
            body.scale = vec(1, 0.8);
        } else {
            // Wings up position - make body slightly larger
            body.scale = vec(1, 1.2);
        }
        this.isFlapping = !this.isFlapping;
    }

    private startFlying(): void {
        // Continuous horizontal movement
        const moveDirection = this.direction === "left" ? -1 : 1;
        this.vel.x = this.speed * moveDirection;

        // Add slight vertical bobbing motion for realism
        this.actions.repeatForever((ctx) =>
            ctx.moveBy(0, -3, 600).moveBy(0, 3, 600)
        );
    }

    onPreUpdate(): void {
        // Check bounds and reverse direction if needed
        if (this.direction === "left" && this.pos.x <= this.flightBounds.left) {
            this.reverseDirection();
        } else if (
            this.direction === "right" &&
            this.pos.x >= this.flightBounds.right
        ) {
            this.reverseDirection();
        }
    }

    private reverseDirection(): void {
        this.direction = this.direction === "left" ? "right" : "left";
        this.vel.x = -this.vel.x;
        this.graphics.flipHorizontal = !this.graphics.flipHorizontal;
    }

    // Public methods for external control
    public setDirection(direction: "left" | "right"): void {
        if (this.direction !== direction) {
            this.reverseDirection();
        }
    }

    public setSpeed(speed: number): void {
        this.speed = speed;
        const moveDirection = this.direction === "left" ? -1 : 1;
        this.vel.x = this.speed * moveDirection;
    }

    public setFlightBounds(bounds: { left: number; right: number }): void {
        this.flightBounds = bounds;
    }
}
