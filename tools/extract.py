import sys, os
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

im = None; H = W = 0; OUT = '.'

def load(src, out):
    """Open a sprite sheet; later cut() calls read from it and write PNGs into `out`."""
    global im, H, W, OUT
    OUT = out
    os.makedirs(OUT, exist_ok=True)
    im = np.array(Image.open(src).convert('RGB')).astype(int)
    H, W = im.shape[:2]

def is_light(a, tol=0):
    r,g,b = a[...,0],a[...,1],a[...,2]
    return (r>236-tol)&(g>224-tol)&(b>224-tol)&(np.abs(g-b)<16)

def matte(a, keep, bg):
    """Soft, anti-aliased alpha plus colour decontamination, so edges have no pale halo."""
    a = a.astype(float)
    B = np.median(a[bg], axis=0) if bg.any() else np.array([254., 246., 246.])
    d = np.sqrt(((a - B) ** 2).sum(axis=2))
    a_c = np.clip((d - 6) / 40.0, 0, 1)            # how "un-background" a pixel is
    din = ndimage.distance_transform_edt(keep)
    dout = ndimage.distance_transform_edt(~keep)
    alpha = keep.astype(float)
    band_in = keep & (din <= 1.5)
    band_out = ~keep & (dout <= 1.0)
    alpha[band_in] = np.maximum(a_c[band_in], 0.35)
    alpha[band_out] = a_c[band_out] * 0.6
    alpha = ndimage.gaussian_filter(alpha, 0.45)     # smooth the pixel stair-steps
    alpha[dout > 2] = 0
    alpha = np.clip(alpha, 0, 1)
    # edge and transparent pixels take the colour of the nearest solid pixel (no background bleed)
    solid = keep & (a_c >= 0.85)
    if solid.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
        near = a[iy, ix]
        fix = ~solid & ((~keep) | band_in)
        a[fix] = near[fix]
    return Image.fromarray(np.dstack([np.clip(a, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')

def cut(name, box, mode='largest', pad=0, scale=2, minsize=40, close=0, erase=(), holes=0):
    x,y,w,h = box
    x0,y0 = max(0,x-pad), max(0,y-pad); x1,y1 = min(W,x+w+pad), min(H,y+h+pad)
    a = im[y0:y1, x0:x1].copy()
    for ex0, ey0, ex1, ey1 in erase:  # blank out neighbouring labels (sheet coordinates)
        a[max(0,ey0-y0):max(0,ey1-y0), max(0,ex0-x0):max(0,ex1-x0)] = 255
    light = is_light(a)
    # close=k: seal outline gaps up to ~2k px so pale interiors (gown, veil) are not flooded
    cand = light & ~ndimage.binary_dilation(~light, iterations=close) if close else light
    lab, n = ndimage.label(cand)
    border = set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]]))) - {0}
    bg = np.isin(lab, list(border))
    if close:
        bg = ndimage.binary_dilation(bg, iterations=close, mask=light)
    if holes:  # also clear enclosed background pockets (e.g. inside rings) bigger than `holes` px
        hl, hn = ndimage.label(light & ~bg)
        hs = ndimage.sum(np.ones_like(hl), hl, range(1, hn+1))
        bg |= np.isin(hl, [i+1 for i,v in enumerate(hs) if v >= holes])
    fg = ~bg
    flab, fn = ndimage.label(fg)
    if fn == 0: print('empty', name); return
    sizes = ndimage.sum(fg, flab, range(1, fn+1))
    if mode == 'largest':
        keep = flab == (int(np.argmax(sizes))+1)
    else:
        keep = np.isin(flab, [i+1 for i,s in enumerate(sizes) if s >= minsize])
    keep = ndimage.binary_fill_holes(keep) if mode=='largest' else keep
    img = matte(a, keep, bg)
    bb = img.getbbox(); img = img.crop(bb)
    if scale != 1:
        img = img.resize((img.width*scale, img.height*scale), Image.LANCZOS)
        r, g, b, al = img.split()
        rgb = Image.merge('RGB', (r, g, b)).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        img = Image.merge('RGBA', (*rgb.split(), al))  # sharpen colour only; sharpening alpha makes jaggies
    img.save(os.path.join(OUT, name + '.png'))
    return img

# Props for the opening banner (rings) and the ending party (gifts, flower basket).
def props():
    cut('prop_gift', (566,594,80,80))
    cut('prop_basket', (736,584,92,90))
    cut('prop_rings', (372,612,80,58), mode='all', holes=25)

def main():
    ONLY = sys.argv[3] if len(sys.argv) > 3 else 'all'  # 'props' redoes only the prop sprites
    load(sys.argv[1], sys.argv[2])
    if ONLY != 'props':
        # Boxes measured on public/ref/3.webp (1536x1024).
        # Boxes are generous (they overlap the neighbours by EXP px); "largest" mode keeps only the
        # sprite itself. Panel title chips above the top rows are erased first.
        EXP = 10
        CHIPS = [(0,0,520,40), (1055,0,1260,34), (0,0,215,42)]
        B1Y, B1H = 34, 152
        bride1 = ['idle','walk1','walk2','walk3','run','jump','happy','excited']
        bx1 = [(340,425),(425,507),(507,592),(592,675),(677,762),(768,852),(853,942),(944,1046)]
        B2Y, B2H = 212, 152
        bride2 = ['sad','surprised','thinking','shy','blush','crying','celebrate','love']
        bx2 = [(340,428),(430,511),(511,596),(596,678),(679,769),(770,856),(856,949),(950,1049)]
        for n,(a,b) in zip(bride1,bx1): cut('bride_'+n, (a-EXP,B1Y,b-a+2*EXP,B1H), erase=CHIPS)
        for n,(a,b) in zip(bride2,bx2): cut('bride_'+n, (a-EXP,B2Y,b-a+2*EXP,B2H))
        G1Y, G1H = 30, 167
        g1 = ['idle','walk1','walk2','run','happy']; gx1=[(1062,1152),(1152,1243),(1243,1334),(1334,1428),(1428,1522)]
        G2Y, G2H = 214, 162
        g2 = ['surprised','thinking','shy','blush','love']; gx2=[(1062,1157),(1157,1251),(1251,1341),(1341,1434),(1434,1527)]
        for n,(a,b) in zip(g1,gx1): cut('groom_'+n, (a-EXP,G1Y,min(b+EXP,1530)-(a-EXP),G1H), erase=CHIPS)
        for n,(a,b) in zip(g2,gx2): cut('groom_'+n, (a-EXP,G2Y,min(b+EXP,1530)-(a-EXP),G2H))
        cut('bride_main', (12,44,204,296), erase=[(0,0,176,42)])
        cut('groom_main', (172,28,156,310), erase=[(0,0,176,42)])
        # items
        cut('item_dress', (12,417,114,110), close=2)
        cut('item_veil', (555,434,100,82), close=4)
        cut('item_shoes', (32,534,84,57), mode='all')
        cut('item_bouquet', (474,434,82,90))
        cut('item_tiara', (651,442,90,42), mode='all', minsize=20)
        cut('item_rings', (741,427,78,87), mode='all')
        cut('item_earrings', (491,532,54,52), mode='all', minsize=15)
        cut('item_perfume', (826,427,70,90))
        # ui / extras
        cut('ui_banner', (9,704,314,102), pad=1, scale=3, erase=[(0,680,146,717)])
        cut('anim_veil', (1146,727,122,162), mode='all')
        cut('anim_bouquet', (921,733,108,164))
        fx = [(538,636),(636,727),(727,814),(814,907)]
        fy = [(727,822),(822,913),(913,1001)]
        i = 0
        for (y0,y1) in fy:
            for (x0,x1) in fx:
                cut(f'face_{i}', (x0,y0,x1-x0,y1-y0)); i += 1
    props()
    print('done')

if __name__ == '__main__':
    main()
