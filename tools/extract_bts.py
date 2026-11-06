# Cut the BTS sheet (public/ref/5.webp, 1536x1024) into sprites for the garden stage.
#   python tools/extract_bts.py public/ref/5.webp public/sprites
# Uses the same cut-out and edge cleanup as extract.py.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract as X

X.load(sys.argv[1], sys.argv[2])
cut = X.cut

# Two full-body poses per member, in the labelled columns at the top right.
# Row 1 starts below the name chips; the rows touch, so each box ends at the thinnest gap.
MEMBERS = ['rm', 'jin', 'suga', 'jhope', 'jimin', 'v', 'jk']
COLS = [(418, 547), (564, 698), (722, 858), (880, 1018), (1036, 1180), (1196, 1342), (1368, 1502)]
ROW1_END = [198, 202, 196, 195, 202, 200, 199]
for name, (x0, x1), mid in zip(MEMBERS, COLS, ROW1_END):
    if name != 'jhope':  # the sheet cuts j-hope's first pose off at the waist; the game mirrors his second pose instead
        cut(f'bts_{name}_1', (x0, 39, x1 - x0, mid - 39))
    cut(f'bts_{name}_2', (x0, mid, x1 - x0, 380 - mid))

# Concert props from the bottom row.
cut('bts_logo', (18, 856, 82, 146), mode='all')
cut('bts_lightstick', (124, 856, 82, 146))
print('done')
