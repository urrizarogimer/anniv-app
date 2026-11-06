# Cut the entourage sheet (public/ref/4.webp, 1536x1024) into sprites.
#   python tools/extract_entourage.py public/ref/4.webp public/sprites
# Uses the same cut-out and edge cleanup as extract.py.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract as X
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage

X.load(sys.argv[1], sys.argv[2])
cut = X.cut

def row(names, y0, y1, xs, **kw):
    """xs are the column splits between neighbouring sprites."""
    for n, a, b in zip(names, xs[:-1], xs[1:]):
        if n:
            cut(n, (a, y0, b - a, y1 - y0), **kw)

# Top row: guests in green and lavender, bridesmaids in blue, then groomsmen.
row(['guest_green1', 'guest_green2', 'guest_lav1', 'maid_blue1', 'maid_blue2', 'maid_lblue1', 'maid_blue3', 'man_1'],
    4, 216, [480, 600, 710, 812, 912, 1021, 1133, 1245, 1338])
row(['man_2', 'man_3'], 4, 216, [1338, 1436, 1534])
# Second row: groomsmen in barong.
row([f'man_{i}' for i in range(4, 14)], 216, 412, [496, 600, 708, 818, 932, 1040, 1142, 1243, 1340, 1435, 1532])
# Third row: guests and bridesmaids holding bouquets, more groomsmen.
row(['guest_green3', 'guest_lav2', 'maid_blue4', 'maid_lblue2'], 412, 622, [4, 129, 254, 366, 486])
row([f'man_{i}' for i in range(14, 19)], 412, 622, [484, 582, 675, 768, 866, 966])
# Satin bows in four colours.
row(['bow_green', 'bow_lav', 'bow_blue', 'bow_gold'], 858, 922, [643, 722, 800, 878, 966], mode='all')
# Venue props.
cut('prop_cakestand', (1392, 616, 140, 262), erase=[(1472, 766, 1536, 890)])
cut('prop_lantern', (1380, 760, 62, 116))

# Chairs: the front chairs overlap a second row, so each is cut with a chair-shaped mask.
src = Image.open(sys.argv[1]).convert('RGB')
OX, OY, K = 960, 880, 3  # measured on a 3x zoom of this corner of the sheet
zoom = src.crop((OX, OY, 1300, 1024)).resize(((1300 - OX) * K, (1024 - OY) * K), Image.LANCZOS)
for name, (x0, x1) in {'chair_green': (118, 273), 'chair_lav': (302, 457), 'chair_blue': (487, 643), 'chair_gold': (672, 829)}.items():
    y0, y1, r, ss = 119, 401, 34, 4
    m = Image.new('L', ((x1 - x0) * ss, (y1 - y0) * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, m.width - 1, m.height + r * ss), radius=r * ss, fill=255)
    m = m.resize((x1 - x0, y1 - y0), Image.LANCZOS)
    piece = zoom.crop((x0, y0, x1, y1)).convert('RGBA')
    piece.putalpha(m)
    piece = piece.resize((round(piece.width * 2 / K), round(piece.height * 2 / K)), Image.LANCZOS)
    piece.save(os.path.join(sys.argv[2], name + '.png'))

# Male guests: the same barong, tinted sage green or lavender.
def tint(name, out, rgb):
    im = Image.open(os.path.join(sys.argv[2], name + '.png')).convert('RGBA')
    a = np.array(im).astype(float)
    h = a.shape[0]
    c = a[..., :3] / 255
    mx, mn = c.max(axis=2), c.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-6)
    ys = np.arange(h)[:, None] * np.ones((1, a.shape[1]))
    # Shirt areas are the pale regions between the dark outlines, below the chin and above the trousers.
    pale = (mx > 0.5) & (sat < 0.4) & (a[..., 3] > 10) & (ys > h * 0.43) & (ys < h * 0.76)
    lab, n = ndimage.label(pale)
    r_g, g_b = c[..., 0] - c[..., 1], c[..., 1] - c[..., 2]
    skin = (r_g > 0.07) & (g_b > 0.03) & (g_b < 0.13) & (sat > 0.12)
    sizes = ndimage.sum(pale, lab, range(1, n + 1))
    body = int(np.argmax(sizes)) + 1
    # The biggest pale area is the shirt; smaller ones count too unless they look like hands.
    shirt = lab == body
    for i in range(1, n + 1):
        part = lab == i
        if i != body and sizes[i - 1] > 100 and skin[part].mean() < 0.5:
            shirt |= part
    shirt = ndimage.binary_fill_holes(ndimage.binary_closing(shirt, iterations=2)) & (mx > 0.4) & (a[..., 3] > 10)
    lum = c.mean(axis=2)
    newc = np.array(rgb) * np.clip(lum / 0.9, 0, 1.08)[..., None]
    c[shirt] = np.clip(newc[shirt], 0, 1)
    a[..., :3] = c * 255
    Image.fromarray(a.astype(np.uint8), 'RGBA').save(os.path.join(sys.argv[2], out + '.png'))

tint('man_8', 'guest_man_green', (0.74, 0.86, 0.66))
tint('man_9', 'guest_man_lav', (0.84, 0.78, 0.96))

# The "Our Wedding Day" title card is a full painted scene: keep it as a rectangle.
title = Image.open(sys.argv[1]).convert('RGB').crop((2, 2, 478, 388))
title.save(os.path.join(sys.argv[2], 'ui_title.webp'), quality=92)
print('done')
