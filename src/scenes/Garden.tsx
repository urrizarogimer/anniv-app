import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { audio } from '../audio'
import { img, S } from '../assets'
import { CHEERS, ITEMS, type ItemDef, type ItemId } from '../items'
import { Ambient } from '../components/Ambient'
import { HeartShape } from '../components/Decor'
import { MuteButton } from '../components/MuteButton'
import { ITEM_SPOTS, OBSTACLES, PROPS, START, WALK_TOP, WH, WW, drawHeart, drawLights, drawStar, renderGround, renderProp } from '../game/world'

const BRIDE_H_PX = 262 // native pixel height of bride_idle; all poses share this scale
const BRIDE_WORLD_H = 132
const SPEED = 260
const PICK_RADIUS = 62
const ITEM_H: Record<ItemId, number> = { dress: 74, veil: 62, shoes: 46, bouquet: 64, tiara: 30, rings: 54, earrings: 32, perfume: 58 }

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  kind: 'star' | 'heart'
  size: number
  color: string
}

interface Flyer {
  id: number
  sprite: string
  from: { x: number; y: number }
  to: { x: number; y: number }
}

const DIRS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  'pad-up': [0, -1],
  'pad-down': [0, 1],
  'pad-left': [-1, 0],
  'pad-right': [1, 0],
}

export function Garden({ onComplete }: { onComplete: (items: ItemId[]) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const keys = useRef(new Set<string>())
  const [collected, setCollected] = useState<ItemId[]>([])
  const [toast, setToast] = useState<{ item: ItemDef; cheer: string; key: number } | null>(null)
  const [intro, setIntro] = useState(true)
  const [done, setDone] = useState(false)
  const [flyers, setFlyers] = useState<Flyer[]>([])
  const isTouch = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches, [])

  const game = useRef({
    x: START[0],
    y: START[1],
    facing: 1,
    moving: false,
    animT: 0,
    happyUntil: 0,
    dressOn: false,
    target: null as null | { x: number; y: number; born: number },
    cam: { x: 0, y: 0 },
    scale: 1,
    cw: 0,
    ch: 0,
    remaining: new Set<ItemId>(ITEMS.map((i) => i.id)),
    particles: [] as Particle[],
    trailT: 0,
    paused: true,
    flash: 0,
  })

  const introRef = useRef(intro)
  const doneRef = useRef(done)
  introRef.current = intro
  doneRef.current = done
  game.current.paused = intro || done

  const spawn = (x: number, y: number, n: number, kinds: Particle['kind'][] = ['star', 'heart']) => {
    const g = game.current
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 60 + Math.random() * 170
      g.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 90,
        life: 0,
        max: 0.8 + Math.random() * 0.7,
        kind: kinds[i % kinds.length],
        size: 7 + Math.random() * 9,
        color: ['#ffe08a', '#fff', '#f78aa8', '#fdb0c4'][i % 4],
      })
    }
  }

  const collect = useCallback((id: ItemId) => {
    const g = game.current
    if (!g.remaining.has(id)) return
    g.remaining.delete(id)
    const def = ITEMS.find((i) => i.id === id)!
    const [ix, iy] = ITEM_SPOTS[id]
    spawn(ix, iy - 30, 26)
    g.happyUntil = performance.now() + 1000
    if (id === 'dress') {
      g.dressOn = true
      g.flash = 1
      spawn(g.x, g.y - 70, 30, ['star'])
    }
    audio.sfx('pickup')

    // fly a copy of the icon from the item to its inventory slot
    const wrap = wrapRef.current
    const slot = slotRefs.current[ITEMS.indexOf(def)]
    if (wrap && slot) {
      const wr = wrap.getBoundingClientRect()
      const sr = slot.getBoundingClientRect()
      const from = { x: (ix - g.cam.x) * g.scale, y: (iy - 30 - g.cam.y) * g.scale }
      const to = { x: sr.left - wr.left + sr.width / 2, y: sr.top - wr.top + sr.height / 2 }
      setFlyers((f) => [...f, { id: Date.now() + Math.random(), sprite: def.sprite, from, to }])
    }
    setCollected((c) => (c.includes(id) ? c : [...c, id]))
    setToast({ item: def, cheer: CHEERS[Math.floor(Math.random() * CHEERS.length)], key: Date.now() })
    if (g.remaining.size === 0) {
      window.setTimeout(() => {
        audio.sfx('complete')
        setToast(null)
        setDone(true)
      }, 1300)
    }
  }, [])

  // toast auto-hide
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (DIRS[e.code]) {
        e.preventDefault()
        keys.current.add(e.code)
        return
      }
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
        if ((e.target as HTMLElement)?.tagName === 'BUTTON') return // let the focused button handle it
        e.preventDefault()
        if (introRef.current) {
          audio.sfx('click')
          setIntro(false)
        } else if (doneRef.current) {
          audio.sfx('click')
          onComplete(ITEMS.map((i) => i.id))
        }
      }
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.code)
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [onComplete])

  // main loop
  useEffect(() => {
    const canvas = canvasRef.current!
    const wrap = wrapRef.current!
    const ctx = canvas.getContext('2d')!
    const g = game.current
    let ground: HTMLCanvasElement | null = null
    let res = 0
    let raf = 0
    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const cw = wrap.clientWidth
      const ch = wrap.clientHeight
      g.cw = cw
      g.ch = ch
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
      canvas.style.width = `${cw}px`
      canvas.style.height = `${ch}px`
      // show more of the garden on narrow (phone) screens
      const visibleH = cw < 600 ? 1000 : 820
      g.scale = Math.min(1.35, Math.max(ch / visibleH, cw / WW))
      const want = Math.min(2, dpr * g.scale) // keeps the ground canvas well under mobile canvas-size limits
      if (Math.abs(want - res) > 0.15 || !ground) {
        res = want
        ground = renderGround(res)
        PROPS.forEach((p) => renderProp(p, res))
      }
      snapCam()
    }
    const camTarget = () => {
      const vw = g.cw / g.scale
      const vh = g.ch / g.scale
      let cx = g.x - vw / 2
      let cy = g.y - 70 - vh / 2
      cx = vw >= WW ? (WW - vw) / 2 : Math.max(0, Math.min(WW - vw, cx))
      // let the view run a little past the bottom so the inventory bar never hides the bride
      const extra = 90 / g.scale
      cy = vh >= WH + extra ? (WH - vh) / 2 : Math.max(0, Math.min(WH + extra - vh, cy))
      return { cx, cy }
    }
    const snapCam = () => {
      const { cx, cy } = camTarget()
      g.cam.x = cx
      g.cam.y = cy
    }
    resize()
    if (import.meta.env.DEV) (window as unknown as { __garden: unknown }).__garden = g
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const update = (dt: number, now: number) => {
      let dx = 0
      let dy = 0
      if (!g.paused) {
        keys.current.forEach((k) => {
          const d = DIRS[k]
          if (d) {
            dx += d[0]
            dy += d[1]
          }
        })
        if (dx || dy) g.target = null
        else if (g.target) {
          const tx = g.target.x - g.x
          const ty = g.target.y - g.y
          const dist = Math.hypot(tx, ty)
          if (dist < 6) g.target = null
          else {
            dx = tx / dist
            dy = ty / dist
          }
        }
      }
      const len = Math.hypot(dx, dy)
      g.moving = len > 0
      if (g.moving) {
        const px = g.x
        const py = g.y
        g.x += (dx / len) * SPEED * dt
        g.y += (dy / len) * SPEED * dt * 0.92
        if (dx !== 0) g.facing = dx > 0 ? 1 : -1
        // collide with props (ellipses, flattened for the top-down look)
        for (const o of OBSTACLES) {
          const sy = o.r > 80 ? 0.5 : 0.7
          const ox = g.x - o.x
          const oy = (g.y - o.y) / sy
          const d = Math.hypot(ox, oy)
          const min = o.r + 16
          if (d < min && d > 0.001) {
            g.x = o.x + (ox / d) * min
            g.y = o.y + (oy / d) * min * sy
          }
        }
        g.x = Math.max(40, Math.min(WW - 40, g.x))
        g.y = Math.max(WALK_TOP + 40, Math.min(WH - 12, g.y))
        // if we are stuck against something while tap-moving, give up on the target
        if (g.target && Math.hypot(g.x - px, g.y - py) < SPEED * dt * 0.15) g.target = null
        g.animT += dt
        if (g.dressOn) {
          g.trailT += dt
          if (g.trailT > 0.14) {
            g.trailT = 0
            g.particles.push({ x: g.x + (Math.random() - 0.5) * 30, y: g.y - 10 - Math.random() * 40, vx: 0, vy: -30, life: 0, max: 0.7, kind: 'star', size: 5 + Math.random() * 4, color: Math.random() < 0.5 ? '#ffe08a' : '#fff' })
          }
        }
      } else {
        g.animT = 0
      }
      // pickups
      if (!g.paused) {
        for (const id of g.remaining) {
          const [ix, iy] = ITEM_SPOTS[id]
          if (Math.hypot(g.x - ix, (g.y - iy) * 1.2) < PICK_RADIUS) {
            collect(id)
            break
          }
        }
      }
      // camera
      const { cx, cy } = camTarget()
      const k = 1 - Math.pow(0.0015, dt)
      g.cam.x += (cx - g.cam.x) * k
      g.cam.y += (cy - g.cam.y) * k
      // particles
      g.particles = g.particles.filter((p) => {
        p.life += dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 0.96
        p.vy = p.vy * 0.96 + (p.kind === 'heart' ? -20 : 40) * dt
        return p.life < p.max
      })
      g.flash = Math.max(0, g.flash - dt * 1.5)
      void now
    }

    const drawBride = (t: number, now: number) => {
      const prefix = g.dressOn ? 'bride_' : 'bridec_'
      let pose = 'idle'
      if (now < g.happyUntil) pose = 'happy'
      else if (g.moving) pose = ['walk1', 'walk2', 'walk3', 'walk2'][Math.floor(g.animT * 8) % 4]
      const im = img(prefix + pose)
      if (!im) return
      const k = BRIDE_WORLD_H / BRIDE_H_PX
      const w = im.width * k
      const h = im.height * k
      const bob = g.moving ? -Math.abs(Math.sin(g.animT * 12)) * 4 : Math.sin(t * 2.2) * 1.2
      ctx.fillStyle = 'rgba(90,120,70,0.25)'
      ctx.beginPath()
      ctx.ellipse(g.x, g.y, 30, 9, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.save()
      ctx.translate(g.x, g.y + bob)
      ctx.scale(g.facing, 1)
      ctx.drawImage(im, -w / 2, -h, w, h)
      ctx.restore()
      if (g.flash > 0) {
        const gr = ctx.createRadialGradient(g.x, g.y - 60, 0, g.x, g.y - 60, 120)
        gr.addColorStop(0, `rgba(255,255,255,${0.9 * g.flash})`)
        gr.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.arc(g.x, g.y - 60, 120, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawItem = (id: ItemId, t: number) => {
      const def = ITEMS.find((i) => i.id === id)!
      const im = img(def.sprite)
      const [x, y] = ITEM_SPOTS[id]
      const bob = Math.sin(t * 2.6 + x) * 5
      const pulse = 0.75 + 0.25 * Math.sin(t * 3 + x)
      ctx.fillStyle = 'rgba(90,120,70,0.2)'
      ctx.beginPath()
      ctx.ellipse(x, y, 24, 7, 0, 0, Math.PI * 2)
      ctx.fill()
      const cy = y - 34 + bob
      const gr = ctx.createRadialGradient(x, cy, 0, x, cy, 56)
      gr.addColorStop(0, `rgba(255,248,214,${0.85 * pulse})`)
      gr.addColorStop(0.5, `rgba(255,214,226,${0.45 * pulse})`)
      gr.addColorStop(1, 'rgba(255,214,226,0)')
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.arc(x, cy, 56, 0, Math.PI * 2)
      ctx.fill()
      if (im) {
        let h = ITEM_H[id]
        let w = (im.width / im.height) * h
        if (w > 76) {
          w = 76
          h = (im.height / im.width) * w
        }
        ctx.drawImage(im, x - w / 2, cy - h / 2, w, h)
      }
      for (let i = 0; i < 3; i++) {
        const a = t * 1.6 + (i * Math.PI * 2) / 3 + x
        drawStar(ctx, x + Math.cos(a) * 40, cy + Math.sin(a) * 26, 4 + 2.5 * Math.sin(t * 5 + i), i === 1 ? '#fff' : '#ffe08a')
      }
    }

    const drawPointer = (t: number) => {
      // gentle hint toward the nearest item that is off screen
      if (g.paused || g.remaining.size === 0) return
      let best: [number, number] | null = null
      let bd = Infinity
      for (const id of g.remaining) {
        const [ix, iy] = ITEM_SPOTS[id]
        const d = Math.hypot(ix - g.x, iy - g.y)
        if (d < bd) {
          bd = d
          best = [ix, iy - 34]
        }
      }
      if (!best) return
      const sx = (best[0] - g.cam.x) * g.scale
      const sy = (best[1] - g.cam.y) * g.scale
      const m = 40
      const top = 110
      const bottom = g.ch - (isTouch ? 210 : 120)
      if (sx > m && sx < g.cw - m && sy > top && sy < bottom) return
      const cx = g.cw / 2
      const cy = (top + bottom) / 2
      const ang = Math.atan2(sy - cy, sx - cx)
      const px = Math.max(m, Math.min(g.cw - m, sx))
      const py = Math.max(top, Math.min(bottom, sy))
      const wob = Math.sin(t * 5) * 4
      ctx.save()
      ctx.translate(px + Math.cos(ang) * wob, py + Math.sin(ang) * wob)
      ctx.globalAlpha = 0.92
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#f78aa8'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, 19, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.rotate(ang)
      ctx.fillStyle = '#f78aa8'
      ctx.beginPath()
      ctx.moveTo(30, 0)
      ctx.lineTo(19, -9)
      ctx.lineTo(19, 9)
      ctx.closePath()
      ctx.fill()
      ctx.rotate(-ang)
      drawHeart(ctx, 0, 1, 22, '#ec6a90')
      ctx.restore()
    }

    const draw = (t: number, now: number) => {
      const dpr = canvas.width / g.cw
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high' // sharper downscaled sprites
      ctx.fillStyle = '#cfe6b8'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const s = g.scale * dpr
      ctx.setTransform(s, 0, 0, s, -g.cam.x * s, -g.cam.y * s)
      if (ground) ctx.drawImage(ground, 0, 0, WW, WH)

      // tap target marker
      if (g.target) {
        const age = (now - g.target.born) / 1000
        ctx.strokeStyle = `rgba(236,106,144,${Math.max(0, 0.8 - age * 0.6)})`
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.ellipse(g.target.x, g.target.y, 16 + Math.sin(t * 6) * 3, 6, 0, 0, Math.PI * 2)
        ctx.stroke()
        drawHeart(ctx, g.target.x, g.target.y - 14 - Math.abs(Math.sin(t * 5)) * 6, 14, '#f78aa8')
      }

      const list: { y: number; draw: () => void }[] = []
      for (const p of PROPS) {
        if (!p.canvas) continue
        const c = p.canvas
        list.push({ y: p.y, draw: () => ctx.drawImage(c, p.x + p.ox!, p.y + p.oy!, c.width / res, c.height / res) })
      }
      for (const id of g.remaining) list.push({ y: ITEM_SPOTS[id][1], draw: () => drawItem(id, t) })
      list.push({ y: g.y, draw: () => drawBride(t, now) })
      list.sort((a, b) => a.y - b.y)
      list.forEach((d) => d.draw())

      drawLights(ctx, t)
      for (const p of g.particles) {
        const a = 1 - p.life / p.max
        ctx.globalAlpha = a
        if (p.kind === 'star') drawStar(ctx, p.x, p.y, p.size * (0.6 + a * 0.4), p.color)
        else drawHeart(ctx, p.x, p.y, p.size * 1.6, p.color === '#fff' ? '#fdb0c4' : p.color)
      }
      ctx.globalAlpha = 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawPointer(t)
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      update(dt, now)
      draw(now / 1000, now)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [collect, isTouch])

  // tap / click to move
  const pointerDown = useRef(false)
  const setTargetFromEvent = (e: React.PointerEvent) => {
    const g = game.current
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = (e.clientX - r.left) / g.scale + g.cam.x
    const y = (e.clientY - r.top) / g.scale + g.cam.y
    g.target = { x: Math.max(40, Math.min(WW - 40, x)), y: Math.max(WALK_TOP + 40, Math.min(WH - 12, y)), born: performance.now() }
  }

  const capture = (e: React.PointerEvent) => {
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* capture is a nicety; ignore if the pointer is already gone */
    }
  }

  const pad = (dir: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      capture(e)
      keys.current.add(dir)
    },
    onPointerUp: () => keys.current.delete(dir),
    onPointerCancel: () => keys.current.delete(dir),
    onLostPointerCapture: () => keys.current.delete(dir),
  })

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-sage-200">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        aria-label="Garden. Move the bride to collect the wedding items."
        onPointerDown={(e) => {
          if (game.current.paused) return
          pointerDown.current = true
          capture(e)
          setTargetFromEvent(e)
        }}
        onPointerMove={(e) => {
          if (pointerDown.current && !game.current.paused) setTargetFromEvent(e)
        }}
        onPointerUp={() => (pointerDown.current = false)}
        onPointerCancel={() => (pointerDown.current = false)}
      />
      <Ambient petals={10} butterflies={3} seed={21} />

      {/* top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-center px-3" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
        <div className="soft-card flex flex-col items-center gap-1 px-4 py-2" role="status" aria-live="polite">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blush-600 sm:text-xs">Find the wedding treasures · {collected.length}/8</div>
          <div className="flex gap-[3px] sm:gap-1">
            {ITEMS.map((it, i) => {
              const got = i < collected.length
              return (
                <div key={it.id} className={got ? 'anim-pop' : ''}>
                  <HeartShape size={22} color={got ? '#ec6a90' : '#f3d4dd'} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="absolute right-3 top-3 z-40" style={{ top: 'max(12px, env(safe-area-inset-top))' }}>
        <MuteButton />
      </div>

      {/* toast */}
      {toast && (
        <div key={toast.key} className="pointer-events-none absolute inset-x-0 top-[86px] flex justify-center px-3 sm:top-[96px]">
          <div className="soft-card anim-rise flex max-w-[92vw] items-center gap-3 py-2 pl-2 pr-5">
            <img src={S(toast.item.face)} alt="" className="h-12 w-12 rounded-full bg-blush-100 object-cover sm:h-14 sm:w-14" />
            <img src={S(toast.item.sprite)} alt="" className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
            <div className="leading-tight">
              <div className="text-sm font-bold text-blush-600 sm:text-base">
                {toast.cheer} {toast.item.name}!
              </div>
              <div className="text-xs text-dusty-800 sm:text-sm">{toast.item.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* inventory */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-2" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <div className="soft-card flex gap-1 p-1.5 sm:gap-2 sm:p-2" aria-label="Inventory">
          {ITEMS.map((it, i) => {
            const got = collected.includes(it.id)
            return (
              <div
                key={it.id}
                ref={(el) => (slotRefs.current[i] = el)}
                title={it.name}
                className={`flex h-9 w-9 items-center justify-center rounded-2xl border-2 sm:h-12 sm:w-12 ${got ? 'anim-pop border-blush-300 bg-blush-50' : 'border-dashed border-blush-200 bg-white/70'}`}
              >
                <img
                  src={S(it.sprite)}
                  alt={got ? it.name : `${it.name} (not found yet)`}
                  className="max-h-[78%] max-w-[82%] object-contain transition"
                  style={got ? undefined : { filter: 'grayscale(1) brightness(1.15)', opacity: 0.28 }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* d-pad for touch screens (tap-to-move works too) */}
      {isTouch && !intro && !done && (
        <div className="absolute left-3 grid grid-cols-3 grid-rows-3 gap-1 opacity-90" style={{ bottom: 'calc(max(10px, env(safe-area-inset-bottom)) + 62px)' }}>
          {(
            [
              ['pad-up', 'col-start-2 row-start-1', 0],
              ['pad-left', 'col-start-1 row-start-2', -90],
              ['pad-right', 'col-start-3 row-start-2', 90],
              ['pad-down', 'col-start-2 row-start-3', 180],
            ] as const
          ).map(([dir, pos, rot]) => (
            <button key={dir} type="button" aria-label={dir.replace('pad-', 'Move ')} className={`round-btn !h-11 !w-11 touch-none ${pos}`} {...pad(dir)}>
              <svg viewBox="0 0 24 24" width={20} height={20} style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
                <path d="M12 5l7 9H5z" fill="#ec6a90" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* flying icons */}
      {flyers.map((f) => (
        <FlyingIcon key={f.id} f={f} onDone={() => setFlyers((l) => l.filter((x) => x.id !== f.id))} />
      ))}

      {/* intro dialogue */}
      {intro && (
        <div className="absolute inset-0 flex items-end justify-center bg-white/20 px-3 pb-24 sm:items-center sm:pb-0">
          <div className="soft-card anim-rise flex w-full max-w-lg items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <img src={S('face_1')} alt="" className="h-16 w-16 shrink-0 rounded-full bg-blush-100 object-cover sm:h-20 sm:w-20" />
            <div className="flex-1">
              <p className="text-[15px] font-bold leading-snug text-dusty-800 sm:text-base">
                Oh no! My wedding things are scattered all over the garden. Help me find all 8 treasures before the ceremony!
              </p>
              <p className="mt-1 text-xs text-dusty-600 sm:text-sm">
                {isTouch ? 'Tap where you want to go, or use the arrows.' : 'Move with arrow keys / WASD, or click where you want to go.'}
              </p>
              <button
                type="button"
                autoFocus
                className="pill-btn mt-3 text-sm"
                onClick={() => {
                  audio.sfx('click')
                  setIntro(false)
                }}
              >
                Let’s go!
                <span className="play-dot">
                  <HeartShape size={14} color="#ec6a90" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* all collected */}
      {done && (
        <div className="absolute inset-0 flex items-center justify-center bg-blush-100/25 px-4">
          <Ambient petals={0} hearts={12} sparkles={14} seed={77} />
          <div className="soft-card anim-pop relative flex w-full max-w-md flex-col items-center gap-3 p-6 text-center">
            <img src={S('bride_excited')} alt="" className="anim-bob h-36 object-contain sm:h-44" />
            <h2 className="font-script text-4xl font-bold text-blush-600">All 8 treasures found!</h2>
            <div className="grid grid-cols-8 gap-1">
              {ITEMS.map((it) => (
                <img key={it.id} src={S(it.sprite)} alt={it.name} className="h-8 w-8 object-contain" />
              ))}
            </div>
            <p className="text-sm text-dusty-800">Everything’s here. Time to get ready!</p>
            <button
              type="button"
              autoFocus
              className="pill-btn text-base"
              onClick={() => {
                audio.sfx('click')
                onComplete(ITEMS.map((i) => i.id))
              }}
            >
              Get ready
              <span className="play-dot">
                <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden>
                  <path d="M8 5l11 7-11 7z" fill="#ec6a90" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FlyingIcon({ f, onDone }: { f: Flyer; onDone: () => void }) {
  const [go, setGo] = useState(false)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)))
    const t = window.setTimeout(() => done.current(), 950)
    return () => {
      cancelAnimationFrame(r)
      window.clearTimeout(t)
    }
  }, [])
  const pos = go ? f.to : f.from
  const style: CSSProperties = {
    left: pos.x,
    top: pos.y,
    transform: `translate(-50%, -50%) scale(${go ? 0.6 : 1.5})`,
    transition: 'left 0.85s cubic-bezier(.5,-0.3,.6,1), top 0.85s cubic-bezier(.3,-0.6,.6,1), transform 0.85s ease',
  }
  return (
    <div className="pointer-events-none absolute z-30" style={style}>
      <img src={S(f.sprite)} alt="" className="h-14 w-14 object-contain drop-shadow-[0_0_10px_rgba(255,224,138,0.95)]" />
    </div>
  )
}
