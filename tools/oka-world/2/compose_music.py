"""Renders the Oka World 2 soundtrack and its darker sound effects.

"Where the Lanterns Sleep": C minor, 60 BPM, 32 bars of 4/4 (128 s).

    bars  0-7   felt piano alone over a low drone and a breath of strings
    bars  8-15  a cello takes the melody
    bars 16-23  a low choir rises, a funeral bell tolls, a deep drum walks
    bars 24-31  Neapolitan turn (Db) and the cello sinks back to the dominant

Distant wind, falling water and the odd metal creak sit far back in a long,
dark convolution reverb. Like the Oka World score, the loop is rendered
circularly and the MP3 carries LOOP + 2 s so audio.ts can loop between exact
sample points with no gap.

    python3 tools/oka-world/2/compose_music.py
"""
import os
import sys

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(HERE))
import compose_music as one  # noqa: E402

SR = one.SR
BPM = 60.0
BEAT = 60.0 / BPM
BARS = 32
LOOP = BARS * 4 * BEAT
N = int(round(LOOP * SR))
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "src", "components", "scenes", "OkaWorld", "2"))
rng = np.random.default_rng(1913)
midi = one.midi
hz = one.hz


def lp(sig, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), sig, axis=-1)


def hp(sig, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), sig, axis=-1)


def bp(sig, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), sig, axis=-1)


def pan2(sig, pan):
    return np.vstack([sig * np.cos((pan + 1) * np.pi / 4), sig * np.sin((pan + 1) * np.pi / 4)])


class Bus:
    def __init__(self):
        self.buf = np.zeros((2, N + SR * 14))

    def add(self, sig, t, pan=0.0, gain=1.0):
        i = int(round(t * SR)) % N
        if sig.ndim == 1:
            sig = pan2(sig, pan)
        end = min(i + sig.shape[1], self.buf.shape[1])
        self.buf[:, i:end] += sig[:, : end - i] * gain

    def loop(self):
        return fold(self.buf)


def fold(buf):
    """Wrap everything past the loop end back onto the start."""
    out = buf[..., :N].copy()
    k = N
    while k < buf.shape[-1]:
        seg = buf[..., k:k + N]
        out[..., : seg.shape[-1]] += seg
        k += N
    return out


def wavetable(partials, size=4096):
    """One period built from (harmonic, amplitude) pairs."""
    ph = np.arange(size) / size * 2 * np.pi
    tab = sum(a * np.sin(k * ph) for k, a in partials)
    return tab / np.abs(tab).max()


def osc(table, freq):
    """Read a wavetable at a (possibly varying) frequency, with linear interpolation."""
    size = table.size
    phase = np.cumsum(np.broadcast_to(freq, freq.shape if np.ndim(freq) else (1,)) / SR) % 1.0 * size
    i0 = phase.astype(int)
    frac = phase - i0
    return table[i0] * (1 - frac) + table[(i0 + 1) % size] * frac


def saw_table(f0, cutoff=4200):
    n = max(1, int(cutoff / f0))
    return wavetable([(k, 1 / k) for k in range(1, n + 1)])


# ------------------------------------------------------------------ voices

def piano(m, vel=0.7, hold=6.0):
    """Felt piano: slightly inharmonic partials, three detuned strings, two-stage decay, soft hammer."""
    f = hz(m)
    dur = min(9.0, hold + 2.5)
    n = int(dur * SR)
    t = np.arange(n) / SR
    bright = 0.35 + 0.65 * vel
    sig = np.zeros(n)
    tau_slow = 5.5 * (130 / f) ** 0.45
    for k in range(1, 15):
        fk = f * k * np.sqrt(1 + 0.00035 * k * k)
        if fk > 7000:
            break
        amp = (k ** -1.25) * np.exp(-(k - 1) * (1.1 - bright) * 0.55) * abs(np.sin(k * np.pi * 0.13) + 0.25)
        tau = tau_slow / (1 + 0.5 * (k - 1))
        env = 0.55 * np.exp(-t / (tau * 0.12)) + 0.45 * np.exp(-t / tau)
        for cents in (-0.9, 0.0, 1.1):
            sig += amp / 3 * env * np.sin(2 * np.pi * fk * 2 ** (cents / 1200) * t + rng.uniform(0, 6.28))
    hammer = lp(rng.standard_normal(n) * np.exp(-t / 0.004), 1800) * 0.25
    sig = sig * np.clip(t / 0.003, 0, 1) + hammer
    damp = np.where(t > hold, np.exp(-(t - hold) / 0.35), 1.0)
    sig = lp(sig * damp, 2000 + 4500 * vel)
    return sig * vel * 0.55


def cello_line(events):
    """events: (midi or None, beats). One legato bowed line with swells, vibrato and bow noise."""
    total = sum(b for _, b in events) * BEAT + 2.5
    n = int(total * SR)
    freq = np.full(n, hz(48))
    amp = np.zeros(n)
    cur = 0.0
    prev = None
    for m, beats in events:
        d = beats * BEAT
        i0, i1 = int(cur * SR), int((cur + d) * SR)
        st = np.arange(i1 - i0) / SR
        if m is not None:
            f = hz(m)
            fseg = f * (prev / f) ** np.exp(-st / 0.06) if prev else np.full(st.size, f)
            vib = np.clip((st - 0.4) / 0.8, 0, 1) * 0.0055
            fseg = fseg * (1 + vib * np.sin(2 * np.pi * 5.3 * st + rng.uniform(0, 6)))
            freq[i0:i1] = fseg
            swell = np.clip(st / 0.25, 0, 1) * (0.7 + 0.3 * np.sin(np.pi * np.clip(st / d, 0, 1)))
            amp[i0:i1] = swell * np.clip((d - st) / 0.15, 0.55, 1)
            prev = f
        else:
            prev = None
        cur += d
    last = int(cur * SR)
    freq[last:] = freq[last - 1]
    amp = lp(amp, 9, 1)
    tone = osc(saw_table(80, 5000), freq)
    bow = bp(rng.standard_normal(n), 1500, 5000) * 0.05
    body = tone + bow
    # wooden body resonances
    body = 0.6 * bp(body, 180, 520) + 0.5 * bp(body, 700, 1500) + 0.18 * bp(body, 2200, 3600) + 0.25 * lp(body, 160)
    return lp(body * amp, 4200) * 0.9


def choir(notes, dur, vowel="oo"):
    """A low choir pad: detuned voices through vowel formants, with a slow breath in."""
    tail = 4.0
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    formants = {"oo": [(300, 0.9), (870, 0.35), (2240, 0.08)], "ah": [(650, 1.0), (1080, 0.55), (2650, 0.15)]}[vowel]
    out = np.zeros((2, n))
    for m in notes:
        f0 = hz(m)
        table = saw_table(f0, 3800)
        for v in range(4):
            cents = rng.uniform(-11, 11)
            vib = 1 + 0.004 * np.sin(2 * np.pi * rng.uniform(4.4, 5.6) * t + rng.uniform(0, 6))
            drift = 1 + 0.0015 * np.sin(2 * np.pi * rng.uniform(0.05, 0.15) * t + rng.uniform(0, 6))
            src = osc(table, f0 * 2 ** (cents / 1200) * vib * drift)
            src += rng.standard_normal(n) * 0.04
            voice = sum(a * bp(src, fc * 0.8, fc * 1.2) for fc, a in formants)
            out += pan2(voice, (-0.6, -0.2, 0.2, 0.6)[v])
    e = np.clip(t / 2.6, 0, 1) ** 1.6 * np.where(t > dur, np.exp(-(t - dur) / 1.4), 1.0)
    return lp(out * e, 3200) / (len(notes) * 4) * 2.2


def strings(notes, dur):
    """Very soft string bed under the piano."""
    tail = 3.5
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        table = saw_table(hz(m), 3000)
        for v, cents in enumerate((-6, 5)):
            vib = 1 + 0.003 * np.sin(2 * np.pi * rng.uniform(4.6, 5.4) * t + rng.uniform(0, 6))
            out += pan2(osc(table, hz(m) * 2 ** (cents / 1200) * vib), (-0.5, 0.5)[v])
    e = np.clip(t / 2.0, 0, 1) ** 1.5 * np.where(t > dur, np.exp(-(t - dur) / 1.2), 1.0)
    return lp(hp(out * e, 120), 1800) / (len(notes) * 2)


def drone(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    swell = 0.65 + 0.35 * np.sin(2 * np.pi * t / 17.0)
    sig = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.0035 * t)
           + 0.3 * np.sin(2 * np.pi * 2 * f * t + 0.7) + 0.12 * np.sin(2 * np.pi * 3.0 * f * t + 1.9))
    fade = np.minimum(1, np.minimum(t / 0.6, (dur - t) / 0.6))
    return sig * swell * fade


def funeral_bell(m, vel=1.0):
    """A big low bell: hum, prime, minor tierce, quint and nominal, each decaying at its own rate."""
    f = hz(m)
    n = int(9.0 * SR)
    t = np.arange(n) / SR
    parts = [(0.5, 0.6, 6.5), (1.0, 1.0, 4.5), (1.19, 0.55, 3.6), (1.5, 0.3, 2.8), (2.0, 0.45, 2.2),
             (2.52, 0.18, 1.4), (3.0, 0.12, 1.0), (4.07, 0.08, 0.6)]
    sig = sum(a * np.exp(-t / tau) * np.sin(2 * np.pi * f * r * t + 0.002 * r * np.sin(2 * np.pi * 0.7 * t)) for r, a, tau in parts)
    strike = lp(rng.standard_normal(n) * np.exp(-t / 0.01), 2500) * 0.15
    return (sig * np.clip(t / 0.004, 0, 1) + strike) * vel * 0.22


def deep_drum(vel=1.0):
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    f = 38 + 34 * np.exp(-t / 0.06)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    skin = bp(rng.standard_normal(n) * np.exp(-t / 0.03), 80, 600)
    return (body + 0.3 * skin) * vel * 0.7


def wind(seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal((2, n))
    lo = bp(noise, 180, 700) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 23.0))
    hi = bp(noise, 900, 2400) * (0.3 + 0.3 * np.sin(2 * np.pi * t / 11.0 + 1.3)) ** 2
    return (lo + 0.4 * hi) * 0.5


def creak(seconds=2.4):
    """A far metal chain or old timber settling: a resonant comb over rough noise."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    rough = rng.standard_normal(n) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(7, 15) * t) ** 8)
    env = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 2
    src = rough * env
    d = int(SR / rng.uniform(140, 260))
    out = src.copy()
    for i in range(d, n):
        out[i] += 0.93 * out[i - d]
    return bp(out, 300, 3000) * 0.02


def impulse(seconds, darkness=2400):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    for ch in range(2):
        noise = rng.standard_normal(n)
        lp1 = lp(noise, 5000)
        lp2 = lp(noise, darkness)
        blend = np.clip(t / seconds * 2.2, 0, 1)
        e = np.exp(-t / (seconds / 6.0)) * np.clip(t / 0.03, 0, 1)
        ir[ch] = (lp1 * (1 - blend) + lp2 * blend) * e
        for _ in range(18):
            i = int(rng.uniform(0.012, 0.14) * SR)
            ir[ch, i] += rng.uniform(-0.5, 0.5)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    return ir * 0.6


# ------------------------------------------------------------------ score

def chord(*names):
    return [midi(x) for x in names]


PROG = [
    # A1
    (chord("C3", "G3", "Eb4", "D4"), "C2"),
    (chord("Ab2", "Eb3", "C4", "G4"), "Ab1"),
    (chord("F2", "C3", "Ab3", "Eb4", "G4"), "F1"),
    (chord("G2", "D3", "F3", "C4"), "G1"),
    # A2
    (chord("C3", "G3", "Eb4", "G4"), "C2"),
    (chord("Ab2", "Eb3", "C4", "Eb4"), "Ab1"),
    (chord("Bb2", "G3", "Bb3", "D4"), "Eb2"),
    (chord("G2", "D3", "B3", "F4"), "G1"),
    # B
    (chord("Ab2", "C3", "Eb3", "C4"), "Ab1"),
    (chord("F2", "Ab3", "C4", "F4"), "F1"),
    (chord("Eb3", "G3", "C4", "G4"), "Eb2"),
    (chord("G2", "B3", "D4", "G4"), "G1"),
    # C
    (chord("F2", "Ab3", "C4", "Eb4"), "F1"),
    (chord("Db3", "F3", "Ab3", "C4"), "Db2"),
    (chord("G2", "C3", "Eb3", "G3"), "G1"),
    (chord("G2", "B2", "F3", "Ab3"), "G1"),
]

PIANO_MOTIF = [(None, 8), ("G5", 3), ("F5", 1), ("Eb5", 2), ("D5", 2),
               ("C5", 4), ("Bb4", 2), ("C5", 2), ("D5", 6), (None, 2)]
CELLO_A2 = [("G3", 4), ("Ab3", 2), ("G3", 1), ("F3", 1), ("Eb3", 4), ("D3", 2), ("C3", 2),
            ("Eb3", 3), ("F3", 1), ("G3", 4), ("Ab3", 2), ("B3", 2), ("G3", 4)]
CELLO_B = [("C4", 4), ("Bb3", 2), ("Ab3", 2), ("F3", 3), ("G3", 1), ("Ab3", 4),
           ("G3", 4), ("Eb4", 2), ("D4", 2), ("D4", 4), ("B3", 2), ("G3", 2)]
CELLO_C = [("Ab3", 4), ("C4", 4), ("Db4", 4), ("F3", 2), ("Ab3", 2),
           ("G3", 4), ("Eb3", 2), ("C3", 2), ("B2", 4), ("D3", 2), (None, 2)]


def render_music():
    dry = Bus()
    verb = Bus()
    bar = 4 * BEAT
    for ci, (notes, root) in enumerate(PROG):
        t0 = ci * 2 * bar
        sec = ci // 4
        span = 2 * bar
        d = drone(midi(root), span + 0.8)
        dry.add(d, t0, gain=0.045)
        verb.add(d, t0, gain=0.02)

        s = strings(notes, span + 0.2)
        dry.add(s, t0, gain=0.22 if sec == 0 else 0.3)
        verb.add(s, t0, gain=0.3)

        # piano: a low root, then a slow broken chord that climbs and falls
        ladder = sorted(set(notes + [x + 12 for x in notes[1:]]))
        low = piano(midi(root) + 12, 0.55, 7.5)
        dry.add(low, t0, pan=-0.25, gain=0.5)
        verb.add(low, t0, pan=-0.25, gain=0.35)
        pattern = [0, 2, 3, 4, 5, 4, 2, 3] if sec != 3 else [0, 2, 4, None, 3, None, 1, None]
        for b, idx in enumerate(pattern):
            if idx is None:
                continue
            m = ladder[min(idx, len(ladder) - 1)]
            vel = (0.32 + 0.12 * rng.random()) * (1.2 if b == 0 else 1.0)
            jitter = rng.normal(0, 0.012)
            p = piano(m, vel, 1.6)
            pan = -0.4 + 0.8 * idx / max(1, len(ladder) - 1)
            dry.add(p, t0 + b * BEAT + jitter, pan=pan, gain=0.5)
            verb.add(p, t0 + b * BEAT + jitter, pan=pan, gain=0.42)

        if sec == 2 or ci >= 12:
            c = choir(notes, span + 0.3, "oo" if sec == 2 else "ah")
            dry.add(c, t0, gain=0.42 if sec == 2 else 0.36)
            verb.add(c, t0, gain=0.5)
        if sec >= 2:
            for b in (0, 5.5) if sec == 2 else (0,):
                dd = deep_drum(0.9 if b == 0 else 0.5)
                dry.add(dd, t0 + b * BEAT, pan=-0.05, gain=0.38)
                verb.add(dd, t0 + b * BEAT, gain=0.22)
            if ci % 2 == 1:
                dd = deep_drum(0.45)
                dry.add(dd, t0 + 4 * BEAT, gain=0.24)
                verb.add(dd, t0 + 4 * BEAT, gain=0.14)
        if ci % 4 == 0:
            fb = funeral_bell(midi(root) + 24, 0.9)
            dry.add(fb, t0, pan=0.3, gain=0.32)
            verb.add(fb, t0, pan=0.3, gain=0.55)
        if ci == 13:
            fb = funeral_bell(midi("Db4"), 0.6)
            dry.add(fb, t0 + 4 * BEAT, pan=-0.3, gain=0.2)
            verb.add(fb, t0 + 4 * BEAT, pan=-0.3, gain=0.45)

    # the piano's lonely motif, high and far, in A1 and again over the last bars
    for start, gain in ((0, 0.55), (24, 0.38)):
        tt = start * bar
        for m, beats in PIANO_MOTIF:
            if m is not None:
                p = piano(midi(m), 0.42, beats * BEAT * 0.9)
                dry.add(p, tt, pan=0.3, gain=gain)
                verb.add(p, tt, pan=0.3, gain=gain * 1.1)
            tt += beats * BEAT

    def cello(events, bar_index, gain):
        ev = [(None if n is None else midi(n), b) for n, b in events]
        sig = cello_line(ev)
        dry.add(sig, bar_index * bar, pan=-0.12, gain=gain)
        verb.add(sig, bar_index * bar, pan=-0.12, gain=gain * 0.7)

    cello(CELLO_A2, 8, 0.5)
    cello(CELLO_B, 16, 0.46)
    cello(CELLO_C, 24, 0.5)

    # the cave itself: wind, far water, a creak now and then
    w = wind(LOOP + 2)
    dry.add(w, 0, gain=0.035)
    drip_notes = [midi(x) for x in ("C6", "Eb6", "G5", "Bb5", "D6")]
    t = 1.3
    while t < LOOP:
        s = one.drip(drip_notes[rng.integers(len(drip_notes))] - 5)
        pan = rng.uniform(-0.9, 0.9)
        dry.add(s, t, pan=pan, gain=0.03)
        verb.add(s, t, pan=pan, gain=0.22)
        t += rng.exponential(4.2) + 0.8
    for t in (19.0, 47.5, 83.0, 111.0):
        c = creak(rng.uniform(1.8, 3.0))
        verb.add(c, t, pan=rng.uniform(-0.8, 0.8), gain=1.0)

    d = dry.loop()
    wv = verb.loop()
    ir = impulse(7.5)
    wet = np.vstack([fold(fftconvolve(wv[ch], ir[ch])) for ch in range(2)])
    mix = d + wet * 0.62
    mix = hp(mix, 38)
    air = hp(mix, 3500, 1)
    mud = bp(mix, 250, 700, 1)
    mix = mix + 0.8 * air - 0.2 * mud - 0.35 * lp(mix, 70)
    return master(mix, -18.5)


def master(mix, lufs_ish):
    peak = np.abs(mix).max()
    mix = mix / peak * 1.25
    mix = np.tanh(mix) / np.tanh(1.25)
    rms = np.sqrt((mix ** 2).mean())
    target = 10 ** (lufs_ish / 20)
    return mix * min(target / rms, 0.92 / np.abs(mix).max())


# ------------------------------------------------------------------ sfx

def sfx_bus(seconds):
    return np.zeros((2, int(seconds * SR)))


def finish_sfx(buf, verb=0.3, peak=0.8, seconds=2.2):
    ir = impulse(seconds)
    wet = np.vstack([fftconvolve(buf[c], ir[c])[: buf.shape[1]] for c in range(2)])
    out = buf + wet * verb
    n = out.shape[1]
    out *= np.minimum(1, (n - np.arange(n)) / (0.08 * SR))
    return out / np.abs(out).max() * peak


def render_sfx():
    s = {}
    place = one.place

    b = sfx_bus(0.9)
    nn = int(0.3 * SR)
    tt = np.arange(nn) / SR
    place(b, bp(rng.standard_normal(nn), 300, 1800) * np.sin(np.pi * tt / 0.3) ** 2, 0, gain=0.5)
    place(b, piano(midi("G3"), 0.5, 0.4), 0.0, gain=0.6)
    s["jump"] = finish_sfx(b, 0.2, 0.5)

    b = sfx_bus(2.6)
    place(b, funeral_bell(midi("G5"), 0.7), 0, pan=-0.2)
    place(b, piano(midi("Eb6"), 0.5, 0.8), 0.04, pan=0.2, gain=0.8)
    place(b, piano(midi("C6"), 0.4, 0.8), 0.11, pan=0.3, gain=0.5)
    s["crystal"] = finish_sfx(b, 0.5, 0.65)

    b = sfx_bus(3.0)
    for i, n in enumerate(("C4", "Eb4", "G4", "C5")):
        place(b, piano(midi(n), 0.5, 1.5), i * 0.09, pan=-0.3 + i * 0.2)
    place(b, strings(chord("C3", "G3", "Eb4"), 1.0)[:, : int(2.5 * SR)], 0.1, gain=1.2)
    s["heart"] = finish_sfx(b, 0.45, 0.7)

    b = sfx_bus(1.2)
    place(b, deep_drum(1.0), 0)
    for n in ("C3", "Db3", "Gb3"):
        place(b, piano(midi(n), 0.7, 0.25), 0.01, gain=0.45)
    s["hurt"] = finish_sfx(b, 0.25, 0.8)

    b = sfx_bus(1.0)
    place(b, deep_drum(0.9), 0)
    crack = rng.standard_normal(int(0.08 * SR)) * np.exp(-np.arange(int(0.08 * SR)) / SR / 0.012)
    place(b, bp(crack, 900, 5000), 0.005, gain=0.9)
    place(b, piano(midi("C3"), 0.5, 0.3), 0.01, gain=0.4)
    s["stomp"] = finish_sfx(b, 0.2, 0.8)

    b = sfx_bus(1.6)
    nn = int(0.9 * SR)
    tn = np.arange(nn) / SR
    burst = bp(rng.standard_normal(nn), 200, 2200) * np.exp(-tn / 0.16) * np.clip(tn / 0.008, 0, 1)
    place(b, burst, 0, gain=0.8)
    for _ in range(6):
        place(b, one.drip(midi("C5") + int(rng.integers(-5, 7))), 0.06 + rng.uniform(0, 0.5), pan=rng.uniform(-0.6, 0.6), gain=0.4)
    s["splash"] = finish_sfx(b, 0.35, 0.55)

    b = sfx_bus(7.5)
    place(b, funeral_bell(midi("C4"), 1.0), 0, pan=-0.1)
    place(b, choir(chord("C3", "G3", "C4", "Eb4"), 2.4, "ah")[:, : int(6.0 * SR)], 0.2, gain=1.6)
    place(b, choir(chord("C3", "G3", "C4", "E4"), 2.2, "ah")[:, : int(5.0 * SR)], 2.4, gain=1.4)
    for i, n in enumerate(("G4", "C5", "E5", "G5", "C6")):
        place(b, piano(midi(n), 0.45, 2.0), 2.4 + i * 0.12, pan=-0.4 + i * 0.2, gain=0.6)
    place(b, funeral_bell(midi("C5"), 0.6), 2.4, pan=0.2)
    s["win"] = finish_sfx(b, 0.5, 0.78, 4.0)

    b = sfx_bus(2.0)
    nn = int(0.5 * SR)
    tn = np.arange(nn) / SR
    place(b, bp(rng.standard_normal(nn), 400, 3000) * (tn / 0.5) ** 2 * np.exp(-((tn - 0.42) / 0.08) ** 2), 0, gain=0.6)
    place(b, funeral_bell(midi("G5"), 0.5), 0.4, pan=0.2)
    place(b, piano(midi("C5"), 0.45, 1.2), 0.42, gain=0.6)
    place(b, piano(midi("G5"), 0.35, 1.2), 0.5, gain=0.5)
    s["lantern"] = finish_sfx(b, 0.45, 0.65)

    b = sfx_bus(4.5)
    nn = int(4.0 * SR)
    tn = np.arange(nn) / SR
    rumble = lp(rng.standard_normal(nn), 120, 4) * np.sin(np.pi * tn / 4.0) ** 1.5
    grit = bp(rng.standard_normal(nn), 400, 2500) * (np.sin(np.pi * tn / 4.0) ** 4) * (rng.random(nn) < 0.002)
    place(b, rumble, 0, gain=1.0)
    place(b, lp(grit, 3000), 0, gain=2.0)
    place(b, deep_drum(0.3), 0.6, gain=0.4)
    s["rumble"] = finish_sfx(b, 0.4, 0.7)

    for name, sig in s.items():
        one.to_mp3(sig, os.path.join(OUT, "sfx", f"{name}.mp3"), "128k")


def main():
    music = render_music()
    tail = music[:, : 2 * SR]
    one.to_mp3(np.hstack([music, tail]), os.path.join(OUT, "OkaWorld2.mp3"), "192k")
    print(f"loop length {LOOP:.4f}s")
    render_sfx()


if __name__ == "__main__":
    main()
