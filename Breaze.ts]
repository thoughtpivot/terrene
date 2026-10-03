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
// import Donut from "../../items/food/Donut/Donut";
// import LorcRPG from "../../items/LorcRPG/LorcRPG";
import BreazeImage from "./Breaze.png";
import BreazeWalkableImage from "./Breaze.walkable.png";

const breazeThemeSong = new Sound("./components/cities/Breeze/Breaze.mp3");
const breazeFootsteps = new Sound(
    "./components/cities/Breeze/Breaze.footsteps.mp3"
);

export default class Breaze extends Scene {
    private player!: You;
    private sally!: Sally;
    private musicLoopTimer!: Timer;
    private musicDuration: number = 0;
    private walkableMap: boolean[][] = [];
    private isPlayerMoving: boolean = false;
    private lastPlayerPosition: Vector = vec(0, 0);

    onInitialize(engine: Engine): void {
        console.log("*** BREAZE SCENE INITIALIZING ***");

        // Load the background music and footsteps
        const loader = new Loader([breazeThemeSong, breazeFootsteps]);

        engine.start(loader).then(async () => {
            console.log("Breaze scene loaded, setting up theme song...");

            // Set up sound properties
            breazeThemeSong.volume = 0.3;
            breazeThemeSong.loop = false; // We'll handle looping manually

            // Set up footsteps sound properties
            breazeFootsteps.volume = 0.15; // Low volume for footsteps
            breazeFootsteps.loop = true; // Loop while walking

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
            await this.createIntelligentCollisionBoundaries();

            // Create and add player - position will be set after collision analysis
            this.player = new You();
            this.player.pos = vec(768, 512); // Temporary position, will be corrected
            this.add(this.player);

            // Create a flock of birds flying from right to left
            this.createBirdFlock();

            // Set up movement tracking for footsteps
            this.setupFootstepSystem();

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
        // Use the main visual image as backdrop
        console.log("Creating backdrop from main Breaze image");

        // Create the background actor using the main visual image
        const backgroundActor = new Actor({
            pos: vec(768, 512),
            anchor: vec(0.5, 0.5),
            z: -1000,
        });

        // Create an ImageSource from the main visual image
        const imageSource = new ImageSource(BreazeImage);
        imageSource.filtering = ImageFiltering.Pixel; // For pixel-perfect rendering

        // Load the image source and create the sprite
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

        try {
            // Fetch the actual JSON data from the AsepriteResource
            let asepriteJson: any = null;

            try {
                // Try to get JSON data from the loaded AsepriteResource
                // Cast to any to access potentially undocumented properties
                const resource = Resources.AsepriteResource as any;

                if (resource.json) {
                    asepriteJson = resource.json;
                    console.log(
                        "Got Aseprite JSON data from resource.json:",
                        asepriteJson
                    );
                } else if (resource.data && typeof resource.data === "object") {
                    // If data exists but isn't the JSON, try to access raw data
                    console.log(
                        "AsepriteResource.data type:",
                        typeof resource.data
                    );
                    console.log(
                        "AsepriteResource.data keys:",
                        Object.keys(resource.data || {})
                    );

                    // Try to find JSON-like data in the resource
                    if (resource.data.meta || resource.data.layers) {
                        asepriteJson = resource.data;
                        console.log(
                            "Using resource.data as JSON:",
                            asepriteJson
                        );
                    } else {
                        // Fall through to fetch method
                        throw new Error(
                            "AsepriteResource.data is not raw JSON"
                        );
                    }
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
                    "./components/cities/Breeze/Breaze.json"
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
        } catch (error) {
            console.error("Error accessing Aseprite JSON data:", error);
            this.createFallbackBoundaries();
        }
    }

    private analyzeCollisionPixelData(): void {
        console.log("*** ANALYZING COLLISION PIXEL DATA ***");
        console.log(
            "Walkable image source being analyzed:",
            BreazeWalkableImage
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

            // Create a debug canvas to visualize what we're detecting
            this.createDebugVisualization(pixels, 1536, 1024);

            // Analyze pixels to find collision areas
            const collisionAreas = this.findCollisionAreas(pixels, 1536, 1024);

            // Create collision boundaries based on the analysis
            this.createCollisionBoundariesFromAreas(collisionAreas);
        };

        img.onerror = () => {
            console.error("Could not load walkable image for pixel analysis");
            this.createFallbackBoundaries();
        };

        // Use the walkable image for collision analysis
        img.src = BreazeWalkableImage;
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
        // Debug: Log some sample pixels to understand the color patterns
        if (Math.random() < 0.001) {
            // Log ~0.1% of pixels for debugging
            console.log(
                `Sample pixel: R=${r}, G=${g}, B=${b}, A=${a}, Brightness=${
                    (r + g + b) / 3
                }`
            );
        }

        // At 100% opacity, white collision pixels will be pure white
        // They create bright white areas over the background colors
        // 100% white overlay = very bright/pure white areas

        const brightness = (r + g + b) / 3;

        // Strategy 1: High brightness detection for 100% white
        // Areas with very high brightness from pure white overlay
        if (brightness >= 220) {
            return true;
        }

        // Strategy 2: Pure white detection
        // Areas very close to pure white
        const rgbMax = Math.max(r, g, b);
        const rgbMin = Math.min(r, g, b);
        const rgbVariance = rgbMax - rgbMin;

        if (brightness >= 200 && rgbVariance <= 30) {
            return true;
        }

        // Strategy 3: Near-white area detection
        // Areas significantly whiter than vegetation
        if (brightness >= 190 && rgbMin >= 150) {
            return true;
        }

        // Strategy 4: Very bright areas
        if (brightness >= 210) {
            return true;
        }

        // Strategy 5: Balanced bright white patterns
        // Areas with high R,G,B values indicating white influence
        if (brightness >= 180 && r >= 150 && g >= 150 && b >= 150) {
            return true;
        }

        // Strategy 6: Areas with strong white influence
        // Areas clearly brightened by 100% white overlay
        if (brightness >= 170 && r + g + b > 400) {
            return true;
        }

        // Strategy 7: Conservative fallback for bright areas
        // Areas that are clearly much brighter than vegetation
        if (brightness >= 160) {
            return true;
        }

        // Default to non-walkable for darker vegetation/artwork colors
        return false;
    }

    private createCollisionBoundariesFromAreas(walkableMap: boolean[][]): void {
        console.log(
            "*** CREATING COLLISION BOUNDARIES FROM WALKABLE AREAS ***"
        );

        // Choose collision approach:
        // 1 = Wall-based (original approach)
        // 2 = Tile-based collision grid
        // 3 = Direct movement validation (RECOMMENDED)
        // 4 = Polygon-based collision tracing
        const collisionApproach: number = 3;

        if (collisionApproach === 1) {
            this.createWallBasedCollision(walkableMap);
        } else if (collisionApproach === 2) {
            this.createTileBasedCollision(walkableMap);
        } else if (collisionApproach === 3) {
            this.setupMovementValidation(walkableMap);
        } else if (collisionApproach === 4) {
            this.createPolygonBasedCollision(walkableMap);
        } else {
            console.warn("Invalid collision approach, using fallback");
            this.createFallbackBoundaries();
        }

        // Set up Sally NPC regardless of collision approach used
        this.setupSallyNPC(walkableMap);
    }

    private createWallBasedCollision(walkableMap: boolean[][]): void {
        console.log("Using WALL-BASED collision system");

        const width = walkableMap[0]?.length || 1536;
        const height = walkableMap.length;

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
        const walkableMinX = Math.max(0, minX - padding);
        const walkableMinY = Math.max(0, minY - padding);
        const walkableMaxX = Math.min(1536, maxX + padding);
        const walkableMaxY = Math.min(1024, maxY + padding);

        console.log(
            `Creating walls around walkable area: (${walkableMinX}, ${walkableMinY}) to (${walkableMaxX}, ${walkableMaxY})`
        );

        // Top wall (blocks everything ABOVE the walkable area)
        if (walkableMinY > 0) {
            const topWallHeight = walkableMinY;
            const topWall = new Actor({
                pos: vec(768, topWallHeight / 2), // Position at center of blocked area
                width: 1536,
                height: topWallHeight,
                color: Color.Red, // Make visible for debugging
                collisionType: CollisionType.Fixed,
                z: 100,
            });
            this.add(topWall);
            console.log(
                `Added TOP wall: blocks Y=0 to Y=${walkableMinY}, positioned at Y=${
                    topWallHeight / 2
                }`
            );
        }

        // Bottom wall (blocks everything BELOW the walkable area)
        if (walkableMaxY < 1024) {
            const bottomWallHeight = 1024 - walkableMaxY;
            const bottomWallY = walkableMaxY + bottomWallHeight / 2;
            const bottomWall = new Actor({
                pos: vec(768, bottomWallY),
                width: 1536,
                height: bottomWallHeight,
                color: Color.Blue, // Make visible for debugging
                collisionType: CollisionType.Fixed,
                z: 100,
            });
            this.add(bottomWall);
            console.log(
                `Added BOTTOM wall: blocks Y=${walkableMaxY} to Y=1024, positioned at Y=${bottomWallY}`
            );
        }

        // Left wall (blocks everything LEFT of the walkable area)
        if (walkableMinX > 0) {
            const leftWallWidth = walkableMinX;
            const leftWall = new Actor({
                pos: vec(leftWallWidth / 2, 512), // Center of scene height
                width: leftWallWidth,
                height: 1024,
                color: Color.Green, // Make visible for debugging
                collisionType: CollisionType.Fixed,
                z: 100,
            });
            this.add(leftWall);
            console.log(
                `Added LEFT wall: blocks X=0 to X=${walkableMinX}, positioned at X=${
                    leftWallWidth / 2
                }`
            );
        }

        // Right wall (blocks everything RIGHT of the walkable area)
        if (walkableMaxX < 1536) {
            const rightWallWidth = 1536 - walkableMaxX;
            const rightWallX = walkableMaxX + rightWallWidth / 2;
            const rightWall = new Actor({
                pos: vec(rightWallX, 512), // Center of scene height
                width: rightWallWidth,
                height: 1024,
                color: Color.Yellow, // Make visible for debugging
                collisionType: CollisionType.Fixed,
                z: 100,
            });
            this.add(rightWall);
            console.log(
                `Added RIGHT wall: blocks X=${walkableMaxX} to X=1536, positioned at X=${rightWallX}`
            );
        }

        // Add boundary walls for the entire scene edges as backup
        this.createSceneBoundaryWalls();

        console.log(
            "Smart collision boundaries created based on pixel analysis!"
        );
    }

    private createSceneBoundaryWalls(): void {
        console.log("Adding scene boundary walls as backup...");

        // Scene boundary walls to prevent leaving the scene entirely
        const wallThickness = 50;

        // Top scene boundary
        const topBoundary = new Actor({
            pos: vec(768, -wallThickness / 2),
            width: 1536,
            height: wallThickness,
            color: Color.Magenta,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(topBoundary);

        // Bottom scene boundary
        const bottomBoundary = new Actor({
            pos: vec(768, 1024 + wallThickness / 2),
            width: 1536,
            height: wallThickness,
            color: Color.Magenta,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(bottomBoundary);

        // Left scene boundary
        const leftBoundary = new Actor({
            pos: vec(-wallThickness / 2, 512),
            width: wallThickness,
            height: 1024,
            color: Color.Magenta,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(leftBoundary);

        // Right scene boundary
        const rightBoundary = new Actor({
            pos: vec(1536 + wallThickness / 2, 512),
            width: wallThickness,
            height: 1024,
            color: Color.Magenta,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(rightBoundary);

        console.log("Scene boundary walls added");
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

        // Stop the music and footsteps when leaving the scene
        breazeThemeSong.stop();
        this.stopFootsteps();

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

    private createTileBasedCollision(walkableMap: boolean[][]): void {
        console.log("*** CREATING TILE-BASED COLLISION SYSTEM ***");

        const width = walkableMap[0]?.length || 1536;
        const height = walkableMap.length;
        const tileSize = 16; // Size of each collision tile
        let collisionTileCount = 0;

        // Create collision tiles for non-walkable areas
        for (let y = 0; y < height; y += tileSize) {
            for (let x = 0; x < width; x += tileSize) {
                // Check if this tile area is walkable
                let isAreaWalkable = false;

                // Sample multiple points in this tile area
                for (let dy = 0; dy < tileSize && y + dy < height; dy += 4) {
                    for (let dx = 0; dx < tileSize && x + dx < width; dx += 4) {
                        if (
                            walkableMap[y + dy] &&
                            walkableMap[y + dy][x + dx]
                        ) {
                            isAreaWalkable = true;
                            break;
                        }
                    }
                    if (isAreaWalkable) break;
                }

                // If the area is not walkable, create a collision tile
                if (!isAreaWalkable) {
                    const collisionTile = new Actor({
                        pos: vec(x + tileSize / 2, y + tileSize / 2),
                        width: tileSize,
                        height: tileSize,
                        color: Color.fromRGB(255, 0, 0, 0.3), // Semi-transparent red
                        collisionType: CollisionType.Fixed,
                        z: 99,
                    });
                    this.add(collisionTile);
                    collisionTileCount++;
                }
            }
        }

        console.log(`Created ${collisionTileCount} collision tiles`);
    }

    private setupMovementValidation(walkableMap: boolean[][]): void {
        console.log("*** SETTING UP UNIVERSAL MOVEMENT VALIDATION SYSTEM ***");

        // Store the walkable map for runtime validation
        this.walkableMap = walkableMap;

        // Position player in center of walkable area
        this.positionPlayerInWalkableArea(walkableMap);

        // Track last valid positions for all actors
        const lastValidPositions = new Map<Actor, Vector>();

        // Set up universal movement validation for all actors
        this.on("postupdate", () => {
            this.validateAllActorPositions(lastValidPositions);
        });

        console.log(
            "Universal movement validation system active - all actors respect boundaries"
        );
    }

    private positionPlayerInWalkableArea(walkableMap: boolean[][]): void {
        const width = walkableMap[0]?.length || 1536;
        const height = walkableMap.length;

        // Find the center of the most dense walkable area
        const bestPosition = this.findMostWalkableCenter(
            walkableMap,
            width,
            height
        );

        if (bestPosition && this.player) {
            this.player.pos = vec(bestPosition.x, bestPosition.y);
            console.log(
                `Player positioned at center of most walkable area: (${Math.floor(
                    bestPosition.x
                )}, ${Math.floor(bestPosition.y)})`
            );
            console.log(
                `Walkable density at position: ${bestPosition.density.toFixed(
                    2
                )}`
            );
        } else {
            console.warn(
                "No walkable area found, keeping player at default position"
            );
        }
    }

    private findMostWalkableCenter(
        walkableMap: boolean[][],
        width: number,
        height: number
    ): { x: number; y: number; density: number } | null {
        let bestPosition: { x: number; y: number; density: number } | null =
            null;
        let maxDensity = 0;

        // Sample every 16 pixels to find dense walkable areas
        const sampleStep = 16;
        const searchRadius = 32; // Look in 64x64 pixel areas

        for (let y = searchRadius; y < height - searchRadius; y += sampleStep) {
            for (
                let x = searchRadius;
                x < width - searchRadius;
                x += sampleStep
            ) {
                // Count walkable pixels in area around this point
                let walkableCount = 0;
                let totalPixels = 0;

                for (let dy = -searchRadius; dy <= searchRadius; dy += 4) {
                    for (let dx = -searchRadius; dx <= searchRadius; dx += 4) {
                        const checkX = x + dx;
                        const checkY = y + dy;

                        if (
                            checkX >= 0 &&
                            checkX < width &&
                            checkY >= 0 &&
                            checkY < height
                        ) {
                            totalPixels++;
                            if (
                                walkableMap[checkY] &&
                                walkableMap[checkY][checkX]
                            ) {
                                walkableCount++;
                            }
                        }
                    }
                }

                const density =
                    totalPixels > 0 ? walkableCount / totalPixels : 0;

                // Only consider areas that are mostly walkable and better than previous best
                if (density > 0.6 && density > maxDensity) {
                    maxDensity = density;
                    bestPosition = { x, y, density };
                }
            }
        }

        // If no good dense area found, fall back to center of bounding box
        if (!bestPosition) {
            console.log(
                "No dense walkable area found, using bounding box center"
            );
            let minX = width,
                maxX = 0,
                minY = height,
                maxY = 0;
            let walkableFound = false;

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

            if (walkableFound) {
                bestPosition = {
                    x: (minX + maxX) / 2,
                    y: (minY + maxY) / 2,
                    density: 0.5,
                };
            }
        }

        return bestPosition;
    }

    private validateAllActorPositions(
        lastValidPositions: Map<Actor, Vector>
    ): void {
        if (this.walkableMap.length === 0) return;

        // Get all actors in the scene
        const actors = this.actors.filter((actor) =>
            this.shouldValidateActor(actor)
        );

        for (const actor of actors) {
            const currentPos = actor.pos;

            // Initialize last valid position if not exists
            if (!lastValidPositions.has(actor)) {
                lastValidPositions.set(actor, currentPos.clone());
                continue;
            }

            const lastValidPos = lastValidPositions.get(actor)!;

            // Check if current position is walkable
            if (this.isPositionWalkable(currentPos.x, currentPos.y)) {
                // Position is valid, update our reference
                lastValidPositions.set(actor, currentPos.clone());
            } else {
                // Position is invalid - immediately revert and stop movement
                actor.pos = lastValidPos.clone();
                actor.vel = vec(0, 0); // Stop all velocity/momentum

                // Handle special actor-specific movement stopping
                this.stopActorSpecificMovement(actor);

                // Optional: Log movement blocking for debugging
                // console.log(`${actor.constructor.name} movement blocked - reverted to valid position`);
            }
        }
    }

    private shouldValidateActor(actor: Actor): boolean {
        // Only validate moveable actors, not static collision objects
        return (
            (!actor.body || actor.body.collisionType !== CollisionType.Fixed) &&
            actor.name !== "collision" && // Skip collision boundary actors
            !actor.name?.includes("wall") && // Skip wall actors
            !actor.name?.includes("building") && // Skip building collision actors
            actor.width > 0 &&
            actor.height > 0 // Skip zero-size actors
        );
    }

    private stopActorSpecificMovement(actor: Actor): void {
        // Handle specific movement patterns for different actor types

        // Stop point-and-click movement for player
        if (actor === this.player && "targetPosition" in actor) {
            (actor as any).targetPosition = null;
            (actor as any).isMovingToTarget = false;
        }

        // Stop any NPC-specific movement patterns
        if (
            "stopMovement" in actor &&
            typeof (actor as any).stopMovement === "function"
        ) {
            (actor as any).stopMovement();
        }

        // Stop any pathfinding or AI movement
        if (
            "clearPath" in actor &&
            typeof (actor as any).clearPath === "function"
        ) {
            (actor as any).clearPath();
        }
    }

    private isPositionWalkable(x: number, y: number): boolean {
        // Check a small area around the player position for collision
        const checkRadius = 6; // Slightly smaller radius for more responsive boundary detection

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
                        return false; // Non-walkable area detected
                    }
                }
            }
        }

        return true;
    }

    private createPolygonBasedCollision(walkableMap: boolean[][]): void {
        console.log("*** CREATING POLYGON-BASED COLLISION SYSTEM ***");

        const width = walkableMap[0]?.length || 1536;
        const height = walkableMap.length;

        // Find contours of non-walkable areas
        const contours = this.findCollisionContours(walkableMap, width, height);

        console.log(`Found ${contours.length} collision contours`);

        // Create polygon collision actors for each contour
        contours.forEach((contour, index) => {
            if (contour.length > 2) {
                this.createPolygonCollisionActor(contour, index);
            }
        });
    }

    private findCollisionContours(
        walkableMap: boolean[][],
        width: number,
        height: number
    ): Vector[][] {
        const contours: Vector[][] = [];
        const visited: boolean[][] = [];

        // Initialize visited map
        for (let y = 0; y < height; y++) {
            visited[y] = new Array(width).fill(false);
        }

        // Sample at reduced resolution for performance
        const step = 8;

        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                if (!visited[y][x] && !this.isWalkableAt(walkableMap, x, y)) {
                    // Found a non-walkable area, trace its contour
                    const contour = this.traceContour(
                        walkableMap,
                        visited,
                        x,
                        y,
                        width,
                        height,
                        step
                    );
                    if (contour.length > 4) {
                        // Only keep significant contours
                        contours.push(contour);
                    }
                }
            }
        }

        return contours;
    }

    private traceContour(
        walkableMap: boolean[][],
        visited: boolean[][],
        startX: number,
        startY: number,
        width: number,
        height: number,
        step: number
    ): Vector[] {
        const contour: Vector[] = [];
        const directions = [
            { x: step, y: 0 }, // Right
            { x: 0, y: step }, // Down
            { x: -step, y: 0 }, // Left
            { x: 0, y: -step }, // Up
        ];

        let currentX = startX;
        let currentY = startY;
        let directionIndex = 0;
        const maxIterations = 1000; // Prevent infinite loops
        let iterations = 0;

        do {
            visited[currentY][currentX] = true;
            contour.push(vec(currentX, currentY));

            // Try to continue in the current direction
            let found = false;
            for (let i = 0; i < directions.length && !found; i++) {
                const dir =
                    directions[(directionIndex + i) % directions.length];
                const nextX = currentX + dir.x;
                const nextY = currentY + dir.y;

                if (
                    nextX >= 0 &&
                    nextX < width &&
                    nextY >= 0 &&
                    nextY < height &&
                    !this.isWalkableAt(walkableMap, nextX, nextY) &&
                    !visited[nextY][nextX]
                ) {
                    currentX = nextX;
                    currentY = nextY;
                    directionIndex = (directionIndex + i) % directions.length;
                    found = true;
                }
            }

            if (!found) break;
            iterations++;
        } while (
            (currentX !== startX || currentY !== startY) &&
            iterations < maxIterations
        );

        return contour;
    }

    private isWalkableAt(
        walkableMap: boolean[][],
        x: number,
        y: number
    ): boolean {
        if (
            x < 0 ||
            x >= walkableMap[0]?.length ||
            y < 0 ||
            y >= walkableMap.length
        ) {
            return false;
        }
        return walkableMap[y] && walkableMap[y][x];
    }

    private createPolygonCollisionActor(
        contour: Vector[],
        index: number
    ): void {
        if (contour.length < 3) return;

        // Calculate center point
        let centerX = 0,
            centerY = 0;
        contour.forEach((point) => {
            centerX += point.x;
            centerY += point.y;
        });
        centerX /= contour.length;
        centerY /= contour.length;

        // Convert to relative coordinates
        const relativePoints = contour.map((point) =>
            vec(point.x - centerX, point.y - centerY)
        );

        // Create collision actor with polygon shape
        const collisionActor = new Actor({
            pos: vec(centerX, centerY),
            collisionType: CollisionType.Fixed,
            z: 99,
        });

        // Create a visual representation (simplified as rectangle for now)
        collisionActor.graphics.use(
            new Rectangle({
                width: 16,
                height: 16,
                color: Color.fromRGB(0, 255, 255, 0.4),
            })
        );

        this.add(collisionActor);
        console.log(
            `Created polygon collision actor ${index} with ${
                contour.length
            } points at (${Math.floor(centerX)}, ${Math.floor(centerY)})`
        );
    }

    private setupSallyNPC(walkableMap: boolean[][]): void {
        const width = walkableMap[0]?.length || 1536;
        const height = walkableMap.length;

        // Find the center of the largest walkable area using the existing method
        const largestWalkableCenter = this.findMostWalkableCenter(
            walkableMap,
            width,
            height
        );

        if (largestWalkableCenter) {
            // Find the bounds of the walkable area for Sally's movement
            let minX = width,
                maxX = 0,
                minY = height,
                maxY = 0;
            let walkableFound = false;

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

            if (walkableFound) {
                // Add some padding to keep Sally away from collision boundaries
                const padding = 40;
                const sallyMinX = Math.max(0, minX + padding);
                const sallyMaxX = Math.min(width, maxX - padding);
                const sallyMinY = Math.max(0, minY + padding);
                const sallyMaxY = Math.min(height, maxY - padding);

                // Create Sally with movement bounds
                this.sally = new Sally({
                    minX: sallyMinX,
                    maxX: sallyMaxX,
                    minY: sallyMinY,
                    maxY: sallyMaxY,
                });

                // Position Sally in the center of the largest walkable area
                this.sally.pos = vec(
                    largestWalkableCenter.x,
                    largestWalkableCenter.y
                );
                this.add(this.sally);

                console.log(
                    `Sally NPC positioned in center of largest walkable area at: (${Math.floor(
                        largestWalkableCenter.x
                    )}, ${Math.floor(largestWalkableCenter.y)}) with density ${
                        largestWalkableCenter.density
                    }`
                );
                console.log(
                    `Sally movement bounds: (${sallyMinX}, ${sallyMinY}) to (${sallyMaxX}, ${sallyMaxY})`
                );
            } else {
                console.warn("No walkable area found for Sally NPC placement");
            }
        } else {
            console.warn(
                "Could not find center of largest walkable area for Sally placement"
            );
        }
    }

    private setupFootstepSystem(): void {
        console.log("Setting up footstep system...");

        // Initialize last known position
        this.lastPlayerPosition = this.player.pos.clone();

        // Set up a timer to check player movement every frame
        const movementCheckTimer = new Timer({
            fcn: () => this.checkPlayerMovement(),
            repeats: true,
            interval: 50, // Check every 50ms
        });

        this.add(movementCheckTimer);
        movementCheckTimer.start();

        console.log("Footstep system initialized");
    }

    private checkPlayerMovement(): void {
        if (!this.player) return;

        const currentPos = this.player.pos;
        const previousPos = this.lastPlayerPosition;

        // Calculate movement distance
        const movementDistance = currentPos.distance(previousPos);
        const isCurrentlyMoving = movementDistance > 1; // Threshold for movement detection

        // Check if player is in walkable area
        const isInWalkableArea = this.isPositionWalkable(
            currentPos.x,
            currentPos.y
        );

        // Determine if footsteps should be playing
        const shouldPlayFootsteps = isCurrentlyMoving && isInWalkableArea;

        // Handle footstep audio state
        if (shouldPlayFootsteps && !this.isPlayerMoving) {
            // Start playing footsteps
            this.startFootsteps();
        } else if (!shouldPlayFootsteps && this.isPlayerMoving) {
            // Stop playing footsteps
            this.stopFootsteps();
        }

        // Update state
        this.isPlayerMoving = shouldPlayFootsteps;
        this.lastPlayerPosition = currentPos.clone();
    }

    private startFootsteps(): void {
        try {
            if (!breazeFootsteps.isPlaying()) {
                breazeFootsteps.play();
                console.log("Started playing footsteps");
            }
        } catch (error) {
            console.error("Error starting footsteps:", error);
        }
    }

    private stopFootsteps(): void {
        try {
            if (breazeFootsteps.isPlaying()) {
                breazeFootsteps.stop();
                console.log("Stopped playing footsteps");
            }
        } catch (error) {
            console.error("Error stopping footsteps:", error);
        }
    }

    private createBirdFlock(): void {
        // Create a flock of 6-8 birds positioned around (720, 556) where user wants to see them
        const flockSize = 6 + Math.floor(Math.random() * 3); // 6-8 birds
        const centerX = 720; // User-specified X position
        const centerY = 556; // User-specified Y position

        console.log(
            `🐦 Creating bird flock of ${flockSize} birds at center (${centerX}, ${centerY})`
        );

        for (let i = 0; i < flockSize; i++) {
            // Create stationary birds for visibility
            const bird = new Birdee({
                direction: "right", // Facing right
                speed: 0, // Stationary for now
                wingFlapSpeed: 120 + Math.random() * 30, // Still flapping wings
                flightBounds: { left: 0, right: 1536 }, // Scene bounds
            });

            // Position birds in a loose formation around the center
            const formationRadius = 100; // Radius of the formation
            const angle = (i / flockSize) * 2 * Math.PI; // Distribute evenly in a circle
            const radiusVariation = Math.random() * 50; // Some randomness in distance

            const posX =
                centerX + Math.cos(angle) * (formationRadius + radiusVariation);
            const posY =
                centerY +
                Math.sin(angle) * (formationRadius * 0.6 + radiusVariation); // Flatter formation

            bird.pos = vec(posX, posY);
            bird.z = 15; // Ensure birds are above background
            this.add(bird);

            console.log(
                `🐦 Bird ${i + 1} created and positioned at: (${Math.floor(
                    posX
                )}, ${Math.floor(posY)}) with z=${bird.z}`
            );
        }

        console.log(
            `🐦 Bird flock complete: ${flockSize} stationary birds positioned in center of Breaze scene`
        );
    }
}

const Resources = {
    Image: new ImageSource(BreazeImage, true, ImageFiltering.Pixel),
    AsepriteResource: new AsepriteResource(
        "./components/cities/Breeze/Breaze.json"
    ),
};

export { Resources as BreazeResources };
