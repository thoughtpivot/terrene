import {
    Engine,
    Scene,
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

export default class Solic extends Scene {
    private beachBounds!: Actor;
    private trails: Actor[] = [];
    private player!: You;
    private ocean!: Actor;
    private waveAnimations: Actor[] = [];
    private fishSpawnTimer!: Timer;

    onInitialize(engine: Engine): void {
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
                color: Color.fromHex("#f4e4bc"), // Sandy beach color
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
                color: Color.fromHex("#1e6091"), // Deep blue ocean
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
                color: Color.fromHex("#4a4a4a"), // Dark gray mountains
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
                color: Color.fromHex("#8b7355"), // Brown trail color
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
                color: Color.fromHex("#8b7355"), // Brown trail color
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
                color: Color.fromHex("#8b7355"), // Brown trail color
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
                color: Color.fromHex("#8b4513"), // Brown trunk
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
                color: Color.fromHex("#228b22"), // Green leaves
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
                color: Color.fromHex("#8b4513"), // Brown trunk
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
                color: Color.fromHex("#228b22"), // Green leaves
            })
        );
        this.add(leaves2);

        // Add some rocks on the beach - positioned in walkable beach area
        const rock1 = new Actor({
            pos: new Vector(480, 300),
            width: 15,
            height: 12,
            collisionType: CollisionType.Fixed,
        });
        rock1.graphics.use(
            new Rectangle({
                width: 15,
                height: 12,
                color: Color.fromHex("#696969"), // Gray rock
            })
        );
        this.add(rock1);

        const rock2 = new Actor({
            pos: new Vector(380, 180),
            width: 12,
            height: 10,
            collisionType: CollisionType.Fixed,
        });
        rock2.graphics.use(
            new Rectangle({
                width: 12,
                height: 10,
                color: Color.fromHex("#696969"), // Gray rock
            })
        );
        this.add(rock2);
    }

    private setupPlayer(engine: Engine): void {
        // Create and add player character
        this.player = new You();
        this.player.pos = new Vector(480, 240); // Start player in center of beach
        this.add(this.player);

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
            { color: "#0f3460", depth: 0, alpha: 1.0 }, // Deepest blue
            { color: "#16537e", depth: 20, alpha: 0.9 }, // Deep blue
            { color: "#1e6091", depth: 40, alpha: 0.8 }, // Medium deep
            { color: "#2980b9", depth: 60, alpha: 0.7 }, // Medium blue
            { color: "#3498db", depth: 80, alpha: 0.6 }, // Light blue
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

                // 16-bit wave pattern colors (alternating for wave effect)
                const wavePatterns = [
                    "#5dade2", // Light wave crest
                    "#3498db", // Medium wave
                    "#2980b9", // Dark wave trough
                    "#1e6091", // Deep trough
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

            // 16-bit foam colors with dithering effect
            const foamColors = ["#ffffff", "#ecf0f1", "#d5dbdb", "#bdc3c7"];
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

    onDeactivate(_context: SceneActivationContext<undefined>): void {
        // Cleanup when leaving the scene
    }
}
