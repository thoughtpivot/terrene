import { Color, Engine, Scene } from "excalibur";
import { startApp } from "./app.js";
import "./heavenOrHell.css";

export const HEAVEN_OR_HELL_SCENE = "heavenorhell";

const TITLE = "Heaven Or Hell";
const ROOT_ID = "heaven-or-hell";

interface CssHost {
    __HOH_CSS__?: string[];
}

/**
 * Heaven Or Hell. Terrene constructs this scene and opens it at #heavenorhell.
 * onActivate mounts the DOM game; onDeactivate removes it so other scenes keep the canvas.
 */
export default class HeavenOrHell extends Scene {
    private root: HTMLElement | null = null;
    private styleEl: HTMLStyleElement | null = null;
    private hostTitle: string | null = null;

    constructor() {
        super();
    }

    onInitialize(engine: Engine): void {
        this.backgroundColor = Color.fromHex("#1a1410");
        void engine;
        console.log("🏰 Heaven Or Hell scene ready to boot");
    }

    onActivate(context: { engine: Engine }): void {
        void context;
        // Drop the page loader as soon as this scene is current. Terrene only
        // removes it after initialize() fulfills, which never happens if boot throws.
        document.getElementById("loading")?.remove();
        if (this.hostTitle === null) {
            this.hostTitle = document.title;
        }
        document.title = TITLE;
        try {
            this.mountRoot();
        } catch (error) {
            console.error(error);
        }
    }

    onDeactivate(context: { engine: Engine }): void {
        void context;
        this.unmountRoot();
        if (this.hostTitle !== null) {
            document.title = this.hostTitle;
            this.hostTitle = null;
        }
        console.log("🏰 Heaven Or Hell scene deactivated");
    }

    private mountRoot(): void {
        this.unmountRoot();
        const collected = (window as CssHost).__HOH_CSS__ ?? [];
        const style = document.createElement("style");
        style.dataset.heavenOrHell = "scene";
        style.textContent = collected.join("\n");
        document.head.append(style);
        this.styleEl = style;

        const root = document.createElement("div");
        root.id = ROOT_ID;
        root.className = "hoh-root";
        document.body.append(root);
        this.root = root;
        startApp(root);
    }

    private unmountRoot(): void {
        this.root?.remove();
        this.root = null;
        document.getElementById(ROOT_ID)?.remove();
        this.styleEl?.remove();
        this.styleEl = null;
    }
}
