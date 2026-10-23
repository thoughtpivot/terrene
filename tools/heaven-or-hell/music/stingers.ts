import { BAR_SEC, STINGERS, StingerId } from "../../../src/components/scenes/HeavenOrHell/audio/musicSpec";
import { LYDIAN, STEP, degreeToMidi } from "./score";
import { Rng, SR, Stereo, expDecay, highpass, lowpass, mixMono, mixStereo, multiply, noise, osc, reverb, reverse, scale } from "./synth/dsp";
import {
    HEAVEN_BELL,
    HELL_BELL,
    brass,
    clap,
    fmBell,
    formant,
    harp,
    noiseRiser,
    organ,
    reverseCymbal,
    snare,
    subBoom,
    unison,
} from "./synth/instruments";

const at = (sec: number): number => Math.round(sec * SR);

function finish(dry: Stereo, room: number, damp: number, wet: number): Stereo {
    const [l, r] = reverb(dry.l, dry.r, { room, damp, preDelay: 0.03, lowCut: 200 });
    const n = dry.length;
    const out = Stereo.zeros(n);
    const fade = Math.round(0.4 * SR);
    for (let i = 0; i < n; i++) {
        const tail = i > n - fade ? (n - i) / fade : 1;
        out.l[i] = (dry.l[i] + l[i] * wet) * tail;
        out.r[i] = (dry.r[i] + r[i] * wet) * tail;
    }
    return out;
}

function crash(rng: Rng, len = 2.2): Float32Array {
    const n = at(len);
    return scale(multiply(highpass(noise(n, rng), 3000), expDecay(n, len * 0.3, 0.001)), 0.5);
}

/** Heaven-to-corruption riser: noise sweep, reverse cymbal, a reversed sung F-C-B cluster, a soft landing. */
function riser(): Stereo {
    const info = STINGERS.riser;
    const rng = new Rng(11);
    const out = Stereo.zeros(at(info.totalSec));
    const hit = at(info.hitSec);
    const sweep = noiseRiser(info.hitSec, rng, 400, 7000);
    mixMono(out, sweep, hit - sweep.length, 0.35, -0.2);
    const cym = reverseCymbal(info.hitSec, rng);
    mixMono(out, cym, hit - cym.length, 0.45, 0.25);
    for (const m of [53, 60, 71]) {
        const v = unison(m, 1.6, { a: 0.01, d: 0.3, s: 0.7, r: 0.8 }, { voices: 4, detuneCents: 20, driftCents: 6, vibratoHz: 4, vibratoCents: 10, wave: "saw", spread: 0.8 }, rng);
        const sung = reverse(formant(v.l, "a"));
        mixMono(out, sung, hit - sung.length, 0.25, m === 71 ? 0.4 : -0.3);
    }
    mixMono(out, subBoom(41, 29, 1.6), hit, 0.55);
    mixMono(out, fmBell(71, 0.8, HEAVEN_BELL), hit, 0.5, 0.2);
    return finish(out, 0.9, 0.3, 0.6);
}

/** The Tier 4 drop: accelerating snare roll, rising siren, reversed hell bell, then the hit. */
function switchUp(): Stereo {
    const info = STINGERS.switchUp;
    const rng = new Rng(22);
    const out = Stereo.zeros(at(info.totalSec));
    const hit = at(info.hitSec);
    // Snare roll: 8ths, then 16ths, then 32nds, then 64ths, crescendo.
    const roll: Array<[number, number]> = [];
    let t = 0;
    const rates: Array<[number, number]> = [[BAR_SEC * 0.5, STEP * 2], [BAR_SEC * 0.5, STEP], [BAR_SEC * 0.5, STEP / 2], [BAR_SEC * 0.5, STEP / 4]];
    for (const [span, every] of rates) {
        for (let x = 0; x < span - 1e-6; x += every) roll.push([t + x, (t + x) / info.hitSec]);
        t += span;
    }
    for (const [time, f] of roll) mixMono(out, snare(0.25 + 0.7 * f, rng), at(time), 0.45 + 0.4 * f, (f - 0.5) * 0.6);
    const sweep = noiseRiser(info.hitSec, rng, 250, 9000);
    mixMono(out, sweep, hit - sweep.length, 0.4);
    const siren = osc("saw", (i) => 87.3 * Math.pow(8, i / at(info.hitSec)), at(info.hitSec));
    for (let i = 0; i < siren.length; i++) siren[i] *= Math.pow(i / siren.length, 2) * 0.12;
    mixMono(out, lowpass(siren, 2500), 0, 1, 0);
    const revBell = reverse(fmBell(48, 1, { ...HELL_BELL, decay: 1.1 }));
    mixMono(out, revBell, hit - revBell.length, 0.6, -0.3);
    // The hit.
    mixMono(out, subBoom(53, 29, 3), hit, 0.8);
    mixMono(out, crash(rng, 2.6), hit, 0.6, 0.3);
    mixMono(out, clap(1, rng), hit, 0.6);
    for (const m of [41, 48, 53, 56]) mixStereo(out, brass(m, 0.6, 1, rng), hit, 0.45);
    mixMono(out, fmBell(53, 1, HELL_BELL), hit, 0.45, -0.25);
    mixMono(out, fmBell(59, 1, HELL_BELL), hit, 0.45, 0.25);
    return finish(out, 0.85, 0.7, 0.45);
}

/** Tier 5: a one-bar suck-back into a wall of organ, brass and a screaming choir. */
function hellImpact(): Stereo {
    const info = STINGERS.hellImpact;
    const rng = new Rng(33);
    const out = Stereo.zeros(at(info.totalSec));
    const hit = at(info.hitSec);
    const cym = reverseCymbal(info.hitSec, rng);
    mixMono(out, cym, hit - cym.length, 0.6);
    const growl = osc("saw", (i) => 220 * Math.pow(0.25, i / at(info.hitSec)), at(info.hitSec));
    for (let i = 0; i < growl.length; i++) growl[i] *= (i / growl.length) * 0.15;
    mixMono(out, lowpass(growl, 1200), 0, 1);
    mixMono(out, subBoom(48, 29, 3), hit, 0.85);
    mixMono(out, crash(rng, 3), hit, 0.55, -0.2);
    for (const m of [53, 56, 59, 63, 66]) mixStereo(out, organ(m, 1.2, rng), hit, 0.22);
    for (const m of [41, 48]) mixStereo(out, brass(m, 0.9, 1, rng), hit, 0.5);
    for (const m of [77, 80, 83]) {
        const v = unison(m, 1.4, { a: 0.03, d: 0.4, s: 0.7, r: 0.8 }, { voices: 5, detuneCents: 35, driftCents: 20, vibratoHz: 7, vibratoCents: 45, wave: "saw", spread: 1 }, rng, -300);
        mixMono(out, formant(v.l, "e", 1.1), hit, 0.18, -0.4);
        mixMono(out, formant(v.r, "e", 1.1), hit, 0.18, 0.4);
    }
    return finish(out, 0.86, 0.7, 0.5);
}

/** Heaven reclaims the field: a harp gliss up F Lydian into a bell chord and a choir bloom. */
function redeem(): Stereo {
    const info = STINGERS.redeem;
    const rng = new Rng(44);
    const out = Stereo.zeros(at(info.totalSec));
    const hit = at(info.hitSec);
    const notes = 28;
    for (let k = 0; k < notes; k++) {
        // Accelerating gliss: spacing shrinks toward the hit.
        const f = k / notes;
        const time = info.hitSec * (1 - Math.pow(1 - f, 1.6));
        mixMono(out, harp(degreeToMidi(LYDIAN, k - 7, 65), 0.35 + 0.5 * f, rng, 1.5), at(time), 0.7, -0.7 + 1.4 * f);
    }
    const shimmer = highpass(noiseRiser(info.hitSec, rng, 2000, 12000), 1500);
    mixMono(out, shimmer, hit - shimmer.length, 0.25, 0.2);
    for (const m of [65, 69, 72, 76, 79, 83]) mixMono(out, fmBell(m, 0.8, HEAVEN_BELL), hit, 0.3, (m - 74) / 12);
    for (const m of [53, 60, 64, 67, 71]) {
        const v = unison(m, 2.4, { a: 0.6, d: 0.6, s: 0.8, r: 1.2 }, { voices: 4, detuneCents: 10, driftCents: 3, vibratoHz: 4.6, vibratoCents: 6, wave: "saw", spread: 0.9 }, rng);
        mixMono(out, formant(v.l, "a"), hit, 0.2, -0.4);
        mixMono(out, formant(v.r, "a"), hit, 0.2, 0.4);
    }
    mixMono(out, subBoom(41, 29, 1.6), hit, 0.4);
    return finish(out, 0.93, 0.2, 0.65);
}

export const STINGER_RENDERERS: Record<StingerId, () => Stereo> = { riser, switchUp, hellImpact, redeem };
