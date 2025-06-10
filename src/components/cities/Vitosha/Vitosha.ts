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

export default class Vitosha extends Scene {
    private player!: You;

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

    onDeactivate(_context: SceneActivationContext<undefined>): void {
        // Cleanup when leaving the scene
        console.log("Leaving Vitosha scene");
    }
}
