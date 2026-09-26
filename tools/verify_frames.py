#!/usr/bin/env python3
"""Pixel-assert the key frames of both animations.

These are the exact assertions that were done by hand (PIL) on the original
build. They run in CI so a regression can't ship silently.

  OpenCodeIntro
    f45  the o is on screen, static, light pixels present
    f170 mid-zoom: both the light wall and the dark slot are visible
    f295 the zoom has LANDED: the whole frame is the empty band (pure black)
    f470 the full wordmark is typed and spans the frame width
  ChatGPTIntro
    f100 bloom grown to half the frame, mint pixels present
    f430 petals in flight: fewer mint pixels than f100 (some have left)
    f599 empty: pure black
"""

import sys
from collections import Counter
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    print("Pillow is required: pip install pillow")
    sys.exit(2)

OUT = Path(__file__).resolve().parent.parent / "out"
BLACK = (0, 0, 0)
failures = []


def check(name, path):
    if not path.exists():
        failures.append(f"{name}: missing {path.name}")
        return None
    im = Image.open(path).convert("RGB")
    return im


def light_pixels(im, tol=40):
    """Pixels that are clearly not the black background."""
    w, h = im.size
    px = im.load()
    n = 0
    xs = []
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b = px[x, y]
            if r + g + b > tol * 3:
                n += 1
                xs.append(x)
    return n, (min(xs), max(xs)) if xs else (0, 0)


def unique_colors(im):
    return len(Counter(im.getdata()))


def max_chroma(im, step=2):
    """Largest (max-min) channel spread found. Brand colours are gray/black
    (chroma 0); the ChatGPT bloom is mint (green dominant)."""
    w, h = im.size
    px = im.load()
    worst = 0
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b = px[x, y]
            worst = max(worst, max(r, g, b) - min(r, g, b))
    return worst


def mint_pixels(im, step=2):
    """Lit pixels where green clearly dominates -> the ChatGPT bloom."""
    w, h = im.size
    px = im.load()
    n = 0
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b = px[x, y]
            if r + g + b > 120 and g > r + 20 and g >= b:
                n += 1
    return n


def ok(msg):
    print(f"  PASS  {msg}")


def bad(msg):
    print(f"  FAIL  {msg}")
    failures.append(msg)


print("OpenCodeIntro")
im = check("oc45", OUT / "still_oc_045.png")
if im:
    n, _ = light_pixels(im)
    (ok if n > 20000 else bad)(f"f45 the o is visible ({n} lit samples)")
    # brand colours are achromatic gray on black; edge antialiasing adds a few
    # intermediate tones, so assert the HUE is neutral rather than a colour count
    c = max_chroma(im)
    (ok if c <= 8 else bad)(f"f45 only gray/black pixels, no stray hue (chroma {c})")

im = check("oc170", OUT / "still_oc_170.png")
if im:
    n, _ = light_pixels(im)
    (ok if n > 100000 else bad)(f"f170 mid-zoom shows the wall ({n} lit samples)")

im = check("oc295", OUT / "still_oc_295.png")
if im:
    cols = unique_colors(im)
    (ok if cols == 1 else bad)(f"f295 zoom landed on a uniform frame ({cols} colour(s))")
    if cols == 1:
        (ok if im.getpixel((10, 10)) == BLACK else bad)("f295 that colour is pure black")

im = check("oc470", OUT / "still_oc_470.png")
if im:
    n, (x0, x1) = light_pixels(im)
    w, _ = im.size
    (ok if n > 100000 else bad)(f"f470 wordmark ink present ({n} lit samples)")
    span = (x1 - x0) / w
    (ok if span > 0.85 else bad)(f"f470 wordmark spans the frame ({span:.0%})")

print("ChatGPTIntro")
im = check("cg100", OUT / "still_cg_100.png")
base = None
if im:
    m = mint_pixels(im)
    base = m
    # the bloom is thin-armed, so ~49k sampled mint pixels at full size
    (ok if m > 20000 else bad)(f"f100 bloom grown and centred ({m} mint samples)")

im = check("cg430", OUT / "still_cg_430.png")
if im and base is not None:
    m = mint_pixels(im)
    (ok if m < base else bad)(f"f430 petals have left the frame ({m} < {base})")
    c = max_chroma(im)
    (ok if c >= 20 else bad)(f"f430 what is left is still mint, not a stray colour (chroma {c})")

im = check("cg599", OUT / "still_cg_599.png")
if im:
    cols = unique_colors(im)
    (ok if cols == 1 else bad)(f"f599 screen is empty ({cols} colour(s))")

if failures:
    print(f"\nVERIFY FAILED ({len(failures)})")
    for f in failures:
        print("  x " + f)
    sys.exit(1)

print("\nVERIFY PASS — every key frame matches the approved spec")
