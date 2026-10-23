import { AudioContextFactory, Sound, WebAudio } from "excalibur";
import { MusicCommand, MusicDirector } from "./director";
import { AutomationPoint, FILTER_OPEN_HZ, Gains, MusicSet, valueAt } from "./mixer";
import { STEM_URLS, STINGER_URLS } from "./musicAssets";
import {
    BAR_SEC,
    BEAT_SEC,
    LOOP_END_SEC,
    LOOP_SEC,
    LOOP_START_SEC,
    MUSIC_MASTER_GAIN,
    STEMS,
    STINGERS,
    STINGER_IDS,
    StemId,
    StemSet,
    StingerId,
    Tier,
} from "./musicSpec";

/** First audible moment after start(); leaves time for every source to be scheduled on the same frame. */
const START_LEAD_SEC = 0.12;
const FADE_IN_SEC = 1.5;

export type MusicPlayerState = "idle" | "loading" | "playing" | "stopped";

/** Live snapshot for HUDs and the preview scene. */
export interface MusicSnapshot {
    state: MusicPlayerState;
    tier: Tier;
    set: MusicSet;
    corruption: number;
    bar: number;
    /** Beat within the bar, 0..3. */
    beat: number;
    gains: Gains;
    filterHz: Record<MusicSet, number>;
    loaded: number;
    total: number;
    lastCommand: MusicCommand | null;
}

interface Bus {
    filter: BiquadFilterNode;
    gain: GainNode;
}

/**
 * Adaptive score player for Heaven Or Hell.
 *
 * Excalibur's `Sound` loads and decodes every stem (sharing Excalibur's
 * AudioContext) and plays the one-shot stingers with `play({ scheduledStartTime })`.
 * The looping stems themselves run on raw AudioBufferSourceNodes on that same
 * context, because Excalibur 0.32's `Sound` cannot do what a layered score needs:
 * it loops the whole buffer (no loopStart/loopEnd, so the gapless pads would be
 * heard), each instance connects straight to the destination (no buses or
 * filters), and its volume setter is a fixed `setTargetAtTime(v, now, 0.1)`
 * that cannot be scheduled on a bar line. Sources started with the same
 * `when` (or joined later with a computed offset) stay sample-locked.
 */
export class HeavenOrHellMusic {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private buses = {} as Record<StemSet, Bus>;
    private stemGains = {} as Record<StemId, GainNode>;
    private sources = new Map<StemId, AudioBufferSourceNode>();
    private stemSounds = new Map<StemId, Sound>();
    private stingerSounds = new Map<StingerId, Sound>();
    private director: MusicDirector | null = null;
    private epoch = 0;
    private corruption = 0;
    private volume = 1;
    private lanes = {} as Record<StemId, AutomationPoint[]>;
    private filterLanes: Record<MusicSet, AutomationPoint[]> = { heaven: [], hell: [] };
    private lastCommand: MusicCommand | null = null;
    private stateValue: MusicPlayerState = "idle";
    private generation = 0;

    /** Called for every scheduled transition (stinger or crossfade). */
    onCommand: ((command: MusicCommand) => void) | null = null;

    get state(): MusicPlayerState {
        return this.stateValue;
    }

    /**
     * Unlock audio and start the score at `corruption`. Must be called from a user
     * gesture the first time. Stems for the current set load first so music begins
     * quickly; the rest stream in and join sample-locked.
     */
    async start(corruption = 0): Promise<void> {
        if (this.stateValue === "playing" || this.stateValue === "loading") return;
        const ctx = AudioContextFactory.create();
        if (!ctx) {
            console.warn("🎵 Heaven Or Hell music: WebAudio unavailable");
            return;
        }
        this.ctx = ctx;
        this.stateValue = "loading";
        const generation = ++this.generation;
        this.corruption = corruption;
        await WebAudio.unlock();
        if (ctx.state === "suspended") await ctx.resume();

        this.buildGraph(ctx);
        this.director = new MusicDirector(corruption);
        const first = this.director.tier >= 4 ? "hell" : "heaven";
        const priority = STEMS.filter((s) => s.set === first || s.set === "neutral").map((s) => s.id);
        const rest = STEMS.map((s) => s.id).filter((id) => !priority.includes(id));

        await Promise.all(priority.map((id) => this.loadStem(id)));
        if (generation !== this.generation) return;

        this.epoch = ctx.currentTime + START_LEAD_SEC;
        const initial = this.director.gains;
        for (const stem of STEMS) {
            this.stemGains[stem.id].gain.setValueAtTime(initial[stem.id], this.epoch);
            this.lanes[stem.id] = [{ t: 0, v: initial[stem.id] }];
        }
        this.master!.gain.setValueAtTime(0, ctx.currentTime);
        this.master!.gain.linearRampToValueAtTime(MUSIC_MASTER_GAIN * this.volume, this.epoch + FADE_IN_SEC);
        for (const id of priority) this.startSource(id, this.epoch);
        this.stateValue = "playing";
        console.log(`🎵 Heaven Or Hell music started at tier ${this.director.tier}`);

        void (async () => {
            await Promise.all(rest.map((id) => this.loadStem(id)));
            if (generation !== this.generation || !this.ctx) return;
            const when = this.ctx.currentTime + START_LEAD_SEC;
            for (const id of rest) this.startSource(id, when);
            await Promise.all(STINGER_IDS.map((id) => this.loadStinger(id)));
            console.log("🎵 Heaven Or Hell music fully loaded");
        })().catch((error) => console.error("🎵 Heaven Or Hell music load failed", error));
    }

    /** Feed the game's corruption (0..5, fractional between tiers). Cheap; call whenever it changes. */
    setCorruption(corruption: number): void {
        this.corruption = corruption;
    }

    /** Drive the director; call once per frame (e.g. from the scene's onPreUpdate). */
    update(): void {
        if (this.stateValue !== "playing" || !this.ctx || !this.director) return;
        const elapsed = this.ctx.currentTime - this.epoch;
        if (elapsed < 0) return;
        const command = this.director.tick(elapsed, this.corruption);
        if (command) this.apply(command);
    }

    /** 0..1 user volume on top of the mastering gain. */
    setVolume(volume: number): void {
        this.volume = Math.min(1, Math.max(0, volume));
        if (this.master && this.ctx && this.stateValue === "playing") {
            this.master.gain.setTargetAtTime(MUSIC_MASTER_GAIN * this.volume, this.ctx.currentTime, 0.05);
        }
    }

    snapshot(): MusicSnapshot {
        const now = this.ctx && this.stateValue === "playing" ? this.ctx.currentTime - this.epoch : 0;
        const gains = {} as Gains;
        for (const stem of STEMS) gains[stem.id] = this.lanes[stem.id] ? valueAt(this.lanes[stem.id], now) : 0;
        const tier = this.director?.tier ?? 0;
        return {
            state: this.stateValue,
            tier,
            set: tier >= 4 ? "hell" : "heaven",
            corruption: this.corruption,
            bar: Math.max(0, Math.floor(now / BAR_SEC)),
            beat: Math.max(0, Math.floor(now / BEAT_SEC)) % 4,
            gains,
            filterHz: {
                heaven: this.filterLanes.heaven.length ? valueAt(this.filterLanes.heaven, now, true) : FILTER_OPEN_HZ,
                hell: this.filterLanes.hell.length ? valueAt(this.filterLanes.hell, now, true) : FILTER_OPEN_HZ,
            },
            loaded: this.sources.size,
            total: STEMS.length,
            lastCommand: this.lastCommand,
        };
    }

    /** Fade out and stop. The player can be started again afterwards. */
    stop(fadeSec = 0.6): void {
        this.generation++;
        const ctx = this.ctx;
        if (!ctx || !this.master) {
            this.stateValue = "stopped";
            return;
        }
        const now = ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(this.master.gain.value, now);
        this.master.gain.linearRampToValueAtTime(0, now + fadeSec);
        for (const source of this.sources.values()) {
            try {
                source.stop(now + fadeSec + 0.05);
            } catch {
                // already stopped
            }
        }
        for (const sound of this.stingerSounds.values()) sound.stop();
        const master = this.master;
        const buses = this.buses;
        const stemGains = this.stemGains;
        setTimeout(() => {
            master.disconnect();
            for (const bus of Object.values(buses)) {
                bus.filter.disconnect();
                bus.gain.disconnect();
            }
            for (const g of Object.values(stemGains)) g.disconnect();
        }, (fadeSec + 0.2) * 1000);
        this.sources.clear();
        this.master = null;
        this.buses = {} as Record<StemSet, Bus>;
        this.stemGains = {} as Record<StemId, GainNode>;
        this.director = null;
        this.lastCommand = null;
        this.stateValue = "stopped";
        console.log("🎵 Heaven Or Hell music stopped");
    }

    /** Stop and drop decoded buffers. Excalibur owns the AudioContext, so it is left open. */
    dispose(): void {
        this.stop(0.05);
        this.stemSounds.clear();
        this.stingerSounds.clear();
        this.onCommand = null;
        this.ctx = null;
    }

    private buildGraph(ctx: AudioContext): void {
        this.master = ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(ctx.destination);
        for (const set of ["heaven", "neutral", "hell"] as const) {
            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = FILTER_OPEN_HZ;
            filter.Q.value = 0.9;
            const gain = ctx.createGain();
            filter.connect(gain);
            gain.connect(this.master);
            this.buses[set] = { filter, gain };
        }
        for (const stem of STEMS) {
            const g = ctx.createGain();
            g.gain.value = 0;
            g.connect(this.buses[stem.set].filter);
            this.stemGains[stem.id] = g;
        }
        this.filterLanes = { heaven: [], hell: [] };
    }

    private async loadStem(id: StemId): Promise<AudioBuffer> {
        let sound = this.stemSounds.get(id);
        if (!sound) {
            sound = new Sound(STEM_URLS[id]);
            this.stemSounds.set(id, sound);
        }
        return sound.isLoaded() ? sound.data : sound.load();
    }

    private async loadStinger(id: StingerId): Promise<void> {
        let sound = this.stingerSounds.get(id);
        if (!sound) {
            sound = new Sound(STINGER_URLS[id]);
            this.stingerSounds.set(id, sound);
        }
        if (!sound.isLoaded()) await sound.load();
    }

    /** Start a stem so it lines up with the music epoch, wherever in the loop `when` falls. */
    private startSource(id: StemId, when: number): void {
        const ctx = this.ctx;
        const sound = this.stemSounds.get(id);
        if (!ctx || !sound?.isLoaded() || this.sources.has(id)) return;
        const source = ctx.createBufferSource();
        source.buffer = sound.data;
        source.loop = true;
        source.loopStart = LOOP_START_SEC;
        source.loopEnd = LOOP_END_SEC;
        source.connect(this.stemGains[id]);
        const into = Math.max(0, when - this.epoch) % LOOP_SEC;
        source.start(when, LOOP_START_SEC + into);
        this.sources.set(id, source);
    }

    private apply(command: MusicCommand): void {
        const ctx = this.ctx;
        if (!ctx) return;
        const at = (t: number) => this.epoch + t;
        for (const stem of STEMS) {
            const points = command.automation[stem.id];
            const param = this.stemGains[stem.id].gain;
            param.cancelScheduledValues(at(points[0].t));
            param.setValueAtTime(points[0].v, at(points[0].t));
            for (const p of points.slice(1)) param.linearRampToValueAtTime(p.v, at(p.t));
            this.lanes[stem.id] = points;
        }
        if (command.filter) {
            const param = this.buses[command.filter.bus].filter.frequency;
            const [head, ...tail] = command.filter.points;
            param.cancelScheduledValues(at(head.t));
            param.setValueAtTime(head.v, at(head.t));
            for (const p of tail) param.exponentialRampToValueAtTime(p.v, at(p.t));
            this.filterLanes[command.filter.bus] = command.filter.points;
        }
        if (command.stinger) {
            const sound = this.stingerSounds.get(command.stinger.id);
            if (sound?.isLoaded()) {
                const volume = Math.min(1, STINGERS[command.stinger.id].level * MUSIC_MASTER_GAIN * this.volume);
                void sound.play({ volume, scheduledStartTime: at(command.stinger.startSec) * 1000 });
            }
        }
        this.lastCommand = command;
        this.onCommand?.(command);
        console.log(`🎵 ${command.kind} → tier ${command.tier} on bar ${command.boundaryBar}`);
    }
}
