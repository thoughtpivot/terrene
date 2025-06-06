import {
    Engine,
    Scene,
    Actor,
    Vector,
    Color,
    Font,
    FontUnit,
    Label,
    Rectangle,
    vec,
} from "excalibur";

export default class CitySelectionMenu extends Scene {
    onInitialize(engine: Engine): void {
        // Set camera zoom for optimal viewing of all menu options
        this.camera.zoom = 1.0;

        // Get screen center for proper centering
        const centerX = engine.screen.resolution.width / 2;
        const centerY = engine.screen.resolution.height / 2;

        // Create background
        const background = new Actor({
            pos: new Vector(centerX, centerY),
            width: engine.screen.resolution.width,
            height: engine.screen.resolution.height,
        });
        background.graphics.use(
            new Rectangle({
                width: engine.screen.resolution.width,
                height: engine.screen.resolution.height,
                color: Color.fromHex("#1a1a2e"),
            })
        );
        background.z = -1;
        this.add(background);

        // Game title - centered vertically in upper portion
        const title = new Label({
            text: "TERRENE",
            pos: new Vector(centerX, centerY - 120),
            font: new Font({
                family: "Arial",
                size: 48,
                unit: FontUnit.Px,
                color: Color.White,
            }),
        });
        title.anchor = vec(0.5, 0.5);
        this.add(title);

        // Subtitle
        const subtitle = new Label({
            text: "Choose your destination",
            pos: new Vector(centerX, centerY - 70),
            font: new Font({
                family: "Arial",
                size: 20,
                unit: FontUnit.Px,
                color: Color.LightGray,
            }),
        });
        subtitle.anchor = vec(0.5, 0.5);
        this.add(subtitle);

        // Craydon Button - centered above center
        this.createCityButton(
            engine,
            "Enter the city of Craydon",
            new Vector(centerX, centerY - 20),
            "craydon"
        );

        // Solic Button - centered below center
        this.createCityButton(
            engine,
            "Enter the city of Solic",
            new Vector(centerX, centerY + 30),
            "solic"
        );
    }

    private createCityButton(
        engine: Engine,
        text: string,
        position: Vector,
        sceneName: string
    ): void {
        const button = new Actor({
            pos: position,
            width: 200,
            height: 35,
        });
        button.anchor = vec(0.5, 0.5); // Center the button

        button.graphics.use(
            new Rectangle({
                width: 200,
                height: 35,
                color: Color.fromHex("#4a4a6a"),
                strokeColor: Color.White,
                lineWidth: 2,
            })
        );

        const buttonText = new Label({
            text: text,
            pos: new Vector(0, 0),
            font: new Font({
                family: "Arial",
                size: 16,
                unit: FontUnit.Px,
                color: Color.White,
            }),
        });
        buttonText.anchor = vec(0.5, 0.5);
        button.addChild(buttonText);

        // Add hover effect
        button.on("pointerenter", () => {
            button.graphics.use(
                new Rectangle({
                    width: 200,
                    height: 35,
                    color: Color.fromHex("#5a5a7a"),
                    strokeColor: Color.Cyan,
                    lineWidth: 2,
                })
            );
        });

        button.on("pointerleave", () => {
            button.graphics.use(
                new Rectangle({
                    width: 200,
                    height: 35,
                    color: Color.fromHex("#4a4a6a"),
                    strokeColor: Color.White,
                    lineWidth: 2,
                })
            );
        });

        button.on("pointerup", () => {
            engine.goToScene(sceneName);
        });

        this.add(button);
    }
}
