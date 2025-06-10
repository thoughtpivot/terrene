import {
    Engine,
    Scene,
    SceneActivationContext,
    Color,
    Actor,
    Rectangle,
    Vector,
    CollisionType,
} from "excalibur";
import You from "../../characters/player/You/You";
import Donut, {
    Resources as DonutResources,
} from "../../items/food/Donut/Donut";
import LorcRPG from "../../items/LorcRPG/LorcRPG";

export default class Vitosha extends Scene {
    private player!: You;
    private donut!: Donut;
    private lorcItems: LorcRPG[] = [];

    onInitialize(engine: Engine): void {
        console.log("Vitosha scene initializing...");

        // Set camera zoom for the scene
        this.camera.zoom = 2.5;

        // Create simple background - blank canvas with NES NTSC color
        const background = new Actor({
            pos: new Vector(
                engine.screen.resolution.width / 2,
                engine.screen.resolution.height / 2
            ),
            width: engine.screen.resolution.width,
            height: engine.screen.resolution.height,
        });

        background.graphics.use(
            new Rectangle({
                width: engine.screen.resolution.width,
                height: engine.screen.resolution.height,
                color: Color.fromHex("#F8F8F8"), // NES NTSC white/light gray
            })
        );

        background.z = -10; // Bottom layer
        this.add(background);

        // Create walkable area bounds (invisible)
        const walkableBounds = new Actor({
            pos: new Vector(480, 240), // Center of screen
            width: 960, // Full screen width
            height: 480, // Full screen height
            collisionType: CollisionType.Passive, // Walkable area
        });
        walkableBounds.graphics.use(
            new Rectangle({
                width: 960,
                height: 480,
                color: Color.Transparent, // Invisible walkable zone
            })
        );
        this.add(walkableBounds);

        // Setup player character
        this.setupPlayer(engine);

        // Add donut item to the scene
        this.setupDonut(engine);

        // Add random LorcRPG items to the scene
        this.setupRandomLorcItems(engine);

        console.log("Vitosha scene initialized successfully");
    }

    private setupPlayer(engine: Engine): void {
        // Create and add player character
        console.log("*** CREATING PLAYER CHARACTER IN VITOSHA ***");
        this.player = new You();
        this.player.pos = new Vector(480, 240); // Start player in center of screen
        this.add(this.player);
        console.log(
            "*** PLAYER CHARACTER ADDED TO VITOSHA SCENE ***",
            this.player
        );

        // Setup camera to follow player
        this.camera.strategy.elasticToActor(this.player, 0.8, 0.9);
    }

    private setupDonut(engine: Engine): void {
        // Create and add donut item
        console.log("*** CREATING DONUT ITEM IN VITOSHA ***");
        this.donut = new Donut();
        this.donut.pos = new Vector(600, 200); // Position donut to the right of player
        this.add(this.donut);
        console.log("*** DONUT ITEM ADDED TO VITOSHA SCENE ***", this.donut);
    }

    private setupRandomLorcItems(engine: Engine): void {
        console.log("*** CREATING RANDOM LORC RPG ITEMS IN VITOSHA ***");

        // Get available icons and select 3 random ones
        const availableIcons = LorcRPG.getAvailableIcons();
        const iconNames = Object.keys(availableIcons);

        console.log(`Available icons: ${iconNames.length} total`);

        // Create 3 random items
        for (let i = 0; i < 3; i++) {
            // Get random icon name
            const randomIconName =
                iconNames[Math.floor(Math.random() * iconNames.length)];

            // Generate random position around the central area
            // Central area is around (480, 240), spread items in a 300px radius
            const angle = Math.random() * Math.PI * 2; // Random angle
            const distance = 100 + Math.random() * 200; // Distance between 100-300px from center
            const centerX = 480;
            const centerY = 240;

            const randomX = centerX + Math.cos(angle) * distance;
            const randomY = centerY + Math.sin(angle) * distance;

            // Create the LorcRPG item
            const lorcItem = new LorcRPG({
                itemName: randomIconName,
                pos: new Vector(randomX, randomY),
                scale: 1.5,
            });

            // Set standard collision
            lorcItem.body.collisionType = CollisionType.Active;

            // Ensure items appear above background
            lorcItem.z = 10;

            // Add to scene and track
            this.add(lorcItem);
            this.lorcItems.push(lorcItem);

            console.log(
                `*** ADDED LORC ITEM #${
                    i + 1
                }: ${randomIconName} at (${randomX.toFixed(
                    0
                )}, ${randomY.toFixed(0)}) with z-index: ${lorcItem.z} ***`
            );
        }

        console.log(
            `*** ALL ${this.lorcItems.length} RANDOM LORC RPG ITEMS ADDED TO VITOSHA SCENE ***`
        );

        // Log scene info for debugging
        console.log(`Scene camera zoom: ${this.camera.zoom}`);
        console.log(
            `Scene camera position: (${this.camera.pos.x}, ${this.camera.pos.y})`
        );
    }

    onDeactivate(_context: SceneActivationContext<undefined>): void {
        // Cleanup when leaving the scene
        console.log("Leaving Vitosha scene");
    }
}
