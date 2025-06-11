import {
    DisplayMode,
    Engine,
    Loader,
    Color,
    Scene,
    PointerScope,
    Label,
    Actor,
    Font,
    vec,
    Rectangle,
} from "excalibur";

import { TiledMapResource } from "@excaliburjs/plugin-tiled";

// const tiledMapResource = new TiledMapResource("./cities/Craydon/Craydon.json");

import Navosah, {
    Resources as NovosahResources,
} from "./characters/npc/WanderingMerchant/Navosah/Navosah";
// import MainMenu from "./scenes/MainMenu";
import Craydon from "./cities/Craydon/Craydon";
import Solic from "./cities/Solic/Solic";
import Vitosha from "./cities/Vitosha/Vitosha";
import Breaze from "./cities/Breeze/Breaze";
import { BreazeResources } from "./cities/Breeze/Breaze";
import Sally, {
    Resources as SallyResources,
} from "./characters/npc/Sally/Sally";

import OldManSam, {
    Resources as OldManSamResources,
} from "./characters/npc/OldManSam/OldManSam";

import Horus, {
    Resources as HorusResources,
} from "./characters/npc/Goblin/Horus/Horus";

import You, { Resources as YouResources } from "./characters/player/You/You";
import { Resources as SwordResources } from "./items/weapons/Sword";
import { Resources as DonutResources } from "./items/food/Donut/Donut";
import { Resources as LorcRPGResources } from "./items/LorcRPG/LorcRPG";
import Baston from "./cities/Baston/Baston";

class MainMenu extends Scene {
    onInitialize(_engine: Engine): void {}
}

class Terrene extends Engine {
    constructor() {
        super({
            displayMode: DisplayMode.FitScreen,
            maxFps: 30,
            pointerScope: PointerScope.Canvas,
            antialiasing: false,
            backgroundColor: Color.Black,
            suppressPlayButton: true,
            suppressConsoleBootMessage: true,
            suppressHiDPIScaling: false,
            width: 960,
            height: 480,
        });
    }

    initialize() {
        // Temporarily suppress audio context warnings during initialization
        const originalWarn = console.warn;
        console.warn = (...args: any[]) => {
            const message = args.join(" ");
            if (
                message.includes("AudioContext") ||
                message.includes("audio context") ||
                message.includes("unlock")
            ) {
                return; // Suppress audio context warnings
            }
            originalWarn.apply(console, args);
        };

        const loader = new Loader([
            // tiledMapResource,
            NovosahResources.Image,
            OldManSamResources.Image,
            SallyResources.Image,
            YouResources.Image,
            YouResources.AsepriteResource,
            YouResources.Sound,
            HorusResources.Image,
            SwordResources.Image,
            SwordResources.AsepriteResource,
            SwordResources.Sound,
            DonutResources.Image,
            DonutResources.AsepriteResource,
            LorcRPGResources.Image,
            LorcRPGResources.AsepriteResource,
            BreazeResources.Image,
            BreazeResources.AsepriteResource,
        ]);

        this.start(loader).then(() => {
            console.log("Engine started, creating menu scene");

            // Create menu scene
            const menuScene = new Scene();

            // Get actual canvas dimensions for proper positioning
            const canvasWidth = this.canvasWidth;
            const canvasHeight = this.canvasHeight;
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;

            console.log(
                `Using canvas dimensions: ${canvasWidth}x${canvasHeight}, center: ${centerX},${centerY}`
            );

            // Set background color so we can see elements
            const background = new Actor({
                pos: vec(centerX, centerY),
                width: canvasWidth,
                height: canvasHeight,
            });
            background.graphics.use(
                new Rectangle({
                    width: canvasWidth,
                    height: canvasHeight,
                    color: Color.Black,
                })
            );
            background.z = -100;
            menuScene.add(background);

            // Debug pointer events
            this.input.pointers.primary.on("down", (evt) => {
                console.log("Global pointer down at:", evt.worldPos);
            });

            // Create title text
            const title = new Label({
                text: "Terrene",
                font: new Font({ size: 32, color: Color.White }),
                pos: vec(centerX, canvasHeight * 0.15), // 15% down from top
            });
            menuScene.add(title);

            // Add a visual debug rectangle to show screen bounds
            const debugBounds = new Actor({
                pos: vec(centerX, centerY),
                width: canvasWidth - 10,
                height: canvasHeight - 10,
            });
            debugBounds.graphics.use(
                new Rectangle({
                    width: canvasWidth - 10,
                    height: canvasHeight - 10,
                    color: Color.Transparent,
                    strokeColor: Color.Red,
                    lineWidth: 2,
                })
            );
            menuScene.add(debugBounds);
            console.log("Added debug bounds rectangle");

            // Create city buttons
            const cities = [
                { name: "Vitosha", scene: new Vitosha() },
                { name: "Solic", scene: new Solic() },
                { name: "Breaze", scene: new Breaze() },
                { name: "Baston", scene: new Baston() },
            ];

            cities.forEach((city, index) => {
                // Center the button group vertically, then space them out
                const buttonSpacing = 80;
                const totalButtonHeight = cities.length * buttonSpacing;
                const startY =
                    centerY - totalButtonHeight / 2 + buttonSpacing / 2;
                const buttonY = startY + index * buttonSpacing;
                const button = new Actor({
                    pos: vec(centerX, buttonY),
                    width: 200,
                    height: 40,
                });

                // Create explicit graphics for the button
                const buttonGraphic = new Rectangle({
                    width: 200,
                    height: 40,
                    color: Color.Gray,
                });

                button.graphics.use(buttonGraphic);

                // Make the button interactive for pointer events
                button.pointer.useGraphicsBounds = true;

                const buttonText = new Label({
                    text: city.name,
                    font: new Font({ size: 20, color: Color.White }),
                    pos: vec(0, 0),
                });
                button.addChild(buttonText);

                // Add hover effects for better UX
                button.on("pointerenter", () => {
                    console.log(`Hovering over ${city.name} button`);
                    button.graphics.use(
                        new Rectangle({
                            width: 200,
                            height: 40,
                            color: Color.LightGray,
                        })
                    );
                });

                button.on("pointerleave", () => {
                    console.log(`Leaving ${city.name} button`);
                    button.graphics.use(
                        new Rectangle({
                            width: 200,
                            height: 40,
                            color: Color.Gray,
                        })
                    );
                });

                // Add click handler
                button.on("pointerdown", (evt) => {
                    console.log(
                        `Clicking ${city.name} button at:`,
                        evt.worldPos
                    );
                    this.addScene(city.name.toLowerCase(), city.scene);
                    this.goToScene(city.name.toLowerCase());
                });

                // Debug: Add a more obvious border to buttons
                const borderButton = new Actor({
                    pos: vec(centerX, buttonY),
                    width: 210,
                    height: 50,
                });
                borderButton.graphics.use(
                    new Rectangle({
                        width: 210,
                        height: 50,
                        color: Color.Transparent,
                        strokeColor: Color.Yellow,
                        lineWidth: 3,
                    })
                );
                menuScene.add(borderButton);

                console.log(
                    `Created button for ${city.name} at position: (${centerX}, ${buttonY})`
                );
                menuScene.add(button);
            });

            this.addScene("menu", menuScene);
            this.goToScene("menu");

            console.log("Menu scene added and activated");
            console.log(
                "Canvas size:",
                this.canvasWidth,
                "x",
                this.canvasHeight
            );
            console.log(
                "Screen resolution:",
                this.screen.resolution.width,
                "x",
                this.screen.resolution.height
            );

            // Restore original console.warn after initialization
            setTimeout(() => {
                console.warn = originalWarn;
            }, 1000);
        });
    }
}

export default Terrene;
