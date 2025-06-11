import {
    Scene,
    Engine,
    vec,
    Actor,
    CollisionType,
    ImageSource,
    ImageFiltering,
    BoundingBox,
    Color,
    Rectangle,
} from "excalibur";
import You from "../../characters/player/You/You";

export default class Baston extends Scene {
    private player!: You;

    onInitialize(engine: Engine): void {
        console.log("*** BASTON SCENE INITIALIZING ***");

        // Set scene dimensions
        this.camera.strategy.limitCameraBounds(
            new BoundingBox({
                left: 0,
                top: 0,
                right: 1536,
                bottom: 1024,
            })
        );

        // Create urban background
        this.createUrbanBackground();

        // Add some basic urban elements
        this.createUrbanElements();

        // Add collision boundaries to restrict movement to road only
        this.createCollisionBoundaries();

        // Create and add player
        this.player = new You();
        this.player.pos = vec(768, 512); // Center position on the road
        this.add(this.player);

        // Focus camera on player
        this.camera.strategy.lockToActor(this.player);

        console.log("*** BASTON SCENE INITIALIZED ***");
    }

    private createUrbanBackground(): void {
        // Create a simple urban-themed background
        const backgroundActor = new Actor({
            pos: vec(768, 512),
            anchor: vec(0.5, 0.5),
            z: -1000,
        });

        // Urban gray background
        const urbanBackground = new Rectangle({
            width: 1536,
            height: 1024,
            color: Color.fromHex("#404040"), // Urban gray
        });

        backgroundActor.graphics.use(urbanBackground);
        this.add(backgroundActor);
        console.log("Urban background created successfully");
    }

    private createUrbanElements(): void {
        // Add some simple urban elements using rectangles

        // Buildings (background)
        for (let i = 0; i < 8; i++) {
            const building = new Actor({
                pos: vec(200 + i * 160, 200),
                width: 120,
                height: 300,
                z: -500,
            });

            building.graphics.use(
                new Rectangle({
                    width: 120,
                    height: 300,
                    color: Color.fromHex("#606060"),
                    strokeColor: Color.fromHex("#808080"),
                    lineWidth: 2,
                })
            );

            this.add(building);
        }

        // Roads/paths (WALKABLE AREA)
        const horizontalRoad = new Actor({
            pos: vec(768, 512),
            width: 1536,
            height: 80,
            z: -100,
        });

        horizontalRoad.graphics.use(
            new Rectangle({
                width: 1536,
                height: 80,
                color: Color.fromHex("#303030"), // Dark road
            })
        );

        this.add(horizontalRoad);

        // Sidewalks (NON-WALKABLE)
        const topSidewalk = new Actor({
            pos: vec(768, 472),
            width: 1536,
            height: 20,
            z: -50,
        });

        topSidewalk.graphics.use(
            new Rectangle({
                width: 1536,
                height: 20,
                color: Color.fromHex("#707070"), // Light gray sidewalk
            })
        );

        this.add(topSidewalk);

        const bottomSidewalk = new Actor({
            pos: vec(768, 552),
            width: 1536,
            height: 20,
            z: -50,
        });

        bottomSidewalk.graphics.use(
            new Rectangle({
                width: 1536,
                height: 20,
                color: Color.fromHex("#707070"),
            })
        );

        this.add(bottomSidewalk);

        console.log("Urban elements created successfully");
    }

    private createCollisionBoundaries(): void {
        console.log("Creating collision boundaries for road-only movement...");

        // Top area collision (above the road) - blocks everything above y=472
        const topCollision = new Actor({
            pos: vec(768, 236), // Center of top half
            width: 1536,
            height: 472, // From top (0) to start of road (472)
            collisionType: CollisionType.Fixed,
            z: 100,
        });

        // Make collision invisible but add slight tint for debugging
        topCollision.graphics.use(
            new Rectangle({
                width: 1536,
                height: 472,
                color: Color.Transparent,
            })
        );

        this.add(topCollision);

        // Bottom area collision (below the road) - blocks everything below y=552
        const bottomCollision = new Actor({
            pos: vec(768, 788), // Center of bottom half
            width: 1536,
            height: 472, // From end of road (552) to bottom (1024)
            collisionType: CollisionType.Fixed,
            z: 100,
        });

        bottomCollision.graphics.use(
            new Rectangle({
                width: 1536,
                height: 472,
                color: Color.Transparent,
            })
        );

        this.add(bottomCollision);

        // Building collision actors
        for (let i = 0; i < 8; i++) {
            const buildingCollision = new Actor({
                pos: vec(200 + i * 160, 200),
                width: 120,
                height: 300,
                collisionType: CollisionType.Fixed,
                z: 100,
            });

            buildingCollision.graphics.use(
                new Rectangle({
                    width: 120,
                    height: 300,
                    color: Color.Transparent,
                })
            );

            this.add(buildingCollision);
        }

        // Scene boundary walls
        this.createSceneBoundaries();

        console.log(
            "Collision boundaries created - player can only move on the dark road!"
        );
    }

    private createSceneBoundaries(): void {
        const wallThickness = 50;

        // Top boundary
        const topBoundary = new Actor({
            pos: vec(768, -wallThickness / 2),
            width: 1536,
            height: wallThickness,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(topBoundary);

        // Bottom boundary
        const bottomBoundary = new Actor({
            pos: vec(768, 1024 + wallThickness / 2),
            width: 1536,
            height: wallThickness,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(bottomBoundary);

        // Left boundary
        const leftBoundary = new Actor({
            pos: vec(-wallThickness / 2, 512),
            width: wallThickness,
            height: 1024,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(leftBoundary);

        // Right boundary
        const rightBoundary = new Actor({
            pos: vec(1536 + wallThickness / 2, 512),
            width: wallThickness,
            height: 1024,
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(rightBoundary);

        console.log("Scene boundaries created");
    }
}
