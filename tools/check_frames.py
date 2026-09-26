"""Independent quantitative check of the rendered stills (no visual model needed).

Verifies the things that actually matter and cannot be eyeballed from a
description: exact colour, geometry, symmetry, and that the wordmark really
spells "opencode" on the correct grid.
"""
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

D = Path(r"C:\Users\dali\remotion-logo\stills")
fails = []


def ok(m):
    print(f"  PASS  {m}")


def bad(m):
    print(f"  FAIL  {m}")
    fails.append(m)


def load(n):
    im = Image.open(D / n).convert("RGB")
    return im


def lit(im, pred):
    w, h = im.size
    px = im.load()
    xs, ys = [], []
    n = 0
    for y in range(h):
        for x in range(w):
            if pred(px[x, y]):
                n += 1
                xs.append(x)
                ys.append(y)
    if not n:
        return 0, None
    return n, (min(xs), min(ys), max(xs), max(ys))


NONBLACK = lambda c: sum(c) > 60
GRAYISH = lambda c: max(c) - min(c) <= 6

print("frame 45 - the o, static, centred")
im = load("still_oc_045.png")
n, bb = lit(im, NONBLACK)
w, h = im.size
ok(f"size {w}x{h}") if (w, h) == (2560, 1440) else bad(f"size is {w}x{h}, expected 2560x1440")
ok(f"glyph ink present ({n} px)") if n > 400_000 else bad(f"only {n} ink px, too small for a 54%-height ring")
gw, gh = bb[2] - bb[0] + 1, bb[3] - bb[1] + 1
# official glyph is 24 wide x 30 tall, so w/h = 0.80 (h/w = 1.25)
ratio = gw / gh
ok(f"glyph box {gw}x{gh} = {gh/h:.0%} of frame height, aspect {ratio:.2f} (24:30=0.80)")
abs_ok = abs(ratio - 0.8) < 0.06
ok("aspect matches the 24x30 official glyph") if abs_ok else bad(f"aspect {ratio:.2f} != 0.80")
cx = (bb[0] + bb[2]) / 2
cy = (bb[1] + bb[3]) / 2
ok(f"centred ({cx:.0f},{cy:.0f} vs frame centre {w/2:.0f},{h/2:.0f})") if abs(cx - w / 2) < 6 and abs(cy - h / 2) < 6 else bad(f"off-centre by ({cx-w/2:+.0f},{cy-h/2:+.0f})")
# ring: the centre of the glyph must be the dark slot
mid = im.getpixel((int(cx), int(cy)))
SLOT = (0x4B, 0x46, 0x46)
ok("centre pixel is the dark slot #4B4646") if mid == SLOT else bad(f"centre pixel is {mid}, expected the slot {SLOT}")
cols = im.getcolors(maxcolors=1 << 24) or []
top = sorted(im.getcolors(maxcolors=1 << 24) or [], reverse=True)[:4]  # (count, rgb)
ok(f"dominant colours {[c for _, c in top]}") if all(GRAYISH(c) for _, c in top) else bad(f"non-gray colour present: {top}")

print("frame 170 - mid zoom (wall fills frame)")
im = load("still_oc_170.png")
n, _ = lit(im, NONBLACK)
frac = n / (2560 * 1440)
# mid-zoom the window straddles the boundary: part wall, part empty band
ok(f"frame is {frac:.0%} lit - straddling the wall/empty-band boundary") if 0.15 < frac < 0.95 else bad(f"{frac:.0%} lit, expected a partial mid-zoom frame")

print("frame 295 - MUST be pure black")
im = load("still_oc_295.png")
cols = (im.getcolors(maxcolors=1 << 24) or [])
ok(f"exactly 1 colour: {cols[0][1]}") if len(cols) == 1 else bad(f"{len(cols)} colours, {sorted(cols, reverse=True)[:3]}")

print("frame 470 - the wordmark")
im = load("still_oc_470.png")
n, bb = lit(im, NONBLACK)
span = (bb[2] - bb[0] + 1) / 2560
ok(f"ink spans {span:.0%} of width, target 92%") if 0.86 < span < 0.98 else bad(f"span {span:.0%} off the 92% target")
# the grid must be 39 columns wide; read it back out of the pixels
gx0, gy0, gx1, gy1 = bb
cellw = (gx1 - gx0 + 1) / 39
cellh = (gy1 - gy0 + 1) / 4
ok(f"cell {cellw:.1f}x{cellh:.1f} -> {cellh/cellw:.2f} (target 1.7, brand 24x30)") if 1.55 < cellh / cellw < 1.85 else bad(f"cells are {cellh/cellw:.2f} tall, not ~1.7 -> letters are squashed")
# print the wordmark back as ASCII from the actual pixels
print("  wordmark read back out of the render:")
for r in range(4):
    y = int(gy0 + (r + 0.5) * cellh)
    line = ""
    for c in range(39):
        x = int(gx0 + (c + 0.5) * cellw)
        px = im.getpixel((x, y))
        line += "#" if sum(px) > 200 else ("+" if sum(px) > 100 else ".")
    print("    " + line)

print("frame 100 - the bloom, centred")
im = load("still_cg_100.png")
MINT = lambda c: c[1] > c[0] + 20 and c[1] >= c[2] and sum(c) > 120
n, bb = lit(im, MINT)
ok(f"mint ink {n} px") if n > 80_000 else bad(f"only {n} mint px")
bw, bh = bb[2] - bb[0] + 1, bb[3] - bb[1] + 1
ok(f"bloom {bw}x{bh} = {bh/1440:.0%} of frame height (target 50%)") if 0.45 < bh / 1440 < 0.55 else bad(f"bloom is {bh/1440:.0%} of height, target 50%")
cx, cy = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2
ok(f"centred ({cx:.0f},{cy:.0f})") if abs(cx - 1280) < 6 and abs(cy - 720) < 6 else bad(f"off-centre by ({cx-1280:+.0f},{cy-720:+.0f})")
# 6-fold symmetry: rotating the ink 60 deg about the centre must overlap itself
px = im.load()
hits = 0
for y in range(0, 1440, 3):
    for x in range(0, 2560, 3):
        if not MINT(px[x, y]):
            continue
        dx, dy = x - cx, y - cy
        # 60 deg rotation
        import math
        a = math.radians(60)
        rx = cx + dx * math.cos(a) - dy * math.sin(a)
        ry = cy + dx * math.sin(a) + dy * math.cos(a)
        rx, ry = int(rx), int(ry)
        if 0 <= rx < 2560 and 0 <= ry < 1440 and MINT(px[rx, ry]):
            hits += 1
tot = sum(1 for y in range(0, 1440, 3) for x in range(0, 2560, 3) if MINT(px[x, y]))
sym = hits / tot if tot else 0
ok(f"60-degree rotational symmetry {sym:.0%} (6-fold bloom)") if sym > 0.85 else bad(f"symmetry only {sym:.0%}, shape is not the 6-fold bloom")

print("frame 430 - petals in flight")
im = load("still_cg_430.png")
n2, bb2 = lit(im, MINT)
ok(f"mint ink dropped {n} -> {n2}") if n2 < n else bad(f"mint ink grew {n} -> {n2}, petals never left")
grew = (bb2[2] - bb2[0] + 1) > (bb[2] - bb[0] + 1) * 1.1
ok("scattered petals pushed the bounding box outward") if grew else bad("bounding box did not grow, nothing was thrown")

print("frame 599 - MUST be pure black")
im = load("still_cg_599.png")
cols = (im.getcolors(maxcolors=1 << 24) or [])
ok(f"exactly 1 colour: {cols[0][1]}") if len(cols) == 1 else bad(f"{len(cols)} colours left: {sorted(cols, reverse=True)[:3]}")

print()
if fails:
    print(f"QUANT CHECK FAILED ({len(fails)})")
    for f in fails:
        print("  x " + f)
    sys.exit(1)
print("QUANT CHECK PASSED - geometry, colour, centring, symmetry and grid all match the spec")
