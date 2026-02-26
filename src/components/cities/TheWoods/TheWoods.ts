import {
    Scene,
    Engine,
    Color,
    vec,
    Actor,
    CollisionType,
    ImageSource,
    ImageFiltering,
    BoundingBox,
    Sprite,
    Canvas,
    PolygonCollider,
    Vector,
    Sound,
    Loader,
    SceneActivationContext,
    Timer,
    Rectangle,
} from "excalibur";
import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import You from "../../characters/player/You/You";
import Sally from "../../characters/npc/Sally/Sally";
import Birdee from "../../creatures/Birdee/Birdee";
import TheWoodsImage from "./TheWoods.png";
import TheWoodsWalkableImage from "./TheWoods.walkable.png";

const theWoodsThemeSong = new Sound(
    "./components/cities/TheWoods/TheWoods.mp3"
);
const theWoodsFootsteps = new Sound(
    "./components/cities/TheWoods/TheWoods.footsteps.mp3"
);

export default class TheWoods extends Scene {
    private player!: You;
    private sally!: Sally;
    private musicLoopTimer!: Timer;
    private musicDuration: number = 0;
    private walkableMap: boolean[][] = [];
    private isPlayerMoving: boolean = false;
    private lastPlayerPosition: Vector = vec(0, 0);

    onInitialize(engine: Engine): void {
        console.log("*** THEWOODS SCENE INITIALIZING ***");

        const loader = new Loader([theWoodsThemeSong, theWoodsFootsteps]);

        engine.start(loader).then(async () => {
            console.log("TheWoods scene loaded, setting up theme song...");

            theWoodsThemeSong.volume = 0.3;
            theWoodsThemeSong.loop = false;

            theWoodsFootsteps.volume = 0.15;
            theWoodsFootsteps.loop = true;

            this.attemptToPlayMusic();

            theWoodsThemeSong.on("playbackstart", () => {
                console.log("TheWoods theme song playback started");
                this.setupCustomLoop();
            });

            theWoodsThemeSong.on("playbackend", () => {
                console.log(
                    "TheWoods theme song ended - restarting for custom loop"
                );
                this.restartMusic();
            });

            this.camera.strategy.limitCameraBounds(
                new BoundingBox({
                    left: 0,
                    top: 0,
                    right: 1536,
                    bottom: 1024,
                })
            );

            this.createBackdropBackground();

            await this.createIntelligentCollisionBoundaries();

            this.player = new You();
            this.player.pos = vec(768, 512);
            this.add(this.player);

            this.createBirdFlock();

            this.setupFootstepSystem();

            this.camera.strategy.lockToActor(this.player);

            console.log("*** THEWOODS SCENE INITIALIZED ***");
        });
    }

    private createBackdropBackground(): void {
        try {
            this.createOriginalBackdrop();
        } catch (error) {
            console.error("Error creating backdrop background:", error);

            const fallbackActor = new Actor({
                pos: vec(768, 512),
                anchor: vec(0.5, 0.5),
                z: -1000,
            });

            const fallbackSprite = new Sprite({
                image: new ImageSource(TheWoodsImage),
                width: 1536,
                height: 1024,
            });
            fallbackActor.graphics.use(fallbackSprite);
            this.add(fallbackActor);
            console.log("Using fallback background image");
        }
    }

    private createOriginalBackdrop(): void {
        console.log("Creating backdrop from main TheWoods image");

        const backgroundActor = new Actor({
            pos: vec(768, 512),
            anchor: vec(0.5, 0.5),
            z: -1000,
        });

        const imageSource = new ImageSource(TheWoodsImage);
        imageSource.filtering = ImageFiltering.Pixel;

        imageSource
            .load()
            .then(() => {
                const backgroundSprite = imageSource.toSprite();
                backgroundActor.graphics.use(backgroundSprite);
                console.log(
                    "Backdrop created from main visual image successfully"
                );
            })
            .catch((error) => {
                console.error("Failed to load main visual image:", error);
            });

        this.add(backgroundActor);
    }

    private async createIntelligentCollisionBoundaries(): Promise<void> {
        console.log("*** CREATING INTELLIGENT COLLISION BOUNDARIES ***");

        let asepriteJson: any = null;

        try {
            const resource = new AsepriteResource(TheWoodsImage);
            await resource.load();

            const asepriteData = resource.getSpriteSheet();

            if (asepriteData) {
                asepriteJson = asepriteData;
                console.log("Using Aseprite data from resource:", asepriteJson);
            } else {
                throw new Error("No JSON data found in AsepriteResource");
            }
        } catch (resourceError) {
            console.log(
                "Couldn't get data from AsepriteResource, fetching JSON directly..."
            );
            console.log("Resource error:", resourceError);

            // Fallback: fetch the JSON data directly
            const response = await fetch(
                "./components/cities/TheWoods/TheWoods.json"
            );
            asepriteJson = await response.json();
            console.log("Fetched Aseprite JSON data:", asepriteJson);
        }

        // Look for collision layer in the meta data
        const collisionLayer = asepriteJson?.meta?.layers?.find(
            (layer: any) => layer.name === "Collision"
        );

        if (collisionLayer) {
            console.log("Found collision layer in JSON:", collisionLayer);

            // We know there's a collision layer, so analyze the pixel data
            this.analyzeCollisionPixelData();
        } else {
            console.warn(
                "Collision layer not found in JSON, using fallback boundaries"
            );
            this.createFallbackBoundaries();
        }
    }

    private analyzeCollisionPixelData(): void {
        console.log("*** ANALYZING COLLISION PIXEL DATA ***");
        console.log(
            "Walkable image source being analyzed:",
            TheWoodsWalkableImage
        );

        // Create a hidden canvas to analyze the image data
        const canvas = document.createElement("canvas");
        canvas.width = 1536;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            console.error("Could not get canvas context");
            this.createFallbackBoundaries();
            return;
        }

        // Load the walkable image to analyze
        const img = new Image();
        img.onload = () => {
            console.log("Walkable image loaded for pixel analysis");
            console.log("Image dimensions:", img.width, "x", img.height);

            // Draw the image to canvas
            ctx.drawImage(img, 0, 0, 1536, 1024);

            // Get image data
            const imageData = ctx.getImageData(0, 0, 1536, 1024);
            const pixels = imageData.data;

            console.log("Image data loaded, starting pixel analysis...");

            // Create a debug canvas to visualize what we're detecting
            this.createDebugVisualization(pixels, 1536, 1024);

            // Analyze pixels to find collision areas
            const collisionAreas = this.findCollisionAreas(pixels, 1536, 1024);

            console.log("Collision areas detected:", collisionAreas);

            // Create collision boundaries based on the analysis
            this.createCollisionBoundariesFromAreas(collisionAreas);
        };

        img.onerror = () => {
            console.error("Could not load walkable image for pixel analysis");
            this.createFallbackBoundaries();
        };

        // Use the walkable image for collision analysis
        img.src = TheWoodsWalkableImage;
    }

    private createDebugVisualization(
        pixels: Uint8ClampedArray,
        width: number,
        height: number
    ): void {
        console.log("Creating debug visualization of detected white areas...");

        // Create a debug canvas to show what we're detecting
        const debugCanvas = document.createElement("canvas");
        debugCanvas.width = width;
        debugCanvas.height = height;
        debugCanvas.style.position = "fixed";
        debugCanvas.style.top = "10px";
        debugCanvas.style.left = "10px";
        debugCanvas.style.width = "400px";
        debugCanvas.style.height = "267px";
        debugCanvas.style.border = "2px solid red";
        debugCanvas.style.zIndex = "9999";
        debugCanvas.style.backgroundColor = "black";
        document.body.appendChild(debugCanvas);

        const debugCtx = debugCanvas.getContext("2d");
        if (!debugCtx) return;

        const debugImageData = debugCtx.createImageData(width, height);
        const debugPixels = debugImageData.data;

        let whitePixelCount = 0;
        const sampleRate = 4;

        // Analyze and visualize
        for (let y = 0; y < height; y += sampleRate) {
            for (let x = 0; x < width; x += sampleRate) {
                const pixelIndex = (y * width + x) * 4;

                const r = pixels[pixelIndex];
                const g = pixels[pixelIndex + 1];
                const b = pixels[pixelIndex + 2];
                const a = pixels[pixelIndex + 3];

                const isWalkable = this.isPixelWalkable(r, g, b, a);

                if (isWalkable) {
                    whitePixelCount++;

                    // Color walkable areas as bright green in debug view
                    for (let dy = 0; dy < sampleRate && y + dy < height; dy++) {
                        for (
                            let dx = 0;
                            dx < sampleRate && x + dx < width;
                            dx++
                        ) {
                            const debugIndex =
                                ((y + dy) * width + (x + dx)) * 4;
                            debugPixels[debugIndex] = 0; // R
                            debugPixels[debugIndex + 1] = 255; // G - bright green
                            debugPixels[debugIndex + 2] = 0; // B
                            debugPixels[debugIndex + 3] = 255; // A
                        }
                    }
                } else {
                    // Show original colors for non-walkable areas (dimmed)
                    for (let dy = 0; dy < sampleRate && y + dy < height; dy++) {
                        for (
                            let dx = 0;
                            dx < sampleRate && x + dx < width;
                            dx++
                        ) {
                            const origIndex = ((y + dy) * width + (x + dx)) * 4;
                            const debugIndex =
                                ((y + dy) * width + (x + dx)) * 4;
                            debugPixels[debugIndex] = pixels[origIndex] / 3; // R (dimmed)
                            debugPixels[debugIndex + 1] =
                                pixels[origIndex + 1] / 3; // G (dimmed)
                            debugPixels[debugIndex + 2] =
                                pixels[origIndex + 2] / 3; // B (dimmed)
                            debugPixels[debugIndex + 3] = 255; // A
                        }
                    }
                }
            }
        }

        debugCtx.putImageData(debugImageData, 0, 0);

        console.log(
            `Debug visualization created. Found ${whitePixelCount} white pixel areas.`
        );
        console.log("Green areas in debug view = detected walkable areas");
        console.log("Debug canvas added to top-left of page");

        // Remove debug canvas after 10 seconds
        setTimeout(() => {
            document.body.removeChild(debugCanvas);
        }, 10000);
    }

    private createFallbackBoundaries(): void {
        console.log("Creating fallback boundaries...");
        // Implement fallback boundary creation logic here
    }

    private findCollisionAreas(
        pixels: Uint8ClampedArray,
        width: number,
        height: number
    ): boolean[][] {
        const walkableMap: boolean[][] = [];

        for (let y = 0; y < height; y++) {
            walkableMap[y] = [];
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = pixels[index];
                const g = pixels[index + 1];
                const b = pixels[index + 2];
                const a = pixels[index + 3];

                walkableMap[y][x] = this.isPixelWalkable(r, g, b, a);
            }
        }

        return walkableMap;
    }

    private createCollisionBoundariesFromAreas(walkableMap: boolean[][]): void {
        // Implement collision boundary creation logic here
    }

    private createBirdFlock(): void {
        // Implement bird flock creation logic here
    }

    private setupFootstepSystem(): void {
        // Implement footstep system setup here
    }

    private attemptToPlayMusic(): void {
        // Implement music playback logic here
    }

    private setupCustomLoop(): void {
        // Implement custom loop setup logic here
    }

    private restartMusic(): void {
        // Implement music restart logic here
    }

    private isPixelWalkable(
        r: number,
        g: number,
        b: number,
        a: number
    ): boolean {
        // Example logic: consider a pixel walkable if it's mostly white
        const threshold = 200; // Adjust this threshold as needed
        return r > threshold && g > threshold && b > threshold && a > threshold;
    }

    private setupMovementValidation(walkableMap: boolean[][]): void {
        console.log("*** SETTING UP MOVEMENT VALIDATION SYSTEM ***");

        this.walkableMap = walkableMap;

        const lastValidPositions = new Map<Actor, Vector>();

        this.on("postupdate", () => {
            this.validateAllActorPositions(lastValidPositions);
        });

        console.log(
            "Movement validation system active - actors respect boundaries"
        );
    }

    private validateAllActorPositions(
        lastValidPositions: Map<Actor, Vector>
    ): void {
        console.log("Validating actor positions...");
        if (this.walkableMap.length === 0) return;

        const actors = this.actors.filter((actor) =>
            this.shouldValidateActor(actor)
        );

        for (const actor of actors) {
            const currentPos = actor.pos;
            console.log(
                `Checking actor ${actor.name} at position (${currentPos.x}, ${currentPos.y})`
            );

            if (!lastValidPositions.has(actor)) {
                lastValidPositions.set(actor, currentPos.clone());
                continue;
            }

            const lastValidPos = lastValidPositions.get(actor)!;

            if (this.isPositionWalkable(currentPos.x, currentPos.y)) {
                lastValidPositions.set(actor, currentPos.clone());
            } else {
                console.log(
                    `Actor ${actor.name} moved to non-walkable area, reverting to last valid position.`
                );
                actor.pos = lastValidPos.clone();
                actor.vel = vec(0, 0);
                this.stopActorSpecificMovement(actor);
            }
        }
    }

    private isPositionWalkable(x: number, y: number): boolean {
        const checkRadius = 6;

        for (let dy = -checkRadius; dy <= checkRadius; dy += 2) {
            for (let dx = -checkRadius; dx <= checkRadius; dx += 2) {
                const checkX = Math.floor(x + dx);
                const checkY = Math.floor(y + dy);

                if (
                    checkX >= 0 &&
                    checkX < 1536 &&
                    checkY >= 0 &&
                    checkY < 1024
                ) {
                    if (
                        this.walkableMap[checkY] &&
                        !this.walkableMap[checkY][checkX]
                    ) {
                        console.log(
                            `Position (${checkX}, ${checkY}) is non-walkable.`
                        );
                        return false;
                    }
                }
            }
        }

        return true;
    }

    private shouldValidateActor(actor: Actor): boolean {
        return (
            (!actor.body || actor.body.collisionType !== CollisionType.Fixed) &&
            actor.name !== "collision" &&
            !actor.name?.includes("wall") &&
            !actor.name?.includes("building") &&
            actor.width > 0 &&
            actor.height > 0
        );
    }

    private stopActorSpecificMovement(actor: Actor): void {
        if (actor === this.player && "targetPosition" in actor) {
            (actor as any).targetPosition = null;
            (actor as any).isMovingToTarget = false;
        }

        if (
            "stopMovement" in actor &&
            typeof (actor as any).stopMovement === "function"
        ) {
            (actor as any).stopMovement();
        }

        if (
            "clearPath" in actor &&
            typeof (actor as any).clearPath === "function"
        ) {
            (actor as any).clearPath();
        }
    }
}
