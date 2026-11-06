// Canvas drawing for the K-Drama Garden: cherry blossoms, silk lanterns, a hanok wall with a gate,
// a lotus pond and stepping-stone paths. Shares helpers (and benches, arches, bushes) with the wedding garden.
import { rng } from '../components/Decor'
import { blob, leaf, makeCanvas, renderProp, roundRect, shadow, type Obstacle, type Prop } from '../game/world'
import { ACTORS } from './data'

export const KW = 1700
export const KH = 1160
export const K_WALK_TOP = 410
export const K_START: [number, number] = [850, 1090]
export const POND = { x: 850, y: 770, rx: 200, ry: 82 }

export interface KProp {
  kind: 'sakura' | 'lantern' | 'bench' | 'arch' | 'bush'
  x: number
  y: number
  seed: number
  canvas?: HTMLCanvasElement
  ox?: number
  oy?: number
}

export const K_PROPS: KProp[] = [
  { kind: 'arch', x: 760, y: 486, seed: 7 },
  { kind: 'sakura', x: 110, y: 500, seed: 1 },
  { kind: 'sakura', x: 530, y: 452, seed: 2 },
  { kind: 'sakura', x: 1330, y: 462, seed: 3 },
  { kind: 'sakura', x: 1630, y: 520, seed: 4 },
  { kind: 'sakura', x: 440, y: 770, seed: 5 },
  { kind: 'sakura', x: 1270, y: 790, seed: 6 },
  { kind: 'sakura', x: 70, y: 1140, seed: 7 },
  { kind: 'sakura', x: 1650, y: 1150, seed: 8 },
  { kind: 'lantern', x: 990, y: 560, seed: 1 },
  { kind: 'lantern', x: 610, y: 600, seed: 2 },
  { kind: 'lantern', x: 700, y: 960, seed: 3 },
  { kind: 'lantern', x: 1000, y: 960, seed: 4 },
  { kind: 'lantern', x: 140, y: 760, seed: 5 },
  { kind: 'lantern', x: 1580, y: 780, seed: 6 },
  { kind: 'bench', x: 190, y: 640, seed: 1 },
  { kind: 'bench', x: 1560, y: 690, seed: 2 },
  { kind: 'bench', x: 380, y: 1100, seed: 3 },
  { kind: 'bush', x: 1330, y: 1110, seed: 31 },
  { kind: 'bush', x: 900, y: 600, seed: 32 },
]

export const K_OBSTACLES: Obstacle[] = [
  ...K_PROPS.flatMap((p): Obstacle[] => {
    switch (p.kind) {
      case 'sakura':
        return [{ x: p.x, y: p.y - 6, r: 28 }]
      case 'lantern':
        return [{ x: p.x, y: p.y - 4, r: 12 }]
      case 'bench':
        return [{ x: p.x - 40, y: p.y - 10, r: 22 }, { x: p.x + 40, y: p.y - 10, r: 22 }]
      case 'arch':
        return [{ x: p.x - 92, y: p.y - 4, r: 16 }, { x: p.x + 92, y: p.y - 4, r: 16 }]
      case 'bush':
        return [{ x: p.x - 28, y: p.y - 14, r: 30 }, { x: p.x + 28, y: p.y - 14, r: 30 }]
    }
  }),
  // the pond, as a row of flattened circles
  ...[-130, -45, 45, 130].map((dx) => ({ x: POND.x + dx, y: POND.y, r: dx === -45 || dx === 45 ? 92 : 70 })),
  // each actor stands their ground
  ...ACTORS.map((a) => ({ x: a.spot[0], y: a.spot[1] - 4, r: 20 })),
]

/** Fairy lights strung between the lanterns. */
export const K_LIGHTS: [number, number, number, number, number][] = [
  [610, 410, 990, 380, 50],
  [140, 560, 610, 410, 50],
  [990, 380, 1580, 590, 70],
  [700, 770, 1000, 770, 26],
]

// ---------------------------------------------------------------- props

function blossom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath()
    ctx.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.55, r * 0.42, a, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#f08fae'
  ctx.beginPath()
  ctx.arc(x, y, r * 0.24, 0, Math.PI * 2)
  ctx.fill()
}

function sakura(ctx: CanvasRenderingContext2D, ax: number, ay: number, seed: number) {
  const r = rng(seed * 17 + 3)
  shadow(ctx, ax, ay, 96, 20)
  // fallen petals around the trunk
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = ['#fbb6c8', '#ffd1dd', '#fff'][i % 3]
    ctx.beginPath()
    ctx.ellipse(ax + (r() - 0.5) * 190, ay - 6 + (r() - 0.5) * 26, 3.6, 2.2, r() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  // trunk and branches
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#6e5148'
  ctx.lineWidth = 26
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.bezierCurveTo(ax - 6, ay - 50, ax + 14, ay - 90, ax + 2, ay - 150)
  ctx.stroke()
  ctx.lineWidth = 11
  for (const [dx, dy, cx, cy] of [[-80, -210, -40, -150], [84, -200, 40, -160], [-20, -250, -6, -200], [40, -240, 20, -190]]) {
    ctx.beginPath()
    ctx.moveTo(ax + 2, ay - 130)
    ctx.quadraticCurveTo(ax + cx, ay + cy, ax + dx, ay + dy)
    ctx.stroke()
  }
  ctx.strokeStyle = '#8a6a5e'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(ax - 6, ay - 8)
  ctx.bezierCurveTo(ax - 10, ay - 50, ax + 6, ay - 90, ax - 4, ay - 140)
  ctx.stroke()
  // canopy
  const puffs: [number, number, number][] = [
    [0, -230, 92], [-86, -200, 70], [88, -196, 72], [-46, -276, 62], [52, -278, 64], [-120, -150, 44], [124, -150, 46], [0, -170, 74],
  ]
  puffs.forEach(([dx, dy, rr], i) => blob(ctx, ax + dx, ay + dy, rr, rr * 0.9, ['#f9c6d4', '#fbd5e0', '#f6b7c9', '#ffe1ea'][i % 4], '#eba3b8', 2))
  blob(ctx, ax - 40, ay - 288, 40, 24, 'rgba(255,255,255,0.4)')
  blob(ctx, ax + 60, ay - 240, 30, 18, 'rgba(255,255,255,0.3)')
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * 130
    blossom(ctx, ax + Math.cos(a) * d, ay - 215 + Math.sin(a) * d * 0.62, 5 + r() * 4, r() < 0.5 ? '#fff' : '#ffd6e2')
  }
}

function lantern(ctx: CanvasRenderingContext2D, ax: number, ay: number, seed: number) {
  // a silk "cheongsachorong" lantern on a wooden post, in pastel silk
  const silk = [['#d9cbf5', '#a387e0'], ['#fdc6d6', '#e3809f'], ['#cfe3fb', '#7fa6dc']][seed % 3]
  shadow(ctx, ax, ay, 22, 6)
  ctx.fillStyle = '#9b7356'
  ctx.strokeStyle = '#6e5148'
  ctx.lineWidth = 2
  roundRect(ctx, ax - 5, ay - 196, 10, 198, 3)
  ctx.fill()
  ctx.stroke()
  roundRect(ctx, ax - 5, ay - 196, 44, 8, 3)
  ctx.fill()
  ctx.stroke()
  const lx = ax + 30
  const ly = ay - 150
  // glow
  const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, 62)
  g.addColorStop(0, 'rgba(255,240,200,0.75)')
  g.addColorStop(1, 'rgba(255,236,190,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(lx, ly, 62, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#6e5148'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(lx, ay - 188)
  ctx.lineTo(lx, ly - 30)
  ctx.stroke()
  // body
  ctx.fillStyle = silk[0]
  ctx.strokeStyle = silk[1]
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(lx - 14, ly - 26)
  ctx.quadraticCurveTo(lx - 30, ly, lx - 14, ly + 26)
  ctx.lineTo(lx + 14, ly + 26)
  ctx.quadraticCurveTo(lx + 30, ly, lx + 14, ly - 26)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.beginPath()
  ctx.ellipse(lx - 8, ly - 4, 4, 13, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = silk[1]
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(lx, ly - 26)
  ctx.lineTo(lx, ly + 26)
  ctx.stroke()
  // caps and tassel
  ctx.fillStyle = '#e8c56f'
  ctx.strokeStyle = '#c49a4d'
  ctx.lineWidth = 1.5
  for (const yy of [ly - 31, ly + 25]) {
    roundRect(ctx, lx - 16, yy, 32, 6, 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.strokeStyle = '#e3809f'
  ctx.lineWidth = 2
  for (const dx of [-3, 0, 3]) {
    ctx.beginPath()
    ctx.moveTo(lx, ly + 31)
    ctx.lineTo(lx + dx, ly + 50)
    ctx.stroke()
  }
  blossom(ctx, ax - 6, ay - 180, 7, '#ffd6e2')
  leaf(ctx, ax + 4, ay - 172, 7, 30)
}

export function renderKProp(p: KProp, scale: number) {
  if (p.kind === 'bench' || p.kind === 'arch' || p.kind === 'bush') {
    const done = renderProp(p as unknown as Prop, scale)
    Object.assign(p, { canvas: done.canvas, ox: done.ox, oy: done.oy })
    return p
  }
  const [w, h, ax, ay] = p.kind === 'sakura' ? [340, 400, 170, 386] : [100, 240, 40, 232]
  const { c, ctx } = makeCanvas(w, h, scale)
  if (p.kind === 'sakura') sakura(ctx, ax, ay, p.seed)
  else lantern(ctx, ax, ay, p.seed)
  p.canvas = c
  p.ox = -ax
  p.oy = -ay
  return p
}

// ---------------------------------------------------------------- ground

function curvedRoof(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h: number) {
  // dark tiled hanok roof with upturned eaves
  const lift = h * 0.9
  ctx.fillStyle = '#6f6a86'
  ctx.strokeStyle = '#4f4a63'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x0 - 18, y - lift)
  ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.2, y, (x0 + x1) / 2, y)
  ctx.quadraticCurveTo(x1 - (x1 - x0) * 0.2, y, x1 + 18, y - lift)
  ctx.lineTo(x1 - 6, y - h * 1.5)
  ctx.quadraticCurveTo((x0 + x1) / 2, y - h * 1.15, x0 + 6, y - h * 1.5)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // tile ridges
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 2
  for (let x = x0 + 8; x < x1; x += 14) {
    ctx.beginPath()
    ctx.moveTo(x, y - h * 1.3)
    ctx.lineTo(x + (x - (x0 + x1) / 2) * 0.05, y - 3)
    ctx.stroke()
  }
  ctx.fillStyle = '#8c86a3'
  roundRect(ctx, x0 + 4, y - h * 1.62, x1 - x0 - 8, h * 0.22, 4)
  ctx.fill()
}

export function renderKGround(scale: number) {
  const { c, ctx } = makeCanvas(KW, KH, scale)
  const r = rng(77)

  // sky and soft mountains
  const sky = ctx.createLinearGradient(0, 0, 0, 380)
  sky.addColorStop(0, '#cfe0fa')
  sky.addColorStop(0.6, '#f1e4f8')
  sky.addColorStop(1, '#ffe9f0')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, KW, 400)
  for (const [x, y, s] of [[180, 70, 0.9], [700, 44, 0.7], [1180, 90, 1], [1560, 52, 0.8]]) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    for (const [dx, dy, rx, ry] of [[0, 0, 70, 24], [-40, 8, 44, 18], [45, 6, 50, 20], [10, -14, 40, 22]]) {
      ctx.beginPath()
      ctx.ellipse(dx, dy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  for (const [col, base, amp, ph] of [['#d8d2f0', 230, 70, 0.4], ['#cbd9f1', 270, 50, 1.7]] as const) {
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.moveTo(0, 400)
    for (let x = 0; x <= KW; x += 20) ctx.lineTo(x, base - Math.abs(Math.sin(x / 260 + ph)) * amp - Math.sin(x / 90 + ph) * 8)
    ctx.lineTo(KW, 400)
    ctx.fill()
  }
  // a little pagoda-roofed pavilion on the hill
  ctx.save()
  ctx.translate(1380, 236)
  ctx.fillStyle = '#efe4f6'
  ctx.fillRect(-26, -8, 52, 30)
  curvedRoof(ctx, -34, 34, -6, 16)
  ctx.restore()

  // blossom tree line behind the wall
  for (let i = 0; i < 26; i++) {
    const x = (i / 25) * KW + (r() - 0.5) * 50
    const s = 0.55 + r() * 0.35
    ctx.save()
    ctx.translate(x, 340)
    ctx.scale(s, s)
    ctx.fillStyle = '#7d5f55'
    ctx.fillRect(-6, -60, 12, 62)
    for (const [dx, dy, rr, k] of [[0, -100, 58, 0], [-38, -76, 42, 1], [40, -78, 44, 2], [0, -60, 40, 3]]) {
      ctx.fillStyle = ['#f9c6d4', '#fbd5e0', '#f6b7c9', '#ffe1ea'][k]
      ctx.beginPath()
      ctx.arc(dx, dy, rr, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  // lawn
  const grass = ctx.createLinearGradient(0, 370, 0, KH)
  grass.addColorStop(0, '#d6ebc4')
  grass.addColorStop(1, '#b3d79a')
  ctx.fillStyle = grass
  ctx.fillRect(0, 370, KW, KH - 370)
  for (let i = 0; i < 28; i++) blob(ctx, r() * KW, 430 + r() * (KH - 430), 60 + r() * 90, 20 + r() * 30, 'rgba(230,245,214,0.45)')

  // hanok wall along the back, with the gate in the middle
  const wallTop = 330
  const wallBot = 404
  for (const [x0, x1] of [[-30, 760], [940, KW + 30]]) {
    ctx.fillStyle = '#e7dccd'
    ctx.fillRect(x0, wallBot - 22, x1 - x0, 22)
    ctx.strokeStyle = '#cdbca6'
    ctx.lineWidth = 1.5
    for (let x = x0; x < x1; x += 34) {
      ctx.beginPath()
      ctx.ellipse(x + 17, wallBot - 11, 15, 9, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillStyle = '#fbf6ee'
    ctx.fillRect(x0, wallTop + 12, x1 - x0, wallBot - 22 - wallTop - 12)
    // flower-pattern tiles set into the plaster
    for (let x = x0 + 50; x < x1 - 30; x += 110) {
      ctx.fillStyle = '#efe2f5'
      roundRect(ctx, x - 16, wallTop + 22, 32, 26, 4)
      ctx.fill()
      blossom(ctx, x, wallTop + 35, 7, '#f6b7c9')
    }
    curvedRoof(ctx, x0, x1, wallTop + 14, 12)
  }
  // gate
  ctx.save()
  ctx.translate(850, wallBot)
  ctx.fillStyle = '#b07a6a'
  ctx.strokeStyle = '#7d5048'
  ctx.lineWidth = 2
  for (const dx of [-86, 72]) {
    roundRect(ctx, dx, -150, 14, 152, 3)
    ctx.fill()
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(255,236,242,0.65)'
  ctx.fillRect(-72, -120, 144, 120)
  ctx.fillStyle = '#9fc0e8'
  ctx.fillRect(-90, -152, 180, 12)
  ctx.fillStyle = '#e9a7bb'
  ctx.fillRect(-90, -142, 180, 6)
  curvedRoof(ctx, -112, 112, -152, 20)
  // signboard
  ctx.fillStyle = '#fff6e6'
  ctx.strokeStyle = '#c49a4d'
  ctx.lineWidth = 3
  roundRect(ctx, -70, -132, 140, 34, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#8f5fc4'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '800 15px Quicksand, ui-rounded, sans-serif'
  ctx.fillText('K-DRAMA GARDEN', 0, -115)
  ctx.restore()

  // stepping-stone paths
  const stones = (pts: [number, number][], gap: number, size: number) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i]
      const [x1, y1] = pts[i + 1]
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / gap))
      for (let k = 0; k < n; k++) {
        const u = k / n
        const x = x0 + (x1 - x0) * u + (r() - 0.5) * 8
        const y = y0 + (y1 - y0) * u + (r() - 0.5) * 6
        const s = size * (0.85 + r() * 0.3)
        blob(ctx, x, y + 3, s, s * 0.5, 'rgba(120,140,100,0.18)')
        blob(ctx, x, y, s, s * 0.5, '#f3ebe0', '#d8c9b6', 2)
        blob(ctx, x - s * 0.3, y - s * 0.15, s * 0.3, s * 0.12, 'rgba(255,255,255,0.7)')
      }
    }
  }
  stones([[850, KH + 10], [850, 900]], 40, 26)
  stones([[850, 900], [640, 880], [560, 760], [640, 640], [850, 600], [850, 420]], 42, 22)
  stones([[850, 900], [1060, 880], [1140, 760], [1060, 640], [850, 600]], 42, 22)
  stones([[640, 640], [460, 600], [260, 600], [80, 560]], 44, 20)
  stones([[1060, 640], [1250, 610], [1450, 650], [1640, 640]], 44, 20)
  stones([[640, 880], [430, 920], [230, 960], [60, 1000]], 44, 20)
  stones([[1060, 880], [1270, 960], [1460, 1000], [1660, 980]], 44, 20)

  // lotus pond
  blob(ctx, POND.x, POND.y + 6, POND.rx + 22, POND.ry + 18, '#e3d7c6')
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2
    blob(ctx, POND.x + Math.cos(a) * (POND.rx + 10), POND.y + 4 + Math.sin(a) * (POND.ry + 8), 18, 10, ['#efe6da', '#e6dccd', '#f6efe4'][i % 3], '#d0bfa8', 1.5)
  }
  const water = ctx.createLinearGradient(0, POND.y - POND.ry, 0, POND.y + POND.ry)
  water.addColorStop(0, '#a9d6ef')
  water.addColorStop(1, '#cbe8f6')
  blob(ctx, POND.x, POND.y, POND.rx, POND.ry, '#bfe3f2')
  ctx.fillStyle = water
  ctx.beginPath()
  ctx.ellipse(POND.x, POND.y, POND.rx - 4, POND.ry - 4, 0, 0, Math.PI * 2)
  ctx.fill()
  for (const [dx, dy, w] of [[-90, -30, 60], [40, 10, 80], [-20, 40, 50], [110, -40, 40]]) blob(ctx, POND.x + dx, POND.y + dy, w, 4, 'rgba(255,255,255,0.55)')
  // koi
  for (const [dx, dy, rot, col] of [[-60, 10, 0.4, '#f6a46b'], [70, -18, -2.6, '#fff'], [120, 24, 2.2, '#f6a46b']] as const) {
    ctx.save()
    ctx.translate(POND.x + dx, POND.y + dy)
    ctx.rotate(rot)
    blob(ctx, 0, 0, 14, 6, col, '#e0875a', 1.2)
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.moveTo(-12, 0)
    ctx.lineTo(-22, -6)
    ctx.lineTo(-22, 6)
    ctx.fill()
    if (col === '#fff') blob(ctx, 3, 0, 5, 3, '#f6a46b')
    ctx.restore()
  }
  // lily pads and lotus flowers
  for (const [dx, dy, s] of [[-140, -10, 1], [-110, 34, 0.8], [150, 10, 1], [10, -50, 0.75], [-30, 50, 0.9], [96, 50, 0.8]]) {
    const x = POND.x + dx
    const y = POND.y + dy
    ctx.fillStyle = '#8cc47a'
    ctx.strokeStyle = '#6fa560'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(x, y, 20 * s, 10 * s, 0, 0.3, Math.PI * 2 - 0.1)
    ctx.lineTo(x, y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    if (s > 0.85) {
      for (const [px, py, rot] of [[-6, -6, -0.5], [6, -6, 0.5], [0, -9, 0]]) {
        ctx.save()
        ctx.translate(x + px * s, y + py * s)
        ctx.rotate(rot)
        blob(ctx, 0, 0, 5 * s, 9 * s, '#fdc6d6', '#e3809f', 1.2)
        ctx.restore()
      }
    }
  }

  // petals and little flowers on the lawn
  for (let i = 0; i < 340; i++) {
    const x = r() * KW
    const y = 420 + r() * (KH - 430)
    if (Math.hypot((x - POND.x) / (POND.rx + 30), (y - POND.y) / (POND.ry + 26)) < 1) continue
    if (i % 2) {
      ctx.fillStyle = ['#fbb6c8', '#ffd1dd', '#fff'][i % 3]
      ctx.beginPath()
      ctx.ellipse(x, y, 4, 2.5, r() * 3, 0, Math.PI * 2)
      ctx.fill()
    } else {
      blossom(ctx, x, y, 3.2, ['#fff', '#ffd6e2', '#e7dcff', '#fff1b8'][Math.floor(r() * 4)])
    }
  }
  ctx.strokeStyle = '#94c37d'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (let i = 0; i < 200; i++) {
    const x = r() * KW
    const y = 420 + r() * (KH - 430)
    ctx.beginPath()
    ctx.moveTo(x - 4, y)
    ctx.lineTo(x - 6, y - 8)
    ctx.moveTo(x, y)
    ctx.lineTo(x, y - 10)
    ctx.moveTo(x + 4, y)
    ctx.lineTo(x + 6, y - 8)
    ctx.stroke()
  }
  return c
}

/** The gate in the wedding garden that leads here (placed by KGATE in game/world.ts). */
export function renderKGate(scale: number) {
  const w = 220
  const h = 260
  const ax = 110
  const ay = 250
  const { c, ctx } = makeCanvas(w, h, scale)
  shadow(ctx, ax, ay, 90, 12)
  ctx.fillStyle = '#b07a6a'
  ctx.strokeStyle = '#7d5048'
  ctx.lineWidth = 2
  for (const dx of [-68, 56]) {
    roundRect(ctx, ax + dx, ay - 170, 12, 172, 3)
    ctx.fill()
    ctx.stroke()
  }
  ctx.fillStyle = '#9fc0e8'
  ctx.fillRect(ax - 72, ay - 172, 144, 10)
  ctx.fillStyle = '#e9a7bb'
  ctx.fillRect(ax - 72, ay - 162, 144, 5)
  curvedRoof(ctx, ax - 86, ax + 86, ay - 172, 16)
  ctx.fillStyle = '#fff6e6'
  ctx.strokeStyle = '#c49a4d'
  ctx.lineWidth = 2.5
  roundRect(ctx, ax - 54, ay - 152, 108, 46, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#8f5fc4'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '800 14px Quicksand, ui-rounded, sans-serif'
  ctx.fillText('K-DRAMA', ax, ay - 137)
  ctx.font = '700 15px "Dancing Script", cursive'
  ctx.fillStyle = '#d64d77'
  ctx.fillText('Garden', ax, ay - 118)
  // blossom garlands on the posts
  const r = rng(5)
  for (const dx of [-62, 62]) {
    for (let i = 0; i < 9; i++) blossom(ctx, ax + dx + (r() - 0.5) * 14, ay - 160 + i * 17, 5 + r() * 3, r() < 0.5 ? '#fff' : '#fbc3d3')
  }
  return { canvas: c, ox: -ax, oy: -ay }
}
