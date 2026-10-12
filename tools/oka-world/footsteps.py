"""Renders Mori's footsteps, landing thud and skid for both Oka Worlds.

A step is a soft leather boot on stone: a low heel thump, a short scuff of
grit and a lighter toe tap a few milliseconds later. Each take varies the
pitch, the heel-to-toe gap and the grit so a run never repeats itself.
Wet takes add a splat and a drip or two for the banks of the pools.

Oka World's set sits in a small, bright cave room. Oka World 2's is lower,
duller and echoes off the drowned city: a long dark tail and a late slap
back from far walls.

    python3 tools/oka-world/footsteps.py
"""
import os
import sys

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True
sys.path.insert(0, HERE)
import compose_music as one  # noqa: E402

SR = one.SR
SCENE = os.path.abspath(os.path.join(HERE, "..", "..", "src", "components", "scenes", "OkaWorld"))
DRY_TAKES = 5
WET_TAKES = 3


def bp(sig, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), sig)


def lp(sig, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), sig, axis=-1)


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.clip(t / attack, 0, 1) * np.exp(-t / decay)


def thump(rng, f0, decay, n):
    """Pitched body of a heel on stone: a quick downward sweep."""
    t = np.arange(n) / SR
    f = f0 * (0.7 + 0.6 * np.exp(-t / 0.012))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + rng.uniform(0, 6)) * env(n, 0.0015, decay)


def step(rng, weight=1.0, wet=False):
    n = int(0.22 * SR)
    out = np.zeros(n)
    heel = thump(rng, rng.uniform(95, 135), rng.uniform(0.025, 0.04), n) * 0.9
    scuff = bp(rng.standard_normal(n), rng.uniform(250, 380), rng.uniform(1400, 2200)) * env(n, 0.002, rng.uniform(0.012, 0.02))
    grit = bp(rng.standard_normal(n) * (rng.random(n) < 0.08), 2500, 7000) * env(n, 0.001, 0.01)
    out += heel * weight + scuff * 0.8 + grit * 0.35
    gap = int(rng.uniform(0.018, 0.034) * SR)
    toe = thump(rng, rng.uniform(150, 210), 0.018, n - gap) * 0.35
    toe += bp(rng.standard_normal(n - gap), 400, 2600) * env(n - gap, 0.001, 0.009) * 0.4
    out[gap:] += toe * rng.uniform(0.6, 1.0)
    if wet:
        splat = bp(rng.standard_normal(n), 500, 3800) * env(n, 0.004, 0.035)
        out += splat * 0.9
        for _ in range(int(rng.integers(1, 3))):
            d = one.drip(one.midi("C6") + int(rng.integers(-3, 9)))
            i = int(rng.uniform(0.03, 0.11) * SR)
            k = min(n - i, d.size)
            out[i:i + k] += d[:k] * 0.35
    return out


def land(rng, dark):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 52 + 70 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.09)
    scuff = bp(rng.standard_normal(n), 200, 1800) * env(n, 0.002, 0.045)
    gravel = bp(rng.standard_normal(n) * (rng.random(n) < 0.03), 1500, 6000) * env(n, 0.01, 0.08)
    out = body * 1.1 + scuff * 0.7 + gravel * 0.4
    boots = step(rng, 0.6)
    i = int(0.012 * SR)
    out[i:i + boots.size] += boots * 0.5
    return lp(out, 2600 if dark else 6000)


def skid(rng, dark):
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    grain = rng.standard_normal(n) * (0.4 + 0.6 * (rng.random(n) < 0.25))
    shape = np.clip(t / 0.015, 0, 1) * np.exp(-t / 0.16) * (1 + 0.35 * np.sin(2 * np.pi * 31 * t))
    scrape = bp(grain, 700, 4200) * shape
    rasp = bp(grain, 250, 900) * shape * 0.5
    out = scrape + rasp + thump(rng, 110, 0.03, n) * 0.6
    return lp(out, 2400 if dark else 7000)


def room(rng, seconds, darkness, early):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    for ch in range(2):
        tail = lp(rng.standard_normal(n), darkness)
        ir[ch] = tail * np.exp(-t / (seconds / 6.0)) * np.clip(t / 0.004, 0, 1)
        for _ in range(10):
            ir[ch, int(rng.uniform(0.004, early) * SR)] += rng.uniform(-0.7, 0.7)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    return ir


def finish(sig, world, rng, peak):
    """Place in the world's acoustic, stereo, normalised to `peak`."""
    dark = world == 2
    if dark:
        sig = lp(sig, 2200) * 1.3
        ir, wet = room(rng, 1.6, 1600, 0.09), 0.28
    else:
        ir, wet = room(rng, 0.7, 4500, 0.03), 0.14
    tail = 2.6 if dark else 0.8
    dry = np.concatenate([sig, np.zeros(int(tail * SR))])
    out = np.vstack([dry, dry])
    out += np.vstack([fftconvolve(dry, ir[c])[: dry.size] for c in range(2)]) * wet
    if dark:
        # slap back off the far walls of the drowned city
        d = int(0.19 * SR)
        out[:, d:] += lp(out[:, :-d], 1400) * 0.22
    out /= np.abs(out).max()
    loud = np.where(np.abs(out).max(0) > 0.002)[0]
    out = out[:, : loud[-1] + int(0.02 * SR)]
    n = out.shape[1]
    out *= np.minimum(1, (n - np.arange(n)) / (0.05 * SR))
    return out * peak


def render(world):
    rng = np.random.default_rng(31 if world == 1 else 32)
    dark = world == 2
    out = os.path.join(SCENE, "sfx") if world == 1 else os.path.join(SCENE, "2", "sfx")
    for i in range(DRY_TAKES):
        one.to_mp3(finish(step(rng, rng.uniform(0.8, 1.1)), world, rng, 0.7), os.path.join(out, f"step-{i + 1}.mp3"), "96k")
    for i in range(WET_TAKES):
        one.to_mp3(finish(step(rng, 0.9, wet=True), world, rng, 0.7), os.path.join(out, f"step-wet-{i + 1}.mp3"), "96k")
    one.to_mp3(finish(land(rng, dark), world, rng, 0.8), os.path.join(out, "land.mp3"), "96k")
    one.to_mp3(finish(skid(rng, dark), world, rng, 0.7), os.path.join(out, "skid.mp3"), "96k")


if __name__ == "__main__":
    render(1)
    render(2)
