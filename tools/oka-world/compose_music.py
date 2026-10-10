"""Renders the Oka World soundtrack and sound effects.

"Lanternlight Under Stone": D Dorian, 72 BPM, 32 bars. A breathing string pad
over a low drone, harp arpeggios, a kalimba ostinato, a wooden flute melody,
soft frame drum and cave water drips, all in a long convolution reverb.

The loop is rendered circularly (tails that run past the end wrap to the
start) and the MP3 carries LOOP + 2 s so the player can loop between 1 s and
1 s + LOOP regardless of any decoder priming delay.

    python3 tools/oka-world/compose_music.py
"""
import os
import subprocess
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve, butter, sosfilt

SR = 44100
BPM = 72.0
BEAT = 60.0 / BPM
BARS = 32
LOOP = BARS * 4 * BEAT
N = int(round(LOOP * SR))
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "src", "components", "scenes", "OkaWorld"))
rng = np.random.default_rng(7)

NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi(name):
    """'D4' -> 62, 'Bb3' -> 58"""
    n = NOTE[name[0]]
    rest = name[1:]
    if rest.startswith("b"):
        n -= 1
        rest = rest[1:]
    elif rest.startswith("#"):
        n += 1
        rest = rest[1:]
    return 12 * (int(rest) + 1) + n


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


class Bus:
    def __init__(self):
        self.buf = np.zeros((2, N + SR * 12))

    def add(self, sig, t, pan=0.0, gain=1.0):
        i = int(round(t * SR))
        if sig.ndim == 1:
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            sig = np.vstack([sig * l, sig * r])
        end = min(i + sig.shape[1], self.buf.shape[1])
        self.buf[:, i:end] += sig[:, : end - i] * gain

    def loop(self):
        """Fold everything past the loop end back onto the start."""
        out = self.buf[:, :N].copy()
        k = N
        while k < self.buf.shape[1]:
            seg = self.buf[:, k:k + N]
            out[:, : seg.shape[1]] += seg
            k += N
        return out


def env_adsr(n, a, d, s, r, total):
    t = np.arange(n) / SR
    e = np.ones(n) * s
    e = np.where(t < a, t / max(a, 1e-4), e)
    dmask = (t >= a) & (t < a + d)
    e = np.where(dmask, 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    rel = t >= total
    e = np.where(rel, s * np.exp(-(t - total) / max(r, 1e-4) * 3), e)
    return e


# ------------------------------------------------------------------ voices

def pad_chord(notes, dur):
    """Ensemble pad: detuned additive voices with slowly drifting partials."""
    tail = 3.5
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        f0 = hz(m)
        for v, cents in enumerate((-7, 0, 6)):
            f = f0 * 2 ** (cents / 1200)
            pan = (-0.55, 0.0, 0.55)[v]
            sig = np.zeros(n)
            for k in range(1, 16):
                fk = f * k
                if fk > 7000:
                    break
                amp = k ** -1.45
                lfo = 0.75 + 0.25 * np.sin(2 * np.pi * rng.uniform(0.07, 0.29) * t + rng.uniform(0, 6.28))
                sig += amp * lfo * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28))
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            out[0] += sig * l
            out[1] += sig * r
    a = 1.6
    e = np.clip(t / a, 0, 1) ** 1.5
    e *= np.where(t > dur, np.exp(-(t - dur) / 1.1), 1.0)
    out *= e
    out = sosfilt(butter(2, 4200, "low", fs=SR, output="sos"), out, axis=1)
    out = sosfilt(butter(1, 110, "high", fs=SR, output="sos"), out, axis=1)
    return out / (len(notes) * 3)


def shimmer(notes, dur):
    """Glassy high chord tones that glint in and out, like light on crystal."""
    n = int((dur + 2.5) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for i, m in enumerate(notes[-3:]):
        f = hz(m + 24)
        trem = 0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.15, 0.4) * t + rng.uniform(0, 6.28))
        sig = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t)) * trem ** 2
        pan = (-0.7, 0.0, 0.7)[i % 3]
        out[0] += sig * np.cos((pan + 1) * np.pi / 4)
        out[1] += sig * np.sin((pan + 1) * np.pi / 4)
    e = np.clip(t / 2.0, 0, 1) * np.where(t > dur, np.exp(-(t - dur) / 0.8), 1.0)
    return out * e / 3


def drone(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    swell = 0.7 + 0.3 * np.sin(2 * np.pi * t / 13.3)
    sig = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t + 1.1)
           + 0.12 * np.sin(2 * np.pi * 3.01 * f * t + 0.4)) * swell
    return sig


def harp(m, vel=1.0):
    f = hz(m)
    dur = 4.0 if f < 300 else 3.0
    n = int(dur * SR)
    t = np.arange(n) / SR
    tau0 = 2.4 * (220 / f) ** 0.35
    sig = np.zeros(n)
    for k in range(1, 11):
        if f * k > 9000:
            break
        a = abs(np.sin(k * np.pi * 0.21)) / k ** 1.2
        tau = tau0 / (1 + 0.55 * (k - 1))
        inh = 1 + 0.0004 * k * k
        sig += a * np.exp(-t / tau) * np.sin(2 * np.pi * f * k * inh * t + rng.uniform(0, 0.3))
    att = np.clip(t / 0.004, 0, 1)
    pluck = rng.standard_normal(n) * np.exp(-t / 0.006) * 0.15
    sos = butter(2, min(f * 6, 9000), "low", fs=SR, output="sos")
    return (sig * att + sosfilt(sos, pluck)) * vel * 0.5


def kalimba(m, vel=1.0):
    f = hz(m)
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    sig = (np.exp(-t / 0.9) * np.sin(2 * np.pi * f * t)
           + 0.28 * np.exp(-t / 0.12) * np.sin(2 * np.pi * f * 5.95 * t)
           + 0.10 * np.exp(-t / 0.05) * np.sin(2 * np.pi * f * 13.1 * t)
           + 0.15 * np.exp(-t / 0.35) * np.sin(2 * np.pi * f * 2.0 * t))
    att = np.clip(t / 0.002, 0, 1)
    return sig * att * vel * 0.45


def bell(m, vel=1.0):
    f = hz(m)
    n = int(5.0 * SR)
    t = np.arange(n) / SR
    parts = [(1.0, 1.0, 3.2), (2.0, 0.5, 2.0), (2.76, 0.35, 1.4), (5.4, 0.2, 0.7), (8.93, 0.1, 0.35)]
    sig = sum(a * np.exp(-t / tau) * np.sin(2 * np.pi * f * r * t) for r, a, tau in parts)
    return sig * np.clip(t / 0.003, 0, 1) * vel * 0.25


def frame_drum(vel=1.0):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    f = 46 + 40 * np.exp(-t / 0.05)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.32)
    skin = rng.standard_normal(n) * np.exp(-t / 0.02)
    sos = butter(2, [120, 900], "band", fs=SR, output="sos")
    return (body + 0.25 * sosfilt(sos, skin)) * vel * 0.6


def drip(m):
    f = hz(m)
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    glide = f * (1 + 0.9 * np.exp(-t / 0.012))
    ph = 2 * np.pi * np.cumsum(glide) / SR
    sig = np.sin(ph) * np.exp(-t / 0.07) + 0.3 * np.sin(1.5 * ph) * np.exp(-t / 0.03)
    return sig * np.clip(t / 0.001, 0, 1) * 0.35


def flute_line(events, start):
    """events: list of (midi or None, beats). Rendered as one legato breath line."""
    total = sum(b for _, b in events) * BEAT + 1.5
    n = int(total * SR)
    t = np.arange(n) / SR
    freq = np.zeros(n)
    amp = np.zeros(n)
    cur = 0.0
    prev_f = None
    for m, beats in events:
        d = beats * BEAT
        i0, i1 = int(cur * SR), int((cur + d) * SR)
        if m is not None:
            f = hz(m)
            seg_t = np.arange(i1 - i0) / SR
            if prev_f is not None:
                port = np.exp(-seg_t / 0.035)
                fseg = f * (prev_f / f) ** port
            else:
                fseg = np.full(i1 - i0, f)
            vib_depth = np.clip((seg_t - 0.35) / 0.6, 0, 1) * 0.0045
            fseg = fseg * (1 + vib_depth * np.sin(2 * np.pi * 5.1 * seg_t))
            freq[i0:i1] = fseg
            a = np.clip(seg_t / 0.08, 0, 1) * (0.88 + 0.12 * np.clip(seg_t / 0.6, 0, 1))
            a *= np.clip((d - seg_t) / 0.12, 0.35, 1)
            amp[i0:i1] = a
            prev_f = f
        else:
            prev_f = None
        cur += d
    last = int(cur * SR)
    freq[last:] = freq[last - 1] if last > 0 else 0
    amp[last:] = 0
    # release tails
    amp = sosfilt(butter(1, 18, "low", fs=SR, output="sos"), amp)
    ph = 2 * np.pi * np.cumsum(freq) / SR
    tone = np.sin(ph) + 0.22 * np.sin(2 * ph + 0.3) + 0.07 * np.sin(3 * ph + 0.9) + 0.025 * np.sin(4 * ph)
    breath = rng.standard_normal(n)
    breath = sosfilt(butter(2, [900, 4200], "band", fs=SR, output="sos"), breath)
    sig = (tone + breath * 0.2) * amp
    sig = sosfilt(butter(2, 7500, "low", fs=SR, output="sos"), sig)
    return sig * 0.42, start


# ------------------------------------------------------------------ score

def chord(*names):
    return [midi(x) for x in names]


A_PROG = [
    (chord("D3", "A3", "C4", "E4", "F4"), "D2"),
    (chord("B2", "G3", "D4", "E4"), "G1"),
    (chord("F3", "A3", "C4", "E4", "G4"), "F2"),
    (chord("E3", "G3", "C4", "D4"), "C2"),
]
B_PROG = [
    (chord("F3", "A3", "C4", "E4"), "F2"),
    (chord("G3", "B3", "D4", "E4"), "G2"),
    (chord("A3", "C4", "E4", "G4"), "A2"),
    (chord("A3", "D4", "E4", "G4"), "A2"),
]
SECTIONS = ["A", "A", "B", "A"]


def progression():
    seq = []
    for s in SECTIONS:
        seq += A_PROG if s == "A" else B_PROG
    return seq


def melody_a2():
    return [("A4", 2), ("C5", 1), ("D5", 1), ("E5", 3), ("D5", 1),
            ("B4", 2), ("G4", 1), ("A4", 1), ("D5", 4),
            ("C5", 1.5), ("A4", 0.5), ("F4", 1), ("G4", 1), ("A4", 2), ("E5", 2),
            ("D5", 1), ("C5", 1), ("G4", 1), ("E4", 1), ("A4", 4)]


def melody_b():
    return [("F5", 4), ("E5", 2), ("C5", 2), ("D5", 4), ("B4", 2), ("G4", 2),
            ("C5", 3), ("E5", 1), ("E5", 2), ("D5", 2), ("E5", 4), (None, 4)]


def melody_a3():
    return [("D5", 2), ("E5", 1), ("F5", 1), ("A5", 3), ("G5", 1),
            ("E5", 2), ("D5", 1), ("B4", 1), ("D5", 4),
            ("C5", 1.5), ("A4", 0.5), ("F4", 1), ("A4", 1), ("G4", 2), ("E5", 2),
            ("D5", 6), (None, 2)]


def render_music():
    dry = Bus()
    verb = Bus()
    prog = progression()
    bar = 4 * BEAT
    for ci, (notes, root) in enumerate(prog):
        t0 = ci * 2 * bar
        p = pad_chord(notes, 2 * bar + 0.25)
        dry.add(p, t0, gain=0.55)
        verb.add(p, t0, gain=0.35)
        d = drone(midi(root), 2 * bar + 0.6)
        fade = np.minimum(1, np.minimum(np.arange(d.size) / (0.3 * SR), (d.size - np.arange(d.size)) / (0.3 * SR)))
        dry.add(d * fade, t0, gain=0.08)
        sec = SECTIONS[ci // 4]
        if ci >= 4:
            sh = shimmer(notes, 2 * bar)
            dry.add(sh, t0, gain=0.035)
            verb.add(sh, t0, gain=0.09)
        ladder = sorted(notes + [x + 12 for x in notes])
        # harp arpeggio
        if ci < 2:
            pattern = [0, 2, 4, 3]
            step = BEAT
        else:
            pattern = [0, 2, 4, 6, 7, 6, 4, 2]
            step = BEAT / 2
        k = 0
        tt = 0.0
        while tt < 2 * bar - 1e-6:
            idx = pattern[k % len(pattern)] % len(ladder)
            vel = 0.8 + 0.2 * rng.random()
            if k % len(pattern) == 0:
                vel *= 1.15
            h = harp(ladder[idx] + 12 if sec == "B" and idx > 4 else ladder[idx], vel)
            pan = -0.35 + 0.7 * (idx / max(1, len(ladder) - 1))
            jitter = rng.normal(0, 0.006)
            dry.add(h, t0 + tt + jitter, pan=pan, gain=0.33 if sec != "B" else 0.26)
            verb.add(h, t0 + tt + jitter, pan=pan, gain=0.22)
            k += 1
            tt += step
        # kalimba ostinato in B and A3
        if sec == "B" or ci >= 12:
            kpat = [4, None, 6, 5, None, 4, 7, None]
            for j, ki in enumerate(kpat * 2):
                if ki is None:
                    continue
                kt = t0 + j * BEAT / 2 + BEAT / 4
                kn = ladder[ki % len(ladder)] + 12
                s = kalimba(kn, 0.7 + 0.3 * rng.random())
                dry.add(s, kt, pan=0.45, gain=0.22 if sec == "B" else 0.14)
                verb.add(s, kt, pan=0.45, gain=0.16)
        # frame drum in B and A3
        if sec == "B" or ci >= 12:
            for b in range(8):
                if b % 2 == 0:
                    v = 1.0 if b % 4 == 0 else 0.7
                    s = frame_drum(v)
                    dry.add(s, t0 + b * BEAT, pan=-0.1, gain=0.30 if sec == "B" else 0.2)
                    verb.add(s, t0 + b * BEAT, gain=0.08)
            s = frame_drum(0.35)
            dry.add(s, t0 + 7.5 * BEAT, pan=0.1, gain=0.2)
        # bell at section starts
        if ci % 4 == 0:
            s = bell(notes[-1] + 12, 0.8)
            dry.add(s, t0, pan=0.25, gain=0.25)
            verb.add(s, t0, pan=0.25, gain=0.4)

    def mel(events, bar_index):
        ev = [(None if n is None else midi(n), b) for n, b in events]
        sig, _ = flute_line(ev, 0)
        t0 = bar_index * bar
        dry.add(sig, t0, pan=0.08, gain=0.62)
        verb.add(sig, t0, pan=0.08, gain=0.45)

    mel(melody_a2(), 8)
    mel(melody_b(), 16)
    mel(melody_a3(), 24)

    # cave water drips
    drip_notes = [midi(x) for x in ("D6", "E6", "A6", "C7", "G6", "D7", "B6")]
    t = 0.7
    while t < LOOP:
        s = drip(drip_notes[rng.integers(len(drip_notes))])
        pan = rng.uniform(-0.9, 0.9)
        dry.add(s, t, pan=pan, gain=0.07)
        verb.add(s, t, pan=pan, gain=0.32)
        t += rng.exponential(2.3) + 0.4

    d = dry.loop()
    w = verb.loop()
    ir = impulse(5.5)
    wet = np.zeros_like(w)
    for ch in range(2):
        conv = fftconvolve(w[ch], ir[ch])
        folded = conv[:N].copy()
        k = N
        while k < conv.size:
            seg = conv[k:k + N]
            folded[: seg.size] += seg
            k += N
        wet[ch] = folded
    mix = d + wet * 0.55
    mix = sosfilt(butter(2, 32, "high", fs=SR, output="sos"), mix, axis=1)
    air = sosfilt(butter(1, 2800, "high", fs=SR, output="sos"), mix, axis=1)
    mud = sosfilt(butter(1, [280, 900], "band", fs=SR, output="sos"), mix, axis=1)
    mix = mix + 0.9 * air - 0.25 * mud
    return master(mix)


def impulse(seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    for ch in range(2):
        noise = rng.standard_normal(n)
        # darkening tail: blend progressively lowpassed noise
        lp1 = sosfilt(butter(2, 6000, "low", fs=SR, output="sos"), noise)
        lp2 = sosfilt(butter(2, 3200, "low", fs=SR, output="sos"), noise)
        blend = np.clip(t / seconds * 1.6, 0, 1)
        tail = lp1 * (1 - blend) + lp2 * blend
        e = np.exp(-t / (seconds / 6.2)) * np.clip(t / 0.02, 0, 1)
        ir[ch] = tail * e
        # early reflections off cave walls
        for _ in range(14):
            i = int(rng.uniform(0.008, 0.09) * SR)
            ir[ch, i] += rng.uniform(-0.6, 0.6)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    return ir * 0.6


def master(mix):
    peak = np.abs(mix).max()
    mix = mix / peak * 1.4
    mix = np.tanh(mix) / np.tanh(1.4)
    rms = np.sqrt((mix ** 2).mean())
    target = 10 ** (-17 / 20)
    mix *= min(target / rms, 0.93 / np.abs(mix).max())
    return mix


def to_mp3(stereo, path, bitrate="192k"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as fh:
        tmp = fh.name
    data = np.clip(stereo.T, -1, 1)
    wavfile.write(tmp, SR, (data * 32767).astype(np.int16))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame",
                    "-b:a", bitrate, path], check=True)
    os.remove(tmp)
    print("wrote", os.path.relpath(path, os.path.join(HERE, "..", "..")), f"{stereo.shape[1] / SR:.2f}s")


# ------------------------------------------------------------------ sfx

def sfx_bus(seconds):
    return np.zeros((2, int(seconds * SR)))


def place(buf, sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if sig.ndim == 1:
        sig = np.vstack([sig * np.cos((pan + 1) * np.pi / 4), sig * np.sin((pan + 1) * np.pi / 4)])
    end = min(buf.shape[1], i + sig.shape[1])
    buf[:, i:end] += sig[:, : end - i] * gain


def finish_sfx(buf, verb=0.25, peak=0.8):
    ir = impulse(1.6)
    wet = np.vstack([fftconvolve(buf[c], ir[c])[: buf.shape[1]] for c in range(2)])
    out = buf + wet * verb
    n = out.shape[1]
    fade = np.minimum(1, (n - np.arange(n)) / (0.05 * SR))
    out *= fade
    return out / np.abs(out).max() * peak


def render_sfx():
    s = {}
    b = sfx_bus(0.9)
    noise = rng.standard_normal(int(0.25 * SR))
    tt = np.arange(noise.size) / SR
    whoosh = sosfilt(butter(2, [600, 3000], "band", fs=SR, output="sos"), noise) * np.sin(np.pi * tt / 0.25) ** 2
    place(b, whoosh, 0, gain=0.5)
    place(b, harp(midi("D5"), 0.7), 0.0)
    place(b, harp(midi("A5"), 0.5), 0.05)
    s["jump"] = finish_sfx(b, 0.15, 0.55)

    b = sfx_bus(1.6)
    place(b, bell(midi("A6"), 1.0), 0, pan=-0.2)
    place(b, bell(midi("D7"), 0.8), 0.07, pan=0.2)
    place(b, kalimba(midi("E7"), 0.5), 0.12)
    s["crystal"] = finish_sfx(b, 0.4, 0.7)

    b = sfx_bus(2.2)
    for i, n in enumerate(("D5", "F5", "A5", "C6", "E6")):
        place(b, harp(midi(n), 0.9), i * 0.06, pan=-0.4 + i * 0.2)
    place(b, bell(midi("D6"), 0.6), 0.3)
    s["heart"] = finish_sfx(b, 0.4, 0.7)

    b = sfx_bus(0.8)
    place(b, frame_drum(1.0), 0, gain=1.0)
    tn = np.arange(int(0.4 * SR)) / SR
    fall = np.sin(2 * np.pi * np.cumsum(330 * np.exp(-tn / 0.25)) / SR) * np.exp(-tn / 0.12)
    place(b, fall, 0.02, gain=0.35)
    s["hurt"] = finish_sfx(b, 0.2, 0.75)

    b = sfx_bus(0.7)
    place(b, frame_drum(1.0), 0)
    grit = rng.standard_normal(int(0.12 * SR)) * np.exp(-np.arange(int(0.12 * SR)) / SR / 0.03)
    place(b, sosfilt(butter(2, [300, 2500], "band", fs=SR, output="sos"), grit), 0, gain=0.6)
    place(b, harp(midi("A4"), 0.6), 0.02)
    s["stomp"] = finish_sfx(b, 0.15, 0.75)

    b = sfx_bus(1.2)
    nn = int(0.7 * SR)
    tn = np.arange(nn) / SR
    burst = sosfilt(butter(2, [400, 5000], "band", fs=SR, output="sos"), rng.standard_normal(nn))
    burst *= np.exp(-tn / 0.12) * np.clip(tn / 0.005, 0, 1)
    place(b, burst, 0, gain=0.8)
    for i in range(7):
        place(b, drip(midi("A5") + int(rng.integers(0, 14))), 0.05 + rng.uniform(0, 0.45), pan=rng.uniform(-0.6, 0.6), gain=0.5)
    s["splash"] = finish_sfx(b, 0.3, 0.6)

    b = sfx_bus(5.0)
    scale = ["D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "A5", "D6"]
    for i, n in enumerate(scale):
        place(b, harp(midi(n), 0.8), i * 0.07, pan=-0.6 + i * 0.1)
    for n, t0 in (("D6", 0.9), ("A6", 1.0), ("D7", 1.15)):
        place(b, bell(midi(n), 0.9), t0)
    place(b, pad_chord(chord("D4", "F4", "A4", "E5"), 2.0)[:, : int(4.0 * SR)], 0.8, gain=0.9)
    s["win"] = finish_sfx(b, 0.5, 0.75)

    for name, sig in s.items():
        to_mp3(sig, os.path.join(OUT, "sfx", f"{name}.mp3"), "128k")


def main():
    music = render_music()
    tail = music[:, : 2 * SR]
    to_mp3(np.hstack([music, tail]), os.path.join(OUT, "OkaWorld.mp3"))
    print(f"loop length {LOOP:.4f}s")
    render_sfx()


if __name__ == "__main__":
    main()
