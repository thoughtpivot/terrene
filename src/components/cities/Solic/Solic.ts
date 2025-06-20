import {
    Engine,
    Scene,
    Loader,
    Sound,
    SceneActivationContext,
    Color,
    Actor,
    Rectangle,
    Vector,
    CollisionType,
    Timer,
    Animation,
    SpriteSheet,
    ImageSource,
    Sprite,
    range,
    randomInRange,
    EasingFunctions,
} from "excalibur";
import You from "../../characters/player/You/You";
import Sally from "../../characters/npc/Sally/Sally";
import OldManSam from "../../characters/npc/OldManSam/OldManSam";

const solicThemeSong = new Sound(
    "./components/cities/Solic/Solic_theme_track.mp3"
);

export default class Solic extends Scene {
    private beachBounds!: Actor;
    private trails: Actor[] = [];
    private player!: You;
    private sally!: Sally;
    private oldManSam!: OldManSam;
    private ocean!: Actor;
    private waveAnimations: Actor[] = [];
    private fishSpawnTimer!: Timer;

    onInitialize(engine: Engine): void {
        const loader = new Loader([solicThemeSong]);

        engine.start(loader).then(() => {
            console.log("Solic scene loaded, setting up theme song...");

            // Set up sound properties
            solicThemeSong.volume = 0.3;
            solicThemeSong.loop = true;

            // Try to play immediately, but handle browser audio policy
            this.attemptToPlayMusic();

            // Set up event listeners for when audio actually starts
            solicThemeSong.on("playbackstart", () => {
                console.log(
                    "Solic theme song playback started - Loop is:",
                    solicThemeSong.loop
                );
            });

            solicThemeSong.on("playbackend", () => {
                console.log(
                    "Solic theme song ended - should restart if looping"
                );
            });

            // Set camera zoom for beach scene
            this.camera.zoom = 2.5;

            // Create sandy beach background
            const beachBackground = new Actor({
                pos: new Vector(
                    engine.screen.resolution.width / 2,
                    engine.screen.resolution.height / 2
                ),
                width: engine.screen.resolution.width,
                height: engine.screen.resolution.height,
            });

            beachBackground.graphics.use(
                new Rectangle({
                    width: engine.screen.resolution.width,
                    height: engine.screen.resolution.height,
                    color: Color.fromHex("#F8D878"), // NES NTSC sandy beach color
                })
            );

            beachBackground.z = -3; // Bottom layer
            this.add(beachBackground);

            // Create ocean on the right side (non-walkable) - visible blue water area
            this.ocean = new Actor({
                pos: new Vector(800, 240), // Position within the 960x480 screen
                width: 320,
                height: 600,
                collisionType: CollisionType.Fixed, // Prevent entry
            });
            this.ocean.graphics.use(
                new Rectangle({
                    width: 320,
                    height: 600,
                    color: Color.fromHex("#0078F8"), // NES NTSC deep blue ocean
                })
            );
            this.ocean.z = -2;
            this.add(this.ocean);

            // Add animated water waves
            this.createWaveAnimations(engine);

            // Create mountains on the left side (non-walkable base) - visible gray mountain area
            const mountains = new Actor({
                pos: new Vector(160, 240), // Position within the 960x480 screen
                width: 320,
                height: 600,
                collisionType: CollisionType.Fixed,
            });
            mountains.graphics.use(
                new Rectangle({
                    width: 320,
                    height: 600,
                    color: Color.fromHex("#787878"), // NES NTSC gray mountains
                })
            );
            mountains.z = -2;
            this.add(mountains);

            // Create walkable beach area (main area) - center beach area between mountains and ocean
            this.beachBounds = new Actor({
                pos: new Vector(480, 240), // Center of screen
                width: 320, // Beach area between mountains and ocean
                height: 480,
                collisionType: CollisionType.Passive, // Walkable area
            });
            this.beachBounds.graphics.use(
                new Rectangle({
                    width: 320,
                    height: 480,
                    color: Color.Transparent, // Invisible walkable zone
                })
            );
            this.add(this.beachBounds);

            // Create walkable mountain trails
            this.createMountainTrails(engine);

            // Add some visual beach elements
            this.addBeachElements(engine);

            // Add and setup player character
            this.setupPlayer(engine);

            // Setup fish spawning
            this.setupFishSpawning(engine);
        });
    }

    private createMountainTrails(engine: Engine): void {
        // Trail 1 - Lower trail extending from mountains into beach
        const trail1 = new Actor({
            pos: new Vector(280, 350), // Extended from mountain edge
            width: 60,
            height: 40,
            collisionType: CollisionType.Passive,
        });
        trail1.graphics.use(
            new Rectangle({
                width: 60,
                height: 40,
                color: Color.fromHex("#AC7C00"), // NES NTSC brown trail color
            })
        );
        trail1.z = -1;
        this.add(trail1);
        this.trails.push(trail1);

        // Trail 2 - Upper trail extending from mountains into beach
        const trail2 = new Actor({
            pos: new Vector(290, 150),
            width: 50,
            height: 35,
            collisionType: CollisionType.Passive,
        });
        trail2.graphics.use(
            new Rectangle({
                width: 50,
                height: 35,
                color: Color.fromHex("#AC7C00"), // NES NTSC brown trail color
            })
        );
        trail2.z = -1;
        this.add(trail2);
        this.trails.push(trail2);

        // Trail 3 - Middle connecting trail
        const trail3 = new Actor({
            pos: new Vector(285, 240), // Middle of screen height
            width: 55,
            height: 30,
            collisionType: CollisionType.Passive,
        });
        trail3.graphics.use(
            new Rectangle({
                width: 55,
                height: 30,
                color: Color.fromHex("#AC7C00"), // NES NTSC brown trail color
            })
        );
        trail3.z = -1;
        this.add(trail3);
        this.trails.push(trail3);
    }

    private addBeachElements(engine: Engine): void {
        // Add palm trees positioned in the beach area (between mountains and ocean)
        const palmTree1 = new Actor({
            pos: new Vector(420, 120),
            width: 8,
            height: 40,
            collisionType: CollisionType.Fixed,
        });
        palmTree1.graphics.use(
            new Rectangle({
                width: 8,
                height: 40,
                color: Color.fromHex("#881400"), // NES NTSC brown trunk
            })
        );
        this.add(palmTree1);

        // Palm tree leaves
        const leaves1 = new Actor({
            pos: new Vector(420, 100),
            width: 20,
            height: 15,
            collisionType: CollisionType.Fixed,
        });
        leaves1.graphics.use(
            new Rectangle({
                width: 20,
                height: 15,
                color: Color.fromHex("#00B800"), // NES NTSC green leaves
            })
        );
        this.add(leaves1);

        // Add another palm tree
        const palmTree2 = new Actor({
            pos: new Vector(550, 320),
            width: 8,
            height: 35,
            collisionType: CollisionType.Fixed,
        });
        palmTree2.graphics.use(
            new Rectangle({
                width: 8,
                height: 35,
                color: Color.fromHex("#881400"), // NES NTSC brown trunk
            })
        );
        this.add(palmTree2);

        const leaves2 = new Actor({
            pos: new Vector(550, 302),
            width: 18,
            height: 12,
            collisionType: CollisionType.Fixed,
        });
        leaves2.graphics.use(
            new Rectangle({
                width: 18,
                height: 12,
                color: Color.fromHex("#00B800"), // NES NTSC green leaves
            })
        );
        this.add(leaves2);

        // Add some rocks on the beach - positioned in walkable beach area
        this.createRock(480, 300, 15, 12);
        this.createRock(380, 180, 12, 10);

        // Add some additional rocks for variety
        this.createRock(520, 200, 10, 8, "#5a5a5a"); // Darker rock
        this.createRock(420, 350, 14, 11, "#7d7d7d"); // Lighter rock

        // Add 10 more scattered rocks with varying sizes and NES NTSC gray shades
        const grayShades = [
            "#000000", // Black
            "#787878", // Medium gray
            "#BCBCBC", // Light gray
            "#881400", // Brown
            "#503000", // Dark brown
            "#AC7C00", // Brown-orange
            "#F8F8F8", // Very light gray
        ];

        for (let i = 0; i < 10; i++) {
            // Random position within the walkable beach area (320x480 centered at 480,240)
            // Beach area bounds: x: 320-640, y: 0-480
            const x = randomInRange(340, 620); // Slightly inset from edges
            const y = randomInRange(20, 460); // Slightly inset from edges

            // Random size variations
            const width = randomInRange(8, 18);
            const height = randomInRange(6, 16);

            // Random gray shade
            const randomShade =
                grayShades[Math.floor(Math.random() * grayShades.length)];

            this.createRock(x, y, width, height, randomShade);
        }
    }

    private createRock(
        x: number,
        y: number,
        width: number,
        height: number,
        color: string = "#787878"
    ): Actor {
        const rock = new Actor({
            pos: new Vector(x, y),
            width: width,
            height: height,
            collisionType: CollisionType.Fixed,
        });

        // N64-style color palette with more variation
        const baseColor = Color.fromHex(color);
        const rockPalette = {
            darkest: baseColor.darken(0.4), // Deep shadows
            darker: baseColor.darken(0.25), // Primary shadows
            base: baseColor, // Main rock color
            lighter: baseColor.lighten(0.2), // Mid highlights
            lightest: baseColor.lighten(0.35), // Bright highlights
            accent: baseColor.darken(0.15), // Detail color
        };

        // Create geometric rock base with angular shape (N64 style)
        const rockShapes = [
            // Main rock body - slightly irregular rectangle
            { w: width, h: height, x: 0, y: 0, color: rockPalette.base },
            // Angular top section
            {
                w: width * 0.8,
                h: height * 0.3,
                x: width * 0.1,
                y: -height * 0.1,
                color: rockPalette.lighter,
            },
            // Left edge shadow
            {
                w: width * 0.15,
                h: height * 0.9,
                x: -width * 0.05,
                y: height * 0.05,
                color: rockPalette.darker,
            },
            // Bottom shadow
            {
                w: width * 0.9,
                h: height * 0.2,
                x: width * 0.05,
                y: height * 0.4,
                color: rockPalette.darkest,
            },
        ];

        // Build main rock geometry
        rockShapes.forEach((shape, index) => {
            const section = new Actor({
                pos: new Vector(x + shape.x, y + shape.y),
                width: shape.w,
                height: shape.h,
                z: index * 0.1,
            });
            section.graphics.use(
                new Rectangle({
                    width: shape.w,
                    height: shape.h,
                    color: shape.color,
                })
            );
            this.add(section);
        });

        // Add N64-style pixelated rock texture layers
        this.addRockTextureLayer(x, y, width, height, rockPalette);

        // Add geometric surface details (cracks, chips, facets)
        this.addRockSurfaceDetails(x, y, width, height, rockPalette);

        // Add N64-style dithered shading
        this.addRockDithering(x, y, width, height, rockPalette);

        // Add mineral veins/streaks (common in N64 rock textures)
        this.addMineralVeins(x, y, width, height, rockPalette);

        this.add(rock);
        return rock;
    }

    private addRockTextureLayer(
        x: number,
        y: number,
        width: number,
        height: number,
        palette: any
    ): void {
        // Create pixel-perfect texture details like N64 games
        const textureCount = Math.floor((width * height) / 25); // Density based on size

        for (let i = 0; i < textureCount; i++) {
            const pixelSize = randomInRange(1, 3);
            const texel = new Actor({
                pos: new Vector(
                    x + randomInRange(-width * 0.4, width * 0.4),
                    y + randomInRange(-height * 0.4, height * 0.4)
                ),
                width: pixelSize,
                height: pixelSize,
                z: 0.5,
            });

            // N64-style limited color selection for texture
            const textureColors = [
                palette.darker,
                palette.accent,
                palette.base,
            ];
            const pixelColor =
                textureColors[Math.floor(Math.random() * textureColors.length)];

            texel.graphics.use(
                new Rectangle({
                    width: pixelSize,
                    height: pixelSize,
                    color: pixelColor,
                })
            );
            this.add(texel);
        }
    }

    private addRockSurfaceDetails(
        x: number,
        y: number,
        width: number,
        height: number,
        palette: any
    ): void {
        // Angular cracks (N64 rocks had geometric, not organic shapes)
        const crackCount = randomInRange(2, 4);
        for (let i = 0; i < crackCount; i++) {
            const crackLength = randomInRange(width * 0.3, width * 0.7);
            const crackWidth = randomInRange(1, 2);

            const crack = new Actor({
                pos: new Vector(
                    x + randomInRange(-width * 0.3, width * 0.3),
                    y + randomInRange(-height * 0.3, height * 0.3)
                ),
                width: crackLength,
                height: crackWidth,
                z: 0.7,
            });
            crack.graphics.use(
                new Rectangle({
                    width: crackLength,
                    height: crackWidth,
                    color: palette.darkest,
                })
            );
            this.add(crack);
        }

        // Rock chips and angular facets
        const chipCount = randomInRange(3, 6);
        for (let i = 0; i < chipCount; i++) {
            const chipSize = randomInRange(2, 4);
            const chip = new Actor({
                pos: new Vector(
                    x + randomInRange(-width * 0.4, width * 0.4),
                    y + randomInRange(-height * 0.4, height * 0.4)
                ),
                width: chipSize,
                height: chipSize,
                z: 0.6,
            });
            chip.graphics.use(
                new Rectangle({
                    width: chipSize,
                    height: chipSize,
                    color: palette.lighter,
                })
            );
            this.add(chip);
        }
    }

    private addRockDithering(
        x: number,
        y: number,
        width: number,
        height: number,
        palette: any
    ): void {
        // N64-style dithering pattern for gradients
        const ditherPixels = Math.floor((width * height) / 20);

        for (let i = 0; i < ditherPixels; i++) {
            const ditherX =
                x + (i % Math.floor(width / 2)) * 2 + randomInRange(-1, 1);
            const ditherY =
                y +
                Math.floor(i / Math.floor(width / 2)) * 2 +
                randomInRange(-1, 1);

            // Skip if outside rock bounds
            if (
                Math.abs(ditherX - x) > width / 2 ||
                Math.abs(ditherY - y) > height / 2
            )
                continue;

            const ditherPixel = new Actor({
                pos: new Vector(ditherX, ditherY),
                width: 1,
                height: 1,
                z: 0.3,
            });

            // Alternating dither pattern
            const isDarkDither =
                (Math.floor(ditherX) + Math.floor(ditherY)) % 2 === 0;
            const ditherColor = isDarkDither ? palette.darker : palette.lighter;

            ditherPixel.graphics.use(
                new Rectangle({
                    width: 1,
                    height: 1,
                    color: ditherColor,
                })
            );
            this.add(ditherPixel);
        }
    }

    private addMineralVeins(
        x: number,
        y: number,
        width: number,
        height: number,
        palette: any
    ): void {
        // Add mineral veins/streaks like N64 rock textures
        const veinCount = randomInRange(1, 3);

        for (let i = 0; i < veinCount; i++) {
            const veinLength = randomInRange(width * 0.4, width * 0.8);
            const veinSegments = Math.floor(veinLength / 3);

            const startX = x + randomInRange(-width * 0.3, width * 0.3);
            const startY = y + randomInRange(-height * 0.3, height * 0.3);
            const angle = randomInRange(0, Math.PI * 2);

            for (let j = 0; j < veinSegments; j++) {
                const segmentX = startX + Math.cos(angle) * j * 3;
                const segmentY = startY + Math.sin(angle) * j * 3;

                const veinSegment = new Actor({
                    pos: new Vector(segmentX, segmentY),
                    width: randomInRange(1, 2),
                    height: randomInRange(1, 2),
                    z: 0.4,
                });

                // Mineral colors - slightly different from main rock
                const mineralColors = [palette.lightest, palette.accent];
                const mineralColor =
                    mineralColors[
                        Math.floor(Math.random() * mineralColors.length)
                    ];

                veinSegment.graphics.use(
                    new Rectangle({
                        width: veinSegment.width,
                        height: veinSegment.height,
                        color: mineralColor,
                    })
                );
                this.add(veinSegment);
            }
        }
    }

    private setupPlayer(engine: Engine): void {
        // Create and add player character
        console.log("*** CREATING PLAYER CHARACTER ***");
        this.player = new You();
        this.player.pos = new Vector(480, 240); // Start player in center of beach
        this.add(this.player);
        console.log("*** PLAYER CHARACTER ADDED TO SCENE ***", this.player);

        // Create and add Sally NPC with beach area bounds
        this.sally = new Sally({
            minX: 340,
            maxX: 620,
            minY: 20,
            maxY: 460,
        });
        this.sally.pos = new Vector(400, 300); // Start Sally in a different part of the beach
        this.add(this.sally);
        console.log("Solic scene: Added Sally at position:", this.sally.pos);

        // Create and add Old Man Sam NPC who will chase the player
        this.oldManSam = new OldManSam();
        this.oldManSam.pos = new Vector(350, 100); // Start him away from the player
        this.add(this.oldManSam);
        console.log(
            "Solic scene: Added Old Man Sam at position:",
            this.oldManSam.pos
        );

        // Setup camera to follow player
        this.camera.strategy.elasticToActor(this.player, 0.8, 0.9);
    }

    private createWaveAnimations(engine: Engine): void {
        // Create 16-bit style layered ocean with gradient and animated patterns
        this.create16BitOceanLayers(engine);
        this.createAnimatedWavePatterns(engine);
        this.createPixelPerfectFoam(engine);
    }

    private create16BitOceanLayers(engine: Engine): void {
        // Create 16-bit style ocean gradient layers (deep to shallow)
        const oceanLayers = [
            { color: "#004058", depth: 0, alpha: 1.0 }, // Deepest NES blue
            { color: "#0058F8", depth: 20, alpha: 0.9 }, // Deep NES blue
            { color: "#0078F8", depth: 40, alpha: 0.8 }, // Medium NES blue
            { color: "#3CBCFC", depth: 60, alpha: 0.7 }, // Light NES blue
            { color: "#A4E4FC", depth: 80, alpha: 0.6 }, // Lightest NES blue
        ];

        oceanLayers.forEach((layer, index) => {
            const oceanLayer = new Actor({
                pos: new Vector(800, 240 + layer.depth),
                width: 320,
                height: 600 - layer.depth * 2,
                z: -2 + index * 0.01,
            });

            const layerGraphic = new Rectangle({
                width: 320,
                height: 600 - layer.depth * 2,
                color: Color.fromHex(layer.color),
            });
            layerGraphic.opacity = layer.alpha;
            oceanLayer.graphics.use(layerGraphic);

            // Add subtle movement to each layer
            oceanLayer.actions.repeatForever((actions) => {
                actions
                    .moveBy(0, randomInRange(-2, 2), 3000 + index * 500)
                    .moveBy(0, randomInRange(-2, 2), 3000 + index * 500);
            });

            this.add(oceanLayer);
            this.waveAnimations.push(oceanLayer);
        });
    }

    private createAnimatedWavePatterns(engine: Engine): void {
        // Create 16-bit style animated wave tiles
        for (let row = 0; row < 12; row++) {
            for (let col = 0; col < 6; col++) {
                const waveTime = (row + col) * 200; // Stagger animation timing

                const waveTile = new Actor({
                    pos: new Vector(
                        660 + col * 32, // 32px tiles across ocean width
                        -40 + row * 32 // 32px tiles down ocean height
                    ),
                    width: 32,
                    height: 16,
                    z: -1.8 + row * 0.01,
                });

                // NES NTSC wave pattern colors (alternating for wave effect)
                const wavePatterns = [
                    "#A4E4FC", // Light NES wave crest
                    "#3CBCFC", // Medium NES wave
                    "#0078F8", // Dark NES wave trough
                    "#0058F8", // Deep NES trough
                ];

                const patternIndex =
                    (row + col + Math.floor(Date.now() / 500)) %
                    wavePatterns.length;

                waveTile.graphics.use(
                    new Rectangle({
                        width: 32,
                        height: 16,
                        color: Color.fromHex(wavePatterns[patternIndex]),
                    })
                );

                // Create scrolling wave animation
                waveTile.actions.repeatForever((actions) => {
                    actions
                        .delay(waveTime)
                        .callMethod(() => {
                            // Cycle through wave patterns
                            const newPatternIndex =
                                (patternIndex + 1) % wavePatterns.length;
                            waveTile.graphics.use(
                                new Rectangle({
                                    width: 32,
                                    height: 16,
                                    color: Color.fromHex(
                                        wavePatterns[newPatternIndex]
                                    ),
                                })
                            );
                        })
                        .moveBy(
                            randomInRange(-4, 4),
                            randomInRange(-2, 2),
                            1000
                        )
                        .moveBy(
                            randomInRange(-4, 4),
                            randomInRange(-2, 2),
                            1000
                        );
                });

                this.add(waveTile);
                this.waveAnimations.push(waveTile);
            }
        }
    }

    private createPixelPerfectFoam(engine: Engine): void {
        // Create 16-bit style foam with dithered patterns
        for (let i = 0; i < 20; i++) {
            const foam = new Actor({
                pos: new Vector(
                    640 + randomInRange(0, 40), // Shore edge with some variation
                    -60 + i * 30 + randomInRange(-10, 10)
                ),
                width: 16,
                height: 8,
                z: -1.5,
            });

            // NES NTSC foam colors with dithering effect
            const foamColors = ["#FCFCFC", "#F8F8F8", "#BCBCBC", "#787878"];
            const foamColor = foamColors[i % foamColors.length];

            foam.graphics.use(
                new Rectangle({
                    width: 16,
                    height: 8,
                    color: Color.fromHex(foamColor),
                })
            );

            // Foam bubble animation
            foam.actions.repeatForever((actions) => {
                actions
                    .moveBy(
                        randomInRange(-8, 16),
                        randomInRange(-4, 4),
                        800 + i * 50
                    )
                    .fade(0.3, 400)
                    .fade(0.9, 400)
                    .moveBy(
                        randomInRange(-16, 8),
                        randomInRange(-4, 4),
                        800 + i * 50
                    )
                    .delay(randomInRange(200, 800));
            });

            this.add(foam);
            this.waveAnimations.push(foam);
        }
    }

    private setupFishSpawning(engine: Engine): void {
        // Create timer for random fish spawning
        this.fishSpawnTimer = new Timer({
            fcn: () => this.spawnFish(engine),
            repeats: true,
            interval: randomInRange(2000, 5000), // Random interval 2-5 seconds
        });

        this.add(this.fishSpawnTimer);
        this.fishSpawnTimer.start();
    }

    private spawnFish(engine: Engine): void {
        // Create 16-bit style fish with pixel perfect design
        this.create16BitFish(engine);

        // Reset timer with new random interval
        this.fishSpawnTimer.interval = randomInRange(2000, 5000);
    }

    private create16BitFish(engine: Engine): void {
        // Fish spawn position - constrained to ocean bounds
        const spawnX = randomInRange(680, 920);
        const spawnY = randomInRange(200, 400);

        // Create main fish body
        const fishBody = new Actor({
            pos: new Vector(spawnX, spawnY),
            width: 16,
            height: 10,
            z: 10,
        });

        // 16-bit fish colors (randomly choose fish type)
        const fishTypes = [
            { body: "#ff6b35", accent: "#f7931e" }, // Orange fish
            { body: "#4ecdc4", accent: "#44a08d" }, // Teal fish
            { body: "#ffbe0b", accent: "#fb8500" }, // Yellow fish
            { body: "#8338ec", accent: "#3a86ff" }, // Purple fish
        ];

        const fishType =
            fishTypes[Math.floor(Math.random() * fishTypes.length)];

        fishBody.graphics.use(
            new Rectangle({
                width: 16,
                height: 10,
                color: Color.fromHex(fishType.body),
            })
        );

        // Add fish tail
        const fishTail = new Actor({
            pos: new Vector(spawnX - 8, spawnY),
            width: 8,
            height: 6,
            z: 9,
        });

        fishTail.graphics.use(
            new Rectangle({
                width: 8,
                height: 6,
                color: Color.fromHex(fishType.accent),
            })
        );

        // Add fish eye (white dot)
        const fishEye = new Actor({
            pos: new Vector(spawnX + 4, spawnY - 2),
            width: 3,
            height: 3,
            z: 11,
        });

        fishEye.graphics.use(
            new Rectangle({
                width: 3,
                height: 3,
                color: Color.White,
            })
        );

        // Add all fish parts to scene
        this.add(fishBody);
        this.add(fishTail);
        this.add(fishEye);

        // Create 16-bit style jumping animation with water splash
        this.animate16BitFishJump(
            engine,
            fishBody,
            fishTail,
            fishEye,
            spawnX,
            spawnY
        );
    }

    private animate16BitFishJump(
        engine: Engine,
        body: Actor,
        tail: Actor,
        eye: Actor,
        startX: number,
        startY: number
    ): void {
        const jumpHeight = randomInRange(50, 100);
        const horizontalMove = randomInRange(-40, 40);
        const jumpDuration = 1200;

        // Constrain movement to ocean bounds
        const targetX = Math.max(680, Math.min(920, startX + horizontalMove));
        const landX = Math.max(
            680,
            Math.min(920, targetX + randomInRange(-20, 20))
        );

        // Create water splash at jump start
        this.createWaterSplash(startX, startY);

        // Animate all fish parts together
        const fishParts = [body, tail, eye];

        fishParts.forEach((part, index) => {
            const offsetX = index === 1 ? -8 : index === 2 ? 4 : 0; // Tail and eye offsets
            const offsetY = index === 2 ? -2 : 0; // Eye Y offset

            part.actions
                .easeTo(
                    targetX + offsetX,
                    startY - jumpHeight + offsetY,
                    jumpDuration * 0.6,
                    EasingFunctions.EaseOutQuad
                )
                .easeTo(
                    landX + offsetX,
                    startY + randomInRange(20, 40) + offsetY,
                    jumpDuration * 0.4,
                    EasingFunctions.EaseInQuad
                )
                .callMethod(() => {
                    if (index === 0) {
                        // Only create splash once (body)
                        this.createWaterSplash(landX, startY + 30);
                    }
                    part.kill();
                });
        });
    }

    private createWaterSplash(x: number, y: number): void {
        // Create 16-bit style water splash effect
        for (let i = 0; i < 8; i++) {
            const splashDrop = new Actor({
                pos: new Vector(x + randomInRange(-10, 10), y),
                width: 4,
                height: 4,
                z: 8,
            });

            splashDrop.graphics.use(
                new Rectangle({
                    width: 4,
                    height: 4,
                    color: Color.fromHex("#87ceeb"), // Sky blue splash
                })
            );

            // Animate splash droplets
            splashDrop.actions
                .moveBy(
                    randomInRange(-20, 20),
                    randomInRange(-15, -5),
                    300 + i * 50
                )
                .moveBy(
                    randomInRange(-10, 10),
                    randomInRange(10, 25),
                    400 + i * 50
                )
                .fade(0, 200)
                .callMethod(() => splashDrop.kill());

            this.add(splashDrop);
        }
    }

    private attemptToPlayMusic(): void {
        console.log("Attempting to play Solic theme song...");
        solicThemeSong
            .play()
            .then(() => {
                console.log("Solic theme song started playing successfully");
            })
            .catch((error) => {
                console.log(
                    "Audio blocked by browser policy, waiting for user interaction..."
                );
                console.log("Click anywhere on the screen to start music");

                // Set up one-time click listener to start music after user interaction
                const startMusicOnClick = () => {
                    console.log("User clicked, attempting to start music...");
                    solicThemeSong
                        .play()
                        .then(() => {
                            console.log(
                                "Solic theme song started after user interaction"
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

    onDeactivate(_context: SceneActivationContext<undefined>): void {
        // Cleanup when leaving the scene
    }
}
