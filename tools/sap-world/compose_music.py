"""Renders the 'Forest Last Sap World' soundtrack, C-minor harmonic SFX, and scene badge.

Track: "Last Sap of the Heartwood"
Key:   C minor (C, D, Eb, F, G, Ab, Bb)
Tempo: 106 BPM (downtempo minimal tech house / Detroit techno)
Length: 64 bars of 4/4 (144.9057 s) + 2 s circular loop tail

Arrangement (64 bars, 4 sections of 16 bars):
  Bars  0-15 (Intro / Deep Moss):
    Four-on-the-floor C1/C2 sub kick, crisp swung 16th minimal hats, wood-click
    percussion tuned to C5/G5, rolling C-minor sub-bass, and dark Detroit dub
    chord stabs through a dotted-eighth ping-pong tape delay.
  Bars 16-31 (Canopy Groove):
    Snappy minimal claps on 2 & 4, offbeat smoky open hat, warm Detroit string
    pad in C minor (Cm9 -> Abmaj9 -> Fm9 -> Gm7), and hypnotic minimal arp.
  Bars 32-47 (The Hollow Crossing - Dub Breakdown & Build):
    First 8 bars strip the kick to let the C-minor dub chords, sub-bass pulse,
    and soulful Detroit analog lead breathe across the chasm; bars 40-47 bring
    the four-on-the-floor groove back with resonant filter opening.
  Bars 48-63 (Heartwood Cistern - Full Detroit Tech Flow):
    Full groove with driving minimal percussion, Detroit chord stabs, warm pad,
    and a high C-minor synth lead that folds seamlessly back into Bar 0.

Every sound effect in `sfx/` is tuned strictly to C minor so every interaction
(grabbing, attaching strands, detaching ivy sap, waking groves, strand strain,
snapping, signpost lore, pipe suction, and level clear) plays in key with the
score.

Usage:
    python3 tools/sap-world/compose_music.py
"""
import os
import struct
import subprocess
import tempfile
import wave
import zlib

import numpy as np

SR = 44100
BPM = 106.0
BEAT = 60.0 / BPM
SIXTEENTH = BEAT / 4.0
BAR = 4.0 * BEAT
BARS = 64
LOOP = BARS * BAR
N = int(round(LOOP * SR))

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "src", "components", "scenes", "SapWorld"))
rng = np.random.default_rng(20261020)

NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi(name: str) -> int:
    """Convert note name like 'C2', 'Eb4', 'Ab3' to MIDI note number."""
    n = NOTE[name[0]]
    rest = name[1:]
    if rest.startswith("b"):
        n -= 1
        rest = rest[1:]
    elif rest.startswith("#"):
        n += 1
        rest = rest[1:]
    return 12 * (int(rest) + 1) + n


def hz(m: float) -> float:
    return 440.0 * (2.0 ** ((m - 69.0) / 12.0))


def chord(*names: str) -> list[int]:
    return [midi(x) for x in names]


# ------------------------------------------------------------------ FFT filters & DSP

def fft_filter(sig: np.ndarray, lo_hz: float | None = None, hi_hz: float | None = None, order: int = 2) -> np.ndarray:
    """Zero-phase / smooth Butterworth-magnitude frequency-domain filter (works on 1D or 2D stereo)."""
    n = sig.shape[-1]
    freqs = np.fft.rfftfreq(n, d=1.0 / SR)
    mask = np.ones_like(freqs)
    if lo_hz is not None and lo_hz > 0:
        # high-pass with smooth Butterworth roll-off
        ratio = np.maximum(freqs, 1e-3) / lo_hz
        mask *= 1.0 / np.sqrt(1.0 + ratio ** (-2 * order))
        mask[0] = 0.0
    if hi_hz is not None and hi_hz > 0:
        # low-pass with smooth Butterworth roll-off
        ratio = freqs / hi_hz
        mask *= 1.0 / np.sqrt(1.0 + ratio ** (2 * order))
    spec = np.fft.rfft(sig, axis=-1)
    return np.fft.irfft(spec * mask, n=n, axis=-1)


def lp(sig: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    return fft_filter(sig, lo_hz=None, hi_hz=cutoff, order=order)


def hp(sig: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    return fft_filter(sig, lo_hz=cutoff, hi_hz=None, order=order)


def bp(sig: np.ndarray, lo_hz: float, hi_hz: float, order: int = 2) -> np.ndarray:
    return fft_filter(sig, lo_hz=lo_hz, hi_hz=hi_hz, order=order)


def fft_convolve_1d(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    n = a.size + b.size - 1
    fft_len = 1 << (n - 1).bit_length()
    A = np.fft.rfft(a, fft_len)
    B = np.fft.rfft(b, fft_len)
    return np.fft.irfft(A * B, fft_len)[:n]


def pan2(sig: np.ndarray, pan: float) -> np.ndarray:
    angle = (np.clip(pan, -1.0, 1.0) + 1.0) * (np.pi / 4.0)
    return np.vstack([sig * np.cos(angle), sig * np.sin(angle)])


def fold(buf: np.ndarray, loop_samples: int = N) -> np.ndarray:
    """Wrap any reverb/delay tail past the loop end seamlessly onto the start."""
    out = buf[..., :loop_samples].copy()
    k = loop_samples
    while k < buf.shape[-1]:
        seg = buf[..., k:k + loop_samples]
        out[..., :seg.shape[-1]] += seg
        k += loop_samples
    return out


class Bus:
    def __init__(self, extra_seconds: float = 16.0):
        self.buf = np.zeros((2, N + int(SR * extra_seconds)), dtype=np.float64)

    def add(self, sig: np.ndarray, t: float, pan: float = 0.0, gain: float = 1.0) -> None:
        i = int(round(t * SR)) % N
        if sig.ndim == 1:
            sig = pan2(sig, pan)
        end = min(i + sig.shape[1], self.buf.shape[1])
        if end > i:
            self.buf[:, i:end] += sig[:, :end - i] * gain

    def loop(self) -> np.ndarray:
        return fold(self.buf, N)


# ------------------------------------------------------------------ Detroit / Minimal Tech Voices (Key of C Minor)

def kick_909_cm(accent: float = 1.0) -> np.ndarray:
    """Deep 909/minimal tech kick whose body settles on C1 (32.70 Hz) / C2 (65.41 Hz)."""
    n = int(0.46 * SR)
    t = np.arange(n) / SR
    f_c1 = hz(midi("C1"))  # 32.70 Hz
    f_c2 = hz(midi("C2"))  # 65.41 Hz
    # Fast transient pitch drop from G3 -> C2 -> C1
    freq = f_c1 + (f_c2 - f_c1) * np.exp(-t / 0.11) + 190.0 * np.exp(-t / 0.009)
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    sub = np.sin(phase) * np.exp(-t / 0.24)
    punch = np.sin(phase * 1.5) * np.exp(-t / 0.035) * 0.28
    click = lp(rng.standard_normal(n) * np.exp(-t / 0.0035), 3600) * 0.16
    raw = (sub + punch + click) * np.clip(t / 0.0012, 0.0, 1.0)
    return np.tanh(raw * 1.45 * accent) * 0.78


def hihat_closed(vel: float = 1.0, decay: float = 0.038) -> np.ndarray:
    """Crisp metallic minimal closed hat with harmonic shimmer."""
    n = int(0.14 * SR)
    t = np.arange(n) / SR
    # 6 metallic square/sine ratios around C6/G6 cluster
    c6 = hz(midi("C6"))
    ratios = [1.0, 1.342, 1.618, 1.92, 2.51, 3.18]
    metal = sum(np.sign(np.sin(2.0 * np.pi * c6 * r * t + i)) for i, r in enumerate(ratios)) / len(ratios)
    noise = rng.standard_normal(n)
    src = bp(0.45 * metal + 0.55 * noise, 6800, 15500)
    env = np.exp(-t / decay) * np.clip(t / 0.001, 0.0, 1.0)
    return src * env * vel * 0.32


def hihat_open(vel: float = 1.0) -> np.ndarray:
    """Smoky off-beat minimal tech house open hat."""
    n = int(0.38 * SR)
    t = np.arange(n) / SR
    c6 = hz(midi("C6"))
    ratios = [1.0, 1.498, 1.888, 2.378, 2.996, 3.72]
    metal = sum(np.sin(2.0 * np.pi * c6 * r * t + i * 0.7) for i, r in enumerate(ratios)) / len(ratios)
    noise = rng.standard_normal(n)
    src = bp(0.5 * metal + 0.5 * noise, 5800, 14800)
    env = np.clip(t / 0.008, 0.0, 1.0) * (0.65 * np.exp(-t / 0.11) + 0.35 * np.exp(-t / 0.21))
    return src * env * vel * 0.26


def minimal_clap_rim(vel: float = 1.0) -> np.ndarray:
    """Tight tech-house clap + rimshot tuned to C4/G4."""
    n = int(0.24 * SR)
    t = np.arange(n) / SR
    # Triple micro-slap envelope + snappy tail
    env = (
        0.7 * np.exp(-np.maximum(0.0, t - 0.0) / 0.006)
        + 0.8 * np.exp(-np.maximum(0.0, t - 0.009) / 0.006) * (t >= 0.009)
        + 1.0 * np.exp(-np.maximum(0.0, t - 0.018) / 0.048) * (t >= 0.018)
    )
    body_noise = bp(rng.standard_normal(n), 950, 3800) * env
    # Tuned woody rim resonance at G4 & C5
    rim = (
        np.sin(2.0 * np.pi * hz(midi("G4")) * t) * np.exp(-t / 0.014)
        + 0.6 * np.sin(2.0 * np.pi * hz(midi("C5")) * t) * np.exp(-t / 0.009)
    )
    return (body_noise * 0.45 + rim * 0.35) * vel * 0.48


def wood_click(m: int, vel: float = 1.0) -> np.ndarray:
    """Minimal micro-percussion hollow wood/amber droplet tuned to a C-minor scale degree."""
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    f = hz(m)
    sig = (
        np.sin(2.0 * np.pi * f * t) * np.exp(-t / 0.028)
        + 0.45 * np.sin(2.0 * np.pi * f * 2.0 * t + 0.4) * np.exp(-t / 0.012)
        + 0.25 * np.sin(2.0 * np.pi * f * 3.0 * t + 1.1) * np.exp(-t / 0.005)
    )
    return sig * np.clip(t / 0.001, 0.0, 1.0) * vel * 0.36


def sub_bass_note(m: int, dur: float, accent: float = 1.0, bright: float = 0.5) -> np.ndarray:
    """Rolling minimal tech house sub-bass in C minor: saturated sine + filtered saw harmonic."""
    n = int((dur + 0.06) * SR)
    t = np.arange(n) / SR
    f = hz(m)
    ph = 2.0 * np.pi * f * t
    # Fundamental + warm 2nd/3rd/4th harmonics with filter envelope decay
    f_env = np.exp(-t / (0.09 + 0.08 * bright))
    sig = (
        1.00 * np.sin(ph)
        + (0.45 + 0.35 * f_env) * np.sin(2.0 * ph + 0.3)
        + (0.20 + 0.30 * f_env * bright) * np.sin(3.0 * ph + 0.8)
        + (0.12 * f_env * bright) * np.sin(4.0 * ph + 1.2)
    )
    amp = np.clip(t / 0.006, 0.0, 1.0) * np.where(t < dur, np.exp(-t / (dur * 1.45)), np.exp(-(t - dur) / 0.018))
    out = np.tanh(sig * amp * (1.25 * accent))
    return lp(out, 260 + 280 * bright) * 0.52


def detroit_dub_stab(notes: list[int], dur: float = 0.42, cutoff_peak: float = 2400.0) -> np.ndarray:
    """Classic Detroit techno minor-9th chord stab with analog drift and resonant filter envelope."""
    n = int((dur + 0.35) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n), dtype=np.float64)
    # Time-varying harmonic brightness (simulating resonant low-pass envelope)
    env_amp = np.clip(t / 0.008, 0.0, 1.0) * np.exp(-t / (dur * 0.65))
    env_filt = np.clip(t / 0.015, 0.0, 1.0) * np.exp(-t / (dur * 0.42))

    for idx, m in enumerate(notes):
        f0 = hz(m)
        for v, cents in enumerate((-8.5, 0.0, 8.5)):
            f = f0 * (2.0 ** (cents / 1200.0))
            pan = (-0.55, 0.0, 0.55)[v] + 0.12 * (idx - len(notes) / 2.0)
            sig = np.zeros(n)
            for k in range(1, 14):
                fk = f * k
                if fk > 6500:
                    break
                # Resonant peak near dynamic cutoff
                cutoff_t = 340.0 + (cutoff_peak - 340.0) * env_filt
                res = 1.45 * np.exp(-((fk - cutoff_t) / (0.28 * cutoff_t)) ** 2)
                roll = 1.0 / np.sqrt(1.0 + (fk / cutoff_t) ** 6)
                harm_env = (roll + res * 0.55) / (k ** 0.88)
                sig += harm_env * np.sin(2.0 * np.pi * fk * t + rng.uniform(0, 2 * np.pi))
            out += pan2(sig, pan)

    out *= env_amp / (len(notes) * 2.6)
    return hp(lp(out, 4800), 130) * 0.58


def dub_tape_delay(stereo: np.ndarray, delay_sec: float, feedback: float = 0.54, taps: int = 7) -> np.ndarray:
    """Ping-pong dub tape delay with progressive high-cut and subtle saturation per echo."""
    d_samples = int(round(delay_sec * SR))
    total_len = stereo.shape[1] + d_samples * (taps + 1)
    out = np.zeros((2, total_len), dtype=np.float64)
    out[:, :stereo.shape[1]] += stereo
    echo = stereo.copy()
    for tap in range(1, taps + 1):
        # Progressive tape warmth: bandpass 220 Hz - (3400 -> 1400 Hz)
        hi = max(1200.0, 3400.0 - tap * 260.0)
        echo = bp(echo, 210.0, hi, order=1)
        # Ping-pong swap channels with slight cross-bleed
        echo = np.vstack([echo[1] * 0.88 + echo[0] * 0.12, echo[0] * 0.88 + echo[1] * 0.12]) * feedback
        echo = np.tanh(echo * 1.08) / 1.08
        start = tap * d_samples
        out[:, start:start + echo.shape[1]] += echo
    return out


def detroit_pad(notes: list[int], dur: float) -> np.ndarray:
    """Warm, breathing Detroit string/synth pad in C minor with slow sidechain-like pulse."""
    tail = 3.2
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n), dtype=np.float64)
    for m in notes:
        f0 = hz(m)
        for v, cents in enumerate((-9.0, -2.5, 3.0, 9.5)):
            f = f0 * (2.0 ** (cents / 1200.0))
            pan = (-0.65, -0.22, 0.22, 0.65)[v]
            sig = np.zeros(n)
            for k in range(1, 12):
                fk = f * k
                if fk > 4600:
                    break
                lfo = 0.78 + 0.22 * np.sin(2.0 * np.pi * rng.uniform(0.11, 0.31) * t + rng.uniform(0, 6.28))
                sig += (k ** -1.25) * lfo * np.sin(2.0 * np.pi * fk * t + rng.uniform(0, 6.28))
            out += pan2(sig, pan)
    att = np.clip(t / 1.4, 0.0, 1.0) ** 1.4
    rel = np.where(t > dur, np.exp(-(t - dur) / 1.05), 1.0)
    # Gentle quarter-note sidechain breathing at 106 BPM
    pump = 0.72 + 0.28 * (1.0 - np.exp(-((t % BEAT) / 0.18)))
    out = out * att * rel * pump / (len(notes) * 3.5)
    return hp(lp(out, 2900), 130) * 0.46


def minimal_arp_pluck(m: int, vel: float = 1.0, bright: float = 0.6) -> np.ndarray:
    """Glassy, hypnotic minimal techno pluck (Plastikman / Basic Channel / Detroit style)."""
    n = int(0.65 * SR)
    t = np.arange(n) / SR
    f = hz(m)
    env_f = np.exp(-t / (0.045 + 0.06 * bright))
    sig = (
        np.sin(2.0 * np.pi * f * t) * np.exp(-t / 0.26)
        + (0.55 * env_f + 0.12) * np.sin(2.0 * np.pi * f * 2.0 * t + 0.2) * np.exp(-t / 0.16)
        + (0.38 * env_f) * np.sin(2.0 * np.pi * f * 3.0 * t + 0.7) * np.exp(-t / 0.09)
        + (0.22 * env_f * bright) * np.sin(2.0 * np.pi * f * 4.0 * t + 1.3) * np.exp(-t / 0.05)
        + (0.14 * env_f * bright) * np.sin(2.0 * np.pi * f * 6.0 * t + 2.1) * np.exp(-t / 0.03)
    )
    att = np.clip(t / 0.0025, 0.0, 1.0)
    return sig * att * vel * 0.34


def detroit_lead_note(m: int, dur: float, vel: float = 0.8) -> np.ndarray:
    """Soulful, late-night Detroit analog synth lead in C minor with subtle vibrato."""
    n = int((dur + 0.5) * SR)
    t = np.arange(n) / SR
    f0 = hz(m)
    vib = 1.0 + np.clip((t - 0.18) / 0.35, 0.0, 1.0) * 0.0038 * np.sin(2.0 * np.pi * 5.2 * t)
    ph = 2.0 * np.pi * np.cumsum(f0 * vib) / SR
    ph2 = 2.0 * np.pi * np.cumsum(f0 * 1.0035 * vib) / SR
    sig = (
        0.55 * (np.sin(ph) + np.sin(ph2))
        + 0.28 * (np.sin(2.0 * ph + 0.4) + np.sin(2.0 * ph2 + 0.9))
        + 0.14 * np.sin(3.0 * ph + 1.1)
        + 0.07 * np.sin(4.0 * ph + 1.7)
    )
    env = np.clip(t / 0.045, 0.0, 1.0) * np.where(t < dur, 0.85 + 0.15 * np.sin(np.pi * t / max(dur, 0.01)), np.exp(-(t - dur) / 0.16))
    return lp(sig * env, 2800) * vel * 0.28


def impulse_reverb(seconds: float = 4.2, hi_cut: float = 3400.0) -> np.ndarray:
    """Warm dark stereo reverb impulse for dub chords and atmospheric forest depth."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n), dtype=np.float64)
    for ch in range(2):
        noise = rng.standard_normal(n)
        shaped = bp(noise, 110.0, hi_cut)
        env = np.exp(-t / (seconds / 5.8)) * np.clip(t / 0.015, 0.0, 1.0)
        ir[ch] = shaped * env
        for _ in range(14):
            idx = int(rng.uniform(0.009, 0.085) * SR)
            ir[ch, idx] += rng.uniform(-0.45, 0.45)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True) + 1e-12)
    return ir * 0.55


# ------------------------------------------------------------------ 64-Bar C Minor Score

# 4-chord cycle (2 bars per chord = 8 bars per cycle, repeated 8 times = 64 bars):
#   1. Cm9      (C3, Eb3, G3, Bb3, D4)   root C1/C2
#   2. Abmaj9   (Ab2, Eb3, G3, C4, Bb3)  root Ab1
#   3. Fm9      (F2, C3, Eb3, Ab3, G3)   root F1
#   4. Gm7(b13) (G2, D3, F3, Bb3, Eb4)   root G1
CHORD_CYCLE = [
    (chord("C3", "Eb3", "G3", "Bb3", "D4"), "C1", "C2"),
    (chord("Ab2", "Eb3", "G3", "Bb3", "C4"), "Ab1", "Ab2"),
    (chord("F2", "C3", "Eb3", "G3", "Ab3"), "F1", "F2"),
    (chord("G2", "D3", "F3", "Bb3", "Eb4"), "G1", "G2"),
]

# 16-step rolling minimal bass pattern per bar (in semitone offsets relative to chord root, or None for rest)
# Step 0 is beat 1 (ducked under kick), offbeats 2, 3, 6, 7, 10, 11, 14, 15 drive the minimal groove
BASS_STEPS_A = [
    None, None, (0, 0.95), (12, 0.65),
    None, (0, 0.55), (0, 0.90), None,
    None, None, (0, 0.95), (7, 0.70),
    None, (0, 0.60), (12, 0.85), (0, 0.60),
]

BASS_STEPS_B = [
    None, (0, 0.50), (0, 0.95), (12, 0.75),
    None, (7, 0.65), (0, 0.90), (10, 0.60),
    None, None, (0, 0.95), (12, 0.75),
    None, (7, 0.65), (3, 0.85), (0, 0.65),
]

# Soulful Detroit lead phrases (bar_offset, beat_in_bar, note_name, duration_beats)
LEAD_MELODY_S2 = [
    (0, 0.5, "G4", 1.5), (0, 2.0, "F4", 1.0), (0, 3.0, "Eb4", 1.5),
    (1, 1.0, "D4", 1.0), (1, 2.0, "C4", 2.0),
    (2, 0.5, "Eb4", 1.5), (2, 2.0, "G4", 1.0), (2, 3.0, "C5", 2.0),
    (3, 1.5, "Bb4", 1.5), (3, 3.0, "G4", 1.5),
    (4, 0.5, "Ab4", 1.5), (4, 2.0, "G4", 1.0), (4, 3.0, "F4", 1.5),
    (5, 1.0, "Eb4", 1.0), (5, 2.0, "C4", 2.0),
    (6, 0.5, "D4", 1.5), (6, 2.0, "Eb4", 1.0), (6, 3.0, "F4", 1.5),
    (7, 1.0, "G4", 2.5),
]

LEAD_MELODY_S4 = [
    (0, 0.0, "C5", 1.5), (0, 1.5, "Bb4", 1.0), (0, 2.5, "G4", 1.5),
    (1, 0.5, "Eb4", 1.5), (1, 2.0, "D4", 1.0), (1, 3.0, "C4", 1.5),
    (2, 0.5, "G4", 1.5), (2, 2.0, "Ab4", 1.0), (2, 3.0, "Bb4", 1.5),
    (3, 1.0, "C5", 2.5),
    (4, 0.5, "D5", 1.5), (4, 2.0, "C5", 1.0), (4, 3.0, "Bb4", 1.5),
    (5, 1.0, "Ab4", 1.5), (5, 2.5, "G4", 1.5),
    (6, 0.5, "F4", 1.5), (6, 2.0, "Eb4", 1.0), (6, 3.0, "D4", 1.5),
    (7, 1.0, "C4", 2.5),
]


def render_music() -> np.ndarray:
    dry = Bus()
    verb = Bus()

    # Pre-build common drum one-shots for speed and consistency
    kick_main = kick_909_cm(1.0)
    kick_soft = kick_909_cm(0.76)
    clap_main = minimal_clap_rim(0.95)
    hat_o = hihat_open(0.88)
    click_c5 = wood_click(midi("C5"), 0.8)
    click_g5 = wood_click(midi("G5"), 0.7)
    click_eb5 = wood_click(midi("Eb5"), 0.75)

    # Subtle 16th-note swing (18 ms on odd 16ths gives an authentic minimal tech groove)
    swing_sec = 0.016

    for bar_idx in range(BARS):
        t_bar = bar_idx * BAR
        section = bar_idx // 16  # 0: Intro, 1: Canopy Groove, 2: Breakdown/Build, 3: Full Flow
        in_breakdown = (32 <= bar_idx < 40)
        is_turnaround = (bar_idx % 8 == 7)

        chord_notes, root_lo, _ = CHORD_CYCLE[(bar_idx // 2) % len(CHORD_CYCLE)]
        root_midi = midi(root_lo)

        # 1. Four-on-the-floor Kick (resting during the first 8 bars of Section 2 breakdown)
        if not in_breakdown:
            for b in range(4):
                if is_turnaround and b == 3:
                    # Syncopated minimal double-kick pickup at end of 8-bar phrase
                    dry.add(kick_soft, t_bar + 3.0 * BEAT, gain=0.82)
                    dry.add(kick_soft, t_bar + 3.5 * BEAT, gain=0.72)
                else:
                    dry.add(kick_main, t_bar + b * BEAT, gain=0.92)

        # 2. Claps on beats 2 & 4 (bars 8..31 and 40..63)
        if (bar_idx >= 8 and not in_breakdown) or bar_idx >= 40:
            for b in (1, 3):
                dry.add(clap_main, t_bar + b * BEAT, pan=0.05, gain=0.72)
                verb.add(clap_main, t_bar + b * BEAT, pan=0.05, gain=0.26)

        # 3. Swung 16th closed hi-hats + offbeat open hi-hat
        for step in range(16):
            st_time = t_bar + step * SIXTEENTH + (swing_sec if step % 2 == 1 else 0.0)
            if step % 4 == 2 and bar_idx >= 4:
                # Off-beat ("&" of each beat): open hat + tight closed layer
                oh_gain = 0.55 if in_breakdown else 0.78
                dry.add(hat_o, st_time, pan=-0.12, gain=oh_gain)
                verb.add(hat_o, st_time, pan=-0.12, gain=0.14)
            else:
                vel = (0.42 if step % 4 == 0 else (0.72 if step % 2 == 1 else 0.54))
                decay = 0.046 if step % 4 == 3 else 0.032
                ch = hihat_closed(vel, decay)
                pan = -0.18 if step % 2 == 0 else 0.18
                dry.add(ch, st_time, pan=pan, gain=0.58 if in_breakdown else 0.74)

        # 4. Tuned C-minor wood/amber micro-percussion on syncopated 16ths
        for step, clk, pn in ((3, click_c5, -0.35), (6, click_g5, 0.35), (11, click_eb5, -0.25), (14, click_g5, 0.30)):
            if (bar_idx + step) % 2 == 0:
                st_time = t_bar + step * SIXTEENTH + (swing_sec if step % 2 == 1 else 0.0)
                dry.add(clk, st_time, pan=pn, gain=0.36)
                verb.add(clk, st_time, pan=pn, gain=0.22)

        # 5. Rolling C-minor Sub-Bassline
        bass_pat = BASS_STEPS_B if (section in (1, 3) or bar_idx >= 40) else BASS_STEPS_A
        bright = 0.38 if in_breakdown else (0.65 if section >= 1 else 0.48)
        for step, item in enumerate(bass_pat):
            if item is None:
                continue
            semitone, vel = item
            st_time = t_bar + step * SIXTEENTH + (swing_sec if step % 2 == 1 else 0.0)
            # Keep strictly in C minor scale
            note_m = root_midi + semitone
            b_sig = sub_bass_note(note_m, SIXTEENTH * 1.15, accent=vel, bright=bright)
            dry.add(b_sig, st_time, pan=0.0, gain=0.72 if in_breakdown else 0.86)

        # 6. Every 2 bars: Detroit Dub Chord Stabs + Warm Detroit Pad
        if bar_idx % 2 == 0:
            # Pad bed in sections 1, 2, 3 (and softly in bars 8-15)
            if bar_idx >= 8:
                pad_sig = detroit_pad(chord_notes, 2.0 * BAR + 0.25)
                pad_gain = 0.62 if in_breakdown else (0.50 if section >= 1 else 0.34)
                dry.add(pad_sig, t_bar, gain=pad_gain)
                verb.add(pad_sig, t_bar, gain=pad_gain * 0.75)

            # Detroit Dub Chord hits at dotted-quarter / syncopated techno positions:
            # Beat 0.75 (step 3) and Beat 4.5 (bar 2 beat 0.5)
            cutoff1 = 2600.0 if section in (1, 3) else (3100.0 if in_breakdown else 1900.0)
            stab1 = detroit_dub_stab(chord_notes, dur=0.38, cutoff_peak=cutoff1)
            delayed1 = dub_tape_delay(stab1, delay_sec=3.0 * SIXTEENTH, feedback=0.56, taps=7)
            hit1_t = t_bar + 3 * SIXTEENTH + swing_sec
            dry.add(delayed1, hit1_t, gain=0.62)
            verb.add(delayed1, hit1_t, gain=0.48)

            stab2 = detroit_dub_stab([x + 12 for x in chord_notes[:3]] + chord_notes[2:], dur=0.32, cutoff_peak=cutoff1 * 0.85)
            delayed2 = dub_tape_delay(stab2, delay_sec=3.0 * SIXTEENTH, feedback=0.52, taps=6)
            hit2_t = t_bar + BAR + 2.5 * BEAT
            dry.add(delayed2, hit2_t, gain=0.52)
            verb.add(delayed2, hit2_t, gain=0.44)

        # 7. Hypnotic Minimal Arp in C minor (active from bar 8 onward)
        if bar_idx >= 8:
            ladder = sorted(set(chord_notes + [x + 12 for x in chord_notes]))
            arp_steps = [0, None, 2, 4, None, 3, 5, None, 1, None, 4, 6, None, 5, 3, 2]
            arp_bright = 0.78 if (section == 3 or bar_idx >= 40) else 0.52
            for step, idx in enumerate(arp_steps):
                if idx is None:
                    continue
                st_time = t_bar + step * SIXTEENTH + (swing_sec if step % 2 == 1 else 0.0)
                m_note = ladder[idx % len(ladder)]
                vel = 0.65 + 0.25 * ((step % 3) / 2.0)
                plk = minimal_arp_pluck(m_note, vel=vel, bright=arp_bright)
                pan = -0.45 + 0.9 * ((idx % 6) / 5.0)
                dry.add(plk, st_time, pan=pan, gain=0.38)
                verb.add(plk, st_time, pan=pan, gain=0.34)

    # 8. Soulful Detroit Analog Synth Lead in Sections 2 (bars 32-47) and 3 (bars 48-63)
    for base_bar, phrase in ((24, LEAD_MELODY_S2), (32, LEAD_MELODY_S2), (48, LEAD_MELODY_S4), (56, LEAD_MELODY_S4)):
        for b_off, beat_in_bar, n_name, dur_beats in phrase:
            t_note = (base_bar + b_off) * BAR + beat_in_bar * BEAT
            sig = detroit_lead_note(midi(n_name), dur_beats * BEAT, vel=0.82)
            st = pan2(sig, 0.14)
            echoed = dub_tape_delay(st, delay_sec=3.0 * SIXTEENTH, feedback=0.42, taps=5)
            dry.add(echoed, t_note, gain=0.52)
            verb.add(echoed, t_note, gain=0.45)

    # Fold circularly and apply convolution reverb
    d_loop = dry.loop()
    v_loop = verb.loop()
    ir = impulse_reverb(4.2, hi_cut=3400.0)
    wet = np.zeros_like(v_loop)
    for ch in range(2):
        conv = fft_convolve_1d(v_loop[ch], ir[ch])
        wet[ch] = fold(conv, N)

    mix = d_loop + wet * 0.48
    # Clean sub below 26 Hz and add silky high air above 4.5 kHz
    mix = hp(mix, 26.0, order=2)
    air = hp(mix, 4800.0, order=1)
    mix = mix + 0.35 * air
    return master_bus(mix, target_db=-14.5)


def master_bus(mix: np.ndarray, target_db: float = -14.5) -> np.ndarray:
    peak = np.abs(mix).max() + 1e-12
    driven = mix / peak * 1.32
    sat = np.tanh(driven) / np.tanh(1.32)
    rms = np.sqrt((sat ** 2).mean() + 1e-12)
    target = 10.0 ** (target_db / 20.0)
    gain = min(target / rms, 0.94 / (np.abs(sat).max() + 1e-12))
    return sat * gain


# ------------------------------------------------------------------ C Minor Harmonic Sound Effects

def sfx_bus(seconds: float) -> np.ndarray:
    return np.zeros((2, int(round(seconds * SR))), dtype=np.float64)


def place_sfx(buf: np.ndarray, sig: np.ndarray, t: float, pan: float = 0.0, gain: float = 1.0) -> None:
    i = int(round(t * SR))
    if sig.ndim == 1:
        sig = pan2(sig, pan)
    end = min(buf.shape[1], i + sig.shape[1])
    if end > i:
        buf[:, i:end] += sig[:, :end - i] * gain


def finish_sfx(buf: np.ndarray, verb_send: float = 0.28, peak: float = 0.78) -> np.ndarray:
    ir = impulse_reverb(1.5, hi_cut=3800.0)
    wet = np.vstack([fft_convolve_1d(buf[c], ir[c])[:buf.shape[1]] for c in range(2)])
    out = buf + wet * verb_send
    n = out.shape[1]
    fade = np.minimum(1.0, (n - np.arange(n)) / (0.04 * SR))
    out *= fade
    mx = np.abs(out).max() + 1e-12
    return out / mx * peak


def render_sfx() -> dict[str, np.ndarray]:
    sfx: dict[str, np.ndarray] = {}
    swing_sec = 0.016

    # All sound effects have their internal transients, arpeggios, and dub echoes
    # locked to exact 106 BPM subdivisions:
    #   SIXTEENTH = 0.1415s, EIGHTH = 0.2830s, DOTTED_EIGHTH = 3 * SIXTEENTH = 0.4245s, BEAT = 0.5660s.

    # 1. grab: Picking up a Goo ball -> 16th-note syncopated C4 -> G4 -> Eb5 pluck (3 sixteenth steps)
    b = sfx_bus(4.0 * SIXTEENTH)
    place_sfx(b, wood_click(midi("C4"), 1.0), 0.0, pan=-0.12, gain=0.92)
    place_sfx(b, minimal_arp_pluck(midi("C4"), 0.9, 0.72), 0.0, pan=-0.15, gain=0.82)
    place_sfx(b, minimal_arp_pluck(midi("G4"), 0.85, 0.82), 1.0 * SIXTEENTH + swing_sec, pan=0.15, gain=0.78)
    place_sfx(b, minimal_arp_pluck(midi("Eb5"), 0.72, 0.88), 2.0 * SIXTEENTH, pan=0.0, gain=0.62)
    sfx["grab"] = finish_sfx(b, 0.22, 0.74)

    # 2. attach: Weaving a Goo node into the structure -> Cm9 Detroit dub stab + 16th-note pulse echo
    b = sfx_bus(2.0 * BEAT + 0.2)
    place_sfx(b, wood_click(midi("C5"), 0.95), 0.0, gain=0.78)
    stab_att = detroit_dub_stab(chord("C4", "Eb4", "G4", "Bb4", "D5"), dur=2.0 * SIXTEENTH, cutoff_peak=2900.0)
    echo_att = dub_tape_delay(stab_att, delay_sec=2.0 * SIXTEENTH, feedback=0.42, taps=3)
    place_sfx(b, echo_att, 0.0, gain=0.92)
    place_sfx(b, minimal_arp_pluck(midi("G5"), 0.80, 0.85), 1.0 * SIXTEENTH + swing_sec, pan=0.25, gain=0.65)
    place_sfx(b, minimal_arp_pluck(midi("C6"), 0.68, 0.90), 2.0 * SIXTEENTH, pan=-0.20, gain=0.55)
    sfx["attach"] = finish_sfx(b, 0.30, 0.80)

    # 3. detach: Releasing a detachable Ivy/Balloon Goo node -> 16th-note descending G4 -> Eb4 -> C4
    b = sfx_bus(5.0 * SIXTEENTH)
    for i, note in enumerate(("G4", "Eb4", "C4")):
        t_step = i * SIXTEENTH + (swing_sec if i % 2 == 1 else 0.0)
        place_sfx(b, minimal_arp_pluck(midi(note), 0.84, 0.58), t_step, pan=0.22 - i * 0.22, gain=0.82)
        place_sfx(b, wood_click(midi(note), 0.65), t_step, pan=0.22 - i * 0.22, gain=0.48)
    sfx["detach"] = finish_sfx(b, 0.24, 0.70)

    # 4. wake: Waking a dormant cluster of Goo balls -> 16th-note swung Cm9 arpeggio over 1 bar (106 BPM)
    b = sfx_bus(BAR)
    wake_notes = ("C4", "Eb4", "G4", "Bb4", "D5", "Eb5", "G5", "C6")
    for i, note in enumerate(wake_notes):
        t_step = i * SIXTEENTH + (swing_sec if i % 2 == 1 else 0.0)
        place_sfx(b, minimal_arp_pluck(midi(note), 0.90, 0.86), t_step, pan=-0.45 + i * 0.13, gain=0.80)
    stab_wake = detroit_dub_stab(chord("C3", "G3", "Eb4", "D4"), dur=BEAT, cutoff_peak=2500.0)
    place_sfx(b, dub_tape_delay(stab_wake, delay_sec=3.0 * SIXTEENTH, feedback=0.45, taps=3), 0.0, gain=0.72)
    sfx["wake"] = finish_sfx(b, 0.36, 0.78)

    # 5. strain: Overstretched strand warning -> 16th-note rhythmic G7(b9)/Cm tension pulse at 106 BPM
    b = sfx_bus(2.0 * BEAT)
    for i, note in enumerate(("G4", "Ab4", "D5", "F5")):
        t_step = i * SIXTEENTH + (swing_sec if i % 2 == 1 else 0.0)
        place_sfx(b, wood_click(midi(note), 0.88), t_step, pan=(-0.32 if i % 2 == 0 else 0.32), gain=0.78)
        place_sfx(b, minimal_arp_pluck(midi(note), 0.78, 0.9), t_step, pan=(-0.25 if i % 2 == 0 else 0.25), gain=0.65)
    sfx["strain"] = finish_sfx(b, 0.25, 0.70)

    # 6. snap: Strand breaking -> Downbeat C2->C1 sub thud + off-beat 16th Cm(b6) rim echo
    b = sfx_bus(2.0 * BEAT)
    place_sfx(b, kick_909_cm(1.0), 0.0, gain=0.95)
    place_sfx(b, minimal_clap_rim(1.0), 0.0, gain=0.88)
    for i, note in enumerate(("Ab3", "Eb4", "C4")):
        t_step = i * SIXTEENTH + (swing_sec if i % 2 == 1 else 0.0)
        place_sfx(b, minimal_arp_pluck(midi(note), 0.85, 0.48), t_step, gain=0.68)
    sfx["snap"] = finish_sfx(b, 0.30, 0.82)

    # 7. launch: Gust / Balloon lift / Whistle -> 1-beat C3->C5 filter sweep + eighth-note C5 -> G5 plucks
    b = sfx_bus(2.0 * BEAT)
    n_sw = int(BEAT * SR)
    t_sw = np.arange(n_sw) / SR
    f_sw = hz(midi("C3")) * (4.0 ** (t_sw / BEAT))
    ph_sw = 2.0 * np.pi * np.cumsum(f_sw) / SR
    sweep = (np.sin(ph_sw) + 0.4 * np.sin(1.5 * ph_sw)) * np.sin(np.pi * t_sw / BEAT) ** 1.4
    place_sfx(b, sweep * 0.4, 0.0, gain=0.8)
    place_sfx(b, minimal_arp_pluck(midi("C5"), 0.85, 0.85), 1.0 * SIXTEENTH + swing_sec, pan=-0.22, gain=0.74)
    place_sfx(b, minimal_arp_pluck(midi("Eb5"), 0.85, 0.88), 2.0 * SIXTEENTH, pan=0.0, gain=0.74)
    place_sfx(b, minimal_arp_pluck(midi("G5"), 0.88, 0.92), 3.0 * SIXTEENTH + swing_sec, pan=0.22, gain=0.78)
    sfx["launch"] = finish_sfx(b, 0.32, 0.74)

    # 8. signpost: Opening a Sign Painter sign -> 106 BPM Fm9 dub chord + 8th-note Eb5 -> D5 -> C5 bells
    b = sfx_bus(BAR)
    stab_sp = detroit_dub_stab(chord("F3", "Ab3", "C4", "Eb4", "G4"), dur=BEAT, cutoff_peak=2200.0)
    place_sfx(b, dub_tape_delay(stab_sp, delay_sec=3.0 * SIXTEENTH, feedback=0.45, taps=3), 0.0, gain=0.85)
    place_sfx(b, minimal_arp_pluck(midi("Eb5"), 0.82, 0.78), 0.0, pan=-0.25, gain=0.74)
    place_sfx(b, minimal_arp_pluck(midi("D5"), 0.78, 0.78), 2.0 * SIXTEENTH, pan=0.25, gain=0.74)
    place_sfx(b, minimal_arp_pluck(midi("C5"), 0.88, 0.82), 4.0 * SIXTEENTH, pan=0.0, gain=0.78)
    sfx["signpost"] = finish_sfx(b, 0.40, 0.74)

    # 9. suck: Goo ball sucked into the Pipe -> 16th-note C5-Eb5-G5-C6 chime locked to 106 BPM
    b = sfx_bus(2.5 * BEAT)
    n_w = int(2.0 * SIXTEENTH * SR)
    t_w = np.arange(n_w) / SR
    whoosh = bp(rng.standard_normal(n_w), 500, 3200) * np.sin(np.pi * t_w / (2.0 * SIXTEENTH)) ** 2
    place_sfx(b, whoosh * 0.45, 0.0, gain=0.75)
    for i, note in enumerate(("C5", "Eb5", "G5", "C6")):
        t_step = i * SIXTEENTH + (swing_sec if i % 2 == 1 else 0.0)
        place_sfx(b, minimal_arp_pluck(midi(note), 0.92, 0.9), t_step, pan=-0.3 + i * 0.2, gain=0.86)
    place_sfx(b, wood_click(midi("C6"), 0.92), 2.0 * SIXTEENTH, gain=0.74)
    sfx["suck"] = finish_sfx(b, 0.36, 0.80)

    # 10. win: Level Clear -> 4-bar 106 BPM Detroit Techno C-minor chord resolution (beat-exact chords & 16th arp)
    b = sfx_bus(4.0 * BAR)
    prog_win = [
        (0.0 * BEAT, chord("C3", "Eb3", "G3", "Bb3", "D4"), "C2"),
        (2.0 * BEAT, chord("Ab2", "Eb3", "G3", "Bb3", "C4"), "Ab1"),
        (4.0 * BEAT, chord("F2", "C3", "Eb3", "Ab3", "C4"), "F1"),
        (6.0 * BEAT, chord("C3", "G3", "Bb3", "D4", "Eb4", "G4"), "C2"),
    ]
    for t0, ch_notes, rt in prog_win:
        stab = detroit_dub_stab(ch_notes, dur=1.2 * BEAT, cutoff_peak=3200.0)
        echo = dub_tape_delay(stab, delay_sec=3.0 * SIXTEENTH, feedback=0.48, taps=4)
        place_sfx(b, echo, t0, gain=0.85)
        place_sfx(b, sub_bass_note(midi(rt), 1.5 * BEAT, accent=0.95, bright=0.6), t0, gain=0.75)
        place_sfx(b, kick_909_cm(0.95), t0, gain=0.80)
    arp_win = ["C5", "Eb5", "G5", "Bb5", "D6", "C6", "G5", "Eb5", "G5", "C6", "Eb6", "C6"]
    for i, note in enumerate(arp_win):
        t_step = 6.0 * BEAT + i * SIXTEENTH + (swing_sec if i % 2 == 1 else 0.0)
        place_sfx(b, minimal_arp_pluck(midi(note), 0.9, 0.9), t_step, pan=-0.45 + (i % 5) * 0.22, gain=0.8)
    sfx["win"] = finish_sfx(b, 0.45, 0.84)

    return sfx


def to_mp3(stereo: np.ndarray, path: str, bitrate: str = "192k") -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as fh:
        tmp = fh.name
    clipped = np.clip(stereo.T, -1.0, 1.0)
    pcm = (clipped * 32767.0).astype("<i2")
    with wave.open(tmp, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", bitrate, path],
        check=True,
    )
    os.remove(tmp)
    rel = os.path.relpath(path, os.path.join(HERE, "..", ".."))
    print(f"wrote {rel} ({stereo.shape[1] / SR:.2f}s)")


def write_scene_png(path: str) -> None:
    """Render a crisp 64x64 RGBA PNG badge for SapWorld (World-of-Goo style pitch-black Goo Ball against golden sky)."""
    w = h = 64
    y, x = np.mgrid[0:h, 0:w]
    cx, cy = 31.5, 32.5
    r = np.hypot(x - cx, y - cy)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)

    # Outer warm golden-amber World of Goo halo
    halo = np.clip(1.0 - r / 30.5, 0.0, 1.0) ** 1.6
    # Core pitch-black glossy Goo sphere
    body = np.clip((22.5 - r) / 1.4, 0.0, 1.0)
    # Wet white specular highlight top-left
    spec = np.exp(-((x - 24.0) ** 2 + (y - 21.5) ** 2) / 18.0) * body

    red = np.clip(242 * halo * (1 - body) + 22 * body + 210 * spec, 0, 255)
    green = np.clip(178 * halo * (1 - body) + 22 * body + 215 * spec, 0, 255)
    blue = np.clip(68 * halo * (1 - body) + 25 * body + 220 * spec, 0, 255)
    alpha = np.clip(halo * 225 + body * 255, 0, 255)

    # Two asymmetric, oversized bulging white World-of-Goo eyes with tiny black pupils
    for ex, ey, er in ((24.5, 31.0, 5.8), (38.0, 29.5, 4.7)):
        de = np.hypot(x - ex, y - ey)
        eye_rim = np.clip((er + 1.1 - de) / 0.9, 0.0, 1.0)
        eye_w = np.clip((er - de) / 0.9, 0.0, 1.0)
        pupil = np.clip((1.8 - np.hypot(x - (ex + 0.9), y - (ey - 0.3))) / 0.8, 0.0, 1.0)
        # Black outline around eye
        red = red * (1 - eye_rim) + 10 * eye_rim
        green = green * (1 - eye_rim) + 10 * eye_rim
        blue = blue * (1 - eye_rim) + 12 * eye_rim
        # White sclera + black pupil
        red = red * (1 - eye_w) + 252 * eye_w * (1 - pupil) + 12 * pupil
        green = green * (1 - eye_w) + 250 * eye_w * (1 - pupil) + 12 * pupil
        blue = blue * (1 - eye_w) + 242 * eye_w * (1 - pupil) + 15 * pupil

    rgba[..., 0] = red.astype(np.uint8)
    rgba[..., 1] = green.astype(np.uint8)
    rgba[..., 2] = blue.astype(np.uint8)
    rgba[..., 3] = alpha.astype(np.uint8)

    raw_rows = b"".join(b"\x00" + rgba[row].tobytes() for row in range(h))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw_rows, 9))
        + chunk(b"IEND", b"")
    )
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(png)
    print("wrote", os.path.relpath(path, os.path.join(HERE, "..", "..")))


def main() -> None:
    write_scene_png(os.path.join(OUT, "SapWorld.png"))
    music = render_music()
    tail = music[:, :2 * SR]
    to_mp3(np.hstack([music, tail]), os.path.join(OUT, "SapWorld.mp3"), "192k")
    print(f"loop length {LOOP:.4f}s ({BARS} bars at {BPM} BPM in C minor)")
    for name, sig in render_sfx().items():
        to_mp3(sig, os.path.join(OUT, "sfx", f"{name}.mp3"), "128k")


if __name__ == "__main__":
    main()
