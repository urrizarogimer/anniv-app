// The MCR Concert Grounds: a night-time festival field. The ground is drawn in code; the stage, tents,
// Ferris wheel and the rest are sprites cut from public/ref/8.webp (tools/extract_mcr.py).
import { rng } from '../components/Decor'
import type { Obstacle } from '../game/world'
import { makeCanvas } from '../game/world'
import { BAND, BOOTHS } from './data'

export const MW = 1800
export const MH = 1240
export const M_WALK_TOP = 500
export const M_START: [number, number] = [900, 1180]
/** Walk up the aisle to here to start the show. */
export const M_STAGE = { x: 900, y: 560, near: 130 }

/** Native sprite sizes (px), so widths and footprints are known before the images load. */
const SIZE: Record<string, [number, number]> = {
  mcrg_stage: [902, 548], mcrg_wheel: [394, 384], mcrg_tower: [90, 296], mcrg_tower_warm: [72, 280], mcrg_screen: [398, 252],
  mcrg_crowd_fence: [432, 286], mcrg_merch: [316, 306], mcrg_food: [214, 268], mcrg_drinks: [186, 276], mcrg_tent_black: [254, 262],
  mcrg_tent_stripe: [256, 262], mcrg_tent_white: [234, 258], mcrg_banner_big: [210, 316], mcrg_pole_spider: [90, 282], mcrg_pole_red: [86, 278],
  mcrg_flag_mcr: [124, 326], mcrg_welcome: [148, 274], mcrg_spider: [98, 142], mcrg_heart: [118, 144], mcrg_tree1: [148, 198],
  mcrg_tree2: [154, 210], mcrg_tree3: [156, 222], mcrg_potty: [112, 192], mcrg_potty2: [106, 192], mcrg_bench: [186, 98],
  mcrg_trash: [98, 94], mcrg_lamp: [78, 208], mcrg_generator: [106, 106], mcrg_crates: [82, 150], mcrg_case_yellow: [134, 90],
  mcrg_barrier: [212, 94], mcrg_speakers: [134, 176],
}

export interface MProp {
  sprite: string
  x: number
  y: number // base (feet) y, for depth sorting
  h: number // drawn height in world units
  /** how much of the width blocks walking (0 = walk-through decoration) */
  block?: number
  /** drawn behind everything else (the stage and the sky-line props) */
  back?: boolean
}

export const M_PROPS: MProp[] = [
  { sprite: 'mcrg_stage', x: 900, y: 500, h: 440, back: true },
  { sprite: 'mcrg_wheel', x: 1640, y: 520, h: 400, back: true },
  { sprite: 'mcrg_screen', x: 190, y: 520, h: 180, back: true },
  { sprite: 'mcrg_tower', x: 470, y: 540, h: 270, block: 0.5 },
  { sprite: 'mcrg_tower_warm', x: 1330, y: 540, h: 260, block: 0.5 },
  { sprite: 'mcrg_banner_big', x: 360, y: 580, h: 180, block: 0.15 },
  { sprite: 'mcrg_pole_spider', x: 1440, y: 580, h: 180, block: 0.3 },
  { sprite: 'mcrg_crowd_fence', x: 700, y: 650, h: 130, block: 0.9 },
  { sprite: 'mcrg_crowd_fence', x: 1100, y: 650, h: 130, block: 0.9 },
  { sprite: 'mcrg_barrier', x: 560, y: 660, h: 46, block: 0.9 },
  { sprite: 'mcrg_barrier', x: 1240, y: 660, h: 46, block: 0.9 },
  { sprite: 'mcrg_merch', x: 230, y: 690, h: 190, block: 0.85 },
  { sprite: 'mcrg_food', x: 1490, y: 700, h: 190, block: 0.85 },
  { sprite: 'mcrg_drinks', x: 1700, y: 890, h: 190, block: 0.85 },
  { sprite: 'mcrg_tent_stripe', x: 120, y: 960, h: 170, block: 0.85 },
  { sprite: 'mcrg_tent_black', x: 300, y: 1170, h: 170, block: 0.85 },
  { sprite: 'mcrg_tent_white', x: 1560, y: 1170, h: 170, block: 0.85 },
  { sprite: 'mcrg_pole_red', x: 60, y: 720, h: 170, block: 0.3 },
  { sprite: 'mcrg_flag_mcr', x: 1770, y: 700, h: 180, block: 0.2 },
  { sprite: 'mcrg_welcome', x: 760, y: 1190, h: 140, block: 0.4 },
  { sprite: 'mcrg_pole_spider', x: 1040, y: 1190, h: 170, block: 0.3 },
  { sprite: 'mcrg_spider', x: 900, y: 850, h: 84, block: 0.6 },
  { sprite: 'mcrg_lamp', x: 620, y: 780, h: 130, block: 0.4 },
  { sprite: 'mcrg_lamp', x: 1180, y: 780, h: 130, block: 0.4 },
  { sprite: 'mcrg_bench', x: 560, y: 900, h: 52, block: 0.9 },
  { sprite: 'mcrg_trash', x: 630, y: 905, h: 34, block: 0.8 },
  { sprite: 'mcrg_case_yellow', x: 220, y: 1010, h: 36, block: 0.9 },
  { sprite: 'mcrg_speakers', x: 1270, y: 1010, h: 90, block: 0.8 },
  { sprite: 'mcrg_potty', x: 1330, y: 1200, h: 120, block: 0.8 },
  { sprite: 'mcrg_potty2', x: 1395, y: 1200, h: 120, block: 0.8 },
  { sprite: 'mcrg_generator', x: 1180, y: 1210, h: 44, block: 0.8 },
  { sprite: 'mcrg_crates', x: 1450, y: 1010, h: 66, block: 0.8 },
  { sprite: 'mcrg_tree1', x: 40, y: 560, h: 200, block: 0.25 },
  { sprite: 'mcrg_tree2', x: 60, y: 1230, h: 220, block: 0.25 },
  { sprite: 'mcrg_tree3', x: 1780, y: 1230, h: 230, block: 0.25 },
  { sprite: 'mcrg_tree2', x: 1790, y: 560, h: 210, block: 0.25 },
]

export const propWidth = (p: MProp) => {
  const [w, h] = SIZE[p.sprite] ?? [1, 1]
  return (w / h) * p.h
}

export const M_OBSTACLES: Obstacle[] = [
  ...M_PROPS.flatMap((p): Obstacle[] => {
    if (!p.block) return []
    const span = propWidth(p) * p.block
    const r = Math.min(34, Math.max(12, span / 2))
    const n = Math.max(1, Math.round(span / (r * 1.6)))
    return Array.from({ length: n }, (_, i) => ({ x: p.x - span / 2 + r + (n === 1 ? span / 2 - r : (i * (span - 2 * r)) / (n - 1)), y: p.y - 10, r }))
  }),
  // the band stand their ground
  ...BAND.map((m) => ({ x: m.spot[0], y: m.spot[1] - 4, r: m.id === 'bob' ? 46 : 20 })),
]

/** Festoon lights strung between the light towers, poles and tents. */
export const M_LIGHTS: [number, number, number, number, number][] = [
  [470, 300, 360, 420, 30],
  [360, 420, 60, 560, 40],
  [1330, 310, 1440, 420, 30],
  [1440, 420, 1770, 540, 40],
  [760, 1080, 1040, 1050, 34],
]

export { BOOTHS }

// ---------------------------------------------------------------- ground

/** Night sky, a dark festival field, trampled paths and a painted plaza in the middle. */
export function renderMGround(scale: number) {
  const { c, ctx } = makeCanvas(MW, MH, scale)
  const r = rng(808)

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, M_WALK_TOP)
  sky.addColorStop(0, '#07060c')
  sky.addColorStop(0.6, '#171225')
  sky.addColorStop(1, '#2a1b2c')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, MW, M_WALK_TOP + 20)
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.6})`
    const s = 0.6 + r() * 1.8
    ctx.fillRect(r() * MW, r() * (M_WALK_TOP - 120), s, s)
  }
  // moon
  const moon = ctx.createRadialGradient(1260, 90, 4, 1260, 90, 90)
  moon.addColorStop(0, 'rgba(255,250,235,0.95)')
  moon.addColorStop(0.32, 'rgba(240,230,220,0.85)')
  moon.addColorStop(0.36, 'rgba(200,180,200,0.18)')
  moon.addColorStop(1, 'rgba(200,180,200,0)')
  ctx.fillStyle = moon
  ctx.beginPath()
  ctx.arc(1260, 90, 90, 0, Math.PI * 2)
  ctx.fill()
  // distant city and trees
  ctx.fillStyle = '#120e1a'
  let x = 0
  while (x < MW) {
    const w = 30 + r() * 70
    const h = 40 + r() * 120
    ctx.fillRect(x, M_WALK_TOP - h, w, h + 20)
    if (r() < 0.6) {
      ctx.fillStyle = 'rgba(255,214,140,0.35)'
      for (let k = 0; k < 4; k++) ctx.fillRect(x + 6 + r() * (w - 12), M_WALK_TOP - h + 8 + r() * (h - 16), 3, 4)
      ctx.fillStyle = '#120e1a'
    }
    x += w + r() * 10
  }
  ctx.fillStyle = '#0d0b12'
  for (let i = 0; i < 40; i++) {
    const tx = r() * MW
    const th = 30 + r() * 50
    ctx.beginPath()
    ctx.ellipse(tx, M_WALK_TOP - th * 0.4, 20 + r() * 20, th * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // field
  const field = ctx.createLinearGradient(0, M_WALK_TOP - 20, 0, MH)
  field.addColorStop(0, '#1d2218')
  field.addColorStop(1, '#2a3323')
  ctx.fillStyle = field
  ctx.fillRect(0, M_WALK_TOP - 20, MW, MH - M_WALK_TOP + 20)
  for (let i = 0; i < 900; i++) {
    const gx = r() * MW
    const gy = M_WALK_TOP + r() * (MH - M_WALK_TOP)
    ctx.strokeStyle = r() < 0.5 ? 'rgba(70,92,52,0.55)' : 'rgba(30,40,24,0.6)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(gx, gy)
    ctx.lineTo(gx + (r() - 0.5) * 4, gy - 4 - r() * 6)
    ctx.stroke()
  }

  // trampled paths
  const path = (pts: [number, number][], width: number) => {
    for (const [col, w] of [['#2a2830', width + 10], ['#3a3740', width]] as const) {
      ctx.strokeStyle = col
      ctx.lineWidth = w
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1])
      ctx.stroke()
    }
  }
  path([[900, MH + 30], [900, 850], [900, 540]], 150)
  path([[900, 840], [600, 800], [330, 760], [230, 730]], 80)
  path([[900, 840], [1200, 800], [1490, 740], [1700, 930]], 80)
  path([[600, 800], [500, 1000], [300, 1200]], 60)
  path([[1200, 800], [1350, 1000], [1560, 1200]], 60)
  // gravel texture on the paths
  for (let i = 0; i < 2600; i++) {
    const gx = r() * MW
    const gy = M_WALK_TOP + r() * (MH - M_WALK_TOP)
    ctx.fillStyle = r() < 0.5 ? 'rgba(90,86,96,0.35)' : 'rgba(20,18,24,0.3)'
    ctx.fillRect(gx, gy, 1.5, 1.5)
  }

  // the plaza: a painted floor with a big red heart
  ctx.fillStyle = '#2e2c34'
  ctx.beginPath()
  ctx.ellipse(900, 850, 190, 92, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#4a4652'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.save()
  ctx.translate(900, 868)
  ctx.scale(1, 0.48)
  ctx.fillStyle = 'rgba(190,30,40,0.55)'
  ctx.beginPath()
  ctx.moveTo(0, 80)
  ctx.bezierCurveTo(-140, 0, -120, -110, -50, -110)
  ctx.bezierCurveTo(-20, -110, 0, -84, 0, -66)
  ctx.bezierCurveTo(0, -84, 20, -110, 50, -110)
  ctx.bezierCurveTo(120, -110, 140, 0, 0, 80)
  ctx.fill()
  ctx.restore()

  // a glow on the field in front of the stage
  const glow = ctx.createRadialGradient(900, 540, 20, 900, 540, 520)
  glow.addColorStop(0, 'rgba(220,40,60,0.28)')
  glow.addColorStop(1, 'rgba(220,40,60,0)')
  ctx.fillStyle = glow
  ctx.fillRect(300, M_WALK_TOP - 40, 1200, 600)
  return c
}

/** Spots that offer something to do when the bride walks up: the stage and the booths. */
export function nearestBooth(x: number, y: number, max = 100) {
  let best: (typeof BOOTHS)[number] | null = null
  let bd = max
  for (const b of BOOTHS) {
    const d = Math.hypot(x - b.x, (y - b.y) * 1.4)
    if (d < bd) {
      bd = d
      best = b
    }
  }
  return best
}
