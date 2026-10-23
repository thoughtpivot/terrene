import { Scene } from "excalibur";
import { ToastKind, hudLayout, ratio } from "./hudState";
import { UiTheme, themeFor } from "./theme";
import {
    DialogueLine,
    DialogueWidget,
    EmberLayer,
    HotbarSlotData,
    HotbarWidget,
    HudValues,
    PromptWidget,
    SanctityVignette,
    TierWidget,
    ToastWidget,
    UiWidget,
    VitalsWidget,
} from "./widgets";

export interface HohHudOptions {
    /** keep the interaction prompt up while dialogue is open (the preview shows both) */
    promptDuringDialogue?: boolean;
    /** push the toasts down, in reference px, to clear something at the top */
    toastOffset?: number;
}

/**
 * The Heaven Or Hell HUD. A scene owns one, calls `layout()` when the screen
 * changes, `setCorruption()` with World Corruption and Stain, `setValues()`
 * and `setHotbar()` with the player's state, and `update(dt)` every frame.
 */
export class HohHud {
    readonly vitals = new VitalsWidget({ seed: 101 });
    readonly hotbar = new HotbarWidget({ seed: 202 });
    readonly tier = new TierWidget({ seed: 303 });
    readonly prompt = new PromptWidget({ seed: 404 });
    readonly dialogue = new DialogueWidget({ seed: 505, z: 104 });
    readonly toasts = new ToastWidget({ seed: 606, z: 106 });
    readonly embers: EmberLayer;
    readonly vignette: SanctityVignette;
    private widgets: UiWidget[];
    private _theme: UiTheme = themeFor(0, 0);
    private promptKey = "";
    private promptLabel = "";

    constructor(private scene: Scene, width: number, height: number, private options: HohHudOptions = {}) {
        this.widgets = [this.vitals, this.hotbar, this.tier, this.prompt, this.dialogue, this.toasts];
        this.vignette = new SanctityVignette(width, height);
        scene.add(this.vignette.element);
        this.embers = new EmberLayer(scene);
        for (const w of this.widgets) w.addTo(scene);
        this.prompt.visible = false;
        this.layout(width, height, 1);
        this.setCorruption(0, 0);
    }

    get theme(): UiTheme {
        return this._theme;
    }

    layout(width: number, height: number, pixelRatio: number): void {
        const l = hudLayout(width, height);
        const s = l.scale;
        this.vitals.place(l.vitals.x, l.vitals.y, s, pixelRatio);
        this.hotbar.place(l.hotbar.x, l.hotbar.y, s, pixelRatio);
        this.tier.place(l.tier.x, l.tier.y, s, pixelRatio);
        this.prompt.place(l.prompt.x, l.prompt.y, s, pixelRatio);
        this.dialogue.place(l.dialogue.x, l.dialogue.y, s, pixelRatio);
        this.toasts.place(l.toasts.x - l.toasts.w / 2, l.toasts.y + (this.options.toastOffset ?? 0) * s, s, pixelRatio);
        this.vignette.resize(width, height);
        this.embers.setSources(
            [
                { x: l.vitals.x + 44 * s, y: l.vitals.y + 38 * s, w: l.vitals.w - 44 * s },
                { x: l.hotbar.x, y: l.hotbar.y, w: l.hotbar.w },
            ],
            s,
        );
    }

    /** World Corruption as a continuous tier, 0..5, and the player's Stain, 0..100. */
    setCorruption(corruption: number, stain: number): void {
        const t = themeFor(corruption, stain);
        if (t.corruption === this._theme.corruption && t.stain === this._theme.stain) return;
        this._theme = t;
        for (const w of this.widgets) w.setTheme(t);
        this.embers.setTheme(t);
    }

    setValues(values: HudValues): void {
        this.vitals.set(values);
        this.hotbar.grace = values.grace;
        this.vignette.set(ratio(values.sanctity, values.sanctityMax));
    }

    setHotbar(weapon: HotbarSlotData, hymns: HotbarSlotData[]): void {
        this.hotbar.weapon = weapon;
        this.hotbar.hymns = hymns;
    }

    toast(title: string, detail = "", kind: ToastKind = "info", seconds = 4.5): void {
        this.toasts.queue.push(title, detail, kind, seconds);
        this.toasts.invalidate();
    }

    /** Open the dialogue box with ChatSystem-style `{ speaker, text }` lines. */
    say(lines: DialogueLine[], onComplete?: () => void): void {
        this.dialogue.start(lines, onComplete);
    }

    advanceDialogue(): void {
        this.dialogue.advance();
    }

    showPrompt(key: string, label: string): void {
        this.promptKey = key;
        this.promptLabel = label;
        this.prompt.show(key, label);
    }

    hidePrompt(): void {
        this.promptLabel = "";
        this.prompt.show(this.promptKey, "");
    }

    setVisible(on: boolean): void {
        for (const w of this.widgets) w.visible = on;
        this.vignette.element.graphics.isVisible = on;
        if (on) this.prompt.visible = !!this.promptLabel;
    }

    update(dt: number): void {
        this.dialogue.visible = this.dialogue.open && this.vitals.visible;
        this.prompt.visible = !!this.promptLabel && this.vitals.visible && (this.options.promptDuringDialogue || !this.dialogue.open);
        for (const w of this.widgets) w.update(dt);
        this.embers.update(dt, this.vitals.visible);
    }

    destroy(): void {
        for (const w of this.widgets) w.destroy();
        this.embers.destroy();
        this.vignette.element.kill();
    }
}
