# Cut the two MCR sheets into sprites for the MCR Concert Grounds.
#   python tools/extract_mcr.py public/ref/7.webp public/ref/8.webp public/sprites
# 7.webp (1125x750) is the band sheet: transparent background, so sprites are cut by alpha.
# 8.webp (1500x1000) is the concert grounds sheet: dark slate panels, so sprites are keyed
# against the panel colour sampled around each box.
import os, sys
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

band_src, grounds_src, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)


def finish(name, rgba, scale=2):
    img = Image.fromarray(rgba.astype(np.uint8), 'RGBA')
    bb = img.getbbox()
    if not bb:
        print('empty', name)
        return
    img = img.crop(bb)
    if scale != 1:
        img = img.resize((img.width * scale, img.height * scale), Image.LANCZOS)
        r, g, b, al = img.split()
        rgb = Image.merge('RGB', (r, g, b)).filter(ImageFilter.UnsharpMask(radius=1.2, percent=50, threshold=2))
        img = Image.merge('RGBA', (*rgb.split(), al))
    img.save(os.path.join(OUT, name + '.png'))
    print(name, img.size)


def pick(fg, mode, minsize):
    lab, n = ndimage.label(fg)
    if n == 0:
        return fg
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    if mode == 'largest':
        return ndimage.binary_fill_holes(lab == int(np.argmax(sizes)) + 1)
    return np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= minsize])


# ------------------------------------------------------------------ band sheet (alpha)
band = np.array(Image.open(band_src).convert('RGBA')).astype(float)


def cut_a(name, box, mode='largest', minsize=30, scale=2, erase=()):
    x0, y0, x1, y1 = box
    a = band[y0:y1, x0:x1].copy()
    for ex0, ey0, ex1, ey1 in erase:  # sheet coordinates
        a[max(0, ey0 - y0):max(0, ey1 - y0), max(0, ex0 - x0):max(0, ex1 - x0), 3] = 0
    al = np.clip((a[..., 3] - 8) / (236 - 8), 0, 1)
    keep = pick(al > 0.5, mode, minsize)
    keep = ndimage.binary_dilation(keep, iterations=2)
    a[..., 3] = al * keep * 255
    finish(name, a, scale)


# members standing (top row; the name chips start at y=197)
cut_a('mcr_gerard', (296, 0, 440, 196))
cut_a('mcr_frank', (452, 0, 586, 196))
cut_a('mcr_ray', (586, 0, 735, 196))
cut_a('mcr_mikey', (752, 0, 880, 196))
cut_a('mcr_bob', (874, 0, 1068, 196))

# stage animation frames (second row; the section chips end at y=246)
FRAMES = {
    'gerard': [(2, 56), (58, 108), (110, 158), (158, 216), (218, 280)],
    'frank': [(294, 350), (350, 400), (400, 447), (447, 496)],
    'ray': [(503, 565), (565, 625), (625, 688)],
    'mikey': [(690, 755), (755, 815), (815, 872)],
    'bob': [(874, 960), (960, 1042), (1040, 1120)],
}
for who, cols in FRAMES.items():
    for i, (x0, x1) in enumerate(cols):
        cut_a(f'mcr_{who}_a{i + 1}', (x0, 248, x1, 366))

# logo, spider and emotes
cut_a('mcr_logo', (0, 0, 290, 192), mode='all', minsize=6, erase=[(150, 140, 290, 192)])
cut_a('mcr_spider', (152, 140, 250, 228))
cut_a('mcr_heart', (970, 502, 1008, 545))
cut_a('mcr_note', (1012, 502, 1040, 545))
cut_a('mcr_banner_black', (938, 585, 1006, 735))
cut_a('mcr_banner_red', (1008, 585, 1074, 712))
cut_a('mcr_barricade', (1000, 700, 1128, 748))
cut_a('mcr_drums', (258, 390, 390, 500))

# portraits: framed cards, kept as rectangles
port = Image.open(band_src).convert('RGBA')
for name, box in [('gerard', (9, 575, 122, 745)), ('frank', (133, 575, 243, 745)), ('ray', (251, 575, 357, 745)), ('mikey', (366, 575, 460, 745)), ('bob', (469, 575, 566, 745))]:
    p = port.crop(box)
    p.putalpha(255)
    p.convert('RGB').save(os.path.join(OUT, f'mcr_p_{name}.jpg'), quality=88)
    print('mcr_p_' + name)

# ------------------------------------------------------------------ grounds sheet (dark key)
gr = np.array(Image.open(grounds_src).convert('RGB')).astype(float)


def cut_d(name, box, mode='largest', tol=20, minsize=40, scale=2, fill=True, bgs=()):
    """bgs: extra panel colours to treat as background (the panels are lighter in places)."""
    x0, y0, x1, y1 = box
    a = gr[y0:y1, x0:x1].copy()
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    B = np.median(edge, axis=0)
    d = np.sqrt(((a - B) ** 2).sum(axis=2))
    for c in bgs:
        d = np.minimum(d, np.sqrt(((a - np.array(c, float)) ** 2).sum(axis=2)))
    near = d < tol
    lab, n = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    keep = pick(~bg, mode, minsize)
    if fill:
        keep = ndimage.binary_fill_holes(keep)
    # soft edge: one pixel of feathering from the colour distance
    soft = np.clip((d - tol * 0.4) / (tol * 1.2), 0, 1)
    din = ndimage.distance_transform_edt(keep)
    alpha = keep.astype(float)
    band_in = keep & (din <= 1.2)
    alpha[band_in] = np.maximum(soft[band_in], 0.45)
    alpha = ndimage.gaussian_filter(alpha, 0.5) * ndimage.binary_dilation(keep, iterations=1)
    finish(name, np.dstack([a, alpha * 255]), scale)


cut_d('mcrg_stage', (432, 40, 912, 314))
cut_d('mcrg_tent_black', (14, 376, 142, 510))
cut_d('mcrg_tent_stripe', (150, 376, 278, 510), fill=False, tol=32)
cut_d('mcrg_tent_white', (276, 370, 394, 510))
cut_d('mcrg_merch', (398, 362, 556, 516))
cut_d('mcrg_food', (562, 370, 676, 516))
cut_d('mcrg_drinks', (682, 370, 782, 516))
cut_d('mcrg_barrier', (802, 382, 912, 438))
cut_d('mcrg_barrier_spider', (984, 496, 1082, 552))
cut_d('mcrg_flag_mcr', (1098, 384, 1162, 552), fill=False, tol=32)
cut_d('mcrg_flag_spider', (1212, 384, 1266, 552), fill=False, bgs=[(58, 56, 68)])
cut_d('mcrg_flag_heart', (1264, 384, 1306, 552), fill=False)
cut_d('mcrg_banner_big', (1304, 384, 1416, 548), fill=False, tol=32)
cut_d('mcrg_welcome', (1414, 414, 1488, 556), mode='all', minsize=80, bgs=[(58, 56, 68)])
cut_d('mcrg_tower', (16, 598, 66, 756))
cut_d('mcrg_tower_warm', (84, 600, 128, 756))
cut_d('mcrg_speakers', (740, 600, 812, 704))
cut_d('mcrg_cases', (530, 600, 578, 752), mode='all')
cut_d('mcrg_heart', (912, 600, 980, 690))
cut_d('mcrg_spider', (872, 672, 934, 756))
cut_d('mcrg_crowd_fence', (1258, 596, 1486, 758), mode='all', minsize=60)
# environment row (the sheet is drawn at 1500 px wide; these are sheet pixels)
cut_d('mcrg_tree1', (490, 800, 568, 976))
cut_d('mcrg_tree2', (563, 800, 642, 914))
cut_d('mcrg_tree3', (642, 802, 724, 922))
cut_d('mcrg_potty', (722, 802, 782, 910))
cut_d('mcrg_potty2', (786, 802, 846, 910))
cut_d('mcrg_crates', (850, 808, 894, 892))
cut_d('mcrg_lamp', (898, 800, 942, 912))
cut_d('mcrg_bench', (570, 916, 668, 976))
cut_d('mcrg_case_yellow', (688, 918, 758, 976))
cut_d('mcrg_trash', (778, 918, 834, 976))
cut_d('mcrg_generator', (855, 910, 916, 976))
cut_d('mcrg_screen', (968, 838, 1176, 976))
cut_d('mcrg_pole_red', (1188, 826, 1234, 976), fill=False)
cut_d('mcrg_pole_spider', (1244, 826, 1294, 976), fill=False)
cut_d('mcrg_wheel', (1300, 772, 1500, 976), tol=24)
print('done')
