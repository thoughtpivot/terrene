import { Actor, vec, Rectangle, Color, Timer, GraphicsGroup, Circle, } from "excalibur";
export default class Birdee extends Actor {
    constructor(options = {}) {
        super({
            pos: vec(0, 0),
            width: 32,
            height: 32,
            name: "Birdee",
            z: 10, // Ensure bird is above other graphics
        });
        this.isFlapping = false;
        // Configuration
        this.direction = options.direction || "left";
        this.speed = options.speed || 50; // pixels per second
        this.wingFlapSpeed = options.wingFlapSpeed || 200; // milliseconds per flap
        this.flightBounds = options.flightBounds || { left: -100, right: 800 };
    }
    onInitialize(engine) {
        this.createBirdGraphics();
        this.startFlapping();
        this.startFlying();
    }
    createBirdGraphics() {
        // Main body (rounded robin-like shape)
        const mainBody = new Circle({
            radius: 8,
            color: Color.fromHex("#D2691E"), // Warm brown/orange body
        });
        // Body shading (darker bottom)
        const bodyShading = new Circle({
            radius: 6,
            color: Color.fromHex("#CD853F"), // Lighter brown for chest
        });
        // Head
        const head = new Circle({
            radius: 6,
            color: Color.fromHex("#8B4513"), // Darker brown head
        });
        // Beak
        const beak = new Rectangle({
            width: 4,
            height: 2,
            color: Color.fromHex("#FFD700"), // Golden yellow beak
        });
        // Eyes
        const leftEye = new Circle({
            radius: 1.5,
            color: Color.fromHex("#000000"), // Black eye
        });
        const rightEye = new Circle({
            radius: 1.5,
            color: Color.fromHex("#000000"),
        });
        // Eye highlights
        const leftEyeHighlight = new Circle({
            radius: 0.5,
            color: Color.fromHex("#FFFFFF"),
        });
        const rightEyeHighlight = new Circle({
            radius: 0.5,
            color: Color.fromHex("#FFFFFF"),
        });
        // PROMINENT WINGS - Made much larger and more visible
        const leftWingBase = new Rectangle({
            width: 14,
            height: 16,
            color: Color.fromHex("#654321"), // Dark brown wing base
        });
        const rightWingBase = new Rectangle({
            width: 14,
            height: 16,
            color: Color.fromHex("#654321"),
        });
        // Wing feathers (more prominent)
        const leftWingFeather1 = new Rectangle({
            width: 12,
            height: 3,
            color: Color.fromHex("#8B4513"),
        });
        const leftWingFeather2 = new Rectangle({
            width: 10,
            height: 3,
            color: Color.fromHex("#A0522D"),
        });
        const leftWingFeather3 = new Rectangle({
            width: 8,
            height: 2,
            color: Color.fromHex("#CD853F"),
        });
        const rightWingFeather1 = new Rectangle({
            width: 12,
            height: 3,
            color: Color.fromHex("#8B4513"),
        });
        const rightWingFeather2 = new Rectangle({
            width: 10,
            height: 3,
            color: Color.fromHex("#A0522D"),
        });
        const rightWingFeather3 = new Rectangle({
            width: 8,
            height: 2,
            color: Color.fromHex("#CD853F"),
        });
        // Tail feathers
        const tailFeather1 = new Rectangle({
            width: 3,
            height: 8,
            color: Color.fromHex("#654321"),
        });
        const tailFeather2 = new Rectangle({
            width: 3,
            height: 6,
            color: Color.fromHex("#8B4513"),
        });
        const tailFeather3 = new Rectangle({
            width: 3,
            height: 4,
            color: Color.fromHex("#A0522D"),
        });
        // Store wing references for animation - now includes feathers
        this.leftWing = leftWingBase;
        this.rightWing = rightWingBase;
        // Store additional wing parts for more complex animation
        this.leftWingFeathers = [
            leftWingFeather1,
            leftWingFeather2,
            leftWingFeather3,
        ];
        this.rightWingFeathers = [
            rightWingFeather1,
            rightWingFeather2,
            rightWingFeather3,
        ];
        // Create composite graphics group with wings in FRONT of body for visibility
        const compositeGraphic = new GraphicsGroup({
            members: [
                // Tail (back layer)
                { graphic: tailFeather1, pos: vec(12, 0) },
                { graphic: tailFeather2, pos: vec(14, -1) },
                { graphic: tailFeather3, pos: vec(16, -2) },
                // Body (middle layer)
                { graphic: mainBody, pos: vec(0, 2) },
                { graphic: bodyShading, pos: vec(0, 4) },
                { graphic: head, pos: vec(-4, -4) },
                // Wings (FRONT layer - most visible!)
                { graphic: leftWingBase, pos: vec(-12, -3) },
                { graphic: rightWingBase, pos: vec(12, -3) },
                { graphic: leftWingFeather1, pos: vec(-11, -6) },
                { graphic: leftWingFeather2, pos: vec(-10, -2) },
                { graphic: leftWingFeather3, pos: vec(-9, 2) },
                { graphic: rightWingFeather1, pos: vec(11, -6) },
                { graphic: rightWingFeather2, pos: vec(10, -2) },
                { graphic: rightWingFeather3, pos: vec(9, 2) },
                // Face details (top layer)
                { graphic: beak, pos: vec(-8, -4) },
                { graphic: leftEye, pos: vec(-6, -6) },
                { graphic: rightEye, pos: vec(-2, -6) },
                { graphic: leftEyeHighlight, pos: vec(-5.5, -6.5) },
                { graphic: rightEyeHighlight, pos: vec(-1.5, -6.5) },
            ],
        });
        // Store the composite graphic and initial positions for animation
        this.compositeGraphic = compositeGraphic;
        this.initialWingPositions = {
            leftWing: vec(-12, -3),
            rightWing: vec(12, -3),
            leftFeather1: vec(-11, -6),
            leftFeather2: vec(-10, -2),
            leftFeather3: vec(-9, 2),
            rightFeather1: vec(11, -6),
            rightFeather2: vec(10, -2),
            rightFeather3: vec(9, 2),
        };
        // Add the composite graphic
        this.graphics.use(compositeGraphic);
        // Face the correct direction
        if (this.direction === "right") {
            this.graphics.flipHorizontal = false;
        }
        else {
            this.graphics.flipHorizontal = true;
        }
        console.log(`🐦 Detailed Birdee with prominent wings created at position (${this.pos.x}, ${this.pos.y})`);
    }
    startFlapping() {
        var _a;
        // Wing flapping animation using timer
        this.flapTimer = new Timer({
            fcn: () => this.flapWings(),
            interval: this.wingFlapSpeed,
            repeats: true,
        });
        (_a = this.scene) === null || _a === void 0 ? void 0 : _a.add(this.flapTimer);
    }
    flapWings() {
        // Get the current members array from the composite graphic
        const members = this.compositeGraphic.members;
        // Find and animate wing positions within the composite graphic
        if (this.isFlapping) {
            // Wings down position (relaxed) - move wings down and inward
            console.log("🐦 Wings down position");
            // Find and update wing positions in the members array
            members.forEach((member, index) => {
                if (member.graphic === this.leftWing) {
                    member.pos = vec(-10, -1); // Move down and inward
                }
                else if (member.graphic === this.rightWing) {
                    member.pos = vec(10, -1);
                }
                else if (member.graphic === this.leftWingFeathers[0]) {
                    member.pos = vec(-9, -4);
                }
                else if (member.graphic === this.leftWingFeathers[1]) {
                    member.pos = vec(-8, 0);
                }
                else if (member.graphic === this.leftWingFeathers[2]) {
                    member.pos = vec(-7, 4);
                }
                else if (member.graphic === this.rightWingFeathers[0]) {
                    member.pos = vec(9, -4);
                }
                else if (member.graphic === this.rightWingFeathers[1]) {
                    member.pos = vec(8, 0);
                }
                else if (member.graphic === this.rightWingFeathers[2]) {
                    member.pos = vec(7, 4);
                }
            });
        }
        else {
            // Wings up position (flapping) - move wings up and outward
            console.log("🐦 Wings up position");
            members.forEach((member, index) => {
                if (member.graphic === this.leftWing) {
                    member.pos = vec(-14, -5); // Move up and outward
                }
                else if (member.graphic === this.rightWing) {
                    member.pos = vec(14, -5);
                }
                else if (member.graphic === this.leftWingFeathers[0]) {
                    member.pos = vec(-13, -8);
                }
                else if (member.graphic === this.leftWingFeathers[1]) {
                    member.pos = vec(-12, -4);
                }
                else if (member.graphic === this.leftWingFeathers[2]) {
                    member.pos = vec(-11, 0);
                }
                else if (member.graphic === this.rightWingFeathers[0]) {
                    member.pos = vec(13, -8);
                }
                else if (member.graphic === this.rightWingFeathers[1]) {
                    member.pos = vec(12, -4);
                }
                else if (member.graphic === this.rightWingFeathers[2]) {
                    member.pos = vec(11, 0);
                }
            });
        }
        this.isFlapping = !this.isFlapping;
    }
    startFlying() {
        // Continuous horizontal movement
        const moveDirection = this.direction === "left" ? -1 : 1;
        this.vel.x = this.speed * moveDirection;
        // Add slight vertical bobbing motion for realism
        this.actions.repeatForever((ctx) => ctx.moveBy(0, -3, 600).moveBy(0, 3, 600));
    }
    onPreUpdate() {
        // Check bounds and reverse direction if needed
        if (this.direction === "left" && this.pos.x <= this.flightBounds.left) {
            this.reverseDirection();
        }
        else if (this.direction === "right" &&
            this.pos.x >= this.flightBounds.right) {
            this.reverseDirection();
        }
    }
    reverseDirection() {
        this.direction = this.direction === "left" ? "right" : "left";
        this.vel.x = -this.vel.x;
        this.graphics.flipHorizontal = !this.graphics.flipHorizontal;
    }
    // Public methods for external control
    setDirection(direction) {
        if (this.direction !== direction) {
            this.reverseDirection();
        }
    }
    setSpeed(speed) {
        this.speed = speed;
        const moveDirection = this.direction === "left" ? -1 : 1;
        this.vel.x = this.speed * moveDirection;
    }
    setFlightBounds(bounds) {
        this.flightBounds = bounds;
    }
}
//# sourceMappingURL=Birdee.js.map