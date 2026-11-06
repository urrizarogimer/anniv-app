# Make a "casual" bride: tint the ivory gown to a soft pink sundress, below the neckline.
import sys, os
from PIL import Image
import numpy as np, colorsys
d = sys.argv[1]
names = ['idle','walk1','walk2','walk3','run','jump','happy','excited','surprised','thinking','love','celebrate']
for n in names:
    im = Image.open(os.path.join(d, f'bride_{n}.png')).convert('RGBA')
    a = np.array(im).astype(float)
    h, w = a.shape[:2]
    rgb = a[...,:3]/255.0
    mx = rgb.max(axis=2); mn = rgb.min(axis=2)
    sat = np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
    ys = np.arange(h)[:,None]*np.ones((1,w))
    # gown: light, low-saturation pixels in lower 55% of the sprite
    gown = (mx>0.70)&(sat<0.20)&(ys>h*0.47)&(a[...,3]>10)
    # also the bodice and shading greys
    gown |= (mx>0.55)&(sat<0.12)&(ys>h*0.47)&(a[...,3]>10)
    lum = rgb.mean(axis=2)
    target = np.array([0.98,0.72,0.80])  # blush pink
    shade = np.clip((lum-0.45)/0.55,0,1)[...,None]
    newc = target*(0.62+0.38*shade)
    out = rgb.copy(); out[gown] = newc[gown]
    a[...,:3] = out*255
    Image.fromarray(a.astype(np.uint8),'RGBA').save(os.path.join(d, f'bridec_{n}.png'))
print('ok')
