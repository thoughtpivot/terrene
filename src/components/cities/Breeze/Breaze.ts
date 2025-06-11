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
} from "excalibur";
import { AsepriteResource } from "@excaliburjs/plugin-aseprite";
import You from "../../characters/player/You/You";
// import Donut from "../../items/food/Donut/Donut";
// import LorcRPG from "../../items/LorcRPG/LorcRPG";
import BreazeImage from "./Breaze.png";
import BreazeJson from "./Breaze.json";

const breazeThemeSong = new Sound("./components/cities/Breeze/Breaze.mp3");

export default class Breaze extends Scene {
    private player!: You;
    private musicLoopTimer!: Timer;
    private musicDuration: number = 0;

    onInitialize(engine: Engine): void {
        console.log("*** BREAZE SCENE INITIALIZING ***");

        // Load the background music
        const loader = new Loader([breazeThemeSong]);

        engine.start(loader).then(() => {
            console.log("Breaze scene loaded, setting up theme song...");

            // Set up sound properties
            breazeThemeSong.volume = 0.3;
            breazeThemeSong.loop = false; // We'll handle looping manually

            // Try to play immediately, but handle browser audio policy
            this.attemptToPlayMusic();

            // Set up event listeners for when audio actually starts
            breazeThemeSong.on("playbackstart", () => {
                console.log("Breaze theme song playback started");
                // Get the duration once it starts playing
                this.setupCustomLoop();
            });

            breazeThemeSong.on("playbackend", () => {
                console.log(
                    "Breaze theme song ended - restarting for custom loop"
                );
                // Restart the music when it ends (shouldn't happen with our timer, but just in case)
                this.restartMusic();
            });

            // Set scene dimensions to match background
            this.camera.strategy.limitCameraBounds(
                new BoundingBox({
                    left: 0,
                    top: 0,
                    right: 1536,
                    bottom: 1024,
                })
            );

            // Create and add background
            this.createBackdropBackground();

            // Create intelligent collision boundaries based on collision layer
            this.createIntelligentCollisionBoundaries();

            // Create and add player at center of scene
            this.player = new You();
            this.player.pos = vec(768, 512); // Center of 1536x1024 scene
            this.add(this.player);

            // Focus camera on player
            this.camera.strategy.lockToActor(this.player);

            console.log("*** BREAZE SCENE INITIALIZED ***");
        });
    }

    private createBackdropBackground(): void {
        try {
            // For now, let's use the original backdrop until we can properly filter
            // TODO: Implement proper layer separation when we have better layer data
            this.createOriginalBackdrop();
        } catch (error) {
            console.error("Error creating backdrop background:", error);

            // Fallback to regular image
            const fallbackActor = new Actor({
                pos: vec(768, 512),
                anchor: vec(0.5, 0.5),
                z: -1000,
            });

            const fallbackSprite = Resources.Image.toSprite();
            fallbackActor.graphics.use(fallbackSprite);
            this.add(fallbackActor);
            console.log("Using fallback background image");
        }
    }

    private createOriginalBackdrop(): void {
        // Use the original image as backdrop for now
        console.log("Creating backdrop from original image");

        try {
            // Try using the sprite sheet first
            const spriteSheet = Resources.AsepriteResource.getSpriteSheet();
            const backgroundActor = new Actor({
                pos: vec(768, 512),
                anchor: vec(0.5, 0.5),
                z: -1000,
            });

            const backgroundSprite = spriteSheet.getSprite(0, 0);
            backgroundActor.graphics.use(backgroundSprite);

            this.add(backgroundActor);
            console.log("Backdrop created from sprite sheet successfully");
        } catch (spriteError) {
            console.log("Sprite sheet failed, using direct image source");

            // Fallback to direct image source
            const backgroundActor = new Actor({
                pos: vec(768, 512),
                anchor: vec(0.5, 0.5),
                z: -1000,
            });

            const backgroundSprite = Resources.Image.toSprite();
            backgroundActor.graphics.use(backgroundSprite);

            this.add(backgroundActor);
            console.log("Backdrop created from image source successfully");
        }
    }

    private createIntelligentCollisionBoundaries(): void {
        console.log("*** CREATING INTELLIGENT COLLISION BOUNDARIES ***");

        try {
            // Check if we have layer information in the imported JSON
            const asepriteJson = BreazeJson;
            console.log("Aseprite JSON data:", asepriteJson);

            // Look for collision layer in the meta data
            const collisionLayer = asepriteJson.meta?.layers?.find(
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
        } catch (error) {
            console.error("Error accessing Aseprite JSON data:", error);
            this.createFallbackBoundaries();
        }
    }

    private analyzeCollisionPixelData(): void {
        console.log("*** ANALYZING COLLISION PIXEL DATA ***");

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

        // Load the image to analyze
        const img = new Image();
        img.onload = () => {
            console.log("Image loaded for pixel analysis");

            // Draw the image to canvas
            ctx.drawImage(img, 0, 0, 1536, 1024);

            // Get image data
            const imageData = ctx.getImageData(0, 0, 1536, 1024);
            const pixels = imageData.data;

            // Analyze pixels to find collision areas
            const collisionAreas = this.findCollisionAreas(pixels, 1536, 1024);

            // Create collision boundaries based on the analysis
            this.createCollisionBoundariesFromAreas(collisionAreas);
        };

        img.onerror = () => {
            console.error("Could not load image for pixel analysis");
            this.createFallbackBoundaries();
        };

        // Use the background image for analysis
        img.src = BreazeImage;
    }

    private findCollisionAreas(
        pixels: Uint8ClampedArray,
        width: number,
        height: number
    ): boolean[][] {
        console.log("*** FINDING COLLISION AREAS FROM PIXEL DATA ***");

        // Create a 2D array to represent walkable areas
        const walkableMap: boolean[][] = [];

        // Initialize the map
        for (let y = 0; y < height; y++) {
            walkableMap[y] = [];
            for (let x = 0; x < width; x++) {
                walkableMap[y][x] = false; // Default to non-walkable
            }
        }

        // Sample every nth pixel for performance (since 1536x1024 is large)
        const sampleRate = 4; // Check every 4th pixel
        let walkablePixels = 0;
        let totalSamples = 0;

        for (let y = 0; y < height; y += sampleRate) {
            for (let x = 0; x < width; x += sampleRate) {
                const pixelIndex = (y * width + x) * 4;

                const r = pixels[pixelIndex];
                const g = pixels[pixelIndex + 1];
                const b = pixels[pixelIndex + 2];
                const a = pixels[pixelIndex + 3];

                // Check if this pixel represents a walkable area
                // You can adjust these conditions based on your collision layer color
                const isWalkable = this.isPixelWalkable(r, g, b, a);

                // Mark surrounding pixels as walkable/non-walkable
                for (let dy = 0; dy < sampleRate && y + dy < height; dy++) {
                    for (let dx = 0; dx < sampleRate && x + dx < width; dx++) {
                        walkableMap[y + dy][x + dx] = isWalkable;
                    }
                }

                if (isWalkable) walkablePixels++;
                totalSamples++;
            }
        }

        console.log(
            `Analyzed ${totalSamples} samples, ${walkablePixels} walkable (${(
                (walkablePixels / totalSamples) *
                100
            ).toFixed(1)}%)`
        );

        return walkableMap;
    }

    private isPixelWalkable(
        r: number,
        g: number,
        b: number,
        a: number
    ): boolean {
        // Define what colors represent walkable areas
        // This assumes the collision layer uses a specific color for walkable areas

        // Example: Check for transparent areas (indicating walkable)
        // or specific RGB values that represent walkable terrain

        // Option 1: Transparent areas are walkable
        if (a < 128) {
            // Semi-transparent or fully transparent
            return true;
        }

        // Option 2: Specific colors are walkable (adjust these values)
        // For example, if your collision layer uses green for walkable areas:
        if (r < 100 && g > 150 && b < 100) {
            // Greenish areas
            return true;
        }

        // Option 3: Light colors are walkable, dark colors are blocked
        const brightness = (r + g + b) / 3;
        if (brightness > 200) {
            // Bright areas are walkable
            return true;
        }

        return false; // Default to non-walkable
    }

    private createCollisionBoundariesFromAreas(walkableMap: boolean[][]): void {
        console.log(
            "*** CREATING COLLISION BOUNDARIES FROM WALKABLE AREAS ***"
        );

        const width = walkableMap[0]?.length || 1536;
        const height = walkableMap.length;

        // Find the boundaries of walkable areas and create collision walls
        // For simplicity, we'll create a bounding box around the largest walkable area

        let minX = width,
            maxX = 0,
            minY = height,
            maxY = 0;
        let walkableFound = false;

        // Find the bounds of the walkable area
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (walkableMap[y] && walkableMap[y][x]) {
                    walkableFound = true;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (!walkableFound) {
            console.warn("No walkable areas found, using fallback boundaries");
            this.createFallbackBoundaries();
            return;
        }

        console.log(
            `Walkable area bounds: (${minX}, ${minY}) to (${maxX}, ${maxY})`
        );

        // Create collision walls around the walkable area
        this.createWallsAroundArea(minX, minY, maxX, maxY);
    }

    private createWallsAroundArea(
        minX: number,
        minY: number,
        maxX: number,
        maxY: number
    ): void {
        // Add some padding to the walkable area
        const padding = 20;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(1536, maxX + padding);
        maxY = Math.min(1024, maxY + padding);

        // Top wall (above walkable area)
        if (minY > 0) {
            const topWall = new Actor({
                pos: vec(768, minY / 2),
                width: 1536,
                height: minY,
                color: Color.Transparent,
                collisionType: CollisionType.Fixed,
                z: 100,
            });
            this.add(topWall);
            console.log("Added top collision wall");
        }

        // Bottom wall (below walkable area)
        if (maxY < 1024) {
            const bottomWall = new Actor({
                pos: vec(768, (maxY + 1024) / 2),
                width: 1536,
                height: 1024 - maxY,
                color: Color.Transparent,
                collisionType: CollisionType.Fixed,
                z: 100,
            });
            this.add(bottomWall);
            console.log("Added bottom collision wall");
        }

        // Left wall (left of walkable area)
        if (minX > 0) {
            const leftWall = new Actor({
                pos: vec(minX / 2, (minY + maxY) / 2),
                width: minX,
                height: maxY - minY,
                color: Color.Transparent,
                collisionType: CollisionType.Fixed,
                z: 100,
            });
            this.add(leftWall);
            console.log("Added left collision wall");
        }

        // Right wall (right of walkable area)
        if (maxX < 1536) {
            const rightWall = new Actor({
                pos: vec((maxX + 1536) / 2, (minY + maxY) / 2),
                width: 1536 - maxX,
                height: maxY - minY,
                color: Color.Transparent,
                collisionType: CollisionType.Fixed,
                z: 100,
            });
            this.add(rightWall);
            console.log("Added right collision wall");
        }

        console.log(
            "Smart collision boundaries created based on pixel analysis!"
        );
    }

    private createFallbackBoundaries(): void {
        console.log("*** CREATING FALLBACK COLLISION BOUNDARIES ***");

        // Fallback to the previous hardcoded walkable area
        const walkableArea = {
            left: 200,
            top: 150,
            right: 1336,
            bottom: 874,
        };

        // Create the same walls as before
        const topWall = new Actor({
            pos: vec(768, walkableArea.top / 2),
            width: 1536,
            height: walkableArea.top,
            color: Color.Transparent,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(topWall);

        const bottomWall = new Actor({
            pos: vec(768, (walkableArea.bottom + 1024) / 2),
            width: 1536,
            height: 1024 - walkableArea.bottom,
            color: Color.Transparent,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(bottomWall);

        const leftWall = new Actor({
            pos: vec(
                walkableArea.left / 2,
                (walkableArea.top + walkableArea.bottom) / 2
            ),
            width: walkableArea.left,
            height: walkableArea.bottom - walkableArea.top,
            color: Color.Transparent,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(leftWall);

        const rightWall = new Actor({
            pos: vec(
                (walkableArea.right + 1536) / 2,
                (walkableArea.top + walkableArea.bottom) / 2
            ),
            width: 1536 - walkableArea.right,
            height: walkableArea.bottom - walkableArea.top,
            color: Color.Transparent,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(rightWall);

        console.log("Fallback collision boundaries created");
    }

    onActivate(): void {
        console.log("*** BREAZE SCENE ACTIVATED ***");
    }

    onDeactivate(_context: SceneActivationContext<undefined>): void {
        console.log("*** BREAZE SCENE DEACTIVATED ***");

        // Stop the music when leaving the scene
        breazeThemeSong.stop();

        // Clean up the timer
        if (this.musicLoopTimer) {
            this.musicLoopTimer.stop();
            this.remove(this.musicLoopTimer);
        }
    }

    private attemptToPlayMusic(): void {
        console.log("Attempting to play Breaze theme song...");
        breazeThemeSong
            .play()
            .then(() => {
                console.log("Breaze theme song started playing successfully");
            })
            .catch((error) => {
                console.log(
                    "Audio blocked by browser policy, waiting for user interaction..."
                );
                console.log("Click anywhere on the screen to start music");

                // Set up one-time click listener to start music after user interaction
                const startMusicOnClick = () => {
                    console.log("User clicked, attempting to start music...");
                    breazeThemeSong
                        .play()
                        .then(() => {
                            console.log(
                                "Breaze theme song started after user interaction"
                            );
                        })
                        .catch((err) => {
                            console.error("Still couldn't play music:", err);
                        });

                    // Remove the event listener after first use
                    document.removeEventListener("click", startMusicOnClick);
                    document.removeEventListener("keydown", startMusicOnClick);
                };

                // Listen for any user interaction
                document.addEventListener("click", startMusicOnClick, {
                    once: true,
                });
                document.addEventListener("keydown", startMusicOnClick, {
                    once: true,
                });
            });
    }

    private setupCustomLoop(): void {
        // Get the duration of the audio file
        this.musicDuration = breazeThemeSong.duration;
        console.log(
            `Music duration: ${this.musicDuration}s, will loop at ${
                this.musicDuration - 12
            }s`
        );

        // Create a timer that triggers 12 seconds before the song ends
        const loopInterval = Math.max(1000, (this.musicDuration - 12) * 1000); // Convert to milliseconds

        this.musicLoopTimer = new Timer({
            fcn: () => {
                console.log("Restarting music (12 seconds before end)");
                this.restartMusic();
            },
            repeats: true,
            interval: loopInterval,
        });

        this.add(this.musicLoopTimer);
        this.musicLoopTimer.start();
    }

    private restartMusic(): void {
        // Stop the current playback
        breazeThemeSong.stop();

        // Start it again from the beginning
        setTimeout(() => {
            breazeThemeSong.play().catch((error) => {
                console.error("Error restarting music:", error);
            });
        }, 100); // Small delay to ensure clean restart
    }
}

const Resources = {
    Image: new ImageSource(BreazeImage, true, ImageFiltering.Pixel),
    AsepriteResource: new AsepriteResource("./Breaze.json"),
};

export { Resources as BreazeResources };
