// 1. ExcaliburJS core
import {
    Actor,
    Canvas,
    Color,
    Engine,
    ImageFiltering,
    ImageSource,
    Keys,
    Scene,
    vec,
} from "excalibur";

// 4. Scene modules
import {
    duckSapMusic,
    getSapBeatPulse,
    playSapSfx,
    preloadSapAudio,
    startSapMusic,
    stopSapMusic,
    unlockSapAudio,
} from "./audio";
import { renderSapWorld, type UiButtonRect } from "./draw";
import { FOREST_ZONES, SAP_WORLD_LEVEL, VIEW_H, VIEW_W } from "./level";
import { SapSolver, type Signpost } from "./solver";

// 5. Assets
import SapWorldBadge from "./SapWorld.png";

export const SAP_WORLD_SCENE = "sapworld";

const Resources = {
    Image: new ImageSource(SapWorldBadge, false, ImageFiltering.Blended),
};

export { Resources };

interface SavedScreen {
    width: number;
    height: number;
    pixelRatio: number | undefined;
    antialiasing: boolean;
    snap: boolean;
    background: Color;
}

const HD_CANVAS_CLASS = "terrene-hd";

function smoothCanvas(canvas: HTMLCanvasElement, smooth: boolean): void {
    if (smooth && !document.getElementById(HD_CANVAS_CLASS)) {
        const style = document.createElement("style");
        style.id = HD_CANVAS_CLASS;
        style.textContent = `canvas.${HD_CANVAS_CLASS} { image-rendering: auto !important; }`;
        document.head.appendChild(style);
    }
    canvas.classList.toggle(HD_CANVAS_CLASS, smooth);
}

function refitScreen(): void {
    window.dispatchEvent(new Event("resize"));
}

/**
 * Forest Last Sap World — a long, 5-zone World-of-Goo-style construction scene
 * set to a 106 BPM Detroit techno / minimal tech house score in the key of C minor.
 */
export default class SapWorld extends Scene {
    readonly solver = new SapSolver(SAP_WORLD_LEVEL);
    camX = 0;
    targetCamX = 0;
    pointerScreenX = VIEW_W * 0.3;
    pointerScreenY = VIEW_H * 0.5;
    activeSignpost: Signpost | null = null;
    bannerText: string | null = "Welcome to Forest Last Sap World · Drag sap globs to weave C-minor strands";
    bannerTime = 5.5;

    private engineRef: Engine | null = null;
    private saved: SavedScreen | null = null;
    private canvasActor: Actor | null = null;
    private screenCanvas: Canvas | null = null;
    private uiButtons: UiButtonRect[] = [];
    private panningSky = false;
    private panStartScreenX = 0;
    private panStartCamX = 0;
    private stepAcc = 0;

    private readonly onPointerDown = (ev: PointerEvent): void => this.handlePointerDown(ev);
    private readonly onPointerMove = (ev: PointerEvent): void => this.handlePointerMove(ev);
    private readonly onPointerUp = (ev: PointerEvent): void => this.handlePointerUp(ev);
    private readonly onContextMenu = (ev: MouseEvent): void => ev.preventDefault();
    private readonly onKeyDown = (ev: KeyboardEvent): void => this.handleKeyDown(ev);
    private readonly onKeyUp = (ev: KeyboardEvent): void => this.handleKeyUp(ev);

    onInitialize(engine: Engine): void {
        this.engineRef = engine;
        console.log("🏰 Forest Last Sap World initialized");
    }

    onActivate(): void {
        const engine = this.engineRef ?? this.engine;
        this.engineRef = engine;
        this.enterHd(engine);
        this.camera.clearAllStrategies();
        this.camera.pos = vec(VIEW_W / 2, VIEW_H / 2);
        this.camera.zoom = 1;

        this.setupCanvasActor();
        this.bindEvents(engine);
        void preloadSapAudio().then(() => {
            if ((this.engine.currentScene as Scene) === this) {
                startSapMusic();
            }
        });
        startSapMusic();

        (window as unknown as { __sap?: SapWorld }).__sap = this;
        console.log("🏰 Forest Last Sap World activated (C minor · 106 BPM)");
    }

    onDeactivate(): void {
        stopSapMusic();
        this.unbindEvents();
        if (this.canvasActor) {
            this.canvasActor.kill();
            this.canvasActor = null;
        }
        if (this.engineRef) {
            this.leaveHd(this.engineRef);
        }
        console.log("🏰 Forest Last Sap World deactivated");
    }

    private pickPixelRatio(): number {
        const dpr = window.devicePixelRatio || 1;
        const fit = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
        const want = Math.ceil(dpr * fit * 2) / 2;
        return Math.max(1, Math.min(2, want));
    }

    private enterHd(engine: Engine): void {
        const screen = engine.screen;
        this.saved = {
            width: screen.resolution.width,
            height: screen.resolution.height,
            pixelRatio: screen.pixelRatioOverride,
            antialiasing: screen.antialiasing,
            snap: engine.snapToPixel,
            background: engine.backgroundColor,
        };
        screen.resolution = { width: VIEW_W, height: VIEW_H };
        screen.pixelRatioOverride = this.pickPixelRatio();
        screen.antialiasing = true;
        engine.snapToPixel = false;
        engine.backgroundColor = Color.fromHex("#071018");
        smoothCanvas(engine.canvas, true);
        refitScreen();
    }

    private leaveHd(engine: Engine): void {
        const s = this.saved;
        if (!s) return;
        const screen = engine.screen;
        screen.resolution = { width: s.width, height: s.height };
        screen.pixelRatioOverride = s.pixelRatio;
        screen.antialiasing = s.antialiasing;
        engine.snapToPixel = s.snap;
        engine.backgroundColor = s.background;
        smoothCanvas(engine.canvas, false);
        refitScreen();
        this.saved = null;
    }

    private setupCanvasActor(): void {
        if (this.canvasActor) {
            this.canvasActor.kill();
        }
        this.screenCanvas = new Canvas({
            width: VIEW_W,
            height: VIEW_H,
            cache: true,
            quality: 1,
            filtering: ImageFiltering.Blended,
            draw: (ctx: CanvasRenderingContext2D): void => {
                this.uiButtons = renderSapWorld(ctx, {
                    solver: this.solver,
                    camX: this.camX,
                    pointerScreenX: this.pointerScreenX,
                    pointerScreenY: this.pointerScreenY,
                    beatPulse: getSapBeatPulse(),
                    activeSignpost: this.activeSignpost,
                    bannerText: this.bannerText,
                    bannerAlpha: Math.min(1, Math.max(0, this.bannerTime)),
                });
            },
        });

        const actor = new Actor({
            pos: vec(0, 0),
            anchor: vec(0, 0),
            width: VIEW_W,
            height: VIEW_H,
            z: 0,
        });
        actor.graphics.use(this.screenCanvas);

        this.add(actor);
        this.canvasActor = actor;
    }

    private bindEvents(engine: Engine): void {
        this.unbindEvents();
        const canvas = engine.canvas;
        canvas.addEventListener("pointerdown", this.onPointerDown);
        window.addEventListener("pointermove", this.onPointerMove);
        window.addEventListener("pointerup", this.onPointerUp);
        canvas.addEventListener("contextmenu", this.onContextMenu);
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
    }

    private unbindEvents(): void {
        const canvas = this.engineRef?.canvas;
        if (canvas) {
            canvas.removeEventListener("pointerdown", this.onPointerDown);
            canvas.removeEventListener("contextmenu", this.onContextMenu);
        }
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
    }

    private clientToScreen(clientX: number, clientY: number): { x: number; y: number } {
        const canvas = this.engineRef?.canvas;
        if (!canvas) return { x: clientX, y: clientY };
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
        return {
            x: ((clientX - rect.left) / rect.width) * VIEW_W,
            y: ((clientY - rect.top) / rect.height) * VIEW_H,
        };
    }

    private handlePointerDown(ev: PointerEvent): void {
        unlockSapAudio();
        const pt = this.clientToScreen(ev.clientX, ev.clientY);
        this.pointerScreenX = pt.x;
        this.pointerScreenY = pt.y;
        const wx = pt.x + this.camX;
        const wy = pt.y;

        // Right-click activates the C-minor Arbiter Whistle
        if (ev.button === 2) {
            this.solver.whistleActive = true;
            this.solver.movePointer(wx, wy);
            playSapSfx("launch", this.panForWorldX(wx), 4);
            return;
        }

        // Check HUD buttons first
        for (const btn of this.uiButtons) {
            if (pt.x >= btn.x && pt.x <= btn.x + btn.w && pt.y >= btn.y && pt.y <= btn.y + btn.h) {
                this.triggerUiButton(btn.id);
                return;
            }
        }

        // Close open signpost if clicking outside
        if (this.activeSignpost) {
            this.activeSignpost = null;
            return;
        }

        // Check if clicking a Watcher Signpost in the world
        for (const sp of this.solver.level.signposts) {
            if (Math.hypot(wx - sp.x, wy - (sp.y - 36)) <= 34) {
                this.activeSignpost = sp;
                sp.read = true;
                playSapSfx("signpost", this.panForWorldX(sp.x));
                return;
            }
        }

        // Try grabbing a sap blob
        const grabbed = this.solver.grabAt(wx, wy);
        if (grabbed) {
            this.flushSolverAudioEvents();
            return;
        }

        // Clicking empty sky/ground pans the camera across the 3600-unit forest
        this.panningSky = true;
        this.panStartScreenX = pt.x;
        this.panStartCamX = this.targetCamX;
    }

    private handlePointerMove(ev: PointerEvent): void {
        const pt = this.clientToScreen(ev.clientX, ev.clientY);
        this.pointerScreenX = pt.x;
        this.pointerScreenY = pt.y;

        if (this.panningSky && this.solver.draggedId === null) {
            const dx = pt.x - this.panStartScreenX;
            this.setTargetCamX(this.panStartCamX - dx * 1.6);
        }

        this.solver.movePointer(pt.x + this.camX, pt.y);
    }

    private handlePointerUp(ev: PointerEvent): void {
        if (ev.button === 2) {
            this.solver.whistleActive = false;
            return;
        }
        this.panningSky = false;
        if (this.solver.draggedId !== null) {
            this.solver.releasePointer();
            this.flushSolverAudioEvents();
        }
    }

    private handleKeyDown(ev: KeyboardEvent): void {
        unlockSapAudio();
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(ev.code)) {
            ev.preventDefault();
        }
        if (ev.code === "KeyR") {
            this.resetExpedition();
        } else if (ev.code === "KeyZ" || ev.code === "KeyU") {
            if (this.solver.undo()) {
                this.showBanner("Time Moth restored the previous strand state");
                this.flushSolverAudioEvents();
            }
        } else if (ev.code === "KeyW") {
            if (!this.solver.whistleActive) {
                this.solver.whistleActive = true;
                playSapSfx("launch", 0, 4);
            }
        } else if (ev.code === "Escape" && this.activeSignpost) {
            this.activeSignpost = null;
        } else if (ev.code === "Digit1") {
            this.jumpToZone(1);
        } else if (ev.code === "Digit2") {
            this.jumpToZone(2);
        } else if (ev.code === "Digit3") {
            this.jumpToZone(3);
        } else if (ev.code === "Digit4") {
            this.jumpToZone(4);
        } else if (ev.code === "Digit5") {
            this.jumpToZone(5);
        }
    }

    private handleKeyUp(ev: KeyboardEvent): void {
        if (ev.code === "KeyW") {
            this.solver.whistleActive = false;
        }
    }

    private triggerUiButton(id: string): void {
        if (id === "close-signpost") {
            this.activeSignpost = null;
            playSapSfx("grab", 0, 2);
        } else if (id === "undo") {
            if (this.solver.undo()) {
                this.showBanner("Time Moth undid the last placement");
                this.flushSolverAudioEvents();
            }
        } else if (id === "frontier") {
            this.jumpToZone(5);
        } else if (id === "reset") {
            this.resetExpedition();
        } else if (id.startsWith("zone-")) {
            const zIndex = Number(id.replace("zone-", ""));
            this.jumpToZone(zIndex);
        }
    }

    /** Jump camera to one of the 5 forest zones (1..5). */
    jumpToZone(zoneIndex: number): void {
        const z = FOREST_ZONES.find((item) => item.index === zoneIndex);
        if (!z) return;
        this.setTargetCamX(z.cameraX - VIEW_W * 0.5);
        this.camX = this.camX + (this.targetCamX - this.camX) * 0.65;
        this.showBanner(`${z.name} — ${z.subtitle}`);
        playSapSfx("grab", 0, zoneIndex);
    }

    resetExpedition(): void {
        this.solver.reset();
        this.activeSignpost = null;
        this.setTargetCamX(0);
        this.camX = 0;
        this.showBanner("Expedition reset · Key of C minor at 106 BPM");
        playSapSfx("detach", 0, 0);
    }

    private showBanner(text: string, duration = 4.2): void {
        this.bannerText = text;
        this.bannerTime = duration;
    }

    private setTargetCamX(x: number): void {
        const maxCam = Math.max(0, this.solver.level.worldWidth - VIEW_W);
        this.targetCamX = Math.max(0, Math.min(maxCam, x));
    }

    private panForWorldX(wx: number): number {
        const screenX = wx - this.camX;
        return Math.max(-0.9, Math.min(0.9, (screenX / VIEW_W) * 2 - 1));
    }

    private flushSolverAudioEvents(): void {
        while (this.solver.events.length > 0) {
            const ev = this.solver.events.shift()!;
            const pan = this.panForWorldX(ev.x);
            if (ev.kind === "win") {
                duckSapMusic(0.28, 5.5);
                playSapSfx("win", 0);
                this.showBanner("The Heartwood Cistern is full! C-minor harmony restored.", 8.0);
            } else if (ev.kind === "wake") {
                playSapSfx("wake", pan, ev.degree);
                if (this.solver.pipeOpen && Math.hypot(ev.x - this.solver.level.cistern.x, ev.y - this.solver.level.cistern.y) < 30) {
                    this.showBanner("Heartwood Cistern valve opened! Sap crawlers are ascending the strands!");
                } else {
                    const g = this.solver.level.groves.find((gr) => Math.hypot(gr.x - ev.x, gr.y - ev.y) < 25);
                    if (g) {
                        this.showBanner(`${g.name} awakened! Fresh sap globs joined the colony.`);
                    }
                }
            } else {
                playSapSfx(ev.kind, pan, ev.degree);
            }
        }
    }

    onPreUpdate(engine: Engine, deltaMs: number): void {
        const dt = Math.min(0.05, deltaMs / 1000);
        if (this.bannerTime > 0) {
            this.bannerTime = Math.max(0, this.bannerTime - dt);
        }

        // Camera keyboard pan (A/D or Left/Right)
        const kb = engine.input.keyboard;
        const panSpeed = 620;
        if (kb.isHeld(Keys.Left) || kb.isHeld(Keys.A)) {
            this.setTargetCamX(this.targetCamX - panSpeed * dt);
        }
        if (kb.isHeld(Keys.Right) || kb.isHeld(Keys.D)) {
            this.setTargetCamX(this.targetCamX + panSpeed * dt);
        }

        // Edge-scroll while dragging a sap blob near the left or right edge of the viewport
        if (this.solver.draggedId !== null) {
            if (this.pointerScreenX > VIEW_W - 76) {
                this.setTargetCamX(this.targetCamX + 480 * dt);
            } else if (this.pointerScreenX < 76) {
                this.setTargetCamX(this.targetCamX - 480 * dt);
            }
            this.solver.movePointer(this.pointerScreenX + this.camX, this.pointerScreenY);
        }

        // Smooth camera interpolation
        this.camX += (this.targetCamX - this.camX) * Math.min(1, dt * 18);
        if (Math.abs(this.targetCamX - this.camX) < 1) {
            this.camX = this.targetCamX;
        }

        // Fixed 60 Hz physics step
        this.stepAcc += dt;
        const fixedDt = 1 / 60;
        let steps = 0;
        while (this.stepAcc >= fixedDt && steps < 3) {
            this.solver.step(fixedDt);
            this.stepAcc -= fixedDt;
            steps++;
        }

        this.flushSolverAudioEvents();
        this.screenCanvas?.flagDirty();
    }
}
