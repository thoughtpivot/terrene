/**
 * Original square-wave music and effects.
 * The melody is not the Super Mario Bros. overworld theme.
 */

let ctx: AudioContext | null = null;
let musicOn = false;
let stepTimer: ReturnType<typeof setInterval> | null = null;
let step = 0;

function audio(): AudioContext | null {
    if (typeof AudioContext === "undefined") return null;
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") {
        void ctx.resume();
    }
    return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gainValue: number, slideTo?: number): void {
    const ac = audio();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), ac.currentTime + dur);
    }
    gain.gain.setValueAtTime(gainValue, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur + 0.02);
}

function noise(dur: number, gainValue: number): void {
    const ac = audio();
    if (!ac) return;
    const length = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(gainValue, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
}

/** A short original march in G, built so it does not quote the famous overworld hook. */
const LEAD = [74, 72, 69, 67, 69, 72, 74, 79, 77, 74, 72, 69, 67, 65, 64, 62, 64, 67, 69, 72, 69, 67, 65, 64];
const BASS = [50, 50, 45, 45, 43, 43, 48, 48, 50, 45, 43, 41, 38, 38, 43, 43];

export function unlockAudio(): void {
    audio();
}

export function startMusic(): void {
    const ac = audio();
    if (!ac || musicOn) return;
    musicOn = true;
    step = 0;
    stepTimer = setInterval(() => {
        if (!musicOn) return;
        const lead = LEAD[step % LEAD.length];
        tone(midi(lead), 0.16, "square", 0.035);
        if (step % 2 === 0) {
            tone(midi(BASS[(step / 2) % BASS.length]), 0.28, "triangle", 0.04);
        }
        step++;
    }, 170);
}

export function stopMusic(): void {
    musicOn = false;
    if (stepTimer) {
        clearInterval(stepTimer);
        stepTimer = null;
    }
}

function midi(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
}

export function sfxJump(): void {
    tone(620, 0.12, "square", 0.05, 280);
}

export function sfxCoin(): void {
    tone(988, 0.08, "square", 0.05);
    setTimeout(() => tone(1319, 0.12, "square", 0.05), 70);
}

export function sfxBump(): void {
    tone(180, 0.08, "square", 0.05, 90);
}

export function sfxBreak(): void {
    noise(0.12, 0.08);
}

export function sfxStomp(): void {
    tone(180, 0.09, "square", 0.06, 70);
}

export function sfxPower(): void {
    [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => tone(f, 0.1, "square", 0.05), i * 70);
    });
}

export function sfxHurt(): void {
    tone(440, 0.2, "square", 0.06, 110);
}

export function sfxDie(): void {
    [523, 494, 440, 392, 349, 330, 294].forEach((f, i) => {
        setTimeout(() => tone(f, 0.16, "square", 0.05), i * 90);
    });
}

export function sfxClear(): void {
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) => {
        setTimeout(() => tone(f, 0.14, "square", 0.05), i * 120);
    });
}

export function sfxOneUp(): void {
    [784, 988, 1319].forEach((f, i) => {
        setTimeout(() => tone(f, 0.1, "square", 0.05), i * 80);
    });
}

export function sfxKick(): void {
    tone(320, 0.08, "square", 0.05, 180);
}
