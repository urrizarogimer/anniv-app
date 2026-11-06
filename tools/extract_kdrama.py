# Cut the K-drama actor sheet (public/ref/6.webp, 1536x1024) into sprites for the K-Drama Garden.
#   python tools/extract_kdrama.py public/ref/6.webp public/sprites
# Uses the same cut-out and edge cleanup as extract.py.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract as X

X.load(sys.argv[1], sys.argv[2])
cut = X.cut

# Columns, left to right, as labelled on the sheet.
ACTORS = ['haein', 'jongsuk', 'haneul', 'soohyun', 'wooseok', 'changwook', 'seonho', 'joohyuk']

# Each column has two poses per row; the x splits are the white gaps between figures.
# Row 1 (y 262-445): standing (the second pose is unused).  Row 2 (y 448-598): laughing, then surprised.
ROW1 = [(11, 107, 120, 210), (229, 315, 333, 413), (424, 512, 521, 599), (616, 696, 706, 782),
        (800, 879, 900, 974), (990, 1063, 1080, 1154), (1169, 1251, 1262, 1338), (1352, 1431, 1444, 1520)]
ROW2 = [(9, 106, 115, 213), (233, 317, 330, 414), (422, 507, 514, 601), (613, 693, 702, 786),
        (796, 878, 897, 980), (990, 1072, 1080, 1162), (1171, 1256, 1262, 1345), (1354, 1436, 1442, 1526)]
for name, (a0, a1, _b0, _b1), (c0, c1, d0, d1) in zip(ACTORS, ROW1, ROW2):
    cut(f'kd_{name}_idle', (a0, 262, a1 - a0, 445 - 262))
    cut(f'kd_{name}_happy', (c0, 448, c1 - c0, 598 - 448))
    cut(f'kd_{name}_oops', (d0, 448, d1 - d0, 598 - 448))

# The group photo and the clapperboard from the bottom row.
group = cut('kd_group', (14, 762, 777, 241))
# the group photo is only shown at the end, so keep it light: a smaller WebP instead of the PNG
group.resize((1100, round(group.height * 1100 / group.width)), X.Image.LANCZOS).save(os.path.join(sys.argv[2], 'kd_group.webp'), quality=88)
os.remove(os.path.join(sys.argv[2], 'kd_group.png'))
cut('kd_clapper', (797, 762, 139, 150), mode='all', minsize=200)
print('done')
