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
    Vector,
} from "excalibur";
import You from "../../characters/player/You/You";
import Sally from "../../characters/npc/Sally/Sally";

export default class Baston extends Scene {
    private player!: You;
    private sally!: Sally;
    private lastValidPositions = new Map<Actor, Vector>();

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

        // Add collision boundaries to restrict movement to road only
        this.createRoadCollisionBoundaries();

        // Create and add player
        this.player = new You();
        this.player.pos = vec(768, 512); // Center of the road
        this.add(this.player);

        // Setup Sally in the center of the road
        this.setupSally();

        // Setup universal movement validation for all actors
        this.setupUniversalMovementValidation();

        // Focus camera on player
        this.camera.strategy.lockToActor(this.player);

        console.log("Baston scene initialization complete");
    }

    private createUrbanBackground(): void {
        // Create urban gray background
        const background = new Rectangle({
            width: 1536,
            height: 1024,
            color: Color.fromHex("#404040"), // Urban gray
        });

        const backgroundActor = new Actor({
            pos: vec(768, 512),
            anchor: vec(0.5, 0.5),
            z: -100,
        });
        backgroundActor.graphics.use(background);
        this.add(backgroundActor);

        // Create dark road (horizontal strip)
        const road = new Rectangle({
            width: 1536,
            height: 80,
            color: Color.fromHex("#2a2a2a"), // Dark asphalt
        });

        const roadActor = new Actor({
            pos: vec(768, 512), // Center of screen
            anchor: vec(0.5, 0.5),
            z: -90,
        });
        roadActor.graphics.use(road);
        this.add(roadActor);

        // Create buildings
        this.createBuildings();
    }

    private createBuildings(): void {
        const buildingColor = Color.fromHex("#606060");
        const buildingBorderColor = Color.fromHex("#808080");

        // Create 8 buildings arranged around the scene
        const buildings = [
            { x: 150, y: 200, width: 120, height: 180 },
            { x: 400, y: 150, width: 100, height: 200 },
            { x: 650, y: 180, width: 140, height: 160 },
            { x: 900, y: 140, width: 110, height: 220 },
            { x: 150, y: 750, width: 130, height: 170 },
            { x: 400, y: 800, width: 120, height: 150 },
            { x: 650, y: 780, width: 100, height: 180 },
            { x: 900, y: 820, width: 140, height: 140 },
        ];

        buildings.forEach((building, index) => {
            const buildingRect = new Rectangle({
                width: building.width,
                height: building.height,
                color: buildingColor,
                strokeColor: buildingBorderColor,
                lineWidth: 2,
            });

            const buildingActor = new Actor({
                pos: vec(building.x, building.y),
                anchor: vec(0.5, 0.5),
                z: -80,
            });
            buildingActor.graphics.use(buildingRect);
            this.add(buildingActor);
        });
    }

    private createRoadCollisionBoundaries(): void {
        // Create collision boundaries to restrict movement to the road area only
        // Road is from y=472 to y=552 (80px high)

        // Top area collision (everything above the road)
        const topCollision = new Actor({
            pos: vec(768, 236), // Center of top area
            width: 1536,
            height: 472, // From top (0) to road start (472)
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(topCollision);

        // Bottom area collision (everything below the road)
        const bottomCollision = new Actor({
            pos: vec(768, 788), // Center of bottom area
            width: 1536,
            height: 472, // From road end (552) to bottom (1024)
            collisionType: CollisionType.Fixed,
            z: 100,
        });
        this.add(bottomCollision);

        // Add individual building collision boxes
        const buildings = [
            { x: 150, y: 200, width: 120, height: 180 },
            { x: 400, y: 150, width: 100, height: 200 },
            { x: 650, y: 180, width: 140, height: 160 },
            { x: 900, y: 140, width: 110, height: 220 },
            { x: 150, y: 750, width: 130, height: 170 },
            { x: 400, y: 800, width: 120, height: 150 },
            { x: 650, y: 780, width: 100, height: 180 },
            { x: 900, y: 820, width: 140, height: 140 },
        ];

        buildings.forEach((building, index) => {
            const collisionActor = new Actor({
                pos: vec(building.x, building.y),
                width: building.width,
                height: building.height,
                collisionType: CollisionType.Fixed,
                z: 100,
                name: `building-collision-${index}`,
            });
            this.add(collisionActor);
        });

        // Scene boundary walls
        const wallThickness = 32;

        // Left wall
        const leftWall = new Actor({
            pos: vec(-wallThickness / 2, 512),
            width: wallThickness,
            height: 1024,
            collisionType: CollisionType.Fixed,
            z: 100,
            name: "left-wall",
        });
        this.add(leftWall);

        // Right wall
        const rightWall = new Actor({
            pos: vec(1536 + wallThickness / 2, 512),
            width: wallThickness,
            height: 1024,
            collisionType: CollisionType.Fixed,
            z: 100,
            name: "right-wall",
        });
        this.add(rightWall);

        console.log(
            "Road collision boundaries created - only road area is walkable"
        );
    }

    private setupSally(): void {
        this.sally = new Sally({
            minX: 0, // Can move across the full road width
            maxX: 1536, // Full scene width
            minY: 472, // Top of road
            maxY: 552, // Bottom of road
        });

        // Position Sally in center of road
        this.sally.pos = vec(768, 512);
        this.add(this.sally);

        console.log(
            "Sally positioned in center of largest walkable area (the road) at (768, 512)"
        );
    }

    private setupUniversalMovementValidation(): void {
        console.log(
            "*** SETTING UP UNIVERSAL MOVEMENT VALIDATION FOR BASTON ***"
        );

        // Set up universal movement validation for all actors
        this.on("postupdate", () => {
            this.validateAllActorPositions();
        });

        console.log(
            "Universal movement validation active - all actors respect road boundaries"
        );
    }

    private validateAllActorPositions(): void {
        // Get all actors that should be validated
        const actors = this.actors.filter((actor) =>
            this.shouldValidateActor(actor)
        );

        for (const actor of actors) {
            const currentPos = actor.pos;

            // Initialize last valid position if not exists
            if (!this.lastValidPositions.has(actor)) {
                // For road-only movement, ensure initial position is on the road
                if (this.isOnRoad(currentPos)) {
                    this.lastValidPositions.set(actor, currentPos.clone());
                } else {
                    // Move actor to center of road if not already there
                    const roadCenterPos = vec(currentPos.x, 512);
                    actor.pos = roadCenterPos;
                    this.lastValidPositions.set(actor, roadCenterPos.clone());
                }
                continue;
            }

            const lastValidPos = this.lastValidPositions.get(actor)!;

            // Check if current position is on the road
            if (this.isOnRoad(currentPos)) {
                // Position is valid, update our reference
                this.lastValidPositions.set(actor, currentPos.clone());
            } else {
                // Position is invalid - immediately revert and stop movement
                actor.pos = lastValidPos.clone();
                actor.vel = vec(0, 0); // Stop all velocity/momentum

                // Handle special actor-specific movement stopping
                this.stopActorSpecificMovement(actor);
            }
        }
    }

    private shouldValidateActor(actor: Actor): boolean {
        // Only validate moveable actors, not static collision objects
        return (
            (!actor.body || actor.body.collisionType !== CollisionType.Fixed) &&
            !actor.name?.includes("collision") && // Skip collision boundary actors
            !actor.name?.includes("wall") && // Skip wall actors
            !actor.name?.includes("building") && // Skip building collision actors
            actor.width > 0 &&
            actor.height > 0 // Skip zero-size actors
        );
    }

    private isOnRoad(pos: Vector): boolean {
        // Road area is from y=472 to y=552 and spans full width
        return pos.x >= 0 && pos.x <= 1536 && pos.y >= 472 && pos.y <= 552;
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
}
