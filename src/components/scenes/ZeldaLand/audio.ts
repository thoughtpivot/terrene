let ctx: AudioContext | null = null;

function context(): AudioContext | null {
    try {
        const AudioCtx = window.AudioContext;
        if (!ctx) ctx = new AudioCtx();
        if (ctx.state === "suspended") {
            void ctx.resume();
        }
        return ctx;
    } catch (error) {
        console.error("❌ Zelda Land audio failed", error);
        return null;
    }
}

export function unlockAudio(): void {
    context();
}

export function tone(freq: number, dur: number, delay = 0, type: OscillatorType = "square"): void {
    const audio = context();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.035, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
}

export function swingTone(): void {
    tone(520, 0.05);
}

export function hurtTone(): void {
    tone(92, 0.14);
}

export function chime(): void {
    tone(523, 0.08, 0);
    tone(659, 0.08, 0.09);
    tone(784, 0.14, 0.18);
}
