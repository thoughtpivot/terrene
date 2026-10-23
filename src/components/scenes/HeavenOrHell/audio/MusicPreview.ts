import { Color, Engine, Keys, Scene } from "excalibur";
import { HeavenOrHellMusic } from "./MusicPlayer";
import { BeatPulse, beatPulse, glowLevel, vibrationOffset } from "./beatPulse";
import { Beat808Hit } from "./beatScheduler";
import { HYSTERESIS } from "./mixer";
import { BPM, MAX_CORRUPTION, STEMS, StemSet } from "./musicSpec";

export const HEAVEN_OR_HELL_MUSIC_SCENE = "heavenorhellmusic";

const TITLE = "Heaven Or Hell: Music Preview";
const ROOT_ID = "hoh-music-preview";
const TAP_STEP = 0.1;
const SHIFT_STEP = 0.5;
/** Holding an arrow key scrubs continuously after this delay. */
const HOLD_DELAY_MS = 300;
const HOLD_RATE = 0.8;
/** Auto-drift speed in corruption per second: the 10-hour arc squeezed into about 50 seconds per direction. */
const DRIFT_RATE = 0.1;
const UI_INTERVAL_MS = 66;

const DIGIT_KEYS: Array<[Keys, number]> = [
    [Keys.Digit0, 0],
    [Keys.Digit1, 1],
    [Keys.Digit2, 2],
    [Keys.Digit3, 3],
    [Keys.Digit4, 4],
    [Keys.Digit5, 5],
];

const CSS = `
#${ROOT_ID} { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center;
  font: 14px/1.4 ui-monospace, Menlo, Consolas, monospace; color: #f4ecd8; background: radial-gradient(circle at 50% 30%, #2a2418, #0b0906 70%);
  transition: background 1.2s; }
#${ROOT_ID}.hell { color: #ffd9c2; background: radial-gradient(circle at 50% 70%, #3a0d06, #070202 70%); }
#${ROOT_ID} .panel { width: min(760px, 94vw); max-height: 94vh; overflow: auto; box-sizing: border-box; padding: 18px 24px; border: 1px solid currentColor; border-radius: 10px; background: rgba(0,0,0,.35); }
#${ROOT_ID} h1 { margin: 0 0 4px; font-size: 20px; letter-spacing: .08em; text-transform: uppercase; color: #e8c66a; }
#${ROOT_ID}.hell h1 { color: #ff6a2a; }
#${ROOT_ID} .sub { opacity: .7; margin-bottom: 14px; }
#${ROOT_ID} .row { display: flex; gap: 18px; flex-wrap: wrap; margin: 6px 0; }
#${ROOT_ID} .big { font-size: 28px; font-weight: 700; }
#${ROOT_ID} .meter { position: relative; height: 12px; background: rgba(255,255,255,.08); border-radius: 6px; overflow: hidden; }
#${ROOT_ID} .meter > i { position: absolute; inset: 0 auto 0 0; background: #e8c66a; transition: width 60ms linear; }
#${ROOT_ID} .meter.neutral > i { background: #c9c3b4; }
#${ROOT_ID} .meter.hell > i { background: #ff5a1f; }
#${ROOT_ID} .corruption { height: 18px; margin: 10px 0 16px; }
#${ROOT_ID} .corruption > i { background: linear-gradient(90deg, #fff6d8, #e8c66a 55%, #ff5a1f 80%, #a80f00); }
#${ROOT_ID} .ticks { display: flex; justify-content: space-between; opacity: .6; font-size: 11px; margin-top: -12px; margin-bottom: 12px; }
#${ROOT_ID} .stems { display: grid; grid-template-columns: 190px 1fr 46px; gap: 5px 12px; align-items: center; }
#${ROOT_ID} .stems .set { grid-column: 1 / -1; margin-top: 8px; opacity: .6; text-transform: uppercase; font-size: 11px; letter-spacing: .12em; }
#${ROOT_ID} .stems .on { opacity: 1; } #${ROOT_ID} .stems .off { opacity: .45; }
#${ROOT_ID} button { font: inherit; font-size: 18px; padding: 14px 26px; border-radius: 8px; border: 1px solid #e8c66a; background: #e8c66a; color: #1a1410; cursor: pointer; }
#${ROOT_ID} .panel { will-change: transform, box-shadow; }
#${ROOT_ID} .b808 { display: inline-block; min-width: 46px; text-align: center; padding: 1px 6px; border-radius: 4px; border: 1px solid currentColor; opacity: .35; }
#${ROOT_ID} .b808.lit { opacity: 1; background: #e8c66a; color: #1a1410; }
#${ROOT_ID}.hell .b808.lit { background: #ff5a1f; color: #160302; }
#${ROOT_ID} .help { margin-top: 14px; opacity: .7; font-size: 12px; }
#${ROOT_ID} kbd { border: 1px solid currentColor; border-radius: 3px; padding: 0 4px; }
#${ROOT_ID} .event { min-height: 1.4em; color: #e8c66a; } #${ROOT_ID}.hell .event { color: #ff8a4a; }
#${ROOT_ID} .beat { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: currentColor; opacity: .15; margin-right: 4px; }
#${ROOT_ID} .beat.lit { opacity: 1; }
`;

/**
 * Preview scene for the adaptive score at /#heavenorhellmusic. Scrub corruption
 * with the keyboard and watch the director cross-fade stems, fire stingers and
 * perform the heaven-to-hell switch-up.
 */
export default class HeavenOrHellMusicPreview extends Scene {
    private music: HeavenOrHellMusic | null = null;
    private root: HTMLElement | null = null;
    private styleEl: HTMLStyleElement | null = null;
    private hostTitle: string | null = null;
    private corruption = 0;
    private drift = 0;
    private holdMs = 0;
    private uiMs = 0;
    private eventText = "";
    private eventUntil = 0;
    private pulse: BeatPulse | null = null;
    private pulseAtMs = 0;
    private hitCount = 0;
    private lastHit: Beat808Hit | null = null;
    private unsubscribeBeat: (() => void) | null = null;
    private meters = new Map<string, { bar: HTMLElement; value: HTMLElement; row: HTMLElement[] }>();

    onInitialize(engine: Engine): void {
        this.backgroundColor = Color.fromHex("#0b0906");
        void engine;
        console.log("🎵 Heaven Or Hell music preview ready");
    }

    onActivate(): void {
        document.getElementById("loading")?.remove();
        if (this.hostTitle === null) this.hostTitle = document.title;
        document.title = TITLE;
        this.mount();
    }

    onDeactivate(): void {
        this.unsubscribeBeat?.();
        this.unsubscribeBeat = null;
        this.pulse = null;
        this.music?.dispose();
        this.music = null;
        this.unmount();
        this.drift = 0;
        if (this.hostTitle !== null) {
            document.title = this.hostTitle;
            this.hostTitle = null;
        }
        console.log("🎵 Heaven Or Hell music preview deactivated");
    }

    onPreUpdate(engine: Engine, deltaMs: number): void {
        const kb = engine.input.keyboard;
        const shift = kb.isHeld(Keys.ShiftLeft) || kb.isHeld(Keys.ShiftRight);
        const step = shift ? SHIFT_STEP : TAP_STEP;
        let delta = 0;
        if (kb.wasPressed(Keys.ArrowRight)) delta += step;
        if (kb.wasPressed(Keys.ArrowLeft)) delta -= step;
        const held = kb.isHeld(Keys.ArrowRight) ? 1 : kb.isHeld(Keys.ArrowLeft) ? -1 : 0;
        this.holdMs = held ? this.holdMs + deltaMs : 0;
        if (held && this.holdMs > HOLD_DELAY_MS) delta += held * HOLD_RATE * (shift ? 3 : 1) * (deltaMs / 1000);
        for (const [key, tier] of DIGIT_KEYS) {
            if (kb.wasPressed(key)) this.setCorruption(tier + (tier < MAX_CORRUPTION ? 0.5 : 0));
        }
        if (kb.wasPressed(Keys.S)) {
            const tier = this.music?.snapshot().tier ?? Math.floor(this.corruption);
            this.setCorruption(tier >= 4 ? 3 - HYSTERESIS : 4.2);
        }
        if (kb.wasPressed(Keys.A)) this.drift = this.drift === 0 ? 1 : this.drift > 0 ? -1 : 0;
        if (kb.wasPressed(Keys.Space)) this.toggle();

        if (this.drift !== 0) {
            delta += this.drift * DRIFT_RATE * (deltaMs / 1000);
            if (this.corruption + delta >= MAX_CORRUPTION) this.drift = -1;
            if (this.corruption + delta <= 0) this.drift = 1;
        }
        if (delta !== 0) this.setCorruption(this.corruption + delta);

        this.music?.update();
        this.applyPulse();
        this.uiMs += deltaMs;
        if (this.uiMs >= UI_INTERVAL_MS) {
            this.uiMs = 0;
            this.render();
        }
    }

    private setCorruption(value: number): void {
        this.corruption = Math.min(MAX_CORRUPTION, Math.max(0, value));
        this.music?.setCorruption(this.corruption);
    }

    private toggle(): void {
        if (this.music && this.music.state === "playing") {
            this.music.stop();
            return;
        }
        this.start();
    }

    private start(): void {
        if (!this.music) {
            this.music = new HeavenOrHellMusic();
            this.unsubscribeBeat = this.music.onBeat808((hit) => {
                this.pulse = beatPulse(hit, hit.tier);
                this.pulseAtMs = performance.now();
                this.hitCount++;
                this.lastHit = hit;
            });
            this.music.onCommand = (cmd) => {
                const label = cmd.stinger ? cmd.stinger.id : "crossfade";
                this.eventText = `${label} → tier ${cmd.tier} on bar ${cmd.boundaryBar}`;
                this.eventUntil = performance.now() + 6000;
            };
        }
        this.root?.querySelector(".start")?.remove();
        void this.music.start(this.corruption).catch((error) => console.error(error));
    }

    private mount(): void {
        this.unmount();
        this.styleEl = document.createElement("style");
        this.styleEl.textContent = CSS;
        document.head.appendChild(this.styleEl);

        const root = document.createElement("div");
        root.id = ROOT_ID;
        const panel = document.createElement("div");
        panel.className = "panel";
        panel.innerHTML = `
            <h1>Heaven Or Hell · Score</h1>
            <div class="sub">${BPM} BPM half-time · F Lydian → F Phrygian · 13 stems, 4 stingers</div>
            <div class="row"><div><div>Tier</div><div class="big" data-k="tier">0</div></div>
              <div><div>Set</div><div class="big" data-k="set">heaven</div></div>
              <div><div>Corruption</div><div class="big" data-k="corruption">0.00</div></div>
              <div><div>Bar</div><div class="big" data-k="bar">-</div></div>
              <div><div>Beat</div><div class="big" data-k="beats"></div></div></div>
            <div class="meter corruption"><i data-k="cbar"></i></div>
            <div class="ticks"><span>0 heaven</span><span>1</span><span>2</span><span>3</span><span>4 switch-up</span><span>5 hell</span></div>
            <div class="event" data-k="event"></div>
            <div class="row"><span class="b808" data-k="b808">808</span><span data-k="beatinfo">808 pulse: waiting for the music</span></div>
            <div class="row" data-k="status"></div>
            <div class="stems" data-k="stems"></div>
            <div class="help"><kbd>←</kbd>/<kbd>→</kbd> scrub (<kbd>Shift</kbd> = bigger) · <kbd>0</kbd>–<kbd>5</kbd> jump to tier ·
              <kbd>S</kbd> switch-up / redeem · <kbd>A</kbd> auto-drift · <kbd>Space</kbd> start/stop</div>`;
        root.appendChild(panel);

        const start = document.createElement("button");
        start.className = "start";
        start.textContent = "▶ Click to start the music";
        start.addEventListener("click", () => this.start());
        const startRow = document.createElement("div");
        startRow.className = "row start";
        startRow.appendChild(start);
        panel.insertBefore(startRow, panel.querySelector("[data-k=status]"));

        const beats = panel.querySelector("[data-k=beats]")!;
        for (let i = 0; i < 4; i++) {
            const dot = document.createElement("span");
            dot.className = "beat";
            beats.appendChild(dot);
        }

        const stems = panel.querySelector("[data-k=stems]")!;
        this.meters.clear();
        for (const set of ["heaven", "neutral", "hell"] as StemSet[]) {
            const head = document.createElement("div");
            head.className = "set";
            head.textContent = set === "neutral" ? "shared (both worlds)" : `${set} set`;
            stems.appendChild(head);
            for (const stem of STEMS.filter((s) => s.set === set)) {
                const label = document.createElement("div");
                label.textContent = stem.label;
                const meter = document.createElement("div");
                meter.className = `meter ${set}`;
                const bar = document.createElement("i");
                bar.style.width = "0%";
                meter.appendChild(bar);
                const value = document.createElement("div");
                value.textContent = "0.00";
                stems.append(label, meter, value);
                this.meters.set(stem.id, { bar, value, row: [label, meter, value] });
            }
        }
        document.body.appendChild(root);
        this.root = root;
        this.render();
    }

    private unmount(): void {
        this.root?.remove();
        this.root = null;
        this.styleEl?.remove();
        this.styleEl = null;
        this.meters.clear();
    }

    /** The 808 demo: a tier-scaled vibration of the panel and a glow pulse, every frame. */
    private applyPulse(): void {
        const panel = this.root?.querySelector(".panel") as HTMLElement | null;
        if (!panel) return;
        const pulse = this.pulse;
        const elapsed = performance.now() - this.pulseAtMs;
        const { x, y } = pulse ? vibrationOffset(pulse, elapsed) : { x: 0, y: 0 };
        const glow = pulse ? glowLevel(pulse, elapsed) : 0;
        panel.style.transform = x || y ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)` : "";
        const hell = this.root?.classList.contains("hell");
        const rgb = hell ? "255, 90, 31" : "232, 198, 106";
        panel.style.boxShadow = glow > 0.005 ? `0 0 ${Math.round(12 + 70 * glow)}px ${Math.round(4 + 26 * glow)}px rgba(${rgb}, ${Math.min(0.9, glow * 1.4).toFixed(3)})` : "";
        panel.style.filter = glow > 0.005 ? `brightness(${(1 + glow * 0.35).toFixed(3)})` : "";
        this.root?.querySelector("[data-k=b808]")?.classList.toggle("lit", glow > 0.08);
    }

    private render(): void {
        const root = this.root;
        if (!root) return;
        const snap = this.music?.snapshot();
        const set = (k: string, text: string) => {
            const el = root.querySelector(`[data-k=${k}]`);
            if (el && el.textContent !== text) el.textContent = text;
        };
        set("corruption", this.corruption.toFixed(2) + (this.drift > 0 ? " ↑" : this.drift < 0 ? " ↓" : ""));
        (root.querySelector("[data-k=cbar]") as HTMLElement).style.width = `${(this.corruption / MAX_CORRUPTION) * 100}%`;
        if (!snap) {
            set("status", "Music stopped. Keys still move the corruption value.");
            return;
        }
        set("tier", snap.pendingTier !== null && snap.pendingTier !== snap.tier ? `${snap.tier}→${snap.pendingTier}` : String(snap.tier));
        set("set", snap.set);
        set("bar", snap.state === "playing" ? String(snap.bar % 32 + 1) + " / 32" : "-");
        root.classList.toggle("hell", snap.set === "hell");
        root.querySelectorAll(".beat").forEach((dot, i) => dot.classList.toggle("lit", snap.state === "playing" && i === snap.beat));
        const h = this.lastHit;
        if (h && this.pulse) {
            set(
                "beatinfo",
                `hits ${this.hitCount} · last: ${h.stem} vel ${h.velocity.toFixed(2)}${h.slide ? ` (${h.glide})` : ""} · tier ${h.tier} · ${this.pulse.vibratePx.toFixed(2)}px / ${Math.round(this.pulse.vibrateMs)}ms · glow ${this.pulse.glowBoost.toFixed(2)} · output latency ${snap.outputLatencyMs.toFixed(0)}ms · fired ${h.lateMs >= 0 ? "+" : ""}${h.lateMs.toFixed(1)}ms`,
            );
        }
        set(
            "status",
            snap.state === "loading"
                ? "Loading stems…"
                : `${snap.state} · stems running ${snap.loaded}/${snap.total} · heaven LP ${Math.round(snap.filterHz.heaven)} Hz · hell LP ${Math.round(snap.filterHz.hell)} Hz`,
        );
        if (snap.pendingTier !== null) this.eventUntil = performance.now() + 4000;
        set(
            "event",
            snap.pendingTier !== null
                ? `${this.eventText} · lands in ${snap.pendingInSec.toFixed(1)} s`
                : performance.now() < this.eventUntil
                  ? this.eventText
                  : "",
        );
        for (const stem of STEMS) {
            const m = this.meters.get(stem.id);
            if (!m) continue;
            const g = snap.gains[stem.id];
            m.bar.style.width = `${Math.round(g * 100)}%`;
            m.value.textContent = g.toFixed(2);
            for (const el of m.row) {
                el.classList.toggle("on", g > 0.01);
                el.classList.toggle("off", g <= 0.01);
            }
        }
    }
}

