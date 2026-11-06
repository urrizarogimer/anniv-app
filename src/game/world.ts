// Canvas drawing for the garden world: a static ground layer plus depth-sorted props.
import { rng, ROSE_COLORS } from '../components/Decor'
import type { ItemId } from '../items'

export const WW = 1800
export const WH = 1060
export const WALK_TOP = 330

export interface Obstacle {
  x: number
  y: number
  r: number
}

export interface Prop {
  kind: 'tree' | 'bush' | 'arch' | 'lamp' | 'bench' | 'fountain' | 'cart'
  x: number
  y: number // base (feet) y, used for depth sorting
  seed: number
  canvas?: HTMLCanvasElement
  ox?: number // offset from (x, y) to the canvas' top-left, in world units
  oy?: number
}

export const PROPS: Prop[] = [
  { kind: 'arch', x: 900, y: 412, seed: 3 },
  { kind: 'fountain', x: 900, y: 690, seed: 1 },
  { kind: 'lamp', x: 690, y: 430, seed: 1 },
  { kind: 'lamp', x: 1110, y: 430, seed: 2 },
  { kind: 'cart', x: 1500, y: 500, seed: 1 },
  { kind: 'bench', x: 330, y: 470, seed: 1 },
  { kind: 'bench', x: 1360, y: 820, seed: 2 },
  { kind: 'tree', x: 120, y: 420, seed: 11 },
  { kind: 'tree', x: 520, y: 380, seed: 12 },
  { kind: 'tree', x: 1290, y: 382, seed: 13 },
  { kind: 'tree', x: 1700, y: 440, seed: 14 },
  { kind: 'tree', x: 130, y: 960, seed: 15 },
  { kind: 'tree', x: 1690, y: 1020, seed: 16 },
  { kind: 'bush', x: 400, y: 600, seed: 21 },
  { kind: 'bush', x: 690, y: 850, seed: 22 },
  { kind: 'bush', x: 1130, y: 860, seed: 23 },
  { kind: 'bush', x: 1430, y: 640, seed: 24 },
  { kind: 'bush', x: 190, y: 720, seed: 25 },
  { kind: 'bush', x: 1660, y: 760, seed: 26 },
  { kind: 'bush', x: 620, y: 520, seed: 27 },
  { kind: 'bush', x: 1200, y: 540, seed: 28 },
  { kind: 'bush', x: 450, y: 1010, seed: 29 },
  { kind: 'bush', x: 1380, y: 1020, seed: 30 },
]

export const OBSTACLES: Obstacle[] = PROPS.flatMap((p): Obstacle[] => {
  switch (p.kind) {
    case 'tree':
      return [{ x: p.x, y: p.y - 6, r: 26 }]
    case 'bush':
      return [{ x: p.x - 28, y: p.y - 14, r: 30 }, { x: p.x + 28, y: p.y - 14, r: 30 }]
    case 'arch':
      return [{ x: p.x - 92, y: p.y - 4, r: 16 }, { x: p.x + 92, y: p.y - 4, r: 16 }]
    case 'fountain':
      return [{ x: p.x, y: p.y - 30, r: 92 }]
    case 'lamp':
      return [{ x: p.x, y: p.y - 4, r: 12 }]
    case 'bench':
      return [{ x: p.x - 40, y: p.y - 10, r: 22 }, { x: p.x + 40, y: p.y - 10, r: 22 }]
    case 'cart':
      return [{ x: p.x - 40, y: p.y - 14, r: 30 }, { x: p.x + 40, y: p.y - 14, r: 30 }]
  }
})

export const ITEM_SPOTS: Record<ItemId, [number, number]> = {
  dress: [250, 590],
  veil: [560, 680],
  shoes: [1590, 620],
  bouquet: [1240, 700],
  tiara: [900, 480],
  rings: [1200, 1000],
  earrings: [380, 860],
  perfume: [1560, 920],
}

export const START: [number, number] = [900, 900]

// ---------------------------------------------------------------- helpers

function rose(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: number) {
  const [fill, line] = ROSE_COLORS[c % ROSE_COLORS.length]
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = fill
  ctx.strokeStyle = line
  ctx.lineWidth = Math.max(0.8, r * 0.13)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-r * 0.55, r * 0.1)
  ctx.quadraticCurveTo(0, -r * 0.75, r * 0.55, r * 0.05)
  ctx.moveTo(-r * 0.3, r * 0.35)
  ctx.quadraticCurveTo(r * 0.1, -r * 0.25, r * 0.35, r * 0.3)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.beginPath()
  ctx.arc(-r * 0.35, -r * 0.4, r * 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rot * Math.PI) / 180)
  ctx.fillStyle = '#9cc488'
  ctx.strokeStyle = '#6f9e5e'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(0, 0, s, s * 0.45, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lw = 2) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lw
    ctx.stroke()
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  blob(ctx, x, y, rx, ry, 'rgba(90,120,70,0.22)')
}

function bushShape(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  const r = rng(seed)
  shadow(ctx, x, y, w * 0.55, h * 0.16)
  blob(ctx, x, y - h * 0.42, w / 2, h * 0.5, '#a9cf94', '#7fae6a', 2)
  blob(ctx, x - w * 0.14, y - h * 0.6, w * 0.28, h * 0.26, 'rgba(203,230,182,0.75)')
  for (let i = 0; i < 14; i++) leaf(ctx, x + (r() - 0.5) * w * 0.9, y - h * 0.1 - r() * h * 0.75, w * (0.06 + r() * 0.04), r() * 180)
  const n = Math.round(w / 12) + 4
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI
    const rad = 0.3 + r() * 0.7
    rose(ctx, x + Math.cos(a) * (w / 2) * rad * 0.88, y - h * 0.2 - Math.sin(a) * h * 0.72 * rad, w * (0.05 + r() * 0.04), Math.floor(r() * 5))
  }
}

// ---------------------------------------------------------------- props

function makeCanvas(w: number, h: number, scale: number) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(w * scale)
  c.height = Math.ceil(h * scale)
  const ctx = c.getContext('2d')!
  ctx.scale(scale, scale)
  return { c, ctx }
}

/** Pre-render a prop into its own canvas. (x, y) of the prop maps to (ox, oy) inside the canvas. */
export function renderProp(p: Prop, scale: number) {
  let w = 200
  let h = 200
  let ax = 100
  let ay = 190
  let draw: (ctx: CanvasRenderingContext2D) => void
  switch (p.kind) {
    case 'tree':
      w = 280; h = 340; ax = 140; ay = 330
      draw = (ctx) => {
        const r = rng(p.seed)
        const pink = p.seed % 2 === 0
        shadow(ctx, ax, ay, 80, 18)
        ctx.fillStyle = '#b48a6a'
        ctx.strokeStyle = '#8c6448'
        ctx.lineWidth = 2
        roundRect(ctx, ax - 14, ay - 130, 28, 132, 10)
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(ax, ay - 90)
        ctx.quadraticCurveTo(ax + 30, ay - 120, ax + 50, ay - 150)
        ctx.moveTo(ax - 4, ay - 100)
        ctx.quadraticCurveTo(ax - 30, ay - 130, ax - 52, ay - 150)
        ctx.lineWidth = 9
        ctx.strokeStyle = '#a57b5c'
        ctx.lineCap = 'round'
        ctx.stroke()
        const base = pink ? ['#f9c6d4', '#fbd5e0', '#f6b7c9'] : ['#b9d99f', '#c6e2ad', '#acd193']
        const puffs = [
          [0, -200, 92], [-70, -170, 64], [72, -172, 66], [-40, -240, 56], [44, -244, 58], [0, -150, 70],
        ]
        puffs.forEach(([dx, dy, rr], i) => blob(ctx, ax + dx, ay + dy, rr, rr * 0.92, base[i % 3], pink ? '#eba3b8' : '#8fbb78', 2))
        blob(ctx, ax - 30, ay - 250, 34, 22, 'rgba(255,255,255,0.35)')
        for (let i = 0; i < 26; i++) {
          const a = r() * Math.PI * 2
          const d = r() * 100
          const fx = ax + Math.cos(a) * d
          const fy = ay - 195 + Math.sin(a) * d * 0.7
          if (pink) {
            ctx.fillStyle = r() < 0.5 ? '#fff' : '#ffe3ea'
            ctx.beginPath()
            ctx.arc(fx, fy, 5 + r() * 4, 0, Math.PI * 2)
            ctx.fill()
          } else {
            rose(ctx, fx, fy, 6 + r() * 4, Math.floor(r() * 5))
          }
        }
      }
      break
    case 'bush':
      w = 220; h = 150; ax = 110; ay = 140
      draw = (ctx) => bushShape(ctx, ax, ay, 170, 110, p.seed)
      break
    case 'arch':
      w = 300; h = 330; ax = 150; ay = 320
      draw = (ctx) => {
        const r = rng(p.seed)
        shadow(ctx, ax - 92, ay, 30, 8)
        shadow(ctx, ax + 92, ay, 30, 8)
        ctx.fillStyle = '#fffaf2'
        ctx.strokeStyle = '#e5d3c0'
        ctx.lineWidth = 2
        for (const dx of [-92, 92]) {
          roundRect(ctx, ax + dx - 9, ay - 210, 18, 212, 7)
          ctx.fill()
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.ellipse(ax, ay - 210, 92, 96, 0, Math.PI, 0)
        ctx.lineWidth = 14
        ctx.strokeStyle = '#fffaf2'
        ctx.stroke()
        // curtains
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.strokeStyle = '#f3dfe4'
        ctx.lineWidth = 1.5
        for (const s of [-1, 1]) {
          ctx.beginPath()
          ctx.moveTo(ax + s * 86, ay - 250)
          ctx.quadraticCurveTo(ax + s * 50, ay - 160, ax + s * 70, ay)
          ctx.lineTo(ax + s * 98, ay)
          ctx.quadraticCurveTo(ax + s * 84, ay - 140, ax + s * 100, ay - 240)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        }
        for (let i = 0; i <= 54; i++) {
          const t = i / 54
          const a = Math.PI * (1 - t)
          const cx = ax + Math.cos(a) * 92 + (r() - 0.5) * 18
          const cy = ay - 210 - Math.sin(a) * 96 + (r() - 0.5) * 16
          if (r() < 0.5) leaf(ctx, cx - 6, cy + 4, 9, r() * 180)
          rose(ctx, cx, cy, 8 + r() * 7, Math.floor(r() * 5))
        }
        for (const dx of [-92, 92]) {
          for (let i = 0; i < 16; i++) {
            const cx = ax + dx + (r() - 0.5) * 22
            const cy = ay - 205 + i * 12 + r() * 6
            if (r() < 0.6) leaf(ctx, cx - 4, cy + 3, 8, r() * 180)
            rose(ctx, cx, cy, 5 + r() * 6, Math.floor(r() * 5))
          }
        }
      }
      break
    case 'lamp':
      w = 80; h = 240; ax = 40; ay = 232
      draw = (ctx) => {
        shadow(ctx, ax, ay, 20, 6)
        ctx.fillStyle = '#4f4a52'
        roundRect(ctx, ax - 4, ay - 180, 8, 182, 3)
        ctx.fill()
        roundRect(ctx, ax - 12, ay - 10, 24, 12, 4)
        ctx.fill()
        const g = ctx.createRadialGradient(ax, ay - 198, 2, ax, ay - 198, 34)
        g.addColorStop(0, 'rgba(255,244,200,0.95)')
        g.addColorStop(1, 'rgba(255,236,170,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(ax, ay - 198, 34, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff6d6'
        ctx.strokeStyle = '#4f4a52'
        ctx.lineWidth = 3
        roundRect(ctx, ax - 12, ay - 214, 24, 30, 5)
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(ax - 16, ay - 214)
        ctx.lineTo(ax, ay - 228)
        ctx.lineTo(ax + 16, ay - 214)
        ctx.closePath()
        ctx.fillStyle = '#4f4a52'
        ctx.fill()
        rose(ctx, ax - 8, ay - 176, 7, 0)
        rose(ctx, ax + 6, ay - 172, 6, 2)
        leaf(ctx, ax + 12, ay - 166, 7, 20)
      }
      break
    case 'bench':
      w = 160; h = 110; ax = 80; ay = 102
      draw = (ctx) => {
        shadow(ctx, ax, ay, 70, 10)
        ctx.fillStyle = '#c8956b'
        ctx.strokeStyle = '#8c6448'
        ctx.lineWidth = 2
        for (const dx of [-56, 52]) {
          roundRect(ctx, ax + dx, ay - 40, 8, 40, 3)
          ctx.fill()
          ctx.stroke()
        }
        for (let i = 0; i < 3; i++) {
          roundRect(ctx, ax - 66, ay - 88 + i * 14, 132, 10, 4)
          ctx.fill()
          ctx.stroke()
        }
        roundRect(ctx, ax - 70, ay - 46, 140, 12, 4)
        ctx.fill()
        ctx.stroke()
        rose(ctx, ax - 60, ay - 92, 9, 0)
        rose(ctx, ax - 48, ay - 88, 7, 2)
        leaf(ctx, ax - 40, ay - 84, 8, 20)
      }
      break
    case 'fountain':
      w = 260; h = 230; ax = 130; ay = 210
      draw = (ctx) => {
        shadow(ctx, ax, ay - 30, 120, 34)
        blob(ctx, ax, ay - 40, 110, 40, '#f4ede4', '#d9c8b4', 3)
        blob(ctx, ax, ay - 46, 96, 32, '#bfe3f2', '#9fcbe0', 2)
        blob(ctx, ax - 30, ay - 52, 30, 7, 'rgba(255,255,255,0.7)')
        ctx.fillStyle = '#f4ede4'
        ctx.strokeStyle = '#d9c8b4'
        ctx.lineWidth = 3
        roundRect(ctx, ax - 14, ay - 140, 28, 98, 8)
        ctx.fill()
        ctx.stroke()
        blob(ctx, ax, ay - 140, 50, 16, '#f4ede4', '#d9c8b4', 3)
        blob(ctx, ax, ay - 144, 40, 11, '#bfe3f2')
        blob(ctx, ax, ay - 170, 10, 24, '#f4ede4', '#d9c8b4', 2)
        // water arcs
        ctx.strokeStyle = 'rgba(160,210,235,0.9)'
        ctx.lineWidth = 3
        for (const s of [-1, 1]) {
          ctx.beginPath()
          ctx.moveTo(ax, ay - 190)
          ctx.quadraticCurveTo(ax + s * 40, ay - 210, ax + s * 46, ay - 146)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(ax + s * 40, ay - 140)
          ctx.quadraticCurveTo(ax + s * 80, ay - 140, ax + s * 84, ay - 60)
          ctx.stroke()
        }
        const r = rng(p.seed)
        for (let i = 0; i < 18; i++) {
          const a = Math.PI * (0.05 + (i / 17) * 0.9)
          rose(ctx, ax + Math.cos(a) * 108, ay - 34 + Math.sin(a) * 30, 7 + r() * 4, Math.floor(r() * 5))
        }
      }
      break
    case 'cart':
      w = 220; h = 220; ax = 110; ay = 210
      draw = (ctx) => {
        shadow(ctx, ax, ay, 90, 12)
        ctx.lineWidth = 2
        // canopy poles
        ctx.fillStyle = '#c8956b'
        ctx.strokeStyle = '#8c6448'
        for (const dx of [-70, 66]) {
          roundRect(ctx, ax + dx, ay - 170, 6, 120, 2)
          ctx.fill()
          ctx.stroke()
        }
        // canopy stripes
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? '#fff' : '#f9b4c7'
          ctx.beginPath()
          ctx.moveTo(ax - 88 + i * 30, ay - 168)
          ctx.lineTo(ax - 58 + i * 30, ay - 168)
          ctx.lineTo(ax - 52 + i * 30, ay - 196)
          ctx.lineTo(ax - 76 + i * 30, ay - 196)
          ctx.closePath()
          ctx.fill()
        }
        ctx.strokeStyle = '#e48aa5'
        ctx.strokeRect(ax - 88, ay - 196, 176, 28)
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? '#fff' : '#f9b4c7'
          ctx.beginPath()
          ctx.arc(ax - 73 + i * 30, ay - 168, 15, 0, Math.PI)
          ctx.fill()
        }
        // cart body
        ctx.fillStyle = '#d9a77c'
        ctx.strokeStyle = '#8c6448'
        roundRect(ctx, ax - 84, ay - 74, 168, 44, 6)
        ctx.fill()
        ctx.stroke()
        const r = rng(p.seed + 9)
        for (let i = 0; i < 16; i++) rose(ctx, ax - 76 + i * 10 + (r() - 0.5) * 4, ay - 78 - r() * 12, 7 + r() * 4, Math.floor(r() * 5))
        // wheels
        for (const dx of [-52, 52]) {
          blob(ctx, ax + dx, ay - 24, 22, 22, '#e9cfa9', '#8c6448', 3)
          blob(ctx, ax + dx, ay - 24, 5, 5, '#8c6448')
        }
      }
      break
  }
  const { c, ctx } = makeCanvas(w, h, scale)
  draw(ctx)
  p.canvas = c
  p.ox = -ax
  p.oy = -ay
  return p
}

/** Draw the static ground layer (sky band, chapel, lawn, paths, scattered flowers). */
export function renderGround(scale: number) {
  const { c, ctx } = makeCanvas(WW, WH, scale)
  const r = rng(42)

  // sky band
  const sky = ctx.createLinearGradient(0, 0, 0, 300)
  sky.addColorStop(0, '#bfe1f7')
  sky.addColorStop(1, '#fff1ef')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, WW, 320)
  for (const [x, y, s] of [[200, 70, 1], [760, 50, 0.8], [1300, 90, 1.1], [1650, 40, 0.7]]) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    ctx.fillStyle = '#fff'
    for (const [dx, dy, rx, ry] of [[0, 0, 70, 26], [-40, 8, 44, 20], [45, 6, 50, 22], [10, -16, 40, 24]]) {
      ctx.beginPath()
      ctx.ellipse(dx, dy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  // far hills
  ctx.fillStyle = '#d7ebc8'
  ctx.beginPath()
  ctx.moveTo(0, 230)
  ctx.quadraticCurveTo(400, 150, 800, 220)
  ctx.quadraticCurveTo(1200, 280, 1800, 200)
  ctx.lineTo(1800, 400)
  ctx.lineTo(0, 400)
  ctx.fill()

  // distant chapel behind the arch
  ctx.save()
  ctx.translate(900, 300)
  ctx.fillStyle = '#fffaf2'
  ctx.strokeStyle = '#d9c8b4'
  ctx.lineWidth = 2
  roundRect(ctx, -90, -110, 180, 110, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#e9a7bb'
  ctx.beginPath()
  ctx.moveTo(-104, -108)
  ctx.lineTo(0, -168)
  ctx.lineTo(104, -108)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#fffaf2'
  roundRect(ctx, -22, -230, 44, 80, 4)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#e9a7bb'
  ctx.beginPath()
  ctx.moveTo(-30, -228)
  ctx.lineTo(0, -280)
  ctx.lineTo(30, -228)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#d9b56e'
  ctx.fillRect(-2, -300, 4, 24)
  ctx.fillRect(-9, -292, 18, 4)
  ctx.fillStyle = '#b9cbe6'
  ctx.beginPath()
  ctx.arc(0, -200, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#c9a27a'
  roundRect(ctx, -20, -60, 40, 60, 18)
  ctx.fill()
  for (const dx of [-60, 46]) {
    ctx.fillStyle = '#b9cbe6'
    roundRect(ctx, dx, -84, 16, 34, 8)
    ctx.fill()
  }
  ctx.restore()

  // tree line
  for (let i = 0; i < 22; i++) {
    const x = (i / 21) * WW + (r() - 0.5) * 60
    if (Math.abs(x - 900) < 140) continue
    const pink = r() < 0.55
    const s = 0.6 + r() * 0.4
    ctx.save()
    ctx.translate(x, 300)
    ctx.scale(s, s)
    ctx.fillStyle = '#b48a6a'
    ctx.fillRect(-6, -60, 12, 62)
    for (const [dx, dy, rr, k] of [[0, -96, 56, 0], [-36, -74, 40, 1], [38, -76, 42, 2]]) {
      ctx.fillStyle = pink ? ['#f9c6d4', '#fbd5e0', '#f6b7c9'][k] : ['#b9d99f', '#c6e2ad', '#acd193'][k]
      ctx.beginPath()
      ctx.arc(dx, dy, rr, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  // lawn
  const grass = ctx.createLinearGradient(0, 290, 0, WH)
  grass.addColorStop(0, '#cfe6b8')
  grass.addColorStop(1, '#a8d08f')
  ctx.fillStyle = grass
  ctx.beginPath()
  ctx.moveTo(0, 300)
  ctx.quadraticCurveTo(450, 280, 900, 300)
  ctx.quadraticCurveTo(1350, 320, 1800, 300)
  ctx.lineTo(1800, WH)
  ctx.lineTo(0, WH)
  ctx.fill()
  // soft lighter patches
  for (let i = 0; i < 26; i++) {
    blob(ctx, r() * WW, 360 + r() * (WH - 360), 60 + r() * 90, 20 + r() * 30, 'rgba(225,243,206,0.45)')
  }

  // white picket fence along the back
  ctx.fillStyle = '#fffaf2'
  ctx.strokeStyle = '#d9c8b4'
  ctx.lineWidth = 1.5
  for (let x = 10; x < WW; x += 26) {
    if (Math.abs(x - 900) < 120) continue
    ctx.beginPath()
    ctx.moveTo(x, 330)
    ctx.lineTo(x, 296)
    ctx.lineTo(x + 7, 288)
    ctx.lineTo(x + 14, 296)
    ctx.lineTo(x + 14, 330)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  ctx.fillRect(0, 302, 780, 6)
  ctx.fillRect(1020, 302, 780, 6)
  ctx.fillRect(0, 318, 780, 6)
  ctx.fillRect(1020, 318, 780, 6)

  // stone paths
  const path = (pts: [number, number][], width: number) => {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const [lw, col] of [[width + 10, '#e6d5bd'], [width, '#f6ecdc']] as const) {
      ctx.strokeStyle = col
      ctx.lineWidth = lw
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2
        const my = (pts[i][1] + pts[i + 1][1]) / 2
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
      }
      const last = pts[pts.length - 1]
      ctx.lineTo(last[0], last[1])
      ctx.stroke()
    }
  }
  path([[900, WH + 20], [900, 900], [900, 760]], 90)
  path([[900, 760], [700, 700], [560, 690], [380, 700], [200, 640], [80, 560]], 60)
  path([[900, 760], [1100, 720], [1260, 720], [1450, 720], [1600, 640], [1760, 600]], 60)
  path([[900, 560], [900, 470], [900, 330]], 80)
  // ring around the fountain
  ctx.strokeStyle = '#e6d5bd'
  ctx.lineWidth = 70
  ctx.beginPath()
  ctx.ellipse(900, 660, 150, 92, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#f6ecdc'
  ctx.lineWidth = 60
  ctx.stroke()
  // stones texture
  for (let i = 0; i < 120; i++) {
    const t = r()
    const x = 900 + (r() - 0.5) * 70
    const y = 330 + t * (WH - 330)
    if (y > 560 && y < 760) continue
    blob(ctx, x, y, 8 + r() * 6, 4 + r() * 3, 'rgba(217,200,180,0.5)')
  }
  // pink petal aisle on the path up to the arch
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = ['#fbb6c8', '#ffd1dd', '#fff'][i % 3]
    ctx.beginPath()
    ctx.ellipse(900 + (r() - 0.5) * 60, 340 + r() * 220, 4, 2.6, r() * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // scattered small flowers
  for (let i = 0; i < 420; i++) {
    const x = r() * WW
    const y = 340 + r() * (WH - 350)
    const col = ['#fff', '#ffd1dd', '#f9a8bf', '#fff1b8', '#e7dcff'][Math.floor(r() * 5)]
    ctx.fillStyle = col
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#f2cf72'
    ctx.beginPath()
    ctx.arc(x, y, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  // grass tufts
  ctx.strokeStyle = '#8fbf77'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (let i = 0; i < 260; i++) {
    const x = r() * WW
    const y = 340 + r() * (WH - 350)
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

/** Fairy-light strings in world space (drawn above everything). */
export const LIGHT_STRINGS: [number, number, number, number, number][] = [
  // x1, y1, x2, y2, sag
  [690, 238, 820, 200, 40],
  [980, 200, 1110, 238, 40],
  [330, 390, 690, 238, 60],
  [1110, 238, 1500, 300, 60],
]

export function drawLights(ctx: CanvasRenderingContext2D, t: number) {
  for (const [x1, y1, x2, y2, sag] of LIGHT_STRINGS) {
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 + sag * 2
    ctx.strokeStyle = 'rgba(110,95,90,0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo(mx, my, x2, y2)
    ctx.stroke()
    const n = Math.round(Math.hypot(x2 - x1, y2 - y1) / 34)
    for (let i = 1; i < n; i++) {
      const u = i / n
      const x = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * mx + u * u * x2
      const y = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * my + u * u * y2 + 5
      const tw = 0.6 + 0.4 * Math.sin(t * 2.2 + i * 1.7 + x1)
      const g = ctx.createRadialGradient(x, y, 0, x, y, 16)
      g.addColorStop(0, `rgba(255,246,205,${0.75 * tw})`)
      g.addColorStop(1, 'rgba(255,236,170,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = i % 2 ? '#fff3c4' : '#ffd6e2'
      ctx.beginPath()
      ctx.arc(x, y, 3.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - s)
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.12, x + s, y)
  ctx.quadraticCurveTo(x + s * 0.12, y + s * 0.12, x, y + s)
  ctx.quadraticCurveTo(x - s * 0.12, y + s * 0.12, x - s, y)
  ctx.quadraticCurveTo(x - s * 0.12, y - s * 0.12, x, y - s)
  ctx.fill()
}

export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s / 24, s / 24)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, 8)
  ctx.bezierCurveTo(-12, 0, -12, -12, -5, -12)
  ctx.bezierCurveTo(-2, -12, 0, -9, 0, -7)
  ctx.bezierCurveTo(0, -9, 2, -12, 5, -12)
  ctx.bezierCurveTo(12, -12, 12, 0, 0, 8)
  ctx.fill()
  ctx.restore()
}
